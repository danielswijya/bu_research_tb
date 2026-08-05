"""CLI: run EXP3 weekly update and publish site_recommendations.

Usage (from repo root, venv active):

    python -m backend.bandit.run_weekly --bootstrap-history
    python -m backend.bandit.run_weekly

Weekly cron example (Linux/macOS):

    0 6 * * 1 cd /path/to/bu_research_tb && .venv/bin/python -m backend.bandit.run_weekly

Windows Task Scheduler: same command once per week.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow `python backend/bandit/run_weekly.py` from repo root
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.bandit.exp3 import Exp3Interactive
from backend.bandit.supabase_io import SupabaseIO


def _reconcile_arm_order(
    saved_order: list[str] | None,
    current_arms: list[dict],
) -> list[str]:
    """Preserve prior indices; append any newly seen arm_ids."""
    current_ids = [a["arm_id"] for a in current_arms]
    current_set = set(current_ids)
    if not saved_order:
        return current_ids

    order = [aid for aid in saved_order if aid in current_set]
    for aid in current_ids:
        if aid not in order:
            order.append(aid)
    return order


def _arms_by_id(arms: list[dict]) -> dict[str, dict]:
    return {a["arm_id"]: a for a in arms}


def publish_recommendations(
    io: SupabaseIO,
    model: Exp3Interactive,
    arm_id_order: list[str],
    arms_map: dict[str, dict],
) -> int:
    rec = model.get_site_recommendation(top_k=None)
    rows = []
    for arm_index, priority, rank in zip(
        rec["arm_indices"], rec["priority"], rec["rank"]
    ):
        arm_id = arm_id_order[arm_index]
        meta = arms_map.get(arm_id, {})
        rows.append(
            {
                "arm_id": arm_id,
                "location_name": meta.get("location_name"),
                "Zona_name": meta.get("Zona_name"),
                "District": meta.get("District"),
                "lat": meta.get("lat"),
                "lon": meta.get("lon"),
                "priority": priority,
                "rank": rank,
            }
        )
    io.upsert_recommendations(rows)
    return len(rows)


def run(
    *,
    bootstrap_history: bool = False,
    t_horizon: int = 100,
    dry_run: bool = False,
) -> None:
    io = SupabaseIO()
    arms = io.build_arms()
    if not arms:
        raise RuntimeError("No arms found in filtered_site_data")

    saved = io.load_bandit_state()
    saved_order = list(saved.get("arm_id_order") or []) if saved else []
    arm_id_order = _reconcile_arm_order(saved_order, arms)
    arms_map = _arms_by_id(arms)
    n_arms = len(arm_id_order)

    processed_ids: list[str] = []
    if saved and saved.get("state"):
        model = Exp3Interactive.from_state(saved["state"])
        if model.n_arms < n_arms:
            model.resize(n_arms)
        processed_ids = [str(x) for x in (saved.get("processed_ticket_ids") or [])]
        print(
            f"Loaded bandit state: week_t={model.week_t}, n_arms={model.n_arms}, "
            f"processed_tickets={len(processed_ids)}"
        )
    else:
        model = Exp3Interactive(n_arms=n_arms, T=t_horizon, K=1)
        print(f"Initialized new EXP3 model with n_arms={n_arms}, T={t_horizon}")

    if bootstrap_history and model.week_t == 0 and not processed_ids:
        history = io.load_historical_outcomes(arm_id_order)
        print(f"Bootstrapping from {len(history)} historical site visits...")
        # Apply each visit as its own pull (K=1), oldest first
        for event in history:
            model.apply_outcomes(
                [event["arm_index"]],
                [event["screened"]],
                [event["positive"]],
            )
        print(f"Bootstrap complete: week_t={model.week_t}")
    elif bootstrap_history:
        print("Skipping bootstrap (state already advanced or tickets processed).")

    new_tickets = io.load_new_ticket_outcomes(arm_id_order, processed_ids)
    if new_tickets:
        # Aggregate by arm so duplicate visits in one week don't overwrite
        by_arm: dict[int, dict[str, float]] = {}
        for e in new_tickets:
            slot = by_arm.setdefault(
                e["arm_index"], {"screened": 0.0, "positive": 0.0}
            )
            slot["screened"] += e["screened"]
            slot["positive"] += e["positive"]
        indices = list(by_arm.keys())
        screened = [by_arm[i]["screened"] for i in indices]
        positive = [by_arm[i]["positive"] for i in indices]
        print(
            f"Applying {len(new_tickets)} new ticket outcome(s) "
            f"across {len(indices)} arm(s)..."
        )
        model.apply_outcomes(indices, screened, positive)
        for e in new_tickets:
            processed_ids.append(e["ticket_id"])
    else:
        print("No new ticket outcomes to apply.")

    state = model.to_state()
    print(
        f"Publishing recommendations for {n_arms} arms "
        f"(week_t={model.week_t})..."
    )

    if dry_run:
        rec = model.get_site_recommendation(top_k=10)
        print("Dry run — top 10:")
        for i, (idx, pri, rank) in enumerate(
            zip(rec["arm_indices"], rec["priority"], rec["rank"])
        ):
            arm = arms_map.get(arm_id_order[idx], {})
            print(
                f"  #{rank} priority={pri:.6f} "
                f"{arm.get('location_name')} / {arm.get('Zona_name')} / {arm.get('District')}"
            )
        return

    count = publish_recommendations(io, model, arm_id_order, arms_map)
    io.save_bandit_state(
        week_t=model.week_t,
        n_arms=model.n_arms,
        t_horizon=model.T,
        state=state,
        arm_id_order=arm_id_order,
        processed_ticket_ids=processed_ids,
    )
    print(f"Done. Upserted {count} site_recommendations rows.")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="EXP3 weekly site recommendations")
    parser.add_argument(
        "--bootstrap-history",
        action="store_true",
        help="On a fresh state, replay filtered_site_data visits before ranking",
    )
    parser.add_argument(
        "--t-horizon",
        type=int,
        default=100,
        help="EXP3 horizon T (eta schedule); default 100",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute ranks but do not write to Supabase",
    )
    args = parser.parse_args(argv)
    run(
        bootstrap_history=args.bootstrap_history,
        t_horizon=args.t_horizon,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()

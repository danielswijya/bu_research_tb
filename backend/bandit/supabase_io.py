"""Supabase REST helpers for EXP3 arms, state, tickets, and recommendations."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv

from .arms import make_arm_id, site_join_key

load_dotenv()

PAGE_SIZE = 1000


class SupabaseIO:
    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
    ):
        self.url = (url or os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.api_key = (
            api_key
            or os.getenv("SUPABASE_API_KEY")
            or os.getenv("SUPABASE_SERVICE_KEY")
            or os.getenv("SUPABASE_KEY")
            or ""
        )
        if not self.url or not self.api_key:
            raise RuntimeError(
                "Set SUPABASE_URL and SUPABASE_API_KEY (service role preferred for writes)"
            )
        self.headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _get_all(self, table: str, select: str = "*", filters: str = "") -> list[dict]:
        rows: list[dict] = []
        start = 0
        while True:
            end = start + PAGE_SIZE - 1
            headers = {**self.headers, "Range": f"{start}-{end}"}
            path = f"{self.url}/rest/v1/{table}?select={select}"
            if filters:
                path = f"{path}&{filters}"
            resp = requests.get(path, headers=headers, timeout=60)
            if resp.status_code not in (200, 206):
                raise RuntimeError(f"GET {table} failed: {resp.status_code} {resp.text}")
            batch = resp.json()
            if not batch:
                break
            rows.extend(batch)
            if len(batch) < PAGE_SIZE:
                break
            start += PAGE_SIZE
        return rows

    def _upsert(self, table: str, rows: list[dict], on_conflict: str) -> list[dict]:
        if not rows:
            return []
        headers = {
            **self.headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        }
        resp = requests.post(
            f"{self.url}/rest/v1/{table}?on_conflict={on_conflict}",
            headers=headers,
            json=rows,
            timeout=120,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"UPSERT {table} failed: {resp.status_code} {resp.text}")
        return resp.json()

    def load_site_rows(self) -> list[dict]:
        return self._get_all(
            "filtered_site_data",
            select="location_name,Zona_name,District,lat,lon,n_screened,n_diagnosed,Date",
        )

    def build_arms(self, site_rows: list[dict] | None = None) -> list[dict]:
        """Distinct screening-site arms with latest lat/lon."""
        rows = site_rows if site_rows is not None else self.load_site_rows()
        arms: dict[str, dict] = {}

        for row in rows:
            location_name = row.get("location_name") or ""
            zona_name = row.get("Zona_name") or ""
            district = row.get("District") or ""
            if not location_name and not zona_name:
                continue

            arm_id = make_arm_id(location_name, zona_name, district)
            date_val = row.get("Date")
            existing = arms.get(arm_id)
            candidate = {
                "arm_id": arm_id,
                "location_name": location_name,
                "Zona_name": zona_name,
                "District": district,
                "lat": row.get("lat"),
                "lon": row.get("lon"),
                "_date": date_val,
            }
            if existing is None:
                arms[arm_id] = candidate
                continue
            # Keep newest date's coordinates when available
            if date_val and (not existing.get("_date") or str(date_val) > str(existing["_date"])):
                arms[arm_id] = candidate

        result = []
        for arm in arms.values():
            arm.pop("_date", None)
            result.append(arm)
        result.sort(key=lambda a: site_join_key(a["location_name"], a["Zona_name"], a["District"]))
        return result

    def load_historical_outcomes(self, arm_id_order: list[str]) -> list[dict]:
        """Bootstrap outcomes from filtered_site_data visits, oldest first."""
        index = {arm_id: i for i, arm_id in enumerate(arm_id_order)}
        rows = self.load_site_rows()

        events = []
        for row in rows:
            arm_id = make_arm_id(
                row.get("location_name"),
                row.get("Zona_name"),
                row.get("District"),
            )
            if arm_id not in index:
                continue
            screened = float(row.get("n_screened") or 0)
            positive = float(row.get("n_diagnosed") or 0)
            if screened <= 0 and positive <= 0:
                continue
            events.append(
                {
                    "arm_id": arm_id,
                    "arm_index": index[arm_id],
                    "screened": screened,
                    "positive": positive,
                    "date": row.get("Date") or "",
                }
            )

        events.sort(key=lambda e: str(e["date"]))
        return events

    def load_new_ticket_outcomes(
        self,
        arm_id_order: list[str],
        processed_ticket_ids: set[str] | list[str],
    ) -> list[dict]:
        """Saved tickets with counts that have not yet reinforced the bandit."""
        processed = set(str(x) for x in processed_ticket_ids)
        index = {arm_id: i for i, arm_id in enumerate(arm_id_order)}
        rows = self._get_all(
            "tickets",
            select="id,location_name,Zona_name,District,screened_count,positive_count,saved,selected_date",
            filters="saved=eq.true",
        )

        events = []
        for row in rows:
            ticket_id = str(row.get("id"))
            if ticket_id in processed:
                continue
            screened = row.get("screened_count")
            positive = row.get("positive_count")
            if screened is None or positive is None:
                continue
            arm_id = make_arm_id(
                row.get("location_name"),
                row.get("Zona_name"),
                row.get("District"),
            )
            if arm_id not in index:
                # Unknown site — skip until it appears in filtered_site_data arms
                continue
            events.append(
                {
                    "ticket_id": ticket_id,
                    "arm_id": arm_id,
                    "arm_index": index[arm_id],
                    "screened": float(screened),
                    "positive": float(positive),
                    "date": row.get("selected_date") or "",
                }
            )

        events.sort(key=lambda e: str(e["date"]))
        return events

    def load_bandit_state(self) -> dict[str, Any] | None:
        rows = self._get_all("bandit_state", select="*", filters="id=eq.default")
        if not rows:
            return None
        return rows[0]

    def save_bandit_state(
        self,
        *,
        week_t: int,
        n_arms: int,
        t_horizon: int,
        state: dict,
        arm_id_order: list[str],
        processed_ticket_ids: list[str],
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        payload = [
            {
                "id": "default",
                "week_t": week_t,
                "n_arms": n_arms,
                "t_horizon": t_horizon,
                "state": state,
                "arm_id_order": arm_id_order,
                "processed_ticket_ids": processed_ticket_ids,
                "last_processed_at": now,
                "updated_at": now,
            }
        ]
        self._upsert("bandit_state", payload, on_conflict="id")

    def upsert_recommendations(self, rows: list[dict]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        payload = []
        for row in rows:
            payload.append(
                {
                    "arm_id": row["arm_id"],
                    "location_name": row.get("location_name"),
                    "Zona_name": row.get("Zona_name"),
                    "District": row.get("District"),
                    "lat": row.get("lat"),
                    "lon": row.get("lon"),
                    "priority": float(row["priority"]),
                    "rank": int(row["rank"]),
                    "updated_at": now,
                }
            )
        # Upsert in chunks to avoid payload limits
        chunk = 200
        for i in range(0, len(payload), chunk):
            self._upsert(
                "site_recommendations",
                payload[i : i + chunk],
                on_conflict="arm_id",
            )

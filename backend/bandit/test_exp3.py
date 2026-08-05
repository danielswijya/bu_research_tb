"""Local unit tests for EXP3 (no Supabase required)."""

from __future__ import annotations

import numpy as np

from backend.bandit.arms import make_arm_id, site_join_key
from backend.bandit.exp3 import Exp3Interactive, reward_from_observation


def test_arm_id_stable():
    a = make_arm_id(" Clinic A ", "Zona 1", "District X")
    b = make_arm_id("clinic a", "zona 1", "district x")
    assert a == b
    assert len(a) == 16
    assert site_join_key("Clinic A", "Zona 1", "District X") == "clinic a|zona 1|district x"


def test_reward_formula():
    screened = np.array([10.0, 10.0])
    positive = np.array([0.0, 2.0])
    r = reward_from_observation(screened, positive)
    assert np.isclose(r[0], -10.0 / 0.1)
    assert np.isclose(r[1], -10.0 / 2.0)


def test_apply_outcomes_changes_ranking():
    model = Exp3Interactive(n_arms=3, T=50, K=1)
    before = model.get_site_recommendation()
    assert before["rank"] == [1, 2, 3]

    # High positives on arm 1 should improve its relative priority vs zero-yield pulls
    model.apply_outcomes([0], [20], [0])
    model.apply_outcomes([1], [20], [8])
    model.apply_outcomes([2], [20], [0])

    after = model.get_site_recommendation()
    # Arm 1 should be first (best reward / least negative)
    assert after["arm_indices"][0] == 1


def test_state_roundtrip():
    model = Exp3Interactive(n_arms=4, T=20)
    model.apply_outcomes([2], [12], [3])
    restored = Exp3Interactive.from_state(model.to_state())
    assert restored.n_arms == 4
    assert restored.week_t == 1
    np.testing.assert_allclose(restored.p, model.p)
    np.testing.assert_allclose(restored.cum_reward, model.cum_reward)


def test_resize_preserves_prefix():
    model = Exp3Interactive(n_arms=2, T=20)
    model.apply_outcomes([0], [10], [2])
    old_p0 = model.p[0]
    model.resize(4)
    assert model.n_arms == 4
    assert len(model.p) == 4
    assert abs(model.p.sum() - 1.0) < 1e-9
    assert model.p[0] > 0
    assert old_p0 > 0


if __name__ == "__main__":
    test_arm_id_stable()
    test_reward_formula()
    test_apply_outcomes_changes_ranking()
    test_state_roundtrip()
    test_resize_preserves_prefix()
    print("All EXP3 unit tests passed.")

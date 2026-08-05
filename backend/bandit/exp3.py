"""EXP3 interactive bandit — production path with real visit outcomes.

Logic mirrors copy_of_demo.exp3_interactive, but apply_outcomes uses observed
screened/positive counts instead of SimStub random draws.
"""

from __future__ import annotations

import numpy as np


def logsumexp_trick(x: np.ndarray) -> np.ndarray:
    x_max = np.max(x)
    exp_x = np.exp(x - x_max)
    return exp_x / exp_x.sum()


def reward_from_observation(screened: np.ndarray, positive: np.ndarray) -> np.ndarray:
    """Demo reward: negative screened-per-positive (0.1 floor when positives == 0)."""
    screened = np.asarray(screened, dtype=float)
    positive = np.asarray(positive, dtype=float)
    reward = np.zeros(len(screened), dtype=float)
    zero_pos = positive == 0
    reward[zero_pos] = -screened[zero_pos] / (0.1 + positive[zero_pos])
    reward[~zero_pos] = -screened[~zero_pos] / positive[~zero_pos]
    return reward


class Exp3Interactive:
    def __init__(self, n_arms: int, T: int = 100, K: int = 1, L: float = 100.0):
        if n_arms < 1:
            raise ValueError("n_arms must be >= 1")
        self.n_arms = int(n_arms)
        self.T = int(T)
        self.K = int(K)
        self.L = float(L)
        self.week_t = 0

        self.p = np.ones(self.n_arms) / self.n_arms
        self.cum_reward = np.zeros(self.n_arms)
        self.his_reward = np.zeros((self.n_arms, self.T))
        self.eta = np.sqrt(np.log(self.n_arms) / (self.T * self.n_arms * self.L**2))
        self.reward = np.zeros(self.n_arms)

    def apply_outcomes(
        self,
        selected_indices: list[int] | np.ndarray,
        screened: list[float] | np.ndarray,
        positive: list[float] | np.ndarray,
    ) -> None:
        """Update weights from real visit outcomes for the selected arms.

        screened/positive are parallel to selected_indices (one outcome per pull).
        """
        selected_indices = np.asarray(selected_indices, dtype=int)
        screened = np.asarray(screened, dtype=float)
        positive = np.asarray(positive, dtype=float)

        if len(selected_indices) == 0:
            return
        if not (len(selected_indices) == len(screened) == len(positive)):
            raise ValueError("selected_indices, screened, and positive must be same length")

        # Build full observation vectors: [diagnosed, screened-diagnosed] per arm
        observation = np.zeros((self.n_arms, 2), dtype=float)
        for idx, s, pos in zip(selected_indices, screened, positive):
            if idx < 0 or idx >= self.n_arms:
                raise IndexError(f"arm index {idx} out of range [0, {self.n_arms})")
            observation[idx, 0] = pos
            observation[idx, 1] = max(s - pos, 0.0)

        totals = observation.sum(axis=1)
        zero_pos = observation[:, 0] == 0
        self.reward = np.zeros(self.n_arms)
        self.reward[zero_pos] = -totals[zero_pos] / (0.1 + observation[:, 0][zero_pos])
        self.reward[~zero_pos] = -totals[~zero_pos] / observation[:, 0][~zero_pos]

        R_hat = np.zeros(self.n_arms)
        # Guard against tiny probabilities
        denom = np.maximum(self.p[selected_indices], 1e-12)
        R_hat[selected_indices] = self.reward[selected_indices] / denom

        self.cum_reward += R_hat
        self.p = logsumexp_trick(self.eta * self.cum_reward)
        self.p = (1 - self.eta) * self.p + self.eta / self.n_arms

        if self.week_t < self.T:
            self.his_reward[:, self.week_t] = self.reward
        self.week_t += 1

    def get_site_recommendation(self, top_k: int | None = None) -> dict:
        """Return zip_code (arm index), priority (p), rank — demo field names."""
        sorted_indices = np.argsort(-self.p)
        probs_sorted = self.p[sorted_indices]

        if top_k is not None:
            sorted_indices = sorted_indices[:top_k]
            probs_sorted = probs_sorted[:top_k]

        return {
            "zip_code": [f"{i}" for i in sorted_indices],
            "priority": probs_sorted.tolist(),
            "rank": list(range(1, len(sorted_indices) + 1)),
            "arm_indices": sorted_indices.tolist(),
        }

    def resize(self, n_arms: int) -> None:
        """Grow arm vectors when new sites appear; keep existing weights."""
        n_arms = int(n_arms)
        if n_arms == self.n_arms:
            return
        if n_arms < self.n_arms:
            raise ValueError("Shrinking n_arms is not supported")

        old_n = self.n_arms
        new_p = np.ones(n_arms) / n_arms
        new_cum = np.zeros(n_arms)
        new_his = np.zeros((n_arms, self.T))

        # Renormalize existing mass into the prefix, leave new arms with equal share of eta mass next update
        new_p[:old_n] = self.p * (old_n / n_arms)
        new_p[old_n:] = (1.0 / n_arms)
        new_p = new_p / new_p.sum()
        new_cum[:old_n] = self.cum_reward
        new_his[:old_n, :] = self.his_reward

        self.n_arms = n_arms
        self.p = new_p
        self.cum_reward = new_cum
        self.his_reward = new_his
        self.eta = np.sqrt(np.log(self.n_arms) / (self.T * self.n_arms * self.L**2))
        self.reward = np.zeros(self.n_arms)

    def to_state(self) -> dict:
        return {
            "n_arms": self.n_arms,
            "T": self.T,
            "K": self.K,
            "L": self.L,
            "week_t": self.week_t,
            "eta": float(self.eta),
            "p": self.p.tolist(),
            "cum_reward": self.cum_reward.tolist(),
        }

    @classmethod
    def from_state(cls, state: dict) -> "Exp3Interactive":
        model = cls(
            n_arms=int(state["n_arms"]),
            T=int(state.get("T", 100)),
            K=int(state.get("K", 1)),
            L=float(state.get("L", 100.0)),
        )
        model.week_t = int(state.get("week_t", 0))
        model.p = np.asarray(state["p"], dtype=float)
        model.cum_reward = np.asarray(state["cum_reward"], dtype=float)
        if "eta" in state:
            model.eta = float(state["eta"])
        if len(model.p) != model.n_arms or len(model.cum_reward) != model.n_arms:
            raise ValueError("State vector length does not match n_arms")
        return model

    def reset(self) -> None:
        self.p = np.ones(self.n_arms) / self.n_arms
        self.cum_reward = np.zeros(self.n_arms)
        self.his_reward = np.zeros((self.n_arms, self.T))
        self.week_t = 0
        self.reward = np.zeros(self.n_arms)

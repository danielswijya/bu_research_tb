"""EXP3 site recommendation bandit (production path).

Research LinUCB remains in copy_of_demo.py; use this package for live rankings.
"""

from .exp3 import Exp3Interactive, logsumexp_trick

__all__ = ["Exp3Interactive", "logsumexp_trick"]

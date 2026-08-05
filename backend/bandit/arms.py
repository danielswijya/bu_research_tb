"""Stable arm identity helpers for screening sites."""

from __future__ import annotations

import hashlib
import re
from typing import Any


def _norm(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def make_arm_id(location_name: Any, zona_name: Any, district: Any) -> str:
    """Stable arm_id from location_name|Zona_name|District."""
    key = f"{_norm(location_name)}|{_norm(zona_name)}|{_norm(district)}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def site_join_key(location_name: Any, zona_name: Any, district: Any) -> str:
    return f"{_norm(location_name)}|{_norm(zona_name)}|{_norm(district)}"

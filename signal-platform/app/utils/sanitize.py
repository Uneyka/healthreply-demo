from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone

CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")
MULTI_SPACE = re.compile(r"\s+")
TICKER_PATTERN = re.compile(r"\b[A-Z]{1,5}\b")


def sanitize_text(text: str, max_len: int = 400) -> str:
    cleaned = CONTROL_CHARS.sub(" ", text)
    cleaned = MULTI_SPACE.sub(" ", cleaned).strip()
    return cleaned[:max_len]


def extract_ticker_candidates(text: str) -> str:
    tickers = sorted(set(TICKER_PATTERN.findall(text)))
    return ",".join(tickers[:8])


def dedupe_hash(headline: str, published_at: datetime) -> str:
    normalized = sanitize_text(headline).lower()
    key = f"{normalized}|{published_at.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M')}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

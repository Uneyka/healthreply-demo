from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from app.utils.text import sanitize_text


def dedupe_hash(title: str, source: str, timestamp: datetime, bucket_minutes: int = 30) -> str:
    ts = timestamp.astimezone(timezone.utc)
    bucket = ts.replace(minute=(ts.minute // bucket_minutes) * bucket_minutes, second=0, microsecond=0)
    payload = f"{sanitize_text(title,220).lower()}|{source.lower()}|{bucket.isoformat()}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

from __future__ import annotations

from datetime import datetime, timezone

import requests

from app.config import settings
from app.storage.models import NewsItem
from app.utils.hashing import dedupe_hash
from app.utils.text import sanitize_text


def collect_finnhub(symbol: str = 'AAPL') -> list[NewsItem]:
    if not settings.finnhub_enabled or not settings.finnhub_api_key:
        return []
    url = 'https://finnhub.io/api/v1/company-news'
    params = {'symbol': symbol, 'from': datetime.now(timezone.utc).strftime('%Y-%m-%d'), 'to': datetime.now(timezone.utc).strftime('%Y-%m-%d'), 'token': settings.finnhub_api_key}
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    rows = r.json()

    out: list[NewsItem] = []
    for row in rows:
        ts = datetime.fromtimestamp(row.get('datetime', 0), tz=timezone.utc)
        title = sanitize_text(row.get('headline', ''), 240)
        if not title:
            continue
        out.append(NewsItem(
            source='finnhub',
            source_url='https://finnhub.io',
            headline=title,
            summary=sanitize_text(row.get('summary', ''), 900),
            link=sanitize_text(row.get('url', ''), 600),
            published_at=ts,
            asset=symbol,
            dedupe_hash=dedupe_hash(title, 'finnhub', ts),
        ))
    return out

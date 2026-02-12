from __future__ import annotations

from datetime import datetime, timezone

import feedparser
from dateutil import parser as date_parser

from app.config import settings
from app.storage.models import NewsItem
from app.utils.hashing import dedupe_hash
from app.utils.text import extract_tickers, sanitize_text


def _parse_dt(value: str) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    dt = date_parser.parse(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def collect_rss() -> list[NewsItem]:
    out: list[NewsItem] = []
    for source_url in settings.rss_feeds:
        parsed = feedparser.parse(source_url)
        for e in parsed.entries:
            headline = sanitize_text(getattr(e, 'title', ''), 240)
            summary = sanitize_text(getattr(e, 'summary', ''), 900)
            if not headline:
                continue
            published_at = _parse_dt(getattr(e, 'published', ''))
            ticker_candidates = extract_tickers(f'{headline} {summary}')
            asset = ticker_candidates[0] if ticker_candidates else 'SPY'
            out.append(
                NewsItem(
                    source=source_url,
                    source_url=source_url,
                    headline=headline,
                    summary=summary,
                    link=sanitize_text(getattr(e, 'link', ''), 600),
                    published_at=published_at,
                    asset=asset,
                    dedupe_hash=dedupe_hash(headline, source_url, published_at),
                )
            )
    return out

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Iterable, List

import feedparser
import requests
from dateutil import parser as date_parser

from app.config import settings
from app.models import NewsItem
from app.utils.sanitize import dedupe_hash, extract_ticker_candidates, sanitize_text

logger = logging.getLogger(__name__)


class NewsCollector:
    def collect(self) -> List[NewsItem]:
        items: List[NewsItem] = []
        items.extend(self._collect_rss())
        if settings.finnhub_enabled and settings.finnhub_api_key:
            items.extend(self._collect_finnhub())
        if settings.newsapi_enabled and settings.newsapi_key:
            items.extend(self._collect_newsapi())
        return items

    def _collect_rss(self) -> List[NewsItem]:
        rows: List[NewsItem] = []
        for url in settings.rss_feeds:
            try:
                parsed = feedparser.parse(url)
                for entry in parsed.entries:
                    published = self._parse_dt(getattr(entry, "published", ""))
                    headline = sanitize_text(getattr(entry, "title", ""), 220)
                    summary = sanitize_text(getattr(entry, "summary", ""), 600)
                    if not headline:
                        continue
                    rows.append(
                        NewsItem(
                            source=url,
                            headline=headline,
                            summary=summary,
                            url=sanitize_text(getattr(entry, "link", ""), 500),
                            published_at=published,
                            raw_tickers=extract_ticker_candidates(f"{headline} {summary}"),
                            dedupe_hash=dedupe_hash(headline, published),
                        )
                    )
            except Exception as exc:
                logger.warning("rss_collection_failed url=%s err=%s", url, exc)
        return rows

    def _collect_finnhub(self) -> List[NewsItem]:
        url = "https://finnhub.io/api/v1/news"
        params = {"category": "general", "token": settings.finnhub_api_key}
        return self._collect_json_feed("finnhub", url, params)

    def _collect_newsapi(self) -> List[NewsItem]:
        url = "https://newsapi.org/v2/top-headlines"
        params = {"category": "business", "apiKey": settings.newsapi_key, "language": "en"}
        return self._collect_json_feed("newsapi", url, params)

    def _collect_json_feed(self, source: str, url: str, params: dict[str, str]) -> List[NewsItem]:
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:
            logger.warning("api_collection_failed source=%s err=%s", source, exc)
            return []

        articles: Iterable[dict] = payload if isinstance(payload, list) else payload.get("articles", []) or payload.get("data", [])
        rows: List[NewsItem] = []
        for article in articles:
            title = sanitize_text(article.get("headline") or article.get("title") or "", 220)
            summary = sanitize_text(article.get("summary") or article.get("description") or "", 600)
            published = self._parse_dt(article.get("datetime") or article.get("publishedAt") or "")
            if not title:
                continue
            rows.append(
                NewsItem(
                    source=source,
                    headline=title,
                    summary=summary,
                    url=sanitize_text(article.get("url") or "", 500),
                    published_at=published,
                    raw_tickers=extract_ticker_candidates(f"{title} {summary}"),
                    dedupe_hash=dedupe_hash(title, published),
                )
            )
        return rows

    @staticmethod
    def _parse_dt(value: str) -> datetime:
        if not value:
            return datetime.now(timezone.utc)
        try:
            dt = date_parser.parse(str(value))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)

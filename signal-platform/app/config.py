from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List


def csv_list(value: str) -> List[str]:
    return [x.strip() for x in value.split(',') if x.strip()]


def csv_weights(value: str) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for part in csv_list(value):
        if '=' in part:
            k, v = part.split('=', 1)
            out[k.strip()] = float(v.strip())
    return out


@dataclass(frozen=True)
class Settings:
    db_path: str = os.getenv('DB_PATH', '/data/signals.db')
    poll_interval_sec: int = int(os.getenv('POLL_INTERVAL_SEC', '90'))
    rss_feeds: List[str] = field(default_factory=list)
    finnhub_enabled: bool = os.getenv('FINNHUB_ENABLED', 'false').lower() == 'true'
    finnhub_api_key: str = os.getenv('FINNHUB_API_KEY', '')
    llm_summary_enabled: bool = os.getenv('LLM_SUMMARY_ENABLED', 'false').lower() == 'true'

    telegram_bot_token: str = os.getenv('TELEGRAM_BOT_TOKEN', '')
    telegram_chat_ids: List[str] = field(default_factory=list)

    notion_enabled: bool = os.getenv('NOTION_ENABLED', 'false').lower() == 'true'
    notion_token: str = os.getenv('NOTION_TOKEN', '')
    notion_database_id: str = os.getenv('NOTION_DATABASE_ID', '')

    dedupe_hours: int = int(os.getenv('DEDUPE_HOURS', '24'))
    asset_cooldown_minutes: int = int(os.getenv('ASSET_COOLDOWN_MINUTES', '15'))

    confidence_threshold: float = float(os.getenv('CONFIDENCE_THRESHOLD', '0.65'))
    min_expected_upper_pct: float = float(os.getenv('MIN_EXPECTED_UPPER_PCT', '0.60'))
    min_atr_pct: float = float(os.getenv('MIN_ATR_PCT', '0.15'))
    max_atr_pct: float = float(os.getenv('MAX_ATR_PCT', '4.00'))
    require_price_confirmation: bool = os.getenv('REQUIRE_PRICE_CONFIRMATION', 'true').lower() == 'true'

    price_cache_ttl_sec: int = int(os.getenv('PRICE_CACHE_TTL_SEC', '900'))
    stooq_url_template: str = os.getenv('STOOQ_URL_TEMPLATE', 'https://stooq.com/q/d/l/?s={symbol}&i=5')

    source_weights: Dict[str, float] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, 'rss_feeds', csv_list(os.getenv('RSS_FEEDS', 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml')))
        object.__setattr__(self, 'telegram_chat_ids', csv_list(os.getenv('TELEGRAM_CHAT_IDS', '')))
        object.__setattr__(self, 'source_weights', csv_weights(os.getenv('SOURCE_WEIGHTS', 'default=1.0,dj.com=1.1,nasdaq.com=1.05')))


settings = Settings()

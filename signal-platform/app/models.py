from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class NewsItem:
    source: str
    headline: str
    summary: str
    url: str
    published_at: datetime
    raw_tickers: str
    dedupe_hash: str


@dataclass
class ClassifiedEvent:
    news_id: int
    event_type: str
    sentiment_score: float
    impact_score: int
    confidence_score: float
    asset_hint: str
    rationale: str


@dataclass
class MarketContext:
    asset: str
    trend_direction: str
    atr_pct: float
    breakout_state: str
    liquidity_proxy: str


@dataclass
class Signal:
    asset: str
    event_type: str
    bias: str
    explanation: str
    entry_context: str
    invalidation: str
    tp_example: Optional[str]
    confidence_score: float
    risk_note: str
    mode: str

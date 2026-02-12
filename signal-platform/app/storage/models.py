from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


Direction = Literal['bullish', 'bearish', 'unclear']
Bias = Literal['Long', 'Short', 'Neutral']


@dataclass
class NewsItem:
    source: str
    source_url: str
    headline: str
    summary: str
    link: str
    published_at: datetime
    asset: str
    dedupe_hash: str


@dataclass
class Classification:
    event_type: str
    direction: Direction
    rule_confidence: float
    matched_rules: str


@dataclass
class MarketFeatures:
    asset: str
    price: float
    atr_pct: float
    trend: str
    regime: str
    above_short_ma: bool
    recent_pivot: float


@dataclass
class SignalPayload:
    asset: str
    timestamp_utc: str
    source: str
    headline: str
    event_type: str
    direction: Direction
    bias: Bias
    impact_score: int
    confidence_score: float
    expected_move_low_pct: float
    expected_move_high_pct: float
    trigger: str
    invalidation: str
    risk_notes: str
    link: str
    horizon: str
    rationale: str

from __future__ import annotations

from app.storage.models import Bias, Direction, SignalPayload


def _bias(direction: Direction) -> Bias:
    if direction == 'bullish':
        return 'Long'
    if direction == 'bearish':
        return 'Short'
    return 'Neutral'


def build_signal(
    asset: str,
    timestamp_utc: str,
    source: str,
    headline: str,
    link: str,
    event_type: str,
    direction: Direction,
    low: float,
    high: float,
    impact: int,
    confidence: float,
    rationale: str,
) -> SignalPayload:
    bias = _bias(direction)
    trigger = (
        'Bullish confirmation: hold above 20MA / recent pivot before considering entry.'
        if bias == 'Long'
        else 'Bearish confirmation: reject at 20MA / break below pivot before considering entry.'
        if bias == 'Short'
        else 'Wait for directional confirmation; no immediate setup.'
    )
    invalidation = (
        'Invalid if price closes back below confirmation level.'
        if bias == 'Long'
        else 'Invalid if price reclaims confirmation level with momentum.'
        if bias == 'Short'
        else 'Invalid if event narrative is contradicted by follow-up data.'
    )
    risk = 'Manual trading only. Watch spread, slippage, gap risk, and event headline revisions.'
    return SignalPayload(
        asset=asset,
        timestamp_utc=timestamp_utc,
        source=source,
        headline=headline,
        event_type=event_type,
        direction=direction,
        bias=bias,
        impact_score=impact,
        confidence_score=confidence,
        expected_move_low_pct=low,
        expected_move_high_pct=high,
        trigger=trigger,
        invalidation=invalidation,
        risk_notes=risk,
        link=link,
        horizon='1-4h',
        rationale=rationale,
    )

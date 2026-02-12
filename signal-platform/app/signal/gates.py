from __future__ import annotations

from app.config import settings
from app.storage.db import recent_signal_for_asset
from app.storage.models import Direction, MarketFeatures


def pass_gates(
    asset: str,
    direction: Direction,
    confidence: float,
    expected_high: float,
    impact_score: int,
    features: MarketFeatures,
) -> tuple[bool, str]:
    if recent_signal_for_asset(asset, settings.asset_cooldown_minutes):
        return False, 'asset_cooldown'
    if confidence < settings.confidence_threshold:
        return False, 'low_confidence'
    if expected_high < settings.min_expected_upper_pct:
        return False, 'expected_move_too_low'
    if not (settings.min_atr_pct <= features.atr_pct <= settings.max_atr_pct):
        return False, 'atr_out_of_band'
    if direction == 'unclear' and impact_score < 85:
        return False, 'unclear_direction'
    if settings.require_price_confirmation and direction != 'unclear':
        bullish_ok = direction == 'bullish' and (features.above_short_ma or features.price > features.recent_pivot)
        bearish_ok = direction == 'bearish' and (not features.above_short_ma or features.price < features.recent_pivot)
        if not (bullish_ok or bearish_ok):
            return False, 'price_confirmation_failed'
    return True, 'passed'

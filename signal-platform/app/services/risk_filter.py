from __future__ import annotations

from app.config import settings
from app.db import alerts_last_hour, recent_signals_per_asset
from app.models import ClassifiedEvent, Signal


class RiskFilter:
    def accept(self, event: ClassifiedEvent, signal: Signal) -> tuple[bool, str]:
        min_conf = settings.min_confidence_aggressive if settings.signal_mode == "AGGRESSIVE" else settings.min_confidence_standard
        min_impact = settings.min_impact_aggressive if settings.signal_mode == "AGGRESSIVE" else settings.min_impact_standard

        if event.confidence_score < min_conf:
            return False, "confidence_below_threshold"
        if event.impact_score < min_impact:
            return False, "impact_below_threshold"
        if recent_signals_per_asset(signal.asset, settings.asset_cooldown_minutes) > 0:
            return False, "asset_cooldown_active"
        if alerts_last_hour() >= settings.max_alerts_per_hour:
            return False, "global_rate_limit"
        if signal.mode == "AGGRESSIVE" and signal.confidence_score < 0.65:
            signal.risk_note += " Aggressive mode: early signal; await extra confirmation."
        return True, "accepted"

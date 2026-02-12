from __future__ import annotations

from app.models import ClassifiedEvent, MarketContext, Signal


class SignalEngine:
    def generate(self, event: ClassifiedEvent, market: MarketContext, mode: str) -> Signal | None:
        if event.event_type == "other":
            return None

        directional_sentiment = event.sentiment_score
        trend_boost = 0.15 if market.trend_direction == "uptrend" else -0.15
        combined = directional_sentiment + trend_boost
        bias = "long" if combined >= 0 else "short"

        explanation = (
            f"{event.event_type} with sentiment={event.sentiment_score:.2f}, impact={event.impact_score}, "
            f"trend={market.trend_direction}, breakout={market.breakout_state}"
        )
        entry_context = (
            "Look for pullback-to-breakout retest" if market.breakout_state.startswith("breakout") else "Wait for confirmation candle near key session level"
        )
        invalidation = "Invalidate if price closes back inside prior range with rising volatility against bias"
        tp_example = "Example only: scale out at 1.5R then trail to 2.5R" if mode == "AGGRESSIVE" else "Example only: partial at 1R, final at 2R"

        return Signal(
            asset=event.asset_hint,
            event_type=event.event_type,
            bias=bias,
            explanation=explanation,
            entry_context=entry_context,
            invalidation=invalidation,
            tp_example=tp_example,
            confidence_score=event.confidence_score,
            risk_note="Manual decision support only. Leverage magnifies losses; size conservatively.",
            mode=mode,
        )

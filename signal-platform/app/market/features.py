from __future__ import annotations

from statistics import mean, pstdev

from app.market.prices import PriceAdapter
from app.storage.models import MarketFeatures


def compute_features(asset: str, adapter: PriceAdapter) -> MarketFeatures:
    bars = adapter.fetch_bars(asset, limit=120)
    if len(bars) < 30:
        return MarketFeatures(asset=asset, price=0.0, atr_pct=0.0, trend='unknown', regime='unknown', above_short_ma=False, recent_pivot=0.0)

    closes = [b.close for b in bars]
    highs = [b.high for b in bars]
    lows = [b.low for b in bars]
    price = closes[-1]

    atr = mean(h - l for h, l in zip(highs[-14:], lows[-14:]))
    atr_pct = (atr / price * 100.0) if price else 0.0
    ma20 = mean(closes[-20:])
    ma50 = mean(closes[-50:])
    trend = 'up' if ma20 > ma50 else 'down'
    rolling_std = pstdev(closes[-30:]) / price * 100.0 if price else 0.0
    regime = 'trending' if atr_pct > rolling_std else 'ranging'
    above_short = price >= ma20
    pivot = mean(closes[-5:])

    return MarketFeatures(asset=asset, price=round(price, 4), atr_pct=round(atr_pct, 4), trend=trend, regime=regime, above_short_ma=above_short, recent_pivot=round(pivot, 4))

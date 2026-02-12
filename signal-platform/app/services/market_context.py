from __future__ import annotations

import csv
import io
import logging
from statistics import mean

import requests

from app.config import settings
from app.models import MarketContext

logger = logging.getLogger(__name__)


class MarketContextAnalyzer:
    def analyze(self, asset: str) -> MarketContext:
        candles = self._fetch_daily(asset)
        if len(candles) < 20:
            return MarketContext(asset=asset, trend_direction="unknown", atr_pct=0.0, breakout_state="unknown", liquidity_proxy="unknown")

        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]

        sma_fast = mean(closes[-10:])
        sma_slow = mean(closes[-20:])
        trend = "uptrend" if sma_fast > sma_slow else "downtrend"

        atr = mean(h - l for h, l in zip(highs[-14:], lows[-14:]))
        atr_pct = (atr / closes[-1]) * 100 if closes[-1] else 0.0

        recent_high = max(highs[-20:-1])
        recent_low = min(lows[-20:-1])
        breakout = "breakout_up" if closes[-1] > recent_high else "breakout_down" if closes[-1] < recent_low else "range"

        avg_range = mean(h - l for h, l in zip(highs[-20:], lows[-20:]))
        liquidity = "good" if avg_range / closes[-1] < 0.05 else "thin"

        return MarketContext(asset=asset, trend_direction=trend, atr_pct=round(atr_pct, 2), breakout_state=breakout, liquidity_proxy=liquidity)

    def _fetch_daily(self, asset: str) -> list[dict[str, float]]:
        symbol = f"{asset.lower()}.us" if len(asset) <= 5 and asset.isalpha() else asset.lower()
        url = settings.market_data_url_template.format(symbol=symbol)
        try:
            response = requests.get(url, timeout=8)
            response.raise_for_status()
        except Exception as exc:
            logger.warning("market_data_fetch_failed asset=%s err=%s", asset, exc)
            return []

        rows: list[dict[str, float]] = []
        reader = csv.DictReader(io.StringIO(response.text))
        for row in reader:
            try:
                rows.append({"high": float(row["High"]), "low": float(row["Low"]), "close": float(row["Close"])})
            except Exception:
                continue
        return rows

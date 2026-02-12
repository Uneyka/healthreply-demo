from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from uuid import uuid4

from app.db import save_backtest_metric
from app.models import NewsItem
from app.services.classifier import EventClassifier
from app.services.market_context import MarketContextAnalyzer
from app.services.signal_engine import SignalEngine


class Backtester:
    def __init__(self) -> None:
        self.classifier = EventClassifier()
        self.market = MarketContextAnalyzer()
        self.engine = SignalEngine()

    def replay(self, headlines: list[dict[str, str]]) -> str:
        run_id = uuid4().hex[:12]
        signals = []
        for i, row in enumerate(headlines, start=1):
            item = NewsItem(
                source="backtest",
                headline=row["headline"],
                summary=row.get("summary", ""),
                url=row.get("url", ""),
                published_at=datetime.now(timezone.utc),
                raw_tickers=row.get("asset", ""),
                dedupe_hash=f"backtest-{i}",
            )
            event = self.classifier.classify(i, item)
            ctx = self.market.analyze(event.asset_hint)
            signal = self.engine.generate(event, ctx, mode="STANDARD")
            if signal:
                signals.append({"signal": signal, "event": event})

        count = len(signals)
        long_count = len([s for s in signals if s["signal"].bias == "long"])
        short_count = count - long_count
        avg_conf = sum(s["signal"].confidence_score for s in signals) / count if count else 0.0
        clustering = self._cluster_proxy(signals)
        directional_accuracy_proxy = self._direction_proxy(signals)
        drawdown_proxy = max(0.0, 1.0 - directional_accuracy_proxy)

        save_backtest_metric(run_id, "signal_frequency", float(count), f"long={long_count},short={short_count}")
        save_backtest_metric(run_id, "directional_accuracy_proxy", directional_accuracy_proxy)
        save_backtest_metric(run_id, "drawdown_proxy", drawdown_proxy)
        save_backtest_metric(run_id, "signal_clustering", clustering)
        save_backtest_metric(run_id, "average_confidence", avg_conf)

        return run_id

    @staticmethod
    def _cluster_proxy(signals: list[dict]) -> float:
        if not signals:
            return 0.0
        assets = [s["signal"].asset for s in signals]
        return 1 - (len(set(assets)) / len(assets))

    @staticmethod
    def _direction_proxy(signals: list[dict]) -> float:
        if not signals:
            return 0.0
        aligned = 0
        for s in signals:
            signal = s["signal"]
            event = s["event"]
            if signal.bias == "long" and event.sentiment_score >= 0:
                aligned += 1
            if signal.bias == "short" and event.sentiment_score < 0:
                aligned += 1
        return aligned / len(signals)

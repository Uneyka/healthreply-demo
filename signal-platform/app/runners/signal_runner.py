from __future__ import annotations

import logging
import time
from datetime import datetime

from dateutil import parser as date_parser

from app.config import settings
from app.db import init_db, insert_classification, insert_signal, log_system, pending_news
from app.logging_utils import configure_logging
from app.models import NewsItem
from app.services.classifier import EventClassifier
from app.services.market_context import MarketContextAnalyzer
from app.services.risk_filter import RiskFilter
from app.services.signal_engine import SignalEngine


def main() -> None:
    configure_logging()
    logger = logging.getLogger("signal_engine")
    init_db()

    classifier = EventClassifier()
    market = MarketContextAnalyzer()
    engine = SignalEngine()
    risk = RiskFilter()

    while True:
        emitted = 0
        for row in pending_news():
            item = NewsItem(
                source=row["source"],
                headline=row["headline"],
                summary=row["summary"],
                url=row["url"],
                published_at=date_parser.parse(row["published_at"]),
                raw_tickers=row["raw_tickers"],
                dedupe_hash=row["dedupe_hash"],
            )
            event = classifier.classify(row["id"], item)
            event_id = insert_classification(event)
            context = market.analyze(event.asset_hint)
            signal = engine.generate(event, context, settings.signal_mode)
            if not signal:
                continue
            ok, reason = risk.accept(event, signal)
            if not ok:
                logger.info("signal_rejected asset=%s reason=%s", signal.asset, reason)
                continue
            insert_signal(event_id, signal)
            emitted += 1

        log_system("signal_engine", "INFO", f"evaluation complete emitted={emitted}")
        logger.info("evaluation_complete emitted=%s", emitted)
        time.sleep(settings.poll_interval_sec)


if __name__ == "__main__":
    main()

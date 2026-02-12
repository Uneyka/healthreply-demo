from __future__ import annotations

import logging
import time

from app.config import settings
from app.db import init_db, insert_news, log_system
from app.logging_utils import configure_logging
from app.services.news_collector import NewsCollector


def main() -> None:
    configure_logging()
    logger = logging.getLogger("collector")
    init_db()
    collector = NewsCollector()

    while True:
        inserted = 0
        for item in collector.collect():
            news_id = insert_news(item)
            if news_id:
                inserted += 1
        log_system("collector", "INFO", f"poll complete inserted={inserted}")
        logger.info("poll_complete inserted=%s", inserted)
        time.sleep(settings.poll_interval_sec)


if __name__ == "__main__":
    main()

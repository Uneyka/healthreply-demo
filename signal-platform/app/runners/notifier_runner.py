from __future__ import annotations

import logging
import time

from app.config import settings
from app.db import init_db, mark_signal_sent, recent_unsent_signals
from app.logging_utils import configure_logging
from app.services.telegram_notifier import TelegramNotifier, format_alert


def main() -> None:
    configure_logging()
    logger = logging.getLogger("notifier")
    init_db()
    notifier = TelegramNotifier()

    while True:
        rows = recent_unsent_signals()
        sent = 0
        for row in rows:
            message = format_alert(dict(row))
            if notifier.send_markdown(message):
                mark_signal_sent(int(row["id"]))
                sent += 1
        logger.info("notification_cycle pending=%s sent=%s", len(rows), sent)
        time.sleep(max(30, settings.poll_interval_sec // 2))


if __name__ == "__main__":
    main()

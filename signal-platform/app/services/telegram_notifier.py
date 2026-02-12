from __future__ import annotations

import logging
import time

import requests

from app.config import settings

logger = logging.getLogger(__name__)


class TelegramNotifier:
    def send_markdown(self, message: str) -> bool:
        if not settings.telegram_bot_token or not settings.telegram_chat_ids:
            logger.info("telegram_disabled")
            return False

        ok = True
        for chat_id in settings.telegram_chat_ids:
            sent = self._send_with_retry(chat_id, message)
            ok = ok and sent
            time.sleep(0.35)
        return ok

    def _send_with_retry(self, chat_id: str, message: str, attempts: int = 3) -> bool:
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }
        for attempt in range(1, attempts + 1):
            try:
                response = requests.post(url, json=payload, timeout=8)
                if response.status_code == 429:
                    time.sleep(2 * attempt)
                    continue
                response.raise_for_status()
                return True
            except Exception as exc:
                logger.warning("telegram_send_failed chat=%s attempt=%s err=%s", chat_id, attempt, exc)
                time.sleep(attempt)
        return False


def format_alert(payload: dict) -> str:
    return (
        "*BREAKING NEWS SIGNAL*\n"
        f"*Asset:* `{payload['asset']}`\n"
        f"*Event:* {payload['event_type']}\n"
        f"*Bias:* *{payload['bias'].upper()}*\n"
        f"*Reason:* {payload['explanation']}\n"
        f"*Suggested context:* {payload['entry_context']}\n"
        f"*Invalidation idea:* {payload['invalidation']}\n"
        f"*Confidence score:* {payload['confidence_score']:.2f}\n"
        f"*Risk note:* _{payload['risk_note']}_\n"
        "\n_Not financial advice. Manual execution only._"
    )

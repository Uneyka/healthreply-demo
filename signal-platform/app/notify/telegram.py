from __future__ import annotations

import requests

from app.config import settings
from app.storage.models import SignalPayload
from app.utils.text import markdown_v2_escape


def render_telegram_message(sig: SignalPayload) -> str:
    return (
        f"*\\[BREAKING\\] {markdown_v2_escape(sig.asset)}*\n"
        f"Time \(UTC\): {markdown_v2_escape(sig.timestamp_utc)}\n"
        f"Source: {markdown_v2_escape(sig.source)}\n"
        f"Headline: {markdown_v2_escape(sig.headline)}\n"
        f"Event: {markdown_v2_escape(sig.event_type)} \({markdown_v2_escape(sig.direction)}\)\n"
        f"Impact: {sig.impact_score}  Confidence: {int(sig.confidence_score*100)}\n"
        f"Expected move \(underlying\): {sig.expected_move_low_pct:.2f}% to {sig.expected_move_high_pct:.2f}% \(1\-4h\)\n"
        f"Trigger: {markdown_v2_escape(sig.trigger)}\n"
        f"Invalidation: {markdown_v2_escape(sig.invalidation)}\n"
        f"Risk: {markdown_v2_escape(sig.risk_notes)}\n"
        f"Link: {markdown_v2_escape(sig.link or 'n/a')}"
    )


def send_telegram(message: str) -> tuple[bool, str]:
    if not settings.telegram_bot_token or not settings.telegram_chat_ids:
        return False, 'telegram_not_configured'
    url = f'https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage'
    for chat_id in settings.telegram_chat_ids:
        payload = {'chat_id': chat_id, 'text': message, 'parse_mode': 'MarkdownV2', 'disable_web_page_preview': True}
        r = requests.post(url, json=payload, timeout=8)
        if not r.ok:
            return False, r.text[:500]
    return True, 'ok'

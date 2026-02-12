from __future__ import annotations

import json

import requests

from app.config import settings
from app.storage.models import SignalPayload


def send_to_notion(sig: SignalPayload) -> tuple[bool, str]:
    if not settings.notion_enabled:
        return False, 'notion_disabled'
    if not settings.notion_token or not settings.notion_database_id:
        return False, 'notion_not_configured'

    url = 'https://api.notion.com/v1/pages'
    headers = {
        'Authorization': f'Bearer {settings.notion_token}',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    }
    summary = (
        f"{sig.asset} {sig.event_type} {sig.bias} | impact={sig.impact_score} "
        f"confidence={sig.confidence_score:.2f} | move={sig.expected_move_low_pct:.2f}-{sig.expected_move_high_pct:.2f}%"
    )
    payload = {
        'parent': {'database_id': settings.notion_database_id},
        'properties': {
            'Title': {'title': [{'text': {'content': f"{sig.asset} {sig.event_type}"}}]},
            'Asset': {'rich_text': [{'text': {'content': sig.asset}}]},
            'Bias': {'select': {'name': sig.bias}},
            'Confidence': {'number': sig.confidence_score},
        },
        'children': [
            {'object': 'block', 'type': 'paragraph', 'paragraph': {'rich_text': [{'type': 'text', 'text': {'content': summary}}]}},
            {'object': 'block', 'type': 'code', 'code': {'language': 'json', 'rich_text': [{'type': 'text', 'text': {'content': json.dumps(sig.__dict__, indent=2)}}]}},
        ],
    }
    r = requests.post(url, headers=headers, json=payload, timeout=10)
    return (True, 'ok') if r.ok else (False, r.text[:700])

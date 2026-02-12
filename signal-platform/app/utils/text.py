from __future__ import annotations

import re

CONTROL = re.compile(r'[\x00-\x1f\x7f]')
WS = re.compile(r'\s+')
TICKER = re.compile(r'\b[A-Z]{1,5}\b')


def sanitize_text(text: str, max_len: int = 600) -> str:
    clean = CONTROL.sub(' ', text)
    clean = WS.sub(' ', clean).strip()
    return clean[:max_len]


def extract_tickers(text: str) -> list[str]:
    return sorted(set(TICKER.findall(text)))[:8]


def markdown_v2_escape(text: str) -> str:
    chars = r'_*[]()~`>#+-=|{}.!'
    escaped = text
    for ch in chars:
        escaped = escaped.replace(ch, f'\\{ch}')
    return escaped

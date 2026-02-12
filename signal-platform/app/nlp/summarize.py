from __future__ import annotations

from app.config import settings


def maybe_summarize(text: str) -> str:
    if not settings.llm_summary_enabled:
        return text
    # deterministic fallback; LLM integration intentionally disabled by default
    return text[:280]

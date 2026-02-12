from __future__ import annotations

from dataclasses import dataclass

from app.storage.models import Direction


@dataclass(frozen=True)
class Rule:
    event_type: str
    direction: Direction
    confidence: float
    patterns: tuple[str, ...]


RULES: tuple[Rule, ...] = (
    Rule('EARNINGS_MISS', 'bearish', 0.86, ('earnings miss', 'misses earnings', 'below estimates')),
    Rule('EARNINGS_BEAT', 'bullish', 0.84, ('earnings beat', 'beats earnings', 'above estimates')),
    Rule('GUIDANCE_CUT', 'bearish', 0.80, ('cuts guidance', 'lowers outlook', 'withdraws guidance')),
    Rule('GUIDANCE_RAISED', 'bullish', 0.78, ('raises guidance', 'raises outlook', 'improves forecast')),
    Rule('MNA', 'bullish', 0.73, ('acquire', 'acquisition', 'merger', 'buyout')),
    Rule('ANALYST_DOWNGRADE', 'bearish', 0.68, ('downgrade', 'cuts rating', 'underperform')),
    Rule('ANALYST_UPGRADE', 'bullish', 0.66, ('upgrade', 'raises rating', 'outperform')),
    Rule('REGULATORY_LEGAL_NEG', 'bearish', 0.72, ('lawsuit', 'probe', 'fine', 'fraud', 'sec charge')),
    Rule('REGULATORY_LEGAL_POS', 'bullish', 0.64, ('approval', 'cleared', 'dismissed case')),
    Rule('MACRO_HAWKISH', 'bearish', 0.74, ('higher for longer', 'hawkish', 'rate hike', 'inflation rises')),
    Rule('MACRO_DOVISH', 'bullish', 0.74, ('dovish', 'rate cut', 'inflation cools', 'softer cpi')),
    Rule('GEOPOL_RISK_OFF', 'bearish', 0.72, ('war escalation', 'sanctions', 'conflict escalation')),
    Rule('GEOPOL_RISK_ON', 'bullish', 0.62, ('ceasefire', 'trade deal', 'sanctions relief')),
)


def classify_event(headline: str, summary: str) -> tuple[str, Direction, float, list[str]]:
    text = f'{headline} {summary}'.lower()
    for rule in RULES:  # precedence is order
        hits = [p for p in rule.patterns if p in text]
        if hits:
            return rule.event_type, rule.direction, rule.confidence, hits
    return 'OTHER', 'unclear', 0.35, []

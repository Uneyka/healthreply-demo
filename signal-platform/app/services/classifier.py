from __future__ import annotations

from dataclasses import dataclass

from app.models import ClassifiedEvent, NewsItem


@dataclass
class Rule:
    event_type: str
    keywords: tuple[str, ...]
    sentiment: float
    impact: int


RULES: tuple[Rule, ...] = (
    Rule("earnings_beat", ("beats", "earnings beat", "strong quarter"), 0.75, 78),
    Rule("earnings_miss", ("misses", "earnings miss", "weak quarter"), -0.75, 80),
    Rule("guidance_change", ("guidance", "forecast", "outlook"), 0.2, 68),
    Rule("merger_acquisition", ("acquire", "merger", "buyout"), 0.35, 82),
    Rule("analyst_action", ("upgrade", "downgrade", "target price"), 0.15, 60),
    Rule("macro_release", ("cpi", "rates", "payroll", "fomc", "inflation"), 0.0, 75),
    Rule("regulatory_legal", ("sec", "lawsuit", "antitrust", "fine"), -0.35, 73),
    Rule("geopolitical", ("sanction", "war", "tariff", "embargo"), -0.2, 70),
    Rule("corporate_announcement", ("ceo", "dividend", "buyback", "restructuring"), 0.1, 58),
)


class EventClassifier:
    def classify(self, news_id: int, item: NewsItem) -> ClassifiedEvent:
        text = f"{item.headline} {item.summary}".lower()
        matched = [rule for rule in RULES if any(keyword in text for keyword in rule.keywords)]

        if not matched:
            return ClassifiedEvent(news_id, "other", 0.0, 35, 0.35, self._asset_hint(item), "No major market-moving keywords.")

        primary = sorted(matched, key=lambda r: r.impact, reverse=True)[0]
        confidence = min(0.95, 0.55 + 0.08 * len(matched) + (0.07 if item.raw_tickers else 0.0))
        sentiment = max(-1.0, min(1.0, primary.sentiment))
        impact = min(100, primary.impact + min(10, 2 * (len(matched) - 1)))
        rationale = f"Matched {primary.event_type} keywords; matches={len(matched)}"

        return ClassifiedEvent(
            news_id=news_id,
            event_type=primary.event_type,
            sentiment_score=sentiment,
            impact_score=impact,
            confidence_score=confidence,
            asset_hint=self._asset_hint(item),
            rationale=rationale,
        )

    @staticmethod
    def _asset_hint(item: NewsItem) -> str:
        if item.raw_tickers:
            return item.raw_tickers.split(",")[0]
        headline = item.headline.upper()
        if "NASDAQ" in headline:
            return "NDX"
        if "S&P" in headline or "SP500" in headline:
            return "SPX"
        return "SPY"

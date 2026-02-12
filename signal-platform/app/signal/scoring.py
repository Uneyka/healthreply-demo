from __future__ import annotations

from dataclasses import dataclass

from app.storage.models import Direction, MarketFeatures


@dataclass(frozen=True)
class Prior:
    mu: float
    sigma: float


PRIORS: dict[str, Prior] = {
    'EARNINGS_BEAT': Prior(0.7, 0.35),
    'EARNINGS_MISS': Prior(0.8, 0.40),
    'GUIDANCE_RAISED': Prior(0.6, 0.30),
    'GUIDANCE_CUT': Prior(0.7, 0.35),
    'MNA': Prior(1.0, 0.45),
    'ANALYST_UPGRADE': Prior(0.45, 0.22),
    'ANALYST_DOWNGRADE': Prior(0.5, 0.24),
    'REGULATORY_LEGAL_POS': Prior(0.55, 0.28),
    'REGULATORY_LEGAL_NEG': Prior(0.7, 0.34),
    'MACRO_HAWKISH': Prior(0.9, 0.45),
    'MACRO_DOVISH': Prior(0.9, 0.45),
    'GEOPOL_RISK_ON': Prior(0.6, 0.3),
    'GEOPOL_RISK_OFF': Prior(0.85, 0.4),
    'OTHER': Prior(0.3, 0.2),
}


def source_weight(source: str, weights: dict[str, float]) -> float:
    for key, weight in weights.items():
        if key != 'default' and key in source:
            return weight
    return weights.get('default', 1.0)


def compute_expected_range(
    event_type: str,
    direction: Direction,
    rule_confidence: float,
    features: MarketFeatures,
    source: str,
    weights: dict[str, float],
) -> tuple[float, float, int, float]:
    prior = PRIORS.get(event_type, PRIORS['OTHER'])
    vol_mult = min(2.0, max(0.6, features.atr_pct / 1.0 if features.atr_pct else 0.9))
    regime_mult = 1.15 if features.regime == 'trending' else 0.95
    src_w = source_weight(source, weights)

    mu = prior.mu * vol_mult * regime_mult * src_w
    sigma = prior.sigma * vol_mult
    low = max(0.05, mu - sigma)
    high = min(4.0, mu + sigma)

    vol_reasonable = 1.0 if 0.15 <= features.atr_pct <= 4.0 else 0.55
    confidence = max(0.05, min(0.98, 0.55 * rule_confidence + 0.25 * min(src_w, 1.3) + 0.20 * vol_reasonable))
    if direction == 'unclear':
        confidence *= 0.8
    impact = int(min(100, max(5, round(high * 40 + confidence * 35))))
    return round(low, 3), round(high, 3), impact, round(confidence, 3)

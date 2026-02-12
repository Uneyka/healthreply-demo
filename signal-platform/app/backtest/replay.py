from __future__ import annotations

import json

from app.backtest.metrics import summarize
from app.market.features import compute_features
from app.market.prices import StooqAdapter
from app.nlp.classify import classify_event
from app.signal.gates import pass_gates
from app.signal.scoring import compute_expected_range
from app.storage.db import init_db, list_news_for_replay


def run_replay(limit: int = 500) -> dict:
    init_db()
    rows = list_news_for_replay(limit=limit)
    adapter = StooqAdapter()

    confidences: list[float] = []
    highs: list[float] = []
    emitted = 0

    for row in rows:
        event, direction, rule_conf, _ = classify_event(row['headline'], row['summary'])
        features = compute_features(row['asset'], adapter)
        low, high, impact, confidence = compute_expected_range(event, direction, rule_conf, features, row['source'], {'default': 1.0})
        ok, _ = pass_gates(row['asset'], direction, confidence, high, impact, features)
        if ok:
            emitted += 1
            confidences.append(confidence)
            highs.append(high)

    return {
        'input_news': len(rows),
        'emitted_signals': emitted,
        'signals_per_day_proxy': round(emitted / 7.0, 3),
        'confidence_distribution': summarize(confidences),
        'expected_high_distribution': summarize(highs),
        'directional_proxy_note': 'Use historical 1h/4h close deltas vs bias in a downstream evaluator.',
    }


if __name__ == '__main__':
    print(json.dumps(run_replay(), indent=2))

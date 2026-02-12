from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone

from fastapi import FastAPI

from app.config import settings
from app.ingest.finnhub import collect_finnhub
from app.ingest.rss import collect_rss
from app.market.features import compute_features
from app.market.prices import StooqAdapter
from app.nlp.classify import classify_event
from app.nlp.summarize import maybe_summarize
from app.notify.notion import send_to_notion
from app.notify.telegram import render_telegram_message, send_telegram
from app.signal.builder import build_signal
from app.signal.gates import pass_gates
from app.signal.scoring import compute_expected_range
from app.storage.db import (
    add_delivery,
    add_error,
    dedupe_exists,
    fetch_unclassified,
    init_db,
    insert_classification,
    insert_market_features,
    insert_news,
    insert_signal,
)
from app.storage.models import Classification
from app.utils.logging import setup_logging

logger = logging.getLogger('news-signal')
health_app = FastAPI()
_state = {'last_run': None, 'status': 'starting'}


@health_app.get('/health')
def health() -> dict:
    return _state


def ingest_news() -> int:
    inserted = 0
    for item in [*collect_rss(), *collect_finnhub()]:
        if dedupe_exists(item.dedupe_hash, settings.dedupe_hours):
            continue
        if insert_news(item):
            inserted += 1
    return inserted


def process_news() -> int:
    adapter = StooqAdapter()
    emitted = 0
    for row in fetch_unclassified():
        try:
            event_type, direction, rule_conf, matches = classify_event(row['headline'], row['summary'])
            insert_classification(row['id'], Classification(event_type, direction, rule_conf, json.dumps(matches)))

            features = compute_features(row['asset'], adapter)
            insert_market_features(row['id'], features)

            low, high, impact, confidence = compute_expected_range(
                event_type=event_type,
                direction=direction,
                rule_confidence=rule_conf,
                features=features,
                source=row['source'],
                weights=settings.source_weights,
            )
            ok, reason = pass_gates(row['asset'], direction, confidence, high, impact, features)
            if not ok:
                continue

            signal = build_signal(
                asset=row['asset'],
                timestamp_utc=datetime.now(timezone.utc).isoformat(),
                source=row['source'],
                headline=maybe_summarize(row['headline']),
                link=row['link'],
                event_type=event_type,
                direction=direction,
                low=low,
                high=high,
                impact=impact,
                confidence=confidence,
                rationale=f'rules={matches}; trend={features.trend}; regime={features.regime}',
            )
            signal_id = insert_signal(row['id'], signal, reason)

            msg = render_telegram_message(signal)
            ok_t, resp_t = send_telegram(msg)
            add_delivery(signal_id, 'telegram', 'ok' if ok_t else 'fail', resp_t)

            ok_n, resp_n = send_to_notion(signal)
            add_delivery(signal_id, 'notion', 'ok' if ok_n else 'skip', resp_n)
            emitted += 1
        except Exception as exc:
            add_error('process_news', str(exc), {'news_id': row['id']})
    return emitted


def run_scheduler() -> None:
    setup_logging()
    init_db()
    logger.info('scheduler_started')
    while True:
        try:
            inserted = ingest_news()
            emitted = process_news()
            _state['last_run'] = datetime.now(timezone.utc).isoformat()
            _state['status'] = 'ok'
            logger.info('cycle_complete inserted=%s emitted=%s', inserted, emitted)
        except Exception as exc:
            _state['status'] = 'error'
            add_error('run_scheduler', str(exc), {})
            logger.exception('cycle_error %s', exc)
        time.sleep(settings.poll_interval_sec)


if __name__ == '__main__':
    mode = os.getenv('RUN_MODE', 'scheduler')
    if mode == 'scheduler':
        run_scheduler()

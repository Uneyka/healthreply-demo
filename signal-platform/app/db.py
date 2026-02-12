from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

from app.config import settings
from app.models import ClassifiedEvent, MarketContext, NewsItem, Signal


def init_db() -> None:
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS news_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                headline TEXT NOT NULL,
                summary TEXT NOT NULL,
                url TEXT NOT NULL,
                published_at TEXT NOT NULL,
                raw_tickers TEXT NOT NULL,
                dedupe_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS classified_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                news_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                sentiment_score REAL NOT NULL,
                impact_score INTEGER NOT NULL,
                confidence_score REAL NOT NULL,
                asset_hint TEXT NOT NULL,
                rationale TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(news_id) REFERENCES news_items(id)
            );

            CREATE TABLE IF NOT EXISTS generated_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                asset TEXT NOT NULL,
                event_type TEXT NOT NULL,
                bias TEXT NOT NULL,
                explanation TEXT NOT NULL,
                entry_context TEXT NOT NULL,
                invalidation TEXT NOT NULL,
                tp_example TEXT,
                confidence_score REAL NOT NULL,
                risk_note TEXT NOT NULL,
                mode TEXT NOT NULL,
                sent_telegram INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(event_id) REFERENCES classified_events(id)
            );

            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                context_json TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS backtest_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL
            );
            """
        )


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def insert_news(item: NewsItem) -> Optional[int]:
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT OR IGNORE INTO news_items (
                source, headline, summary, url, published_at, raw_tickers, dedupe_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item.source,
                item.headline,
                item.summary,
                item.url,
                item.published_at.isoformat(),
                item.raw_tickers,
                item.dedupe_hash,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        return cursor.lastrowid if cursor.rowcount == 1 else None


def insert_classification(event: ClassifiedEvent) -> int:
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO classified_events (
                news_id, event_type, sentiment_score, impact_score, confidence_score, asset_hint, rationale, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event.news_id,
                event.event_type,
                event.sentiment_score,
                event.impact_score,
                event.confidence_score,
                event.asset_hint,
                event.rationale,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        return int(cursor.lastrowid)


def insert_signal(event_id: int, signal: Signal) -> int:
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO generated_signals (
                event_id, asset, event_type, bias, explanation, entry_context, invalidation,
                tp_example, confidence_score, risk_note, mode, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                signal.asset,
                signal.event_type,
                signal.bias,
                signal.explanation,
                signal.entry_context,
                signal.invalidation,
                signal.tp_example,
                signal.confidence_score,
                signal.risk_note,
                signal.mode,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        return int(cursor.lastrowid)


def mark_signal_sent(signal_id: int) -> None:
    with get_conn() as conn:
        conn.execute("UPDATE generated_signals SET sent_telegram = 1 WHERE id = ?", (signal_id,))


def recent_unsent_signals(limit: int = 20) -> list[sqlite3.Row]:
    with get_conn() as conn:
        return list(
            conn.execute(
                """
                SELECT id, asset, event_type, bias, explanation, entry_context, invalidation,
                       tp_example, confidence_score, risk_note, mode
                FROM generated_signals
                WHERE sent_telegram = 0
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        )


def recent_signals_per_asset(asset: str, minutes: int) -> int:
    with get_conn() as conn:
        return int(
            conn.execute(
                """
                SELECT COUNT(*) AS c FROM generated_signals
                WHERE asset = ? AND created_at >= datetime('now', ?)
                """,
                (asset, f"-{minutes} minutes"),
            ).fetchone()["c"]
        )


def alerts_last_hour() -> int:
    with get_conn() as conn:
        return int(
            conn.execute(
                "SELECT COUNT(*) AS c FROM generated_signals WHERE created_at >= datetime('now', '-60 minutes')"
            ).fetchone()["c"]
        )


def log_system(component: str, level: str, message: str, context_json: str = "") -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO system_logs (component, level, message, context_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (component, level, message, context_json, datetime.now(timezone.utc).isoformat()),
        )


def save_backtest_metric(run_id: str, metric: str, value: float, details: str = "") -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO backtest_results (run_id, metric, value, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (run_id, metric, value, details, datetime.now(timezone.utc).isoformat()),
        )


def pending_news(limit: int = 50) -> list[sqlite3.Row]:
    with get_conn() as conn:
        return list(
            conn.execute(
                """
                SELECT n.id, n.headline, n.summary, n.url, n.source, n.published_at, n.raw_tickers, n.dedupe_hash
                FROM news_items n
                LEFT JOIN classified_events c ON c.news_id = n.id
                WHERE c.id IS NULL
                ORDER BY n.id ASC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        )

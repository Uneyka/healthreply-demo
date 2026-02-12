from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Optional

from app.config import settings
from app.storage.models import Classification, MarketFeatures, NewsItem, SignalPayload
from app.utils.time import utc_now


@contextmanager
def conn() -> Iterator[sqlite3.Connection]:
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(settings.db_path)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init_db() -> None:
    with conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS news_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              source TEXT, source_url TEXT, headline TEXT, summary TEXT, link TEXT,
              published_at TEXT, asset TEXT, dedupe_hash TEXT UNIQUE, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS classifications(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              news_id INTEGER UNIQUE, event_type TEXT, direction TEXT,
              rule_confidence REAL, matched_rules TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS market_features(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              news_id INTEGER UNIQUE, asset TEXT, price REAL, atr_pct REAL,
              trend TEXT, regime TEXT, above_short_ma INTEGER, recent_pivot REAL,
              feature_json TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS signals(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              news_id INTEGER UNIQUE, asset TEXT, payload_json TEXT,
              confidence_score REAL, impact_score INTEGER,
              expected_move_low_pct REAL, expected_move_high_pct REAL,
              gate_reason TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS deliveries(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              signal_id INTEGER, channel TEXT, status TEXT,
              response TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS errors(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              stage TEXT, error TEXT, context_json TEXT, created_at TEXT
            );
            """
        )


def insert_news(item: NewsItem) -> Optional[int]:
    with conn() as c:
        cur = c.execute(
            """INSERT OR IGNORE INTO news_items
            (source,source_url,headline,summary,link,published_at,asset,dedupe_hash,created_at)
            VALUES (?,?,?,?,?,?,?,?,?)""",
            (item.source, item.source_url, item.headline, item.summary, item.link,
             item.published_at.isoformat(), item.asset, item.dedupe_hash, utc_now().isoformat()),
        )
        return int(cur.lastrowid) if cur.rowcount == 1 else None


def dedupe_exists(hash_value: str, hours: int) -> bool:
    with conn() as c:
        row = c.execute(
            """SELECT COUNT(*) c FROM news_items
               WHERE dedupe_hash = ? AND created_at >= datetime('now', ?)""",
            (hash_value, f'-{hours} hours'),
        ).fetchone()
    return int(row['c']) > 0


def fetch_unclassified(limit: int = 200) -> list[sqlite3.Row]:
    with conn() as c:
        return list(c.execute(
            """SELECT n.* FROM news_items n
            LEFT JOIN classifications c ON c.news_id=n.id
            WHERE c.id IS NULL ORDER BY n.id ASC LIMIT ?""", (limit,)
        ).fetchall())


def insert_classification(news_id: int, cls: Classification) -> None:
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO classifications(news_id,event_type,direction,rule_confidence,matched_rules,created_at) VALUES(?,?,?,?,?,?)",
            (news_id, cls.event_type, cls.direction, cls.rule_confidence, cls.matched_rules, utc_now().isoformat()),
        )


def insert_market_features(news_id: int, feat: MarketFeatures) -> None:
    with conn() as c:
        c.execute(
            """INSERT OR REPLACE INTO market_features
            (news_id,asset,price,atr_pct,trend,regime,above_short_ma,recent_pivot,feature_json,created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (news_id, feat.asset, feat.price, feat.atr_pct, feat.trend, feat.regime,
             int(feat.above_short_ma), feat.recent_pivot, json.dumps(feat.__dict__), utc_now().isoformat()),
        )


def recent_signal_for_asset(asset: str, minutes: int) -> bool:
    try:
        with conn() as c:
            row = c.execute(
                "SELECT COUNT(*) c FROM signals WHERE asset = ? AND created_at >= datetime('now', ?)",
                (asset, f'-{minutes} minutes'),
            ).fetchone()
        return int(row['c']) > 0
    except sqlite3.OperationalError:
        return False


def insert_signal(news_id: int, signal: SignalPayload, gate_reason: str) -> int:
    with conn() as c:
        cur = c.execute(
            """INSERT OR REPLACE INTO signals(news_id,asset,payload_json,confidence_score,impact_score,
            expected_move_low_pct,expected_move_high_pct,gate_reason,created_at)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (news_id, signal.asset, json.dumps(signal.__dict__), signal.confidence_score,
             signal.impact_score, signal.expected_move_low_pct, signal.expected_move_high_pct,
             gate_reason, utc_now().isoformat()),
        )
        return int(cur.lastrowid)


def undelivered_signals(channel: str, limit: int = 50) -> list[sqlite3.Row]:
    with conn() as c:
        return list(c.execute(
            """SELECT s.id signal_id,s.payload_json FROM signals s
            LEFT JOIN deliveries d ON d.signal_id=s.id AND d.channel=?
            WHERE d.id IS NULL ORDER BY s.id ASC LIMIT ?""", (channel, limit)
        ).fetchall())


def add_delivery(signal_id: int, channel: str, status: str, response: str) -> None:
    with conn() as c:
        c.execute("INSERT INTO deliveries(signal_id,channel,status,response,created_at) VALUES(?,?,?,?,?)",
                  (signal_id, channel, status, response[:1200], utc_now().isoformat()))


def add_error(stage: str, error: str, context: dict) -> None:
    with conn() as c:
        c.execute("INSERT INTO errors(stage,error,context_json,created_at) VALUES(?,?,?,?)",
                  (stage, error[:1000], json.dumps(context), utc_now().isoformat()))


def list_news_for_replay(limit: int = 1000) -> list[sqlite3.Row]:
    with conn() as c:
        return list(c.execute("SELECT * FROM news_items ORDER BY id ASC LIMIT ?", (limit,)).fetchall())

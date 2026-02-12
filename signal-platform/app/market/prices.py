from __future__ import annotations

import csv
import io
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass

import requests

from app.config import settings

logger = logging.getLogger('news-signal')


@dataclass
class PriceBar:
    close: float
    high: float
    low: float


class PriceAdapter(ABC):
    @abstractmethod
    def fetch_bars(self, asset: str, limit: int = 120) -> list[PriceBar]:
        raise NotImplementedError


class StooqAdapter(PriceAdapter):
    _cache: dict[str, tuple[float, list[PriceBar]]] = {}

    def fetch_bars(self, asset: str, limit: int = 120) -> list[PriceBar]:
        now = time.time()
        cached = self._cache.get(asset)
        if cached and now - cached[0] < settings.price_cache_ttl_sec:
            return cached[1][-limit:]

        symbol = f'{asset.lower()}.us' if len(asset) <= 5 and asset.isalpha() else asset.lower()
        url = settings.stooq_url_template.format(symbol=symbol)
        try:
            r = requests.get(url, timeout=8)
            r.raise_for_status()
        except requests.RequestException as exc:
            logger.warning('price_fetch_failed asset=%s url=%s error=%s', asset, url, exc)
            return []

        reader = csv.DictReader(io.StringIO(r.text))
        bars: list[PriceBar] = []
        for row in reader:
            try:
                bars.append(PriceBar(close=float(row['Close']), high=float(row['High']), low=float(row['Low'])))
            except Exception:
                continue
        self._cache[asset] = (now, bars)
        return bars[-limit:]

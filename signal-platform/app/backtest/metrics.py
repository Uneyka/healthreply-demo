from __future__ import annotations

from statistics import mean


def summarize(values: list[float]) -> dict[str, float]:
    if not values:
        return {'count': 0.0, 'avg': 0.0, 'p90': 0.0}
    sorted_vals = sorted(values)
    p90 = sorted_vals[min(len(sorted_vals) - 1, int(len(sorted_vals) * 0.9))]
    return {'count': float(len(values)), 'avg': round(mean(values), 4), 'p90': round(p90, 4)}

from __future__ import annotations

import csv
import json
from pathlib import Path

from app.db import init_db
from app.services.backtester import Backtester


def main() -> None:
    init_db()
    fixture = Path("/app/data/backtest_headlines.csv")
    if not fixture.exists():
        fixture = Path("data/backtest_headlines.csv")

    headlines: list[dict[str, str]] = []
    with fixture.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            headlines.append(row)

    run_id = Backtester().replay(headlines)
    print(json.dumps({"run_id": run_id, "input_rows": len(headlines)}))


if __name__ == "__main__":
    main()

from __future__ import annotations

from app.db import init_db
from app.services.monitoring import run_health_server


if __name__ == "__main__":
    init_db()
    run_health_server(8080)

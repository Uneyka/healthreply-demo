from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

from app.db import get_conn


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/health":
            self.send_response(404)
            self.end_headers()
            return
        with get_conn() as conn:
            signals = conn.execute("SELECT COUNT(*) AS c FROM generated_signals").fetchone()["c"]
            news = conn.execute("SELECT COUNT(*) AS c FROM news_items").fetchone()["c"]
        body = {"status": "ok", "signals": signals, "news_items": news}
        payload = json.dumps(body).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def run_health_server(port: int = 8080) -> None:
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()

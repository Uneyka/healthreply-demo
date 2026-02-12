from __future__ import annotations

import uvicorn

from app.main import health_app


if __name__ == '__main__':
    uvicorn.run(health_app, host='0.0.0.0', port=8080)

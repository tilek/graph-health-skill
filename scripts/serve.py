#!/usr/bin/env python3
"""Serve the health dashboard backed by a local CSV.

The server exposes:
  GET /            -> assets/index.html
  GET /<file>      -> assets/<file>   (static files — JS, CSS, images)
  GET /api/data    -> JSON array of the current CSV rows

The CSV is read fresh on every /api/data request, so the user can re-run
append_to_csv.py and refresh the browser without restarting the server.
"""

from __future__ import annotations

import argparse
import csv
import http.server
import json
import socket
import socketserver
import threading
import webbrowser
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = SKILL_ROOT / "assets"


def make_handler(csv_path: Path):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ASSETS_DIR), **kwargs)

        def do_GET(self):  # noqa: N802
            if self.path.split("?", 1)[0] == "/api/data":
                self._send_data()
                return
            return super().do_GET()

        def _send_data(self):
            rows: list[dict] = []
            if csv_path.exists():
                with csv_path.open(newline="") as f:
                    rows = list(csv.DictReader(f))

            context = None
            context_path = csv_path.parent / "health_context.json"
            if context_path.exists():
                try:
                    with context_path.open() as f:
                        context = json.load(f)
                except (OSError, json.JSONDecodeError) as exc:
                    print(f"  warning: could not read {context_path}: {exc}")

            body = json.dumps({
                "rows": rows,
                "csv_path": str(csv_path),
                "context": context,
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):  # quiet default logging
            return

    return Handler


def find_free_port(preferred: int) -> int:
    for port in [preferred] + list(range(preferred + 1, preferred + 30)):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"no free port in {preferred}..{preferred + 30}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", required=True, help="Path to the CSV to visualize")
    ap.add_argument("--port", type=int, default=8765, help="Preferred port (default: 8765)")
    ap.add_argument(
        "--no-open", action="store_true", help="Don't auto-open the browser"
    )
    args = ap.parse_args()

    csv_path = Path(args.csv).resolve()
    if not ASSETS_DIR.exists():
        raise SystemExit(f"assets directory not found at {ASSETS_DIR}")

    port = find_free_port(args.port)
    url = f"http://127.0.0.1:{port}/"

    handler = make_handler(csv_path)

    class ReusableServer(socketserver.ThreadingTCPServer):
        allow_reuse_address = True

    server = ReusableServer(("127.0.0.1", port), handler)

    print(f"Health dashboard serving {csv_path}")
    if not csv_path.exists():
        print("  note: CSV does not exist yet — dashboard will show empty state")
    print(f"  URL:  {url}")
    print("  Stop: Ctrl+C")

    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

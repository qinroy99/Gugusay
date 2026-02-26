import atexit
import os
import sys
import ctypes
from threading import Thread

import webview

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Reuse the same executable for update worker mode.
if len(sys.argv) > 1 and sys.argv[1] == "--run-updater":
    from backend.updater_client import main as updater_main

    raise SystemExit(updater_main())

from backend.config import WINDOW_HEIGHT, WINDOW_MIN_SIZE, WINDOW_TITLE, WINDOW_WIDTH
from backend.database import db_manager
from backend.server import start_server

window_ref = None


def on_closing():
    if window_ref:
        try:
            window_ref.evaluate_js("window.saveReadingProgressOnClose && window.saveReadingProgressOnClose()")
        except Exception:
            pass


class Api:
    def save_progress(self, last_viewed_id, last_viewed_datetime):
        try:
            db_manager.update_reading_progress(last_viewed_id, last_viewed_datetime)
            return True
        except Exception:
            return False


if __name__ == "__main__":
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()

    debug_mode = os.getenv("GUGUSAY_DEBUG", "0") == "1"
    # Architecture-level slim build: only support WebView2 (edgechromium).
    preferred_gui = "edgechromium"
    start_url = f"http://localhost:3000/?gui={preferred_gui}&debug={int(debug_mode)}"

    window_ref = webview.create_window(
        title=WINDOW_TITLE,
        url=start_url,
        js_api=Api(),
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=WINDOW_MIN_SIZE,
    )

    atexit.register(on_closing)
    try:
        webview.start(debug=debug_mode, gui=preferred_gui)
    except Exception as exc:
        msg = (
            f"Failed to start gui={preferred_gui}.\n\n"
            f"{exc}\n\n"
            "Please install Microsoft Edge WebView2 Runtime and relaunch."
        )
        try:
            ctypes.windll.user32.MessageBoxW(0, msg, "Gugusay Startup Error", 0x10)
        except Exception:
            print(msg)
        raise
    on_closing()

import shutil
import sys
from pathlib import Path


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _runtime_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return _project_root()


def _resource_root(runtime_root: Path) -> Path:
    if getattr(sys, "frozen", False):
        meipass = getattr(sys, "_MEIPASS", None)
        if meipass:
            return Path(meipass).resolve()
        internal = runtime_root / "_internal"
        if internal.exists():
            return internal
        return runtime_root
    return _project_root()


RUNTIME_ROOT = _runtime_root()
APP_ROOT = str(_resource_root(RUNTIME_ROOT))

DATA_DIR = str(RUNTIME_ROOT / "data")
MEDIA_DIR = str(RUNTIME_ROOT / "media")
DB_PATH = str(Path(DATA_DIR) / "SR.db")

SERVER_HOST = "localhost"
SERVER_PORT = 3000

WINDOW_TITLE = "姑射山人2011"
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 900
WINDOW_MIN_SIZE = (800, 600)

DEFAULT_PAGE_SIZE = 6
SEARCH_HISTORY_LIMIT = 10


def _bundled_db_candidates() -> list[Path]:
    app_root = Path(APP_ROOT)
    return [
        app_root / "data" / "SR.db",
        app_root / "backend" / "data" / "SR.db",
        _project_root() / "data" / "SR.db",
    ]


def ensure_directories() -> None:
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
    Path(MEDIA_DIR).mkdir(parents=True, exist_ok=True)

    db_file = Path(DB_PATH)
    if not db_file.exists():
        for candidate in _bundled_db_candidates():
            if candidate.exists():
                shutil.copy2(candidate, db_file)
                break


ensure_directories()

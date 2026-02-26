import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).parent.resolve()
SRC = ROOT / "Gugusay1.0"


def run_build():
    if not SRC.exists():
        raise FileNotFoundError("Gugusay1.0 source directory not found")

    cmd = [
        "pyinstaller",
        "--onedir",
        "--windowed",
        "--clean",
        "-y",
        "--name",
        "Twitter",
        "--exclude-module",
        "PyQt5",
        "--exclude-module",
        "PyQt6",
        "--exclude-module",
        "PySide2",
        "--exclude-module",
        "PySide6",
        "--exclude-module",
        "qtpy",
        "--exclude-module",
        "gi",
        "--exclude-module",
        "gtk",
        "--exclude-module",
        "PyGObject",
        "--exclude-module",
        "cefpython3",
        "--add-data",
        "index.html;.",
        "--add-data",
        "index-simple.html;.",
        "--add-data",
        "scripts.js;.",
        "--add-data",
        "styles.css;.",
        "--add-data",
        "sba.jpg;.",
        "--add-data",
        "favicon.ico;.",
        "--add-data",
        "modules;modules",
        "--add-data",
        "utils;utils",
        "--add-data",
        "styles;styles",
        "--add-data",
        "icons;icons",
        "--add-data",
        "backend;backend",
        "--add-data",
        "data;data",
        "--add-data",
        "media;media",
        "main.py",
    ]
    subprocess.check_call(cmd, cwd=str(SRC))


def main():
    try:
        import PyInstaller  # noqa: F401
    except Exception:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
    run_build()
    print("Build complete. Output: Gugusay1.0/dist/Twitter/Twitter.exe")


if __name__ == "__main__":
    main()

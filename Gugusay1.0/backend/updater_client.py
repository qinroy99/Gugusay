import json
import os
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path


def _is_windows_process_alive(pid):
    try:
        import ctypes

        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if handle == 0:
            return False
        ctypes.windll.kernel32.CloseHandle(handle)
        return True
    except Exception:
        return False


def _is_process_alive(pid):
    if pid <= 0:
        return False
    if os.name == "nt":
        return _is_windows_process_alive(pid)
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _wait_parent_exit(parent_pid, timeout_sec=45):
    start = time.time()
    while time.time() - start < timeout_sec:
        if not _is_process_alive(parent_pid):
            return True
        time.sleep(0.5)
    return False


def _safe_child_path(base_dir, relative_path):
    rel = (relative_path or "").replace("\\", "/")
    if rel.startswith("/") or rel.startswith("\\") or ":" in rel:
        raise ValueError("invalid relative path")
    normalized = os.path.normpath(rel)
    if normalized.startswith(".."):
        raise ValueError("path traversal detected")
    target = Path(base_dir) / normalized
    target.parent.mkdir(parents=True, exist_ok=True)
    return target


def _extract_zip_safe(zip_path, target_dir):
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            if member.is_dir():
                continue
            out_path = _safe_child_path(target_dir, member.filename)
            with zf.open(member, "r") as src, open(out_path, "wb") as dst:
                shutil.copyfileobj(src, dst)


def _apply_update(task):
    db_path = Path(task["db_path"])
    media_dir = Path(task["media_dir"])
    version_file = Path(task["version_file"])
    version = task["version"]

    # Replace database atomically with backup.
    db_asset = next((a for a in task.get("assets", []) if a.get("kind") == "database"), None)
    if db_asset:
        src_db = Path(db_asset["path"])
        if src_db.exists():
            db_path.parent.mkdir(parents=True, exist_ok=True)
            if db_path.exists():
                backup = Path(str(db_path) + ".backup")
                if backup.exists():
                    backup.unlink()
                shutil.copy2(db_path, backup)
            temp_target = Path(str(db_path) + ".new")
            shutil.copy2(src_db, temp_target)
            os.replace(temp_target, db_path)

    # Merge media pack/files.
    media_dir.mkdir(parents=True, exist_ok=True)
    for asset in task.get("assets", []):
        kind = asset.get("kind")
        src = Path(asset.get("path", ""))
        if not src.exists():
            continue
        if kind == "media_pack":
            _extract_zip_safe(src, media_dir)
        elif kind == "media_file":
            rel = asset.get("relative_path") or asset.get("name", "")
            target = _safe_child_path(media_dir, rel)
            shutil.copy2(src, target)

    version_file.parent.mkdir(parents=True, exist_ok=True)
    version_file.write_text(version, encoding="utf-8")

    staging_dir = task.get("staging_dir", "")
    if staging_dir and Path(staging_dir).exists():
        shutil.rmtree(staging_dir, ignore_errors=True)


def _restart_app(task):
    cmd = task.get("restart_command", [])
    if cmd:
        subprocess.Popen(cmd, cwd=str(Path(cmd[-1]).parent) if len(cmd) > 1 else None)


def run_task(task_path, parent_pid):
    with open(task_path, "r", encoding="utf-8") as f:
        task = json.load(f)

    _wait_parent_exit(parent_pid)
    _apply_update(task)
    _restart_app(task)

    try:
        Path(task_path).unlink()
    except OSError:
        pass


def main():
    if len(sys.argv) < 4:
        return 1
    task_path = sys.argv[2]
    parent_pid = int(sys.argv[3])
    try:
        run_task(task_path, parent_pid)
        return 0
    except Exception:
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

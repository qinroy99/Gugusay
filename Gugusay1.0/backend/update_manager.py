import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from backend.config import APP_ROOT, DATA_DIR, DB_PATH, MEDIA_DIR

CONFIG_PATH = Path(DATA_DIR) / "update_config.json"
VERSION_PATH = Path(DATA_DIR) / "version.txt"
TASK_PATH = Path(DATA_DIR) / "update_install_task.json"
STAGING_ROOT = Path(DATA_DIR) / "update_staging"

# Replace this with your real Ed25519 verify key (base64) before production use.
PUBLIC_KEY_B64 = ""

OWNER_RE = re.compile(r"^[A-Za-z0-9_.-]+$")
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+$")
CHANNEL_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


class UpdateManager:
    def __init__(self):
        self.config = self._load_config()
        self.manifest_info = None

    def _load_config(self):
        default = {"owner": "your-org", "repo": "your-repo", "channel": "latest"}
        if not CONFIG_PATH.exists():
            return default
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {
                "owner": data.get("owner", default["owner"]),
                "repo": data.get("repo", default["repo"]),
                "channel": data.get("channel", default["channel"]),
            }
        except Exception:
            return default

    def get_config(self):
        return dict(self.config)

    def update_config(self, owner, repo, channel):
        if not OWNER_RE.match(owner or ""):
            return {"success": False, "error": "invalid owner"}
        if not REPO_RE.match(repo or ""):
            return {"success": False, "error": "invalid repo"}
        if not CHANNEL_RE.match(channel or ""):
            return {"success": False, "error": "invalid channel"}

        self.config = {"owner": owner, "repo": repo, "channel": channel}
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _manifest_url(self):
        owner = self.config["owner"]
        repo = self.config["repo"]
        channel = self.config["channel"]
        if channel == "latest":
            return f"https://github.com/{owner}/{repo}/releases/latest/download/version.json"
        return f"https://github.com/{owner}/{repo}/releases/download/{channel}/version.json"

    def _fetch_json(self, url):
        if not url.startswith("https://"):
            raise ValueError("update source must use https")
        req = urllib.request.Request(url, headers={"User-Agent": "Twitter-PyWebView-Updater/2.0"})
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))

    def _local_version(self):
        if VERSION_PATH.exists():
            try:
                return VERSION_PATH.read_text(encoding="utf-8").strip()
            except Exception:
                return "0.0.0"
        return "0.0.0"

    def _verify_ed25519(self, message_bytes, signature_b64):
        if not PUBLIC_KEY_B64:
            return False
        try:
            from nacl.signing import VerifyKey
            from nacl.exceptions import BadSignatureError
        except Exception:
            return False
        try:
            verify_key = VerifyKey(base64.b64decode(PUBLIC_KEY_B64))
            verify_key.verify(message_bytes, base64.b64decode(signature_b64))
            return True
        except (ValueError, BadSignatureError):
            return False

    def _validate_manifest(self, manifest):
        if manifest.get("manifest_version") != 2:
            raise ValueError("manifest_version must be 2")
        if "version" not in manifest:
            raise ValueError("missing version")
        assets = manifest.get("assets")
        if not isinstance(assets, list) or not assets:
            raise ValueError("assets must be a non-empty list")
        for asset in assets:
            if asset.get("kind") not in {"database", "media_pack", "media_file"}:
                raise ValueError("invalid asset kind")
            url = asset.get("url", "")
            if not url.startswith("https://"):
                raise ValueError("asset url must use https")
            if not asset.get("sha256"):
                raise ValueError("missing asset sha256")

    def check_update(self):
        try:
            manifest = self._fetch_json(self._manifest_url())
            self._validate_manifest(manifest)
            self.manifest_info = manifest
            local_version = self._local_version()
            remote_version = manifest.get("version", "0.0.0")
            return {
                "has_update": remote_version != local_version,
                "local_version": local_version,
                "remote_version": remote_version,
                "published_at": manifest.get("published_at", ""),
                "notes": manifest.get("notes", ""),
                "asset_count": len(manifest.get("assets", [])),
            }
        except Exception as e:
            return {"has_update": False, "error": str(e)}

    def _download_file(self, url, target):
        req = urllib.request.Request(url, headers={"User-Agent": "Twitter-PyWebView-Updater/2.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(target, "wb") as f:
                shutil.copyfileobj(response, f)

    def _sha256_file(self, path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    def start_update(self):
        try:
            if not self.manifest_info:
                check = self.check_update()
                if check.get("error"):
                    return {"success": False, "error": check["error"]}
                if not check.get("has_update"):
                    return {"success": False, "error": "no update available"}

            manifest = self.manifest_info
            version = manifest["version"]
            staging_dir = STAGING_ROOT / f"{version}_{int(time.time())}"
            assets_dir = staging_dir / "assets"
            assets_dir.mkdir(parents=True, exist_ok=True)

            downloaded_assets = []
            for asset in manifest.get("assets", []):
                file_name = asset.get("name") or Path(asset["url"]).name
                target = assets_dir / file_name
                self._download_file(asset["url"], target)
                digest = self._sha256_file(target)
                if digest.lower() != asset["sha256"].lower():
                    raise ValueError(f"sha256 mismatch: {file_name}")

                signature = asset.get("signature", "")
                if signature and not self._verify_ed25519(digest.encode("utf-8"), signature):
                    raise ValueError(f"signature verify failed: {file_name}")

                downloaded_assets.append(
                    {
                        "kind": asset["kind"],
                        "name": file_name,
                        "path": str(target),
                        "relative_path": asset.get("relative_path", ""),
                    }
                )

            restart_command = [sys.executable] if getattr(sys, "frozen", False) else [sys.executable, str(Path(APP_ROOT) / "main.py")]

            task = {
                "version": version,
                "staging_dir": str(staging_dir),
                "assets": downloaded_assets,
                "db_path": DB_PATH,
                "media_dir": MEDIA_DIR,
                "version_file": str(VERSION_PATH),
                "restart_command": restart_command,
            }

            os.makedirs(DATA_DIR, exist_ok=True)
            with open(TASK_PATH, "w", encoding="utf-8") as f:
                json.dump(task, f, ensure_ascii=False, indent=2)

            cmd = [sys.executable, "--run-updater", str(TASK_PATH), str(os.getpid())]
            subprocess.Popen(cmd, cwd=APP_ROOT)
            return {"success": True, "message": "update downloaded, installer launched", "should_exit": True}
        except Exception as e:
            return {"success": False, "error": str(e)}


update_manager = UpdateManager()

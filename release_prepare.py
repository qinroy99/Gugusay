import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).parent.resolve()
DEFAULT_RELEASE_DIR = Path.cwd()
MEDIA_SUFFIXES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".mp4",
    ".mov",
    ".m4v",
    ".webm",
    ".avi",
    ".mkv",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def github_download_base(owner: str, repo: str, channel: str) -> str:
    if channel == "latest":
        return f"https://github.com/{owner}/{repo}/releases/latest/download"
    return f"https://github.com/{owner}/{repo}/releases/download/{channel}"


def collect_media_files(release_dir: Path, db_name: str, media_name: str) -> list[Path]:
    skip_names = {db_name.lower(), media_name.lower(), "version.json"}
    files: list[Path] = []
    for p in sorted(release_dir.rglob("*")):
        if not p.is_file():
            continue
        if p.name.lower() in skip_names:
            continue
        if p.suffix.lower() in MEDIA_SUFFIXES:
            files.append(p)
    return files


def build_media_pack(release_dir: Path, media_path: Path, media_files: list[Path]) -> None:
    if media_path.exists():
        media_path.unlink()
    with ZipFile(media_path, "w", compression=ZIP_DEFLATED) as zf:
        for p in media_files:
            zf.write(p, p.relative_to(release_dir))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate version.json and optionally auto-build media-pack.zip from loose media files."
    )
    parser.add_argument("--release-dir", default=str(DEFAULT_RELEASE_DIR), help="Release directory (default: current working directory)")
    parser.add_argument("--owner", default="qinroy99", help="GitHub owner/user")
    parser.add_argument("--repo", default="GuguSay", help="GitHub repository")
    parser.add_argument("--channel", default="latest", help="Release channel: latest or tag")
    parser.add_argument("--version", default=datetime.now().strftime("%Y.%m.%d"), help="Manifest version")
    parser.add_argument("--min-app-version", default="1.0.0")
    parser.add_argument("--notes", default="Release notes")
    parser.add_argument("--db-name", default="SR.db")
    parser.add_argument("--media-name", default="media-pack.zip")
    parser.add_argument("--skip-media", action="store_true", help="Skip media-pack.zip in manifest")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    release_dir = Path(args.release_dir).resolve()
    release_dir.mkdir(parents=True, exist_ok=True)

    db_path = release_dir / args.db_name
    if not db_path.exists():
        raise FileNotFoundError(
            f"Missing {args.db_name} in release directory: {release_dir}\n"
            "Please copy SR.db into this folder first."
        )
    db_sha = sha256_file(db_path)

    media_sha = None
    media_path = release_dir / args.media_name
    packed_media_count = 0
    if not args.skip_media:
        media_files = collect_media_files(release_dir, args.db_name, args.media_name)
        if not media_files:
            raise FileNotFoundError(
                f"No media files found in release directory: {release_dir}\n"
                "Please copy image/video files into this folder (or subfolders), or pass --skip-media."
            )
        build_media_pack(release_dir, media_path, media_files)
        packed_media_count = len(media_files)
        media_sha = sha256_file(media_path)

    base = github_download_base(args.owner, args.repo, args.channel)
    assets = [
        {
            "kind": "database",
            "name": args.db_name,
            "url": f"{base}/{args.db_name}",
            "sha256": db_sha,
            "signature": "",
        }
    ]
    if not args.skip_media:
        assets.append(
            {
                "kind": "media_pack",
                "name": args.media_name,
                "url": f"{base}/{args.media_name}",
                "sha256": media_sha,
                "signature": "",
            }
        )

    manifest = {
        "manifest_version": 2,
        "version": args.version,
        "published_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "min_app_version": args.min_app_version,
        "notes": args.notes,
        "assets": assets,
    }

    version_json = release_dir / "version.json"
    with version_json.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print("Generated:")
    print(f"- {version_json}")
    print(f"- {args.db_name} sha256: {db_sha}")
    if not args.skip_media:
        print(f"- {args.media_name} sha256: {media_sha}")
        if packed_media_count > 0:
            print(f"- packed media files: {packed_media_count}")
    print()
    print("Upload to one GitHub Release:")
    print("- version.json")
    print(f"- {args.db_name}")
    if not args.skip_media:
        print(f"- {args.media_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

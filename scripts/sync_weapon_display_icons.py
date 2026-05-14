#!/usr/bin/env python3
"""
根据 src/assets/weapons/**/*.svg 的文件名，从 valorant-api.com 拉取对应武器的
displayIcon，保存为 武器名.png，并生成 武器名_mirror.png（逻辑同 mirror_png.py）。
"""
from __future__ import annotations

import gzip
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

from mirror_png import mirror_png_file

WEAPONS_API = "https://valorant-api.com/v1/weapons"
REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS_WEAPONS = REPO_ROOT / "src" / "assets" / "weapons"


def fetch_weapons_by_display_name_lower() -> dict[str, dict]:
    req = urllib.request.Request(WEAPONS_API, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    payload = json.loads(raw.decode("utf-8"))
    out: dict[str, dict] = {}
    for w in payload.get("data") or []:
        name = w.get("displayName")
        icon = w.get("displayIcon")
        if not name or not icon:
            continue
        out[name.lower()] = w
    return out


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "valotool-weapon-sync/1"})
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())


def iter_weapon_svgs() -> list[Path]:
    return sorted(ASSETS_WEAPONS.rglob("*.svg"))


def main() -> int:
    force = "--force" in sys.argv
    try:
        by_lower = fetch_weapons_by_display_name_lower()
    except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
        print(f"无法拉取武器列表: {e}", file=sys.stderr)
        return 1

    errors = 0
    for svg in iter_weapon_svgs():
        stem = svg.stem
        key = stem.lower()
        weapon = by_lower.get(key)
        if not weapon:
            print(f"[跳过] 无 API 匹配: {svg.relative_to(REPO_ROOT)} (displayName≈{stem!r})", file=sys.stderr)
            errors += 1
            continue
        icon_url = weapon["displayIcon"]
        out_dir = svg.parent
        png = out_dir / f"{stem}.png"
        mirror_png = out_dir / f"{stem}_mirror.png"

        if not force and png.is_file() and mirror_png.is_file():
            print(f"[跳过已存在] {png.relative_to(REPO_ROOT)}")
            continue

        try:
            print(f"下载 {weapon['displayName']} -> {png.relative_to(REPO_ROOT)}")
            download(icon_url, png)
            mirror_png_file(png, mirror_png)
        except (urllib.error.URLError, OSError) as e:
            print(f"[失败] {svg}: {e}", file=sys.stderr)
            errors += 1

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

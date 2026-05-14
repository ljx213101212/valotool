#!/usr/bin/env python3
"""
从 valorant-api.com/v1/agents 拉取每个可玩角色的技能 displayIcon，
保存到 src/assets/abilities/<agent-slug>/，文件名与 slot 对应（与 Astra 案例一致）：

  Ability1.png, Ability2.png, Grenade.png, Ultimate.png, Passive.png（有图才下）

用法：
  python3 scripts/sync_agent_ability_icons.py
  python3 scripts/sync_agent_ability_icons.py --force   # 覆盖已存在文件
"""
from __future__ import annotations

import gzip
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

AGENTS_API = "https://valorant-api.com/v1/agents"
REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS_ABILITIES = REPO_ROOT / "src" / "assets" / "abilities"

# 与 src/features/abilities/config.ts 中 `displayIcon`（`{slug}/{Slot}.png`）一致
SLOT_TO_FILENAME: dict[str, str] = {
    "Ability1": "Ability1.png",
    "Ability2": "Ability2.png",
    "Grenade": "Grenade.png",
    "Ultimate": "Ultimate.png",
    "Passive": "Passive.png",
}


def fetch_agents_payload() -> list[dict]:
    req = urllib.request.Request(AGENTS_API, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    payload = json.loads(raw.decode("utf-8"))
    return list(payload.get("data") or [])


def agent_slug(display_name: str) -> str:
    """目录名：全小写，去掉 /，其余非字母数字变为下划线并压平。"""
    s = display_name.strip().lower().replace("/", "")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "unknown"


def ability_icon_filename(slot: str | None) -> str | None:
    if not slot:
        return None
    return SLOT_TO_FILENAME.get(slot)


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "valotool-agent-abilities/1"})
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())


def main() -> int:
    force = "--force" in sys.argv
    try:
        agents = fetch_agents_payload()
    except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
        print(f"无法拉取 agents: {e}", file=sys.stderr, flush=True)
        return 1

    errors = 0
    for agent in agents:
        if not agent.get("isPlayableCharacter", True):
            continue
        name = agent.get("displayName")
        if not name:
            continue
        slug = agent_slug(name)
        out_dir = ASSETS_ABILITIES / slug

        for ab in agent.get("abilities") or []:
            slot = ab.get("slot")
            icon_url = ab.get("displayIcon")
            fname = ability_icon_filename(slot)
            if not fname or not icon_url:
                if slot and slot not in SLOT_TO_FILENAME:
                    print(
                        f"[跳过未知 slot] {name!r} slot={slot!r}",
                        file=sys.stderr,
                        flush=True,
                    )
                elif not icon_url:
                    print(f"[跳过无图] {name!r} {slot}", file=sys.stderr, flush=True)
                continue

            dest = out_dir / fname
            if not force and dest.is_file():
                print(f"[跳过已存在] {dest.relative_to(REPO_ROOT)}", flush=True)
                continue
            try:
                print(
                    f"下载 {name} / {slot} -> {dest.relative_to(REPO_ROOT)}",
                    flush=True,
                )
                download(icon_url, dest)
            except (urllib.error.URLError, OSError) as e:
                print(f"[失败] {name} {slot}: {e}", file=sys.stderr, flush=True)
                errors += 1

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

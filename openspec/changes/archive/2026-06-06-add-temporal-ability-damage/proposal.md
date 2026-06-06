## Why

The current damage MVP proves armor-aware damage, instant Sova Shock Bolt settlement, and damage-derived kill records. The next gap is time-based ability damage: delayed explosions and persistent damage zones are common Valorant review cases, but they currently remain researched-only and unavailable for UI settlement.

## What Changes

- Add timeline-aware damage generation for delayed and persistent ability families.
- Support a small representative first set:
  - Gekko `Mosh Pit` as delayed/persistent area damage.
  - Brimstone `Incendiary` as persistent area damage.
  - Killjoy `Nanoswarm` as armed persistent area damage.
- Extend ability placement UX so users can confirm a future or duration-based damage zone without immediately mutating agent state.
- Group repeated tick damage in keyframe/detail surfaces so persistent skills remain readable.
- Preserve deletion semantics: removing the originating ability removes all generated future/tick damage events and any damage-derived kill records.
- Keep weapon damage, hit regions, penetration, projectile direct-hit AI, and environment hazards out of scope.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `damage`: Damage events can occur at future timeline times and in generated tick sequences while still deriving combat state, elimination, and damage-derived kill events deterministically.
- `ability-damage`: Supported damaging ability families expand from instant area to delayed area, persistent area, and armed persistent area.

## Impact

- Ability damage metadata and event generation utilities.
- Timeline/keyframe storage and playback derivation for future and repeated damage events.
- Ability placement activation flows and map render layers for delayed/persistent damage zones.
- Keyframe/detail drawer display for grouped damage events and damage-derived kills.
- Specs in `specs/damage/spec.md` and `specs/ability/damage.md`.

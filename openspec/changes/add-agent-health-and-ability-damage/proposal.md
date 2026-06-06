## Why

Damage is the next natural layer for tactical playback: the map already records ability deployments and timed status overlays, but it cannot yet answer how much health or armor each agent has at a given timeline moment. Adding a small health and ability-damage foundation makes later weapon damage, environmental damage, healing, shields, and compound ability effects easier to build without rewriting the timeline model.

## What Changes

- Add an agent health and armor state model that can be evaluated from timeline events.
- Represent base health, light armor, regen armor, and heavy armor as researched game data rather than hardcoded assumptions.
- Add map-token UI semantics for showing health, armor, elimination, and detailed exact values without overcrowding the map.
- Add a typed damage event model with ability, weapon, and environment source categories; only ability damage is implemented in this change.
- Add ability-damage metadata for researched Valorant damage abilities and classify them into reusable interaction/rendering families.
- Add timeline behavior for applying ability damage and keeping agent health/armor synchronized during playback.
- Leave weapon damage and environmental damage as typed future extension points with no user-facing implementation in this change.

## Capabilities

### New Capabilities
- `damage`: Agent health, armor, damage events, timeline health-state evaluation, and map-token health/armor display semantics.
- `ability-damage`: Valorant damaging ability data, damage ability categories, and reusable map interaction semantics for ability damage.

### Modified Capabilities
- `ability`: Ability deployment flows can produce damage events in addition to visual/status effects.

## Impact

- Affected specs: `specs/damage/spec.md`, `specs/ability/damage.md`, and the ability spec sections that describe deployment effects and timeline semantics.
- Affected implementation areas: ability metadata/configuration, matchup/timeline state, keyframe deploy event rendering, map agent token rendering, ability placement previews, and ability instance popovers.
- Data sourcing impact: game health, armor, regen armor, and damaging ability values must be researched from current external references during implementation; if reliable values cannot be found, implementation pauses for user-provided sources instead of inventing values.
- No breaking changes are expected for existing smoke, dash, flash, or concuss behavior.

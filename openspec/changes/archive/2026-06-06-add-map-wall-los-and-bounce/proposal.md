## Why

Many tactical-board ability effects depend on map walls: flashes should not affect targets hidden behind opaque geometry, and several projectile abilities need wall hits or simple bounce paths to feel believable. The current flash/concuss system approximates affected targets from side, distance, and facing only, so wall-aware planning needs a shared geometry foundation before more ability coverage is added.

## What Changes

- Add a reusable map wall geometry capability for 2D line-of-sight blocking, first wall-hit detection, and bounded projectile bounce traces against opaque map wall segments.
- Add wall-aware target inference for supported flash/blind/nearsight effects so blocked targets are treated as missed unless manually corrected.
- Add projectile path support for representative wall-interaction abilities, starting with simple wall hit and one-bounce behavior for skills such as Neon `Relay Bolt`, Yoru `BLINDSIDE`, and KAY/O `FLASH/drive`.
- Add a debug/inspection overlay that can show source-to-target visibility lines, blocked hit points, blocking wall identity, and projectile bounce paths while validating wall-aware ability behavior.
- Keep full player vision simulation out of scope: no always-on character vision cones, persistent vision polygons, 3D height modeling, smoke-as-vision-blocker behavior, or user-editable vision system in this change.

## Capabilities

### New Capabilities

- `map-wall-geometry`: Shared tactical-map wall geometry for line-of-sight blocking, ray wall hits, bounded projectile bounces, and debug visualization inputs.
- `ability-wall-interactions`: Wall-aware ability semantics for supported flash/blind/nearsight/concuss projectile effects, including blocked-target inference and representative bounce-path handling.

### Modified Capabilities

- None. The project does not yet have archived OpenSpec capability specs; existing product notes in `specs/map/spec.md` and `specs/ability/spec.md` should be updated during implementation if user-visible behavior changes.

## Impact

- Affected map data: `src/shared/data/valorantMap.ts` wall segments and `src/shared/types/map.ts` wall geometry types.
- Affected shared utilities: map geometry helpers, flash/concuss target inference, and tests for line-of-sight and bounce edge cases.
- Affected ability configuration and placement flow: metadata for wall-aware projectile behavior and status-effect confirmation logic in `useMatchupStore`.
- Affected map UI: `MapAbilityRenderLayer` and related preview/debug rendering for LOS lines, blocking hits, and bounce paths.
- Affected specs: `specs/map/spec.md`, `specs/ability/spec.md`, and ability-focused notes should be reviewed during implementation.

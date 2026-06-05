## 1. Geometry Test Coverage

- [x] 1.1 Add unit tests for line-of-sight visible, blocked, non-opaque, and nearest-blocker cases.
- [x] 1.2 Add unit tests for projectile ray first-hit, miss, behind-origin, and nearest-hit cases.
- [x] 1.3 Add unit tests for one-bounce path tracing, bounce-limit stopping, and corner/parallel-wall edge cases.

## 2. Shared Map Geometry Facade

- [x] 2.1 Create a shared map geometry utility with readable facade functions for LOS blocking, first wall hit, and bounded wall bounces.
- [x] 2.2 Return inspection data from geometry results, including source/target points, path segments, hit points, wall IDs, and blocked/visible state.
- [x] 2.3 Keep existing view calculation behavior working or migrate it to reuse the new intersection helper without changing its public behavior.

## 3. Flash-Like Wall-Aware Target Inference

- [x] 3.1 Add tests proving flash-like status inference omits wall-blocked targets while preserving visible target severity.
- [x] 3.2 Extend flash/blind/nearsight target inference to accept optional wall geometry and LOS behavior without changing behavior when walls are omitted.
- [x] 3.3 Wire wall geometry into status-effect placement confirmation for supported point-source flash-like abilities.
- [x] 3.4 Preserve manual correction flows for wall-aware inferred misses and visible affected targets.

## 4. Projectile Wall Interaction

- [x] 4.1 Add ability metadata for bounded wall-interacting projectiles, including max distance and bounce count.
- [x] 4.2 Store projectile path geometry on confirmed ability placements in a normalization-safe way.
- [x] 4.3 Wire Neon Relay Bolt to use wall-aware projectile tracing and infer concuss targets from the configured impact or terminal zones.
- [x] 4.4 Add representative wiring for Yoru BLINDSIDE or KAY/O FLASH/drive using the same projectile path mechanism if the Neon path proves stable.

## 5. Map Rendering and Inspection Overlay

- [x] 5.1 Add map rendering for confirmed projectile path segments and bounce hit points where appropriate.
- [x] 5.2 Add debug/inspection overlay rendering for flash-like LOS lines, blocked hit points, and blocking wall identifiers.
- [x] 5.3 Gate inspection overlays so they do not render always-on character vision lines, cones, or polygons in normal mode.

## 6. Specs, Regression, and Verification

- [x] 6.1 Update `specs/map/spec.md` and ability specs if implementation changes user-visible map or ability semantics.
- [x] 6.2 Run focused unit tests for map geometry and status inference.
- [x] 6.3 Run the project lint/build verification required by the repo.
- [x] 6.4 Manually verify a blocked Phoenix-style flash and a bounced Neon Relay Bolt on the tactical map.

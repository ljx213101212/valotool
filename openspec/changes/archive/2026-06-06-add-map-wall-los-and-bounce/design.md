## Context

The generated tactical map already contains opaque wall line segments in `valorantMap.walls`, and `src/shared/utils/viewCalculation.ts` has an early line-segment intersection helper. Flash/concuss status inference currently lives in `abilityStatusEffects.ts` and determines affected targets from side rules, distance, and facing, without checking whether map walls block the source-to-target line.

Wall-aware behavior is a shared dependency for several abilities:

- Phoenix-style flashes need source-to-target line-of-sight checks.
- Yoru and KAY/O style projectiles need simple wall bounce paths before the final burst/source point is evaluated.
- Neon Relay Bolt needs a bounded wall hit/bounce path that can place concuss zones at the impact or terminal points.

The tactical board is still a 2D planning tool. It cannot perfectly model Valorant's 3D height, windows, exact collision volumes, or every ability-specific exception. The implementation should therefore provide predictable tactical-board approximations, visible debug evidence, and manual correction where automatic inference is insufficient.

## Goals / Non-Goals

**Goals:**

- Add a small shared map geometry facade for wall line-of-sight, first-hit raycasts, and bounded bounce traces.
- Keep geometry APIs readable from ability code, even if the math inside uses vector/intersection helpers.
- Use generated `Wall` data as the source of truth for opaque blockers.
- Make flash/blind/nearsight target inference wall-aware for supported point-source effects.
- Add representative projectile wall interactions for one-bounce abilities such as Neon `Relay Bolt`, Yoru `BLINDSIDE`, and KAY/O `FLASH/drive`.
- Add debug/inspection rendering for LOS lines, blocking hits, wall IDs, and bounce paths.
- Cover geometry behavior with focused unit tests before wiring it into ability behavior.

**Non-Goals:**

- Full player vision simulation.
- Always-on role/player vision cones or vision polygons.
- Smoke, door, height, window, or 3D occlusion modeling.
- A physics engine or continuous projectile simulation.
- Perfect game-accurate collision for every Valorant ability.
- User-editable wall geometry or vision-line authoring.

## Decisions

### 1. Add a map geometry facade, not ability-specific math

Create a shared utility boundary with readable API names such as:

```ts
isLineOfSightBlocked(source, target, walls)
findFirstWallHit(origin, direction, walls, options)
traceWallBounces(origin, direction, walls, options)
```

The facade should return enough explanation data for debugging, such as the blocking wall, hit point, and path segments. Ability code should depend on these semantic helpers rather than calling low-level intersection math directly.

Rationale: geometry bugs are hard to reason about when math is scattered through store and UI code. A facade keeps ability semantics readable and leaves room to swap the internals later.

Alternative considered: implement collision directly inside each ability confirmation branch. That is quick for one skill but would duplicate edge-case handling and make later debugging much harder.

### 2. Start with a local implementation and defer external geometry libraries

For MVP, implement 2D line/segment intersection, nearest wall hit, and vector reflection locally behind the facade. Keep the math small, tested, and isolated. Do not introduce a physics engine. Reconsider a library such as `@flatten-js/core` only if future requirements expand into polygons, thicker blockers, clipping, or more complex spatial relationships.

Rationale: current map geometry is only 237 line segments on Split, so a linear scan is simple and fast enough. A large geometry or physics dependency would make the project harder to understand before the requirements justify it.

Alternative considered: immediately adopt a mature 2D geometry package. This could reduce numerical edge-case risk, but it also adds a new abstraction for maintainers and still leaves custom game semantics to implement.

### 3. Treat debug LOS and bounce rendering as an inspection layer

Add debug data and rendering paths that can show:

- visible source-to-target lines,
- blocked source-to-target lines,
- blocking hit points,
- blocking wall IDs when practical,
- projectile bounce path segments.

This overlay should be controlled as inspection/debug UI and should not become a formal player vision feature in this change.

Rationale: wall-aware inference will otherwise feel opaque. Users and developers need to see why a target was missed or why a projectile bounced to a specific point.

Alternative considered: skip visual debug and rely on tests. Tests are necessary, but they do not help diagnose map-coordinate or SVG-wall data mistakes during real tactical-board use.

### 4. Apply wall LOS to point-source status inference first

For flash/blind/nearsight point-source effects, add an optional wall geometry input to target inference. A target that would otherwise be affected by side, distance, and facing is excluded when source-to-target LOS is blocked by an opaque wall. Manual correction should still allow the user to override an inferred miss, preserving the existing "tactical-board suggestion" model.

Rationale: this is the highest-value accuracy improvement and has a natural integration point in `computeFlashTargets`.

Alternative considered: infer all wall interactions at placement-render time only. That would show useful visuals but would not make timeline playback and affected statuses consistent.

### 5. Keep projectile bounce semantics bounded and data-driven

Represent wall-interacting projectile behavior with ability metadata rather than hard-coded agent branches. The first implementation should support a small maximum bounce count and explicit max path distance. Each traced path should produce segments and terminal/source points that ability-specific status logic can consume.

Rationale: Neon, Yoru, and KAY/O need similar wall geometry but different final effects. Bounded traces prevent runaway loops near corners or parallel walls.

Alternative considered: simulate projectile motion frame by frame. That would be overbuilt for the current tactical board and harder to keep deterministic in timeline snapshots.

## Risks / Trade-offs

- Wall data may be incomplete or drawn differently from real collision → Add debug overlays and keep manual correction available.
- Segment math can be fragile near corners, parallel lines, or starting points on walls → Use focused tests, epsilon handling, and bounded bounce counts.
- Tactical-board 2D LOS may disagree with Valorant 3D reality → Document it as an approximation and avoid claiming perfect game physics.
- More status inference parameters can bloat store logic → Keep geometry helpers pure and pass wall-aware options into existing inference utilities.
- Debug rendering could clutter normal planning → Gate it behind debug/inspection state rather than showing it by default.
- Future needs may outgrow simple line segments → Keep the facade stable so internals can later adopt a geometry library or spatial index.

## Migration Plan

- Existing ability placements without wall-aware metadata should continue to normalize and render.
- Existing flash/concuss behavior should remain available when wall geometry is not provided.
- New wall-aware inference should only affect newly confirmed/snapshotted placements after the change.
- If debug overlay state is persisted later, default it to disabled for older sessions.

## Open Questions

- Which representative projectile should be wired first after the geometry utility: Neon `Relay Bolt`, Yoru `BLINDSIDE`, or KAY/O `FLASH/drive`?
- Should wall IDs be shown only in development builds, or also in a user-facing inspection mode?

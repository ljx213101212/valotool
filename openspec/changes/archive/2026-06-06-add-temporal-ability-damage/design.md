## Context

The previous damage MVP added combat state, armor-aware damage application, instant area ability damage, and damage-derived kill events. It intentionally left delayed and persistent damaging abilities classified but unsupported in UI settlement because they create damage at future times and often as repeated ticks.

Existing code already has the right foundation:

- `DamageEvent.time` carries the actual damage time.
- `computeAbilityDamageEvents` can produce event times for `windup`, `persistent`, and `windup-then-persistent` metadata.
- Timeline keyframes can store damage events and recompute combat state from ordered events.
- Ability placements already carry `activeAt`, `expiresAt`, and `damageEffect` geometry.

This change turns those foundations into supported product behavior for a focused set of time-based damage skills.

## Goals / Non-Goals

**Goals:**

- Support delayed and persistent circular damage zones through the existing ability activation flow.
- Generate deterministic future/tick damage events from ability metadata.
- Keep timeline/keyframe playback as the source of truth for health, armor, elimination, and damage-derived kills.
- Make repeated damage readable in keyframe details by grouping events by originating ability deployment and target.
- Keep deletion behavior exact: deleting an ability removes its generated damage events and damage-derived kills.
- Support first representative skills: Gekko `Mosh Pit`, Brimstone `Incendiary`, and Killjoy `Nanoswarm`.

**Non-Goals:**

- Gun damage, hit regions, wall penetration, distance falloff, and fire-rate simulation.
- Projectile travel, bounce trajectory collision, autonomous targeting, or direct-hit AI.
- Vulnerable/decay amplification and healing-over-time composition.
- Full real-time animation of every damage tick; the timeline state and keyframes remain authoritative.

## Decisions

### 1. Generated Damage Events Stay Atomic

Each tick or delayed pulse remains a regular `DamageEvent` with its own `time`, `targetPlacementId`, `rawDamage`, and ability source. This keeps combat derivation simple: ordered damage events are applied the same way regardless of whether they came from Shock Bolt, Mosh Pit, or Incendiary.

Alternative considered: store one aggregate “duration damage event” and expand it only during playback. That would reduce event count but make deletion, kill attribution, keyframe inspection, and tests more complex.

### 2. Add Ability Damage Deployment Metadata Only Where Needed

`AbilityPlacement.damageEffect` should become the visual and scheduling envelope for deployed temporal damage zones:

- `sourceX/sourceY/radius` for map rendering.
- `startsAt` / `endsAt` semantics through existing `activeAt` / `expiresAt`.
- Optional family-specific flags only when the UI needs them, such as armed activation state for Nanoswarm.

The first implementation should avoid introducing a separate damage-zone store. Ability placement already owns the origin, owner, lifecycle, deletion, and render path.

### 3. Record Events At Their Damage Times

For temporal abilities, generated damage events should be recorded into keyframes at each event time, not all attached only to the deployment keyframe. Deployment keyframes show placement/start/end; damage keyframes show actual health/armor outcomes at the times they occur.

If multiple ticks occur in the same quantized timeline bucket, they can be stored together in that keyframe. The detail UI should group them for readability.

### 4. Group Display, Not Data

The UI should group damage events by deployment/ability/target for display, but the underlying data remains event-level. This preserves deterministic recomputation and enables future features like deleting one deployment, inspecting a lethal tick, or retiming an ability.

### 5. Keep First Scope Circular

The implementation should only support circular area geometry for this change. Line, beam, sequence, projectile, weapon-equip, and compound non-damage effects stay unsupported even if metadata exists.

## Risks / Trade-offs

- Event volume from high tick-rate skills can be large → Keep the first supported set small, group UI display, and test persistent skills with quantized event counts.
- Existing keyframe merge behavior may need careful handling for future events → Add pure tests for generating events across multiple keyframe times before wiring UI.
- Nanoswarm has armed/triggered semantics that differ from immediate molly placement → Model it as an armed damage ability with explicit trigger, reusing existing prepared ability token patterns where possible.
- Some wiki tick-rate values are approximations or frame-derived → Preserve source provenance and avoid claiming higher precision than the researched data supports.

## Migration Plan

- Existing instant damage events remain valid.
- Existing stored ability placements without temporal damage fields should normalize safely using current defaults.
- Unsupported temporal ability metadata can be flipped to supported one skill at a time after tests exist.
- Rollback is removing the new supported flags and UI activation paths; base damage and instant damage behavior remain unaffected.

## Open Questions

- Whether persistent damage should generate one event per documented tick or a coarser “timeline bucket” event for very high tick-rate skills. The first implementation should prefer correctness, then adjust only if UI/storage performance proves poor.
- Whether Mosh Pit’s pre-explosion damage-over-time should be represented in the first implementation or whether MVP should focus on its explosion pulses. Specs should make the chosen scope explicit before coding.

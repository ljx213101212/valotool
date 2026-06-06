## 1. Metadata And Scope

- [x] 1.1 Confirm current researched values for Gekko `Mosh Pit`, Brimstone `Incendiary`, and Killjoy `Nanoswarm`; update `specs/ability/damage.md` if any verified value or support status changes.
- [x] 1.2 Mark the first supported temporal skills in ability damage metadata while keeping unsupported families inert.
- [x] 1.3 Define any additional placement metadata needed for delayed, persistent, and armed persistent damage zones without creating a parallel damage-zone store.

## 2. Pure Damage Event Generation

- [x] 2.1 Add tests for delayed damage event times, persistent tick sequences, and windup-then-persistent sequences.
- [x] 2.2 Extend `computeAbilityDamageEvents` so future/tick events are generated deterministically from metadata, timeline start time, geometry, and target rules.
- [x] 2.3 Add tests for high tick-rate quantization, deterministic event IDs, and deletion by deployment id.
- [x] 2.4 Ensure future/tick lethal damage derives kill events at the damage event time and remains reversible when the originating deployment is removed.

## 3. Timeline And Store Integration

- [x] 3.1 Add or extend timeline helpers to record generated damage events into the keyframes matching their quantized event times.
- [x] 3.2 Update damage placement confirmation so delayed and persistent abilities create deployment records, active/expiry timestamps, and generated damage events without immediate live-state mutation before damage time.
- [x] 3.3 Add support for armed persistent damage activation, including armed state before trigger and generated damage events after trigger.
- [x] 3.4 Keep playback scrubbing deterministic for future damage, active zones, expired zones, and derived kills.

## 4. Map And Detail UI

- [x] 4.1 Render delayed and persistent damage zones with active/expired visibility driven by timeline playhead state.
- [x] 4.2 Add activation controls for supported temporal damage abilities while preserving unsupported messaging for other damage families.
- [x] 4.3 Group repeated damage events in the keyframe detail drawer by ability deployment and target, showing total damage, tick count, resulting health/armor, and lethal outcome when applicable.
- [x] 4.4 Ensure deleting a temporal damage deployment from the detail surface removes its deployment events, generated damage events, and damage-derived kills.

## 5. Verification

- [x] 5.1 Add focused tests for delayed placement, persistent placement, armed trigger, deletion, and keyframe grouping helpers.
- [x] 5.2 Run targeted unit tests for damage event generation and timeline damage mutation.
- [x] 5.3 Run `npm run build`, `npm run lint`, and `openspec validate add-temporal-ability-damage --strict`.
- [x] 5.4 Review affected specs after implementation and update deltas or main specs if implementation reveals missing or incorrect behavior.
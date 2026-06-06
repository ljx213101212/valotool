## 1. Research And Product Specs

- [x] 1.1 Research current Valorant base health, light armor, regen armor, heavy armor, and regen armor behavior from reliable sources; record source provenance and verification date.
- [x] 1.2 If health or armor values conflict or cannot be verified, pause and ask the user for source material before continuing.
- [x] 1.3 Research current Valorant damaging abilities and classify each into instant area, delayed area, persistent area, compound, or unsupported future families.
- [x] 1.4 Update `specs/damage/spec.md` with verified health/armor semantics and source notes.
- [x] 1.5 Update `specs/ability/damage.md` with verified damaging ability data, source notes, and reusable family classifications.

## 2. Data Model And Pure Logic

- [x] 2.1 Add combat state types for health, armor kind/value, regen armor reserve/state, eliminated status, and typed damage sources.
- [x] 2.2 Add pure damage application helpers for armor-aware damage, health clamping, elimination, and deterministic timeline-state derivation.
- [x] 2.3 Add pure regen armor helpers for researched recovery delay, recovery rate, maximum recovery, reserve handling, and interruption behavior.
- [x] 2.4 Add ability-damage metadata types and configuration fields for damage amount, timing, geometry, target rules, duration/ticks, support status, and source provenance.

## 3. Timeline And Store Behavior

- [x] 3.1 Extend matchup/timeline state to store initial agent combat state and timeline-linked damage events.
- [x] 3.2 Link damage events produced by ability deployments to their originating ability instance.
- [x] 3.3 Keep derived health/armor state synchronized when the playhead scrubs forward and backward.
- [x] 3.4 Remove linked damage events when a damaging ability deployment is deleted.

## 4. Map And Detail UI

- [x] 4.1 Add compact health and armor indicators to map agent tokens while preserving existing portrait, side color, eliminated, flash, and concuss treatments.
- [x] 4.2 Expose exact health/armor values in appropriate popover or detail surfaces instead of permanently rendering dense numbers on the map.
- [x] 4.3 Add keyframe/detail rows for damage events with source, affected target, damage amount, and resulting health/armor state.

## 5. Ability Damage Interaction

- [x] 5.1 Implement activation/placement support for the first supported damaging ability family: instant area; keep delayed and persistent families classified but unsupported for UI damage settlement.
- [x] 5.2 Infer affected targets from configured geometry and side-affecting rules for supported damaging abilities.
- [x] 5.3 Apply ability damage through the generic damage event pipeline rather than directly mutating agent tokens.
- [x] 5.4 Mark researched but unsupported damaging abilities as unavailable for activation without applying damage.

## 6. Verification

- [x] 6.1 Add focused tests for pure damage application, regen armor recovery, timeline scrubbing, and deletion of linked damage events.
- [x] 6.2 Add focused tests for supported ability-damage target inference and event generation.
- [x] 6.3 Run the project verification commands and fix regressions.
- [x] 6.4 Review affected specs after implementation and update deltas or main specs if implementation reveals missing or incorrect behavior.

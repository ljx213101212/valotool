## Context

The app already models tactical map state, ability deployments, keyframe/timeline playback, and timed portrait overlays for smoke, dash, flash, and concuss abilities. There is also existing loadout UI/configuration for armor items, but there is no timeline-evaluable agent health state and no damage event model.

Damage should build on the current ability deployment and timeline patterns instead of creating a separate combat simulator. The first implementation should be useful for tactical review: show each agent's current health/armor, let damaging abilities affect those values, and record the result in timeline/keyframe state. Accuracy-sensitive game data must be researched during implementation; if reliable current sources cannot be found, implementation stops for user-provided sources.

## Goals / Non-Goals

**Goals:**
- Add a compact health/armor state layer for agents that can be evaluated at any timeline time.
- Support base health, light armor, regen armor, and heavy armor as documented data with source provenance.
- Render health and armor on map agent tokens without turning the map into a dense spreadsheet.
- Add typed damage source categories for ability, weapon, and environment damage.
- Implement ability damage as the only active damage source in this change.
- Classify damaging abilities into reusable UI/logic families so future abilities can be configured rather than bespoke-coded.
- Keep damage application deterministic and testable with pure helpers.

**Non-Goals:**
- Weapon damage calculation, hit-region selection, penetration, range falloff, or economy balance.
- Environmental damage UI or automatic fall/out-of-bounds detection.
- Healing, shields, overheal, suppression, deafness, or build-object health beyond data-shape extension points.
- Full 3D Valorant simulation, verticality, projectile physics, or exact server tick replication.
- Automatic web scraping at runtime; research is an implementation-time data task.

## Decisions

### Use a timeline-derived health state, not mutable global health

Health and armor should be derived from an initial per-agent combat state plus ordered timeline events. This matches the existing keyframe playback model and allows scrubbing to any moment without hidden mutable state.

Alternative considered: store current HP directly on map tokens. That is simpler for one-off editing, but it makes timeline scrubbing, undo, and historical inspection fragile.

### Split data and behavior into `damage` and `ability-damage`

`damage` owns generic concepts: health, armor, damage sources, damage application, elimination, and display semantics. `ability-damage` owns Valorant ability facts and interaction families. This avoids baking ability-specific assumptions into the foundation and leaves room for weapon/environment damage later.

Alternative considered: put all damage requirements under `ability`. That would be faster initially but would make later gun/environment damage feel bolted on.

### Record source metadata for researched values

Base health, armor values, regen armor behavior, and damaging ability values should include source URL/name and verification date in the researched data layer or adjacent documentation. When source conflict or missing data appears, the implementation should pause for user input rather than inventing values.

Alternative considered: seed known values from memory. That violates the user's accuracy requirement and risks making specs look authoritative when they are not.

### Keep first map-token UI compact

The token should show health and armor as compact visual status: a health ring/bar and a small armor indicator. Exact numbers belong in hover/popover/detail surfaces where space allows. Eliminated tokens continue to use the existing eliminated treatment.

Alternative considered: always render numeric HP/armor labels on tokens. That is precise, but likely overcrowds the minimap and conflicts with existing status overlays.

### Treat damaging abilities as event producers

An activated damaging ability should create one or more damage events tied to the timeline. Those events apply deterministic damage to affected targets and can be shown in keyframe detail rows. Existing ability deployment rendering remains responsible for visual previews and placed ability instances.

Alternative considered: damage abilities directly mutate agent snapshots without event records. That hides causality and makes review/debugging much harder.

### Implement instant-area UI first and keep delayed/persistent as classified data

The first pass should wire the full data shape and implement a narrow, correct interaction path for instant area damage. Delayed area and persistent area damage should be researched, classified, and covered by pure event-generation helpers, but remain disabled for UI activation until timeline accumulation semantics are implemented correctly.

Alternative considered: implement every damaging ability at once. That creates too much blast radius and makes it harder to verify the health layer independently.

## Risks / Trade-offs

- [Risk] Valorant damage/armor data changes or conflicts across sources. -> Mitigation: store source provenance, verification date, and pause for user sources when confidence is low.
- [Risk] Regen armor behavior is more nuanced than the MVP model. -> Mitigation: specify and test the current supported behavior, then isolate regen logic in pure helpers for later correction.
- [Risk] Token UI becomes visually noisy with HP, armor, flash, concuss, and future statuses. -> Mitigation: prioritize minimal rings/indicators on the token and move exact details to popovers/drawers.
- [Risk] Damage events and ability deployments drift out of sync when deleting or moving timeline events. -> Mitigation: damage events should be linked to their originating ability deployment where applicable and removed together.
- [Risk] Persistent damage zones require tick semantics that can become expensive or confusing. -> Mitigation: derive damage from elapsed time using deterministic interval/tick helpers and clamp repeated application per target.
- [Risk] Weapon/environment source types may be under-specified. -> Mitigation: include them only as inert type extension points in this change, with no UI commitment.

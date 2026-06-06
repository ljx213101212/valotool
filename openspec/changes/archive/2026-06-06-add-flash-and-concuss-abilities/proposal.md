## Why

Flash and concuss abilities are core Valorant utility, but the current tactical board only models smoke and movement effects. Adding them lets users plan, replay, and communicate vision-denial and debuff timing with the same timeline-driven workflow used by existing ability effects.

## What Changes

- Add configurable flash/blind ability effect metadata covering projectile, curved, guided, wall-burst, safe enemy-only, and zone-projectile delivery forms.
- Add configurable concuss ability effect metadata for circular and linear/zone shapes.
- Represent affected agents as timed status effects with severity levels, duration, and fade-out metadata.
- Render flash/blind overlays on affected agent portraits, with gold-white opacity reflecting effect severity.
- Render concuss overlays on affected agent portraits with a distinct muted/blue-violet treatment.
- Add map placement previews and confirmation flows for supported flash/concuss shapes, following existing smoke and movement placement patterns.
- Record flash/concuss deploy start/end events on the timeline and keep active effects in sync with playback.
- Add manual correction affordances for inferred flash exposure so users can adjust back-flash, side-flash, front-flash, or missed targets when automatic tactical-board inference is insufficient.

## Capabilities

### New Capabilities

- `ability-flash-concuss`: Tactical-board support for flash/blind and concuss ability deployment, affected-agent status metadata, map rendering, portrait overlays, and timeline playback.

### Modified Capabilities

- None. The project does not yet have archived OpenSpec capability specs; existing product notes in `specs/ability/spec.md` remain the product-intent source and will be reflected in this change.

## Impact

- Affected ability configuration: `src/features/abilities/config.ts` and related ability catalog helpers.
- Affected shared types and stores: ability placement types, timeline deploy events, matchup store placement/confirmation state, normalization, and playback synchronization.
- Affected map UI: placement preview hooks, `MapAbilityRenderLayer`, `MapHeroToken`, ability instance popovers, and tactical effect components.
- Affected timeline/keyframe UI: ability deploy event rows and deletion/scrub behavior for timed effects.
- Affected specs: `specs/ability/spec.md` should gain flash/concuss behavior notes if implementation changes user-visible ability semantics.

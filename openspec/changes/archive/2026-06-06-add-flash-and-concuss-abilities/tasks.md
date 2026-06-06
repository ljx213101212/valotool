## 1. Data Model And Pure Logic

- [x] 1.1 Add flash/blind/concuss metadata types and helpers in ability configuration.
- [x] 1.2 Add pure geometry/status helpers for flash exposure severity, strength, timing, and concuss target checks.
- [x] 1.3 Extend ability placement normalization and timeline deploy types to tolerate flash/concuss geometry and affected statuses.

## 2. Store And Timeline Behavior

- [x] 2.1 Add matchup store state/actions for flash and concuss placement preview, cancellation, and confirmation.
- [x] 2.2 Record flash/concuss deploy start/end events and keep affected statuses synchronized with timeline playback.
- [x] 2.3 Add manual exposure correction behavior for stored affected statuses.

## 3. Map Interaction And Rendering

- [x] 3.1 Add map placement preview hooks and render-layer components for supported flash/concuss shapes.
- [x] 3.2 Add activation routing from ability instance popovers for supported flash/concuss abilities.
- [x] 3.3 Render active flash/blind/nearsight/concuss overlays on agent portraits with strength-based opacity and fade-out.

## 4. Ability Coverage And Product Specs

- [x] 4.1 Configure initial Valorant flash/blind and concuss abilities in `ABILITY_EFFECT_META`.
- [x] 4.2 Update `specs/ability/spec.md` with flash/concuss behavior notes and supported MVP categories.
- [x] 4.3 Run focused tests and project verification commands, then fix regressions.

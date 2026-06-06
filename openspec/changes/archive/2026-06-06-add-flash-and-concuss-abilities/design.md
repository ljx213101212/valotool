## Context

The current ability system models map effects as `AbilityEffectKind` values configured in `src/features/abilities/config.ts`. Smoke and direct movement already share a useful pattern:

1. create an initial ability token,
2. command/control-click the token,
3. activate a map placement mode,
4. preview geometry on the Konva stage,
5. confirm with left click or cancel with Escape,
6. write deploy events into timeline keyframes,
7. render active effects from timeline playback state.

Flash/blind and concuss effects fit this pattern, but they add a second result: affected agents need timed status overlays, not just a map shape. Flash effects also cannot be perfectly inferred from a 2D tactical board because true Valorant flashes depend on 3D line-of-sight, target facing, distance, and map geometry.

## Goals / Non-Goals

**Goals:**

- Model flash/blind and concuss abilities as first-class ability effects.
- Support the initial flash categories discussed in discovery:
  - projectile flash: KAY/O `FLASH/drive`, Yoru `BLINDSIDE`
  - fixed-curve flash: Phoenix `Curveball`
  - guided flash: Skye `Guiding Light`
  - wall-burst flash: Breach `Flashpoint`, Vyse `Arc Rose`
  - enemy-only blind: Gekko `Dizzy`, Reyna `Leer`
  - zone-projectile nearsight: Omen `Paranoia`
- Support concuss circle and concuss line/zone geometry for abilities such as Astra `Nova Pulse`, Breach `Fault Line`, Breach `Rolling Thunder`, Neon `Relay Bolt`, and similar later entries.
- Infer affected targets from side, distance, facing, and configured shape.
- Store status results so timeline playback can render affected agents consistently.
- Let users manually correct inferred exposure severity: missed, back, side, or front.
- Render flash/blind overlays on agent portraits using gold-white opacity based on severity.
- Render concuss overlays on agent portraits using a visually distinct muted/blue-violet treatment.

**Non-Goals:**

- Perfect Valorant physics, wall legality, bounce simulation, or 3D occlusion.
- Projectile collision against real map geometry.
- Damage, suppression, deafness, heal, shield, or build ability semantics.
- Full moving-unit simulation for Skye birds, Gekko Dizzy, or later drones; MVP may approximate them as placed/guided endpoints.

## Decisions

### 1. Use composable metadata for delivery and status

Add effect kinds such as `flash`, `blind`, `nearsight`, and `concuss`, with metadata fields for delivery shape rather than creating one effect kind per agent.

Example metadata shape:

```ts
flashDelivery: 'projectile' | 'fixed-curve' | 'guided' | 'wall-burst' | 'enemy-only-source' | 'zone-projectile';
statusEffect: 'flash' | 'blind' | 'nearsight' | 'concuss';
affects: 'enemies-only' | 'all-players';
effectRadius?: number;
effectWidth?: number;
effectLength?: number;
durationSec?: number;
fadeSec?: number;
```

Rationale: this keeps ability configuration data-driven like smoke and movement. It also keeps "safe flash" as metadata (`affects: enemies-only`) instead of a separate hard-coded branch.

Alternative considered: hard-code each flash agent in store logic. That would be quicker for the first few abilities but brittle when adding later agents and mixed-effect abilities.

### 2. Store affected-agent status results on ability placements

Extend `AbilityPlacement` with status-effect geometry and affected-target records:

```ts
affectedStatuses: Array<{
  targetPlacementId: string;
  effect: 'flash' | 'blind' | 'nearsight' | 'concuss';
  severity: 'miss' | 'back' | 'side' | 'front';
  strength: number;
  startsAt: number;
  endsAt: number;
  fadeEndsAt: number;
  manual?: boolean;
}>;
```

Rationale: timeline keyframes already snapshot ability placements. Keeping status results with the originating placement means deletion, scrub, and archival are simpler: remove one ability placement and its target overlays vanish with it.

Alternative considered: separate global agent-status store. That would help aggregate overlapping status effects, but it would add more cross-store coordination before the first tactical-board behavior exists.

### 3. Infer flash severity from facing angle and distance, then allow manual correction

For flash-like effects, compute target exposure against the explosion/source point:

- front flash: target is facing toward the source and within range
- side flash: target is oblique to the source
- back flash: target is facing away from the source
- miss: out of range, excluded by side rules, or manually cleared

Use continuous `strength` for UI opacity and discrete `severity` for display and editing. MVP can ignore map wall occlusion and store `lineOfSight: true` internally if needed later.

Rationale: this matches Valorant's qualitative behavior while admitting that a 2D map cannot know exact visibility.

Alternative considered: no automatic inference, only manual target marking. That is precise but slower for users and misses the value of current facing handles already present on agent tokens.

### 4. Render target overlays inside `MapHeroToken`

`MapHeroToken` already owns the portrait, facing fan, selection ring, and drag/facing behavior. It should accept or derive active status overlays from playback state and draw them above the portrait:

- flash/blind: gold-white circle overlay with opacity from `strength`
- nearsight: darker purple-gold tint or vignette
- concuss: muted blue-violet overlay with subtle ring/wave treatment

Rationale: overlays stay aligned to moving/draggable tokens and can be layered above portraits without duplicating token geometry elsewhere.

Alternative considered: draw all status overlays in `MapAbilityRenderLayer`. That keeps ability rendering centralized, but overlay registration against each token becomes more fragile.

### 5. Reuse existing placement-effect hooks

Add new placement modes next to smoke and direct movement:

- simple point placement for wall-burst and source flashes,
- line/zone placement for Paranoia and concuss lines,
- fixed-curve preview for Phoenix,
- guided path preview for Skye-like abilities.

Rationale: the current `useMapPlacementPreviews` and `useMapPlacementEffects` pattern already centralizes pointer sync, Escape cancellation, and click confirmation.

Alternative considered: modal-driven placement configuration. It would be less natural for map-first tactical planning and would diverge from the existing interaction model.

## Risks / Trade-offs

- Inaccurate automatic exposure because map geometry and true 3D line-of-sight are unavailable → Store severity as editable, and treat automatic values as tactical-board suggestions.
- Overlapping flashes/concuss effects may compete visually → Render strongest active status per effect family first; later work can add stacked indicators.
- More placement modes can bloat `useMatchupStore` and `Map.tsx` → Keep geometry helpers pure and consider extracting common placement state after the MVP passes tests.
- Status overlays might obscure portrait identity too much → Cap maximum opacity and keep selection/facing affordances visible above or around the overlay.
- Existing persisted ability placements will not have new fields → Normalization must tolerate missing flash/concuss/status fields.

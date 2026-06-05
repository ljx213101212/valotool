## ADDED Requirements

### Requirement: Flash-like status inference respects wall line of sight
The system SHALL use opaque map walls to exclude blocked targets from automatic flash, blind, and nearsight point-source status inference.

#### Scenario: Blocked target is automatically missed
- **WHEN** a target is within effect radius and facing would otherwise produce a flash, blind, or nearsight status
- **AND** an opaque wall blocks line of sight from the effect source to the target
- **THEN** the automatic affected-target result SHALL omit that target

#### Scenario: Visible target keeps existing severity inference
- **WHEN** a target is within effect radius and no opaque wall blocks line of sight from the effect source to the target
- **THEN** the system SHALL continue assigning front, side, or back severity from target facing

#### Scenario: Wall-aware inference remains optional for missing geometry
- **WHEN** flash-like target inference runs without wall geometry input
- **THEN** the system SHALL preserve the existing side, distance, and facing behavior

### Requirement: Manual status correction remains available
The system SHALL allow users to manually correct wall-aware automatic status results.

#### Scenario: User restores a blocked target
- **WHEN** automatic wall-aware inference omits a target because line of sight is blocked
- **AND** the user manually marks the target as back, side, or front affected
- **THEN** the resulting affected status SHALL be stored with manual correction metadata

#### Scenario: User clears a visible target
- **WHEN** automatic wall-aware inference marks a visible target as affected
- **AND** the user manually marks the target as missed
- **THEN** the target SHALL not render an active status overlay for that deployment

### Requirement: Supported projectiles can trace wall bounce paths
The system SHALL support configured projectile abilities whose placement or effect source depends on a bounded wall-hit or bounce trace.

#### Scenario: One-bounce projectile records a bounced path
- **WHEN** a configured one-bounce projectile is aimed at an opaque wall
- **THEN** the confirmed ability placement SHALL record path geometry containing the incoming segment, wall hit, and reflected segment

#### Scenario: Projectile without wall hit records terminal path
- **WHEN** a configured projectile is aimed without hitting an opaque wall within range
- **THEN** the confirmed ability placement SHALL record a terminal path ending at the configured maximum distance or target point

#### Scenario: Bounced terminal point drives status effect source
- **WHEN** a wall-aware projectile produces a terminal burst or impact point
- **THEN** target inference SHALL use that terminal point or configured impact point as the status effect source

### Requirement: Neon Relay Bolt uses wall-aware projectile geometry
The system SHALL model Neon `Relay Bolt` as a wall-aware concuss projectile with bounded bounce behavior.

#### Scenario: Relay Bolt shocks on each surface hit
- **WHEN** Neon `Relay Bolt` is placed with a trajectory that hits an opaque wall
- **THEN** the map SHALL show the bounced projectile path and infer concuss targets from each recorded surface hit point and final terminal landing point

#### Scenario: Relay Bolt path is inspectable
- **WHEN** inspection/debug overlay is enabled for a confirmed Neon `Relay Bolt`
- **THEN** the map SHALL render the ordered path segments and wall hit point used by that placement

### Requirement: Wall-aware debug overlays explain automatic ability decisions
The system SHALL provide an inspection overlay for wall-aware ability placements that explains visibility and projectile path decisions.

#### Scenario: Flash placement shows blocked and visible lines
- **WHEN** inspection/debug overlay is enabled for a wall-aware flash-like placement
- **THEN** the map SHALL render visible source-to-target lines differently from blocked source-to-target lines

#### Scenario: Blocked flash line identifies the blocker
- **WHEN** inspection/debug overlay renders a blocked source-to-target line
- **THEN** the overlay SHALL expose the blocking hit point and blocking wall identifier when available

#### Scenario: Overlay is not normal player vision
- **WHEN** the wall-aware inspection overlay is disabled
- **THEN** the system SHALL not render always-on character vision lines, vision cones, or vision polygons as part of this change

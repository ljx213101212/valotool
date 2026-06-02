## ADDED Requirements

### Requirement: Flash and blind abilities are configurable
The system SHALL allow ability metadata to classify flash/blind abilities by delivery form, status effect type, affected side rules, timing, and map geometry.

#### Scenario: Supported flash categories are represented
- **WHEN** an ability is configured as projectile, fixed-curve, guided, wall-burst, enemy-only source, or zone-projectile delivery
- **THEN** the ability metadata SHALL expose enough information for the map to choose the correct placement preview and confirmation behavior

#### Scenario: Safe flashes exclude teammates
- **WHEN** an ability is configured with enemies-only targeting
- **THEN** affected-target inference SHALL exclude agents on the same side as the caster

### Requirement: Flash exposure has severity levels
The system SHALL represent flash/blind exposure using both a discrete severity and a continuous strength for rendering.

#### Scenario: Front exposure is strongest
- **WHEN** a target is within range and facing toward the flash source
- **THEN** the target status SHALL be recorded as front severity with a high strength value

#### Scenario: Side exposure is moderate
- **WHEN** a target is within range and the flash source is oblique to the target facing
- **THEN** the target status SHALL be recorded as side severity with a medium strength value

#### Scenario: Back exposure is weakest
- **WHEN** a target is within range and facing away from the flash source
- **THEN** the target status SHALL be recorded as back severity with a low strength value

#### Scenario: Missed exposure is not rendered
- **WHEN** a target is outside range or manually marked missed
- **THEN** the target SHALL NOT render an active flash overlay for that deployment

### Requirement: Affected agents show timed visual status overlays
The system SHALL render active flash/blind and concuss statuses on affected agent portraits during timeline playback.

#### Scenario: Flash overlay reflects strength
- **WHEN** an agent has an active flash/blind status
- **THEN** the agent portrait SHALL render a gold-white overlay whose opacity reflects the recorded strength

#### Scenario: Flash overlay fades after effect duration
- **WHEN** the playhead moves from status start through duration and fade time
- **THEN** the overlay opacity SHALL reduce until the effect no longer renders after fade completion

#### Scenario: Concuss overlay is visually distinct
- **WHEN** an agent has an active concuss status
- **THEN** the agent portrait SHALL render a muted blue-violet concuss treatment instead of the flash gold-white treatment

### Requirement: Flash and concuss deployments follow existing ability placement flow
The system SHALL use the existing ability token activation pattern for supported flash and concuss abilities.

#### Scenario: User activates a flash ability token
- **WHEN** the user command/control-clicks an initial flash ability token and chooses activation
- **THEN** the map SHALL enter the configured flash placement mode and render the appropriate trajectory, source, or area preview

#### Scenario: User confirms a deployment
- **WHEN** the user left-clicks during an active flash or concuss placement mode
- **THEN** the system SHALL confirm the deployment, record affected statuses, and write timeline deploy events for the deployment duration

#### Scenario: User cancels a deployment
- **WHEN** the user presses Escape during an active flash or concuss placement mode
- **THEN** the system SHALL cancel the placement mode without changing the ability placement or timeline

### Requirement: Flash exposure can be manually corrected
The system SHALL allow users to override inferred exposure severity for affected targets after deployment.

#### Scenario: User changes exposure severity
- **WHEN** a user changes a target exposure from front to side, back, or missed
- **THEN** the stored status SHALL use the selected severity and mark the status as manually overridden

#### Scenario: Manual correction controls rendering
- **WHEN** a status has a manual severity override
- **THEN** timeline playback SHALL render the overlay using the manual severity-derived strength rather than recomputing automatic exposure

### Requirement: Concuss abilities are configurable and timed
The system SHALL allow concuss abilities to define circular or linear/zone geometry, duration, and affected side rules.

#### Scenario: Circular concuss placement
- **WHEN** a circular concuss ability is confirmed at a map point
- **THEN** the system SHALL record agents inside the configured radius as concussed for the configured duration

#### Scenario: Linear concuss placement
- **WHEN** a linear or zone concuss ability is confirmed with a facing and length
- **THEN** the system SHALL record agents inside the configured line/zone shape as concussed for the configured duration

#### Scenario: Concuss timeline expiration
- **WHEN** the playhead reaches the concuss status end time
- **THEN** affected agent concuss overlays SHALL stop rendering

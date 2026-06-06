## ADDED Requirements

### Requirement: Delayed area damage can be activated
The system SHALL allow supported delayed area damage abilities to be placed and resolved at their configured future damage time.

#### Scenario: User confirms delayed damage placement
- **WHEN** the user confirms a supported delayed area damage placement
- **THEN** the system SHALL record the deployment time, future damage time, area geometry, and generated damage events

#### Scenario: Delayed damage affects targets at resolution time
- **WHEN** the delayed damage time is reached
- **THEN** the system SHALL apply damage to valid targets inside the configured geometry according to the ability damage values

#### Scenario: Delayed damage has no valid targets
- **WHEN** the delayed damage resolves with no valid targets in the configured geometry
- **THEN** the system SHALL preserve the deployment record and show that no damage was applied

### Requirement: Persistent area damage can be activated
The system SHALL allow supported persistent area damage abilities to create a duration-based damage zone and generated tick damage events.

#### Scenario: User confirms persistent damage placement
- **WHEN** the user confirms a supported persistent area damage placement
- **THEN** the map SHALL show the active damage zone for its configured duration and the timeline SHALL contain generated tick damage events

#### Scenario: Persistent damage affects valid targets
- **WHEN** a valid target is inside the persistent damage geometry for one or more generated tick times
- **THEN** the system SHALL apply the configured tick damage at those tick times

#### Scenario: Persistent damage expires
- **WHEN** the playhead reaches the persistent damage zone end time
- **THEN** the map SHALL stop showing the damage zone as active

### Requirement: Armed persistent damage can be triggered
The system SHALL support prepared damage abilities that remain armed until explicitly triggered, then produce persistent damage from the trigger time.

#### Scenario: User arms Nanoswarm
- **WHEN** the user places a supported armed persistent damage ability during preparation
- **THEN** the ability SHALL remain on the map as an armed token without producing damage events

#### Scenario: User triggers Nanoswarm
- **WHEN** the user triggers the armed persistent damage ability at a timeline time
- **THEN** the system SHALL record a deployment activation and generate persistent damage events from that trigger time

#### Scenario: Armed damage is deleted before trigger
- **WHEN** an armed persistent damage ability is deleted before it is triggered
- **THEN** the system SHALL remove the armed token without creating damage events

### Requirement: Temporal damage details are grouped for readability
The system SHALL make delayed and persistent damage outcomes inspectable without requiring users to read every tick as an unrelated row.

#### Scenario: Keyframe contains repeated tick damage
- **WHEN** a keyframe contains multiple damage events from the same ability deployment
- **THEN** the detail surface SHALL group them by ability deployment and target while preserving exact damage totals and resulting health/armor state

#### Scenario: Keyframe contains a lethal tick
- **WHEN** a grouped temporal damage outcome includes a tick that causes a kill
- **THEN** the detail surface SHALL still expose the resulting damage-derived kill in the keyframe kill order

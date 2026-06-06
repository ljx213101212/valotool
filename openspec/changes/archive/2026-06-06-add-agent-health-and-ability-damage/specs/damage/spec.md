## ADDED Requirements

### Requirement: Agent combat state is timeline-evaluable
The system SHALL represent each agent's combat state as health, armor kind, armor value, regen armor reserve when applicable, and eliminated status that can be derived for any timeline time.

#### Scenario: Default combat state is created
- **WHEN** a round timeline is initialized for agents
- **THEN** each agent SHALL have a combat state with base health, selected armor kind/value, no applied damage events, and eliminated status set to false

#### Scenario: Timeline playback derives current combat state
- **WHEN** the playhead moves to a timeline time after one or more damage events
- **THEN** the system SHALL derive each affected agent's current health, armor value, regen armor state, and eliminated status from the ordered events up to that time

#### Scenario: Scrubbing backward restores earlier combat state
- **WHEN** the playhead moves from a later time back before a damage event
- **THEN** the derived combat state SHALL exclude that later damage event

### Requirement: Health and armor data is researched before implementation
The system SHALL use current researched game data for base health, light armor, regen armor, heavy armor, and regen armor behavior instead of invented or memory-only values.

#### Scenario: Reliable values are found
- **WHEN** implementation research finds reliable current values for health or armor behavior
- **THEN** the values SHALL be recorded with enough provenance to identify the source and verification date

#### Scenario: Reliable values are not found
- **WHEN** implementation research cannot find reliable current values or finds conflicting values
- **THEN** implementation SHALL pause for user-provided sources before those values are added

### Requirement: Damage is applied through armor-aware rules
The system SHALL apply incoming damage to an agent's health and armor according to the configured armor kind and armor rules.

#### Scenario: Damage does not eliminate the agent
- **WHEN** a damage event leaves the agent with health greater than zero
- **THEN** the derived combat state SHALL keep eliminated status false and preserve the remaining health and armor values

#### Scenario: Damage eliminates the agent
- **WHEN** a damage event reduces the agent's health to zero or below
- **THEN** the derived combat state SHALL clamp health to zero and set eliminated status true

#### Scenario: Ability damage creates a kill event
- **WHEN** an ability damage event reduces an enemy's health to zero or below
- **THEN** the keyframe SHALL include a kill event for the caster and victim derived from that damage event

#### Scenario: Excess damage is clamped
- **WHEN** incoming damage exceeds the agent's remaining health and armor capacity
- **THEN** the derived combat state SHALL NOT show negative health or negative armor

### Requirement: Regen armor can recover according to researched rules
The system SHALL model regen armor recovery using researched game rules for reserve, recovery delay, recovery rate, maximum restored armor, and damage interruption.

#### Scenario: Regen armor is eligible to recover
- **WHEN** an agent with regen armor has recoverable armor reserve and satisfies the configured recovery conditions
- **THEN** the derived combat state SHALL restore armor over time up to the configured limit

#### Scenario: Regen armor recovery is interrupted
- **WHEN** an agent with regen armor takes damage before or during recovery
- **THEN** the derived combat state SHALL apply the configured interruption and delay rules before further recovery

### Requirement: Damage sources are typed
The system SHALL classify damage sources as ability, weapon, or environment damage.

#### Scenario: Ability damage source is active
- **WHEN** a damaging ability produces damage
- **THEN** the damage event SHALL identify the source as ability damage with the originating ability and caster

#### Scenario: Weapon damage source is reserved
- **WHEN** the system defines weapon damage types in this change
- **THEN** those types SHALL remain inert extension points with no weapon damage UI or calculation behavior

#### Scenario: Environment damage source is reserved
- **WHEN** the system defines environment damage types in this change
- **THEN** those types SHALL remain inert extension points with no automatic environment damage detection or UI behavior

### Requirement: Map tokens show combat state compactly
The system SHALL show health, armor, and elimination state on map agent tokens using compact visual indicators.

#### Scenario: Agent is alive
- **WHEN** an agent has health greater than zero
- **THEN** the map token SHALL show the agent portrait with a compact health indicator and armor indicator when armor is present

#### Scenario: Agent is eliminated
- **WHEN** an agent's derived combat state is eliminated
- **THEN** the map token SHALL use the eliminated visual treatment and stop presenting the agent as alive

#### Scenario: Exact values are needed
- **WHEN** the user opens a detail surface for an agent or relevant event
- **THEN** the system SHALL expose exact health and armor values without requiring those numbers to be permanently rendered on the map token

### Requirement: Damage events are visible in timeline details
The system SHALL make applied damage events inspectable from timeline/keyframe detail surfaces.

#### Scenario: Damage event appears in a keyframe detail
- **WHEN** a keyframe contains damage applied to one or more agents
- **THEN** the detail surface SHALL show the damage source, affected agent, damage amount, and resulting health/armor state

#### Scenario: Originating ability is deleted
- **WHEN** a damaging ability deployment is deleted
- **THEN** damage events and damage-derived kill events produced by that deployment SHALL be removed or invalidated so derived combat state no longer includes that damage

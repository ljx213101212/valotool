## ADDED Requirements

### Requirement: Damage events can occur after deployment time
The system SHALL support damage events whose damage time is later than the originating ability deployment time.

#### Scenario: Future damage is pending
- **WHEN** a delayed ability is deployed and its damage time is later than the current playhead
- **THEN** the target combat state SHALL remain unchanged until the playhead reaches the damage event time

#### Scenario: Future damage becomes active
- **WHEN** the playhead reaches a future damage event time
- **THEN** the system SHALL apply that damage event through the standard armor-aware damage pipeline

#### Scenario: Future lethal damage creates a kill event
- **WHEN** a future ability damage event reduces a target's health to zero
- **THEN** the keyframe at the damage event time SHALL include the damage-derived kill record

### Requirement: Persistent damage is represented as ordered events
The system SHALL represent persistent ability damage as ordered damage events generated from the ability timing metadata.

#### Scenario: Persistent damage ticks over time
- **WHEN** a persistent damage ability affects a target for multiple ticks
- **THEN** the system SHALL generate one ordered damage event per tick time and apply them in chronological order

#### Scenario: Multiple ticks share a keyframe bucket
- **WHEN** multiple damage ticks quantize to the same keyframe time
- **THEN** the keyframe SHALL preserve all damage events in deterministic order

#### Scenario: Persistent damage stops at duration end
- **WHEN** the playhead moves beyond the ability's configured duration
- **THEN** no additional damage events SHALL be generated after the configured end time

### Requirement: Temporal damage deletion removes derived outcomes
The system SHALL remove all future, tick, and derived kill outcomes produced by a deleted temporal damage deployment.

#### Scenario: Temporal deployment is deleted
- **WHEN** a delayed or persistent damage deployment is deleted
- **THEN** all damage events whose source references that deployment SHALL be removed from keyframes

#### Scenario: Deleted temporal deployment had a kill
- **WHEN** a deleted temporal damage deployment previously produced a damage-derived kill
- **THEN** that damage-derived kill SHALL be removed while manual kill records remain unchanged

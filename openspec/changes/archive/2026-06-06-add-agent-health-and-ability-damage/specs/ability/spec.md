## ADDED Requirements

### Requirement: Ability deployments can produce damage events
The system SHALL allow supported ability deployments to produce timeline-linked damage events in addition to their existing visual or status effects.

#### Scenario: Supported damaging ability is deployed
- **WHEN** a supported damaging ability deployment is confirmed
- **THEN** the deployment SHALL create any configured damage events and link them to the originating ability instance

#### Scenario: Non-damaging ability is deployed
- **WHEN** an ability deployment has no configured damage behavior
- **THEN** the deployment SHALL continue to follow its existing visual or status behavior without creating damage events

#### Scenario: Damaging deployment is removed
- **WHEN** a user deletes a damaging ability deployment
- **THEN** the system SHALL remove the linked damage events so the timeline no longer applies that deployment's damage

### Requirement: Ability detail surfaces expose damage outcomes
The system SHALL include damage outcomes in ability-related detail surfaces when a deployed ability produces damage events.

#### Scenario: Deployed ability has damage results
- **WHEN** the user inspects a deployed damaging ability
- **THEN** the detail surface SHALL show affected targets and their resulting health/armor state

#### Scenario: Deployed ability has no damage results
- **WHEN** the user inspects a deployed ability that produced no damage events
- **THEN** the detail surface SHALL avoid showing empty or misleading damage results


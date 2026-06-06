## ADDED Requirements

### Requirement: Damaging abilities have researched metadata
The system SHALL represent Valorant damaging abilities with researched metadata for damage amount, timing, area/shape, affected targets, duration or tick behavior, and source provenance.

#### Scenario: Ability damage values are found
- **WHEN** implementation research finds reliable current values for a damaging ability
- **THEN** the ability damage metadata SHALL record the values and enough provenance to identify the source and verification date

#### Scenario: Ability damage values are missing or conflicting
- **WHEN** implementation research cannot find reliable values for a damaging ability or finds conflicting values
- **THEN** that ability SHALL NOT receive invented values and implementation SHALL pause for user-provided sources or mark the ability unsupported

### Requirement: Damage abilities are classified into reusable families
The system SHALL classify damaging abilities into reusable UI and logic families instead of implementing each ability as a one-off behavior.

#### Scenario: Instant area damage ability
- **WHEN** an ability is classified as instant area damage
- **THEN** activation SHALL support selecting an area and applying configured damage once to affected targets

#### Scenario: Delayed area damage ability
- **WHEN** an ability is classified as delayed area damage
- **THEN** the metadata SHALL preserve its configured delay and damage values while UI activation remains unsupported in this change

#### Scenario: Persistent area damage ability
- **WHEN** an ability is classified as persistent area damage
- **THEN** the metadata SHALL preserve its duration and tick rules while UI activation remains unsupported in this change

#### Scenario: Compound damage ability
- **WHEN** an ability includes damage plus another effect such as displacement, slow, vulnerability, or object health
- **THEN** the metadata SHALL identify the damage part separately from the other effect so future systems can compose the behavior

### Requirement: Ability damage placement follows existing ability activation patterns
The system SHALL use the existing ability token activation flow for supported damaging ability families.

#### Scenario: User activates a supported damage ability
- **WHEN** the user command/control-clicks a supported damaging ability token and chooses activation
- **THEN** the map SHALL enter that ability family's placement or targeting mode

#### Scenario: User confirms placement
- **WHEN** the user confirms a supported damage ability placement
- **THEN** the system SHALL create the ability deployment and associated damage event data for timeline evaluation

#### Scenario: User confirms instant area damage placement
- **WHEN** the user confirms a supported instant area damage placement
- **THEN** the system SHALL record an instant deployment event and SHALL NOT leave a persistent ability tag or damage area on the map

#### Scenario: User cancels placement
- **WHEN** the user presses Escape during damage ability placement
- **THEN** the system SHALL cancel placement without creating ability deployment or damage events

### Requirement: Damage targeting is inferred from configured geometry
The system SHALL infer affected targets from the damaging ability's configured geometry and side-affecting rules.

#### Scenario: Target is inside the damage geometry
- **WHEN** an agent is inside a supported damaging ability's configured damage geometry at the damage time
- **THEN** the system SHALL include that agent in the generated damage events unless side-affecting rules exclude them

#### Scenario: Target is outside the damage geometry
- **WHEN** an agent is outside the configured damage geometry at the damage time
- **THEN** the system SHALL NOT include that agent in the generated damage events

#### Scenario: Side-affecting rules exclude a target
- **WHEN** an ability is configured to affect only enemies, only allies, only self, or a specific side set
- **THEN** the generated damage events SHALL respect that target rule

### Requirement: Unsupported damage families are explicit
The system SHALL distinguish configured-but-unsupported damage families from implemented damage behavior.

#### Scenario: Ability has a future family
- **WHEN** a damaging ability is researched but belongs to a family not implemented in this change
- **THEN** the ability metadata SHALL mark it unsupported for activation while preserving its classification for future work

#### Scenario: User tries to activate unsupported damage behavior
- **WHEN** the user attempts to activate an unsupported damaging ability behavior
- **THEN** the system SHALL avoid applying damage and SHALL communicate that the damage behavior is not supported yet

### Requirement: Ability damage is inspectable
The system SHALL make ability damage outcomes inspectable from ability or timeline detail surfaces.

#### Scenario: Ability damage affects targets
- **WHEN** a damaging ability deployment applies damage to one or more targets
- **THEN** the detail surface SHALL show the ability name, caster, affected targets, damage amount, and resulting health/armor state

#### Scenario: Ability damage affects no targets
- **WHEN** a damaging ability deployment applies no damage because no valid target is affected
- **THEN** the detail surface SHALL still show the deployment and indicate that no target was damaged

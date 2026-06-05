## ADDED Requirements

### Requirement: Opaque map walls block line of sight
The system SHALL determine whether a straight line between two map points is blocked by opaque tactical-map wall segments.

#### Scenario: Opaque wall blocks a source-to-target line
- **WHEN** a source-to-target segment intersects an opaque wall segment between the source and target
- **THEN** the line-of-sight result SHALL report blocked with the blocking wall and hit point

#### Scenario: Non-intersecting walls do not block a source-to-target line
- **WHEN** no opaque wall segment intersects the source-to-target segment between the source and target
- **THEN** the line-of-sight result SHALL report visible

#### Scenario: Non-opaque walls are ignored
- **WHEN** a source-to-target segment intersects only walls marked as non-opaque
- **THEN** the line-of-sight result SHALL report visible

### Requirement: Projectile rays report the first opaque wall hit
The system SHALL trace a 2D projectile ray against opaque tactical-map wall segments and report the nearest valid hit within the configured distance.

#### Scenario: Nearest hit is selected
- **WHEN** a projectile ray intersects multiple opaque wall segments within range
- **THEN** the raycast result SHALL report the closest hit point and wall along the ray direction

#### Scenario: Ray misses all walls
- **WHEN** a projectile ray does not intersect an opaque wall segment within range
- **THEN** the raycast result SHALL report no hit and a terminal point at the configured maximum distance

#### Scenario: Ray ignores hits behind its origin
- **WHEN** an opaque wall segment lies behind the ray origin relative to the ray direction
- **THEN** the raycast result SHALL ignore that wall segment

### Requirement: Projectile paths support bounded wall bounces
The system SHALL compute deterministic projectile path segments for a bounded number of wall bounces against opaque tactical-map wall segments.

#### Scenario: One bounce produces two path segments
- **WHEN** a projectile ray hits an opaque wall and the configured bounce count is one
- **THEN** the trace result SHALL include the incoming segment, the reflected outgoing segment, and the wall hit point

#### Scenario: No hit produces a single terminal segment
- **WHEN** a projectile ray reaches its configured maximum distance without hitting an opaque wall
- **THEN** the trace result SHALL include one segment from origin to terminal point and no bounce hits

#### Scenario: Bounce tracing is capped
- **WHEN** a projectile path could continue hitting walls after the configured bounce count is exhausted
- **THEN** the trace result SHALL stop at the configured bounce limit

### Requirement: Wall geometry exposes inspection data
The system SHALL expose enough line-of-sight and projectile trace data for map inspection overlays to explain wall-aware decisions.

#### Scenario: Blocked line-of-sight includes debug data
- **WHEN** a line-of-sight check is blocked by a wall
- **THEN** the result SHALL include the source point, target point, hit point, and blocking wall identifier

#### Scenario: Projectile trace includes debug data
- **WHEN** a projectile path is traced against walls
- **THEN** the result SHALL include ordered path segments and any wall hit identifiers needed to render an inspection path

import { Circle, Group, Line, Text } from 'react-konva';
import type { Point, Wall } from '@/shared/types/map';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import { isLineOfSightBlocked } from '@/shared/utils/mapGeometry';

export type MapLineOfSightDebugOverlayProps = {
  source: Point;
  targets: MapAgentPlacement[];
  walls: Wall[];
  enabled?: boolean;
};

export function MapLineOfSightDebugOverlay({
  source,
  targets,
  walls,
  enabled = import.meta.env.DEV,
}: MapLineOfSightDebugOverlayProps) {
  if (!enabled) return null;

  return (
    <Group listening={false}>
      {targets.map((target) => {
        const result = isLineOfSightBlocked({ source, target, walls });
        const color = result.blocked ? '#ef4444' : '#22c55e';
        return (
          <Group key={`los-${target.id}`}>
            <Line
              points={[source.x, source.y, target.x, target.y]}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.55}
              dash={result.blocked ? [6, 6] : [3, 5]}
            />
            {result.hit ? (
              <>
                <Circle
                  x={result.hit.point.x}
                  y={result.hit.point.y}
                  radius={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1}
                />
                <Text
                  x={result.hit.point.x + 6}
                  y={result.hit.point.y - 6}
                  text={result.hit.wall.id}
                  fontSize={10}
                  fill="#fee2e2"
                />
              </>
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}

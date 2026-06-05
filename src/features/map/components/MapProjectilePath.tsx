import { Circle, Group, Line, Text } from 'react-konva';
import type { AbilityProjectilePath } from '@/shared/types/ability';

export type MapProjectilePathProps = {
  path: AbilityProjectilePath;
  debug?: boolean;
};

export function MapProjectilePath({ path, debug = import.meta.env.DEV }: MapProjectilePathProps) {
  return (
    <Group listening={false}>
      {path.segments.map((segment, index) => (
        <Line
          key={`projectile-segment-${index}`}
          points={[segment.from.x, segment.from.y, segment.to.x, segment.to.y]}
          stroke="#facc15"
          strokeWidth={3}
          opacity={0.8}
          dash={index === 0 ? undefined : [8, 6]}
          lineCap="round"
          shadowColor="#facc15"
          shadowBlur={10}
          shadowOpacity={0.45}
        />
      ))}
      {path.hits.map((hit, index) => (
        <Group key={`projectile-hit-${hit.wallId}-${index}`}>
          <Circle
            x={hit.point.x}
            y={hit.point.y}
            radius={6}
            fill="#f97316"
            stroke="#fff7ed"
            strokeWidth={1.5}
          />
          {debug ? (
            <Text
              x={hit.point.x + 8}
              y={hit.point.y - 8}
              text={hit.wallId}
              fontSize={10}
              fill="#fff7ed"
              listening={false}
            />
          ) : null}
        </Group>
      ))}
    </Group>
  );
}

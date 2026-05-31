import { Arrow, Circle, Group, Line } from 'react-konva';
import type { MatchupSide } from '@/shared/types/matchup';
import { tacticalSideMapTokenColors } from '@/shared/constants/tacticalSideColors';

export type MapDirectMovementProps = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  side: MatchupSide;
  preview?: boolean;
  onCmdClick?: (anchor: { clientX: number; clientY: number }) => void;
};

export function MapDirectMovement({
  startX,
  startY,
  endX,
  endY,
  side,
  preview = false,
  onCmdClick,
}: MapDirectMovementProps) {
  const { accent } = tacticalSideMapTokenColors(side);
  const opacity = preview ? 0.55 : 0.92;
  const points = [startX, startY, endX, endY];

  const onPathClick = (e: {
    cancelBubble: boolean;
    evt: PointerEvent | MouseEvent | TouchEvent;
  }) => {
    if (preview || !onCmdClick) return;
    const pe = e.evt;
    const mod = 'metaKey' in pe ? pe.metaKey || pe.ctrlKey : false;
    if (!mod) return;
    e.cancelBubble = true;
    const clientX = 'clientX' in pe ? pe.clientX : 0;
    const clientY = 'clientY' in pe ? pe.clientY : 0;
    onCmdClick({ clientX, clientY });
  };

  return (
    <Group listening={!preview && !!onCmdClick}>
      <Line
        points={points}
        stroke={accent}
        strokeWidth={9}
        opacity={opacity * 0.16}
        lineCap="round"
        listening={false}
        shadowColor={accent}
        shadowBlur={18}
        shadowOpacity={0.45}
      />
      <Arrow
        points={points}
        stroke={accent}
        fill={accent}
        strokeWidth={3}
        opacity={opacity}
        pointerLength={12}
        pointerWidth={12}
        lineCap="round"
        lineJoin="round"
        dash={preview ? [7, 6] : undefined}
        listening={false}
      />
      <Circle
        x={endX}
        y={endY}
        radius={10}
        stroke={accent}
        strokeWidth={2}
        opacity={opacity}
        fill="rgba(15, 23, 42, 0.18)"
        listening={false}
      />
      {!preview && onCmdClick ? (
        <Line
          points={points}
          stroke="rgba(0,0,0,0.01)"
          strokeWidth={24}
          hitStrokeWidth={24}
          onClick={onPathClick}
        />
      ) : null}
    </Group>
  );
}

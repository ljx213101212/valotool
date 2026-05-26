import { Group, Line } from 'react-konva';
import { computeFixedDualLineSegments } from '@/shared/utils/lineSmokeGeometry';

export type MapFixedDualLineSmokeProps = {
  cx: number;
  cy: number;
  facing: number;
  length: number;
  spacing: number;
  strokeWidth: number;
  color: string;
  preview?: boolean;
  onCmdClick?: (anchor: { clientX: number; clientY: number }) => void;
};

function laneStroke(color: string, width: number, opacity: number) {
  return {
    stroke: color,
    strokeWidth: width,
    opacity,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    shadowColor: color,
    shadowBlur: 14,
    shadowOpacity: 0.65,
  };
}

export function MapFixedDualLineSmoke({
  cx,
  cy,
  facing,
  length,
  spacing,
  strokeWidth,
  color,
  preview = false,
  onCmdClick,
}: MapFixedDualLineSmokeProps) {
  const opacity = preview ? 0.55 : 0.92;
  const { lane1, lane2 } = computeFixedDualLineSegments(cx, cy, facing, length, spacing);
  const stroke = laneStroke(color, strokeWidth, opacity);
  const glow = laneStroke(color, strokeWidth + 6, opacity * 0.35);

  const onLaneClick = (e: {
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

  const hitWidth = Math.max(strokeWidth + 16, 22);

  return (
    <Group listening={!preview && !!onCmdClick}>
      <Line points={lane1} {...glow} listening={false} />
      <Line points={lane2} {...glow} listening={false} />
      <Line points={lane1} {...stroke} listening={false} />
      <Line points={lane2} {...stroke} listening={false} />
      {!preview && onCmdClick ? (
        <>
          <Line
            points={lane1}
            stroke="rgba(0,0,0,0.01)"
            strokeWidth={hitWidth}
            hitStrokeWidth={hitWidth}
            onClick={onLaneClick}
          />
          <Line
            points={lane2}
            stroke="rgba(0,0,0,0.01)"
            strokeWidth={hitWidth}
            hitStrokeWidth={hitWidth}
            onClick={onLaneClick}
          />
        </>
      ) : null}
    </Group>
  );
}

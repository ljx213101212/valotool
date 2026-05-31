import { Group, Line } from 'react-konva';
import { computeWallSegment } from '@/shared/utils/lineSmokeGeometry';

export type MapFixedSingleLineSmokeProps = {
  cx: number;
  cy: number;
  facing: number;
  length: number;
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
    shadowBlur: 12,
    shadowOpacity: 0.5,
  };
}

export function MapFixedSingleLineSmoke({
  cx,
  cy,
  facing,
  length,
  strokeWidth,
  color,
  preview = false,
  onCmdClick,
}: MapFixedSingleLineSmokeProps) {
  const opacity = preview ? 0.55 : 0.92;
  const segment = computeWallSegment(cx, cy, facing, length);
  const stroke = laneStroke(color, strokeWidth, opacity);
  const glow = laneStroke(color, strokeWidth + 6, opacity * 0.35);
  const hitWidth = Math.max(strokeWidth + 16, 22);

  const onLineClick = (e: {
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
      <Line points={segment} {...glow} listening={false} />
      <Line points={segment} {...stroke} listening={false} />
      {!preview && onCmdClick ? (
        <Line
          points={segment}
          stroke="rgba(0,0,0,0.01)"
          strokeWidth={hitWidth}
          hitStrokeWidth={hitWidth}
          onClick={onLineClick}
        />
      ) : null}
    </Group>
  );
}

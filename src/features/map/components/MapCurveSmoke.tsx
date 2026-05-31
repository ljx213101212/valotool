import { Group, Line } from 'react-konva';

export type MapCurveSmokeProps = {
  points: number[];
  strokeWidth: number;
  color: string;
  preview?: boolean;
  onCmdClick?: (anchor: { clientX: number; clientY: number }) => void;
};

function curveStroke(color: string, width: number, opacity: number) {
  return {
    stroke: color,
    strokeWidth: width,
    opacity,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    tension: 0.4,
    shadowColor: color,
    shadowBlur: 12,
    shadowOpacity: 0.5,
  };
}

export function MapCurveSmoke({
  points,
  strokeWidth,
  color,
  preview = false,
  onCmdClick,
}: MapCurveSmokeProps) {
  const minLen = preview ? 2 : 4;
  if (points.length < minLen) return null;
  const opacity = preview ? 0.55 : 0.92;
  const stroke = curveStroke(color, strokeWidth, opacity);
  const glow = curveStroke(color, strokeWidth + 6, opacity * 0.35);
  const hitWidth = Math.max(strokeWidth + 16, 22);

  const onCurveClick = (e: {
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
      <Line points={points} {...glow} listening={false} />
      <Line points={points} {...stroke} listening={false} />
      {!preview && onCmdClick ? (
        <Line
          points={points}
          stroke="rgba(0,0,0,0.01)"
          strokeWidth={hitWidth}
          hitStrokeWidth={hitWidth}
          onClick={onCurveClick}
        />
      ) : null}
    </Group>
  );
}

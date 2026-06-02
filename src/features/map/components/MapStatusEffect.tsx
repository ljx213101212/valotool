import { Circle, Group, Line } from 'react-konva';
import type { AbilityStatusEffectType } from '@/features/abilities/config';

const EFFECT_COLORS: Record<AbilityStatusEffectType, string> = {
  flash: '#fff7b8',
  blind: '#fef3c7',
  nearsight: '#b78cff',
  concuss: '#8bb8ff',
};

export type MapStatusEffectProps = {
  kind: AbilityStatusEffectType;
  sourceX: number;
  sourceY: number;
  radius?: number;
  facing?: number;
  length?: number;
  width?: number;
  preview?: boolean;
  onCmdClick?: (anchor: { clientX: number; clientY: number }) => void;
};

export function MapStatusEffect({
  kind,
  sourceX,
  sourceY,
  radius = 48,
  facing = 0,
  length,
  width = 28,
  preview = false,
  onCmdClick,
}: MapStatusEffectProps) {
  const color = EFFECT_COLORS[kind];
  const opacity = preview ? 0.42 : 0.74;
  const isLine = length != null && length > 0;
  const endX = sourceX + Math.cos(facing) * (length ?? 0);
  const endY = sourceY + Math.sin(facing) * (length ?? 0);

  const onEffectClick = (e: {
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
      {isLine ? (
        <>
          <Line
            points={[sourceX, sourceY, endX, endY]}
            stroke={color}
            strokeWidth={width}
            opacity={opacity * 0.22}
            lineCap="round"
            shadowColor={color}
            shadowBlur={18}
            shadowOpacity={0.45}
            listening={false}
          />
          <Line
            points={[sourceX, sourceY, endX, endY]}
            stroke={color}
            strokeWidth={3}
            opacity={opacity}
            dash={preview ? [8, 6] : undefined}
            lineCap="round"
            listening={false}
          />
          {!preview && onCmdClick ? (
            <Line
              points={[sourceX, sourceY, endX, endY]}
              stroke="rgba(0,0,0,0.01)"
              strokeWidth={Math.max(width, 24)}
              hitStrokeWidth={Math.max(width, 24)}
              onClick={onEffectClick}
            />
          ) : null}
        </>
      ) : (
        <>
          <Circle
            x={sourceX}
            y={sourceY}
            radius={radius}
            fill={color}
            opacity={opacity * 0.14}
            stroke={color}
            strokeWidth={2}
            dash={preview ? [7, 6] : undefined}
            shadowColor={color}
            shadowBlur={16}
            shadowOpacity={0.45}
            listening={false}
          />
          <Circle
            x={sourceX}
            y={sourceY}
            radius={8}
            fill={color}
            opacity={opacity}
            listening={false}
          />
          {!preview && onCmdClick ? (
            <Circle
              x={sourceX}
              y={sourceY}
              radius={radius}
              fill="rgba(0,0,0,0.01)"
              onClick={onEffectClick}
            />
          ) : null}
        </>
      )}
    </Group>
  );
}

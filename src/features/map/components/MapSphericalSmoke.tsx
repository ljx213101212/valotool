import { Circle, Group, Ring } from 'react-konva';
import type { SphericalSmokeVariant } from '@/features/abilities/config';
import type { MatchupSide } from '@/shared/types/matchup';
import { tacticalSideMapTokenColors } from '@/shared/constants/tacticalSideColors';

const SMOKE_FILL = '#616462';

export type MapSphericalSmokeProps = {
  x: number;
  y: number;
  radius: number;
  side: MatchupSide;
  variant?: SphericalSmokeVariant;
  /** 放置预览：半透明 */
  preview?: boolean;
  /** ⌘/Ctrl+点击烟雾时打开技能操作 Popover */
  onCmdClick?: (anchor: { clientX: number; clientY: number }) => void;
};

export function MapSphericalSmoke({
  x,
  y,
  radius,
  side,
  variant = 'default',
  preview = false,
  onCmdClick,
}: MapSphericalSmokeProps) {
  const { accent } = tacticalSideMapTokenColors(side);
  const opacity = preview ? 0.55 : 1;
  const isCage = variant === 'cage';

  const onSmokeClick = (e: {
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
    <Group x={x} y={y} listening={!preview && !!onCmdClick}>
      <Circle
        radius={radius + 10}
        fill={accent}
        opacity={opacity * 0.12}
        listening={false}
      />
      <Circle
        radius={radius + 5}
        stroke={accent}
        strokeWidth={2}
        opacity={opacity * 0.45}
        shadowColor={accent}
        shadowBlur={16}
        shadowOpacity={0.55}
        fillEnabled={false}
        listening={false}
      />
      {isCage ? (
        <>
          <Circle
            radius={radius * 0.72}
            fill={SMOKE_FILL}
            opacity={opacity * 0.35}
            listening={false}
          />
          <Ring
            innerRadius={radius * 0.55}
            outerRadius={radius}
            stroke={accent}
            strokeWidth={2}
            dash={[6, 5]}
            opacity={opacity * 0.85}
            fillEnabled={false}
            listening={false}
          />
        </>
      ) : (
        <Circle radius={radius} fill={SMOKE_FILL} opacity={opacity} listening={false} />
      )}
      {!preview && onCmdClick ? (
        <Circle
          radius={radius}
          fill="rgba(0,0,0,0.01)"
          hitStrokeWidth={12}
          onClick={onSmokeClick}
        />
      ) : null}
    </Group>
  );
}

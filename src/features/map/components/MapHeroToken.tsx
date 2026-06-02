import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Circle, Group, Image, Line } from 'react-konva';
import { tacticalSideMapTokenColors } from '@/shared/constants/tacticalSideColors';
import { getAgentPortraitUrl } from '@/shared/data/agentPortraitUrl';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import {
  resolveStatusOverlayOpacity,
  strongestActiveStatusForTarget,
} from '@/shared/utils/abilityStatusEffects';

const BODY_R = 24;
/** 选中时头像外侧白色描边圈半径（描边居中于圆上） */
const SELECT_RING_R = BODY_R + 4;
const SELECT_RING_STROKE = 3;
const ORBIT = BODY_R + 10;
const HANDLE_R = 5;
/** 顶点距圆心距离（须 > BODY_R） */
const VISION_LEN = 18;
const VISION_ARC_STEPS = 28;
/** 淘汰态仅显示 X 时的臂长 */
const X_ARM = BODY_R * 0.72;

/**
 * 圆外顶点 + 两条切线 + 圆上两切点间的弧，围成封闭区域（不进入圆内）。
 * 顶点在 facing 方向、距圆心 d = BODY_R + VISION_LEN；切点极角为 facing ± arccos(r/d)。
 */
function visionTangentFanPoints(facing: number): number[] {
  const r = BODY_R;
  const d = r + VISION_LEN;
  const beta = Math.acos(Math.min(1, r / d));
  const px = Math.cos(facing) * d;
  const py = Math.sin(facing) * d;
  const phi0 = facing - beta;
  const phi1 = facing + beta;
  const pts: number[] = [];
  for (let i = 0; i <= VISION_ARC_STEPS; i++) {
    const t = i / VISION_ARC_STEPS;
    const ang = phi0 + t * (phi1 - phi0);
    pts.push(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  pts.push(px, py);
  return pts;
}

/** Narrow ref typing without depending on `konva` as a direct import. */
type TokenGroupRef = {
  getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null;
  getAbsoluteTransform: () => {
    copy: () => { invert: () => { point: (p: { x: number; y: number }) => { x: number; y: number } } };
  };
};

export function MapHeroToken({
  placement,
  setMapTransformLocked,
  isSelected,
  onSelect,
  onAbilityPopoverRequest,
}: {
  placement: MapAgentPlacement;
  setMapTransformLocked?: (locked: boolean) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  /** ⌘/Ctrl+点击且未淘汰时打开技能 Popover */
  onAbilityPopoverRequest?: (anchor: { clientX: number; clientY: number }) => void;
}) {
  const patchMapPlacement = useMatchupStore((s) => s.patchMapPlacement);
  const abilityPlacements = useMatchupStore((s) => s.abilityPlacements);
  const timelineCurrentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragFacing, setDragFacing] = useState(false);
  const [dragBody, setDragBody] = useState(false);
  const bodyDragMovedRef = useRef(false);
  const [bodyDraft, setBodyDraft] = useState<{ x: number; y: number } | null>(null);
  const [liveFacing, setLiveFacing] = useState(placement.facing);
  const groupRef = useRef<TokenGroupRef | null>(null);
  const facingRef = useRef(placement.facing);

  const url = getAgentPortraitUrl(placement.agentId);

  useEffect(() => {
    if (!url) {
      const timer = window.setTimeout(() => setImg(null), 0);
      return () => window.clearTimeout(timer);
    }
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.src = url;
    el.onload = () => setImg(el);
    el.onerror = () => setImg(null);
    return () => {
      el.onload = null;
      el.onerror = null;
    };
  }, [url]);

  useEffect(() => {
    if (dragFacing) return;
    const timer = window.setTimeout(() => {
      setLiveFacing(placement.facing);
      facingRef.current = placement.facing;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [placement.facing, dragFacing]);

  const eliminated = !!placement.eliminated;
  const { accent, wedgeFill } = tacticalSideMapTokenColors(placement.side);
  const activeStatus = strongestActiveStatusForTarget(
    abilityPlacements.flatMap((ability) => ability.affectedStatuses ?? []),
    placement.id,
    timelineCurrentTime,
  );
  const statusOpacity = activeStatus
    ? resolveStatusOverlayOpacity({ ...activeStatus, playheadSec: timelineCurrentTime })
    : 0;
  const statusFill =
    activeStatus?.effect === 'concuss'
      ? '#8bb8ff'
      : activeStatus?.effect === 'nearsight'
        ? '#b78cff'
        : '#fff7b8';

  const showHandle = (hovered || dragFacing) && !eliminated;
  const facing = dragFacing ? liveFacing : placement.facing;

  const lockMapTransform = () => {
    if (!setMapTransformLocked) return;
    flushSync(() => setMapTransformLocked(true));
  };

  const onTokenPointerDown = (e: { evt: PointerEvent | MouseEvent | TouchEvent }) => {
    const pe = e.evt;
    if ('button' in pe && typeof pe.button === 'number' && pe.button !== 0) return;
    lockMapTransform();
  };

  const beginFacingDrag = () => {
    lockMapTransform();
    facingRef.current = placement.facing;
    setLiveFacing(placement.facing);
    setDragFacing(true);
  };

  useEffect(() => {
    if (!dragFacing) return;
    const onMove = () => {
      const g = groupRef.current;
      const stage = g?.getStage();
      if (!g || !stage) return;
      const pt = stage.getPointerPosition();
      if (!pt) return;
      const local = g.getAbsoluteTransform().copy().invert().point(pt);
      const ang = Math.atan2(local.y, local.x);
      facingRef.current = ang;
      setLiveFacing(ang);
    };
    const onUp = () => {
      patchMapPlacement(placement.id, { facing: facingRef.current });
      setDragFacing(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
    };
  }, [dragFacing, patchMapPlacement, placement.id]);

  const gx = dragBody && bodyDraft ? bodyDraft.x : placement.x;
  const gy = dragBody && bodyDraft ? bodyDraft.y : placement.y;

  const setStageCursor = (target: { getStage?: () => { container: () => HTMLElement } | null } | null, cursor: string) => {
    const stage = target?.getStage?.() ?? null;
    const el = stage?.container();
    if (el) el.style.cursor = cursor;
  };

  const onSelectClick = useCallback(
    (e: { cancelBubble: boolean; evt: PointerEvent | MouseEvent | TouchEvent }) => {
      if (bodyDragMovedRef.current) return;
      e.cancelBubble = true;
      const pe = e.evt;
      const mod =
        'metaKey' in pe ? pe.metaKey || pe.ctrlKey : false;
      if (mod && !eliminated && onAbilityPopoverRequest) {
        const clientX = 'clientX' in pe ? pe.clientX : 0;
        const clientY = 'clientY' in pe ? pe.clientY : 0;
        onAbilityPopoverRequest({ clientX, clientY });
        return;
      }
      onSelect?.();
    },
    [eliminated, onAbilityPopoverRequest, onSelect]
  );

  if (eliminated) {
    return (
      <Group
        ref={(node) => {
          groupRef.current = node as unknown as TokenGroupRef | null;
        }}
        x={placement.x}
        y={placement.y}
        onMouseLeave={(e) => {
          setStageCursor(e.target, '');
        }}
      >
        <Line
          points={[-X_ARM, -X_ARM, X_ARM, X_ARM]}
          stroke={accent}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[X_ARM, -X_ARM, -X_ARM, X_ARM]}
          stroke={accent}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Circle
          radius={BODY_R + 6}
          fill="rgba(0,0,0,0.001)"
          listening
          hitStrokeWidth={16}
          perfectDrawEnabled={false}
          onClick={onSelectClick}
          onMouseEnter={(e) => setStageCursor(e.target, 'pointer')}
          onMouseLeave={(e) => setStageCursor(e.target, '')}
        />
      </Group>
    );
  }

  return (
    <Group
      ref={(node) => {
        groupRef.current = node as unknown as TokenGroupRef | null;
      }}
      x={gx}
      y={gy}
      draggable
      onDragStart={(e) => {
        lockMapTransform();
        e.evt.stopPropagation();
        bodyDragMovedRef.current = false;
        setDragBody(true);
        setBodyDraft({ x: placement.x, y: placement.y });
      }}
      onDragMove={(e) => {
        e.evt.stopPropagation();
        bodyDragMovedRef.current = true;
        setBodyDraft({ x: e.target.x(), y: e.target.y() });
      }}
      onDragEnd={(e) => {
        e.evt.stopPropagation();
        patchMapPlacement(placement.id, { x: e.target.x(), y: e.target.y() });
        setDragBody(false);
        setBodyDraft(null);
        window.setTimeout(() => {
          bodyDragMovedRef.current = false;
        }, 0);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseDown={onTokenPointerDown}
      onTouchStart={onTokenPointerDown}
      onMouseLeave={(e) => {
        if (!dragFacing && !dragBody) setHovered(false);
        setStageCursor(e.target, '');
      }}
    >
      <Line
        points={visionTangentFanPoints(facing)}
        closed
        fill={wedgeFill}
        stroke={accent}
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />

      {isSelected ? (
        <Circle
          radius={SELECT_RING_R}
          stroke="#ffffff"
          strokeWidth={SELECT_RING_STROKE}
          fillEnabled={false}
          listening
          hitStrokeWidth={18}
          perfectDrawEnabled={false}
          onClick={onSelectClick}
          onMouseEnter={(e) => setStageCursor(e.target, 'pointer')}
          onMouseLeave={(e) => setStageCursor(e.target, '')}
        />
      ) : null}

      <Group
        listening={false}
        clipFunc={(ctx) => {
          ctx.beginPath();
          ctx.arc(0, 0, BODY_R, 0, Math.PI * 2);
          ctx.closePath();
        }}
      >
        {img ? (
          <Image image={img} x={-BODY_R} y={-BODY_R} width={BODY_R * 2} height={BODY_R * 2} listening={false} />
        ) : (
          <Circle radius={BODY_R} fill="rgba(30, 41, 59, 0.95)" listening={false} />
        )}
        {statusOpacity > 0 ? (
          <Circle
            radius={BODY_R}
            fill={statusFill}
            opacity={Math.min(0.82, statusOpacity)}
            listening={false}
          />
        ) : null}
      </Group>

      {statusOpacity > 0 ? (
        <Circle
          radius={BODY_R + 3}
          stroke={statusFill}
          strokeWidth={activeStatus?.effect === 'concuss' ? 2 : 3}
          opacity={Math.min(0.72, statusOpacity)}
          dash={activeStatus?.effect === 'concuss' ? [5, 4] : undefined}
          shadowColor={statusFill}
          shadowBlur={activeStatus?.effect === 'concuss' ? 10 : 16}
          shadowOpacity={0.45}
          listening={false}
        />
      ) : null}

      <Circle
        radius={BODY_R}
        stroke={accent}
        strokeWidth={2}
        fill="rgba(0,0,0,0.01)"
        listening
        hitStrokeWidth={12}
        onClick={onSelectClick}
        onMouseEnter={(e) => setStageCursor(e.target, 'pointer')}
        onMouseLeave={(e) => setStageCursor(e.target, '')}
      />

      <Circle
        x={Math.cos(facing) * ORBIT}
        y={Math.sin(facing) * ORBIT}
        radius={HANDLE_R}
        fill={accent}
        stroke="rgba(15, 23, 42, 0.9)"
        strokeWidth={1}
        opacity={showHandle ? 1 : 0}
        listening={showHandle}
        hitStrokeWidth={showHandle ? 14 : 0}
        onMouseEnter={(e) => setStageCursor(e.target, 'grab')}
        onMouseLeave={(e) => setStageCursor(e.target, '')}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          beginFacingDrag();
        }}
        onTouchStart={(e) => {
          e.cancelBubble = true;
          beginFacingDrag();
        }}
      />
    </Group>
  );
}

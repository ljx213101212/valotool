import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Circle, Group, Image } from 'react-konva';
import {
  agentCatalogIdToAbilitySlug,
  ABILITIES_BY_AGENT,
  isReleasePlacementSmokeAbility,
} from '@/features/abilities';
import { getAbilityDisplayIconUrl } from '@/features/abilities/abilityDisplayIconUrls';
import { tacticalSideMapTokenColors } from '@/shared/constants/tacticalSideColors';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import type { AbilityPlacement } from '@/shared/types/ability';

const MARKER_R = 14;

function abilityIconPath(placement: AbilityPlacement): string | undefined {
  const slug = agentCatalogIdToAbilitySlug(placement.agentId);
  const rows = ABILITIES_BY_AGENT[slug];
  const entry = rows.find((r) => r.name === placement.abilitySlot);
  return entry ? getAbilityDisplayIconUrl(entry.displayIcon) : undefined;
}

export function MapAbilityToken({
  placement,
  setMapTransformLocked,
  isSelected,
  onSelect,
}: {
  placement: AbilityPlacement;
  setMapTransformLocked?: (locked: boolean) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const owner = useMatchupStore((s) =>
    s.mapPlacements.find((p) => p.id === placement.ownerPlacementId)
  );
  const patchAbilityPlacement = useMatchupStore((s) => s.patchAbilityPlacement);
  const openAbilityInstancePopover = useMatchupStore((s) => s.openAbilityInstancePopover);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [dragBody, setDragBody] = useState(false);
  const [bodyDraft, setBodyDraft] = useState<{ x: number; y: number } | null>(null);
  const bodyDragMovedRef = useRef(false);
  const iconPath = abilityIconPath(placement);
  const side = owner?.side ?? 'attack';
  const { accent } = tacticalSideMapTokenColors(side);
  const isInitial = placement.state === 'initial';
  const hideToken =
    isReleasePlacementSmokeAbility(placement.agentId, placement.abilitySlot) &&
    (placement.state === 'active' || placement.state === 'expired');

  useEffect(() => {
    if (!iconPath) {
      setImg(null);
      return;
    }
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.src = iconPath;
    el.onload = () => setImg(el);
    el.onerror = () => setImg(null);
    return () => {
      el.onload = null;
      el.onerror = null;
    };
  }, [iconPath]);

  const lockMapTransform = () => {
    if (!setMapTransformLocked) return;
    flushSync(() => setMapTransformLocked(true));
  };

  const onTokenPointerDown = (e: { evt: PointerEvent | MouseEvent | TouchEvent }) => {
    const pe = e.evt;
    if ('button' in pe && typeof pe.button === 'number' && pe.button !== 0) return;
    lockMapTransform();
  };

  const setStageCursor = (
    target: { getStage?: () => { container: () => HTMLElement } | null } | null,
    cursor: string
  ) => {
    const stage = target?.getStage?.() ?? null;
    const el = stage?.container();
    if (el) el.style.cursor = cursor;
  };

  const onTokenClick = useCallback(
    (e: { cancelBubble: boolean; evt: PointerEvent | MouseEvent | TouchEvent }) => {
      if (bodyDragMovedRef.current) return;
      e.cancelBubble = true;
      const pe = e.evt;
      const mod = 'metaKey' in pe ? pe.metaKey || pe.ctrlKey : false;
      if (mod && isInitial) {
        const clientX = 'clientX' in pe ? pe.clientX : 0;
        const clientY = 'clientY' in pe ? pe.clientY : 0;
        openAbilityInstancePopover(placement.id, { clientX, clientY });
        return;
      }
      onSelect?.();
    },
    [isInitial, onSelect, openAbilityInstancePopover, placement.id]
  );

  const gx = dragBody && bodyDraft ? bodyDraft.x : placement.x;
  const gy = dragBody && bodyDraft ? bodyDraft.y : placement.y;

  if (hideToken) return null;

  return (
    <Group
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
        patchAbilityPlacement(placement.id, { x: e.target.x(), y: e.target.y() });
        setDragBody(false);
        setBodyDraft(null);
        window.setTimeout(() => {
          bodyDragMovedRef.current = false;
        }, 0);
      }}
      onMouseDown={onTokenPointerDown}
      onTouchStart={onTokenPointerDown}
    >
      {isSelected ? (
        <Circle
          radius={MARKER_R + 4}
          stroke="#ffffff"
          strokeWidth={2}
          listening={false}
        />
      ) : null}
      {isInitial ? (
        <Circle
          radius={MARKER_R + 3}
          stroke={accent}
          strokeWidth={1.5}
          dash={[4, 3]}
          opacity={0.75}
          listening={false}
        />
      ) : null}
      <Circle
        radius={MARKER_R}
        fill="rgba(15, 23, 42, 0.88)"
        stroke={accent}
        strokeWidth={2}
        listening={false}
      />
      {img ? (
        <Image
          image={img}
          x={-MARKER_R + 2}
          y={-MARKER_R + 2}
          width={(MARKER_R - 2) * 2}
          height={(MARKER_R - 2) * 2}
          listening={false}
        />
      ) : null}
      <Circle
        radius={MARKER_R}
        fill="rgba(0,0,0,0.01)"
        listening
        hitStrokeWidth={12}
        onClick={onTokenClick}
        onMouseEnter={(e) => setStageCursor(e.target, 'pointer')}
        onMouseLeave={(e) => setStageCursor(e.target, '')}
      />
    </Group>
  );
}

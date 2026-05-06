import { useEffect, useState } from 'react';
import { Circle, Group, Image, Line } from 'react-konva';
import { getAgentPortraitUrl } from '@/data/agentPortraitUrl';
import { useMatchupStore } from '@/store/useMatchupStore';
import type { MapAgentPlacement } from '@/types/matchup';

const BODY_R = 24;
const ORBIT = BODY_R + 10;
const HANDLE_R = 5;
const VISION_LEN = 18;
const VISION_HALF = 0.18;

function visionWedgePoints(facing: number): number[] {
  const tipX = Math.cos(facing) * (BODY_R + VISION_LEN);
  const tipY = Math.sin(facing) * (BODY_R + VISION_LEN);
  const x0 = Math.cos(facing - VISION_HALF) * BODY_R;
  const y0 = Math.sin(facing - VISION_HALF) * BODY_R;
  const x1 = Math.cos(facing + VISION_HALF) * BODY_R;
  const y1 = Math.sin(facing + VISION_HALF) * BODY_R;
  return [x0, y0, tipX, tipY, x1, y1];
}

export function MapHeroToken({ placement }: { placement: MapAgentPlacement }) {
  const patchMapPlacement = useMatchupStore((s) => s.patchMapPlacement);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragFacing, setDragFacing] = useState(false);

  const url = getAgentPortraitUrl(placement.agentId);

  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
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

  const attack = placement.side === 'attack';
  const accent = attack ? '#38bdf8' : '#fbbf24';
  const wedgeFill = attack ? 'rgba(56, 189, 248, 0.38)' : 'rgba(251, 191, 36, 0.38)';

  const syncFacingFromHandle = (e: { target: { position: () => { x: number; y: number } } }) => {
    const pos = e.target.position();
    const ang = Math.atan2(pos.y, pos.x);
    patchMapPlacement(placement.id, { facing: ang });
  };

  const showHandle = hovered || dragFacing;

  return (
    <Group
      x={placement.x}
      y={placement.y}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (!dragFacing) setHovered(false);
      }}
    >
      <Line
        points={visionWedgePoints(placement.facing)}
        closed
        fill={wedgeFill}
        stroke={accent}
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />

      <Group
        clipFunc={(ctx) => {
          ctx.beginPath();
          ctx.arc(0, 0, BODY_R, 0, Math.PI * 2);
          ctx.closePath();
        }}
      >
        {img ? (
          <Image image={img} x={-BODY_R} y={-BODY_R} width={BODY_R * 2} height={BODY_R * 2} />
        ) : (
          <Circle radius={BODY_R} fill="rgba(30, 41, 59, 0.95)" />
        )}
      </Group>

      <Circle
        radius={BODY_R}
        stroke={accent}
        strokeWidth={2}
        fill="rgba(0,0,0,0.01)"
        listening
      />

      <Circle
        x={Math.cos(placement.facing) * ORBIT}
        y={Math.sin(placement.facing) * ORBIT}
        radius={HANDLE_R}
        fill={accent}
        stroke="rgba(15, 23, 42, 0.9)"
        strokeWidth={1}
        opacity={showHandle ? 1 : 0}
        listening={showHandle}
        draggable={showHandle}
        dragBoundFunc={(pos) => {
          const ang = Math.atan2(pos.y, pos.x);
          return { x: Math.cos(ang) * ORBIT, y: Math.sin(ang) * ORBIT };
        }}
        onDragStart={(e) => {
          e.evt.stopPropagation();
          setDragFacing(true);
        }}
        onDragMove={(e) => {
          e.evt.stopPropagation();
          syncFacingFromHandle(e);
        }}
        onDragEnd={(e) => {
          e.evt.stopPropagation();
          syncFacingFromHandle(e);
          setDragFacing(false);
        }}
        hitStrokeWidth={showHandle ? 14 : 0}
      />
    </Group>
  );
}

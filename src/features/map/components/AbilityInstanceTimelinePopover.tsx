import { type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { getAbilityDisplayName } from '@/features/abilities/abilityDisplayName';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import { formatTimelineQuantized } from '@/shared/utils/timelineQuantize';
import './AbilityInstanceActionPopover.less';

const POPOVER_OFFSET_X = 12;
const POPOVER_OFFSET_Y = 8;

export type AbilityInstanceTimelinePopoverProps = {
  placement: AbilityPlacement;
  anchor: AbilityPopoverAnchor;
  popoverRef: RefObject<HTMLDivElement | null>;
};

function placementStatusLabel(placement: AbilityPlacement): string {
  if (placement.state === 'expired') return '已结束';
  if (placement.directMovement) return '瞬发位移';
  return '释放期';
}

/** 释放期 / 已施放：跳转时间轴上的施放与结束时刻 */
export function AbilityInstanceTimelinePopover({
  placement,
  anchor,
  popoverRef,
}: AbilityInstanceTimelinePopoverProps) {
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const pausePlayback = useTimelinePlaybackStore((s) => s.pausePlayback);
  const seek = useTimelinePlaybackStore((s) => s.seek);
  const closeAbilityInstancePopover = useMatchupStore((s) => s.closeAbilityInstancePopover);
  const removeAbilityPlacement = useMatchupStore((s) => s.removeAbilityPlacement);

  const hasDeployTime = placement.activeAt != null;
  const hasEndTime = placement.expiresAt != null;

  const left = anchor.clientX + POPOVER_OFFSET_X;
  const top = anchor.clientY + POPOVER_OFFSET_Y;
  const name = getAbilityDisplayName(placement.agentId, placement.abilitySlot);

  const seekToTime = (time: number) => {
    pausePlayback();
    seek(time);
    closeAbilityInstancePopover();
  };

  const onSeekDeploy = () => {
    if (placement.activeAt == null) return;
    seekToTime(placement.activeAt);
  };

  const onSeekEnd = () => {
    if (placement.expiresAt == null) return;
    seekToTime(placement.expiresAt);
  };

  const onDelete = () => {
    removeAbilityPlacement(placement.id);
    closeAbilityInstancePopover();
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="ability-instance-popover"
      style={{ left, top }}
      role="menu"
      aria-label={`技能操作：${name}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="ability-instance-popover__title">
        {name} · {placementStatusLabel(placement)}
      </p>
      <button
        type="button"
        className="ability-instance-popover__action"
        disabled={!hasDeployTime}
        title={
          hasDeployTime
            ? `跳转到施放时刻 ${formatTimelineQuantized(placement.activeAt!, maxTime)}`
            : '无施放时间'
        }
        onClick={onSeekDeploy}
      >
        施放时间
      </button>
      <button
        type="button"
        className="ability-instance-popover__action"
        disabled={!hasEndTime}
        title={
          hasEndTime
            ? `跳转到结束时刻 ${formatTimelineQuantized(placement.expiresAt!, maxTime)}`
            : '无结束时间'
        }
        onClick={onSeekEnd}
      >
        结束时间
      </button>
      <button
        type="button"
        className="ability-instance-popover__action ability-instance-popover__action--danger"
        onClick={onDelete}
        title="删除地图上的该技能实例"
      >
        删除
      </button>
    </div>,
    document.body
  );
}

import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { syncAbilityPlacementsForPlayhead } from '@/shared/utils/timelineAbilityMutations';

/** 播放头移动后，按 activeAt/expiresAt 同步技能实例状态（关键帧之间 scrub） */
export function syncLiveAbilityPlacementsForPlayhead(playheadSec: number): void {
  const { abilityPlacements } = useMatchupStore.getState();
  const next = syncAbilityPlacementsForPlayhead(abilityPlacements, playheadSec);
  const changed = next.some((p, i) => p.state !== abilityPlacements[i]?.state);
  if (!changed) return;
  useMatchupStore.setState({ abilityPlacements: next });
}

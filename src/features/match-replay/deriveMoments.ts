import type { MatchDetails, ReplayMoment } from './types';

/**
 * 把一回合拆成有序的「关键时刻」序列：每次击杀一帧 + 下包/拆包各一帧。
 * 每帧都带该瞬间的全员存活位置快照（Riot 仅在这些事件点记录坐标，无逐帧轨迹）。
 */
export function deriveRoundMoments(match: MatchDetails, roundNum: number): ReplayMoment[] {
  const moments: ReplayMoment[] = [];

  const kills = (match.kills ?? [])
    .filter((k) => k.round === roundNum)
    .sort((a, b) => a.roundTime - b.roundTime);

  for (const kill of kills) {
    moments.push({
      type: 'kill',
      roundTime: kill.roundTime,
      locations: kill.playerLocations,
      kill,
      actor: kill.killer,
    });
  }

  const round = match.roundResults?.find((r) => r.roundNum === roundNum);
  if (round) {
    if (round.plantPlayerLocations && round.plantPlayerLocations.length > 0) {
      moments.push({
        type: 'plant',
        roundTime: round.plantRoundTime ?? 0,
        locations: round.plantPlayerLocations,
        spikeLocation: round.plantLocation,
        actor: round.bombPlanter,
      });
    }
    if (round.defusePlayerLocations && round.defusePlayerLocations.length > 0) {
      moments.push({
        type: 'defuse',
        roundTime: round.defuseRoundTime ?? 0,
        locations: round.defusePlayerLocations,
        spikeLocation: round.defuseLocation,
      });
    }
  }

  return moments.sort((a, b) => a.roundTime - b.roundTime);
}

/** 回合内毫秒 → mm:ss 展示。 */
export function formatRoundTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

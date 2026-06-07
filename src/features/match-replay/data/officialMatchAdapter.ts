import type {
  Kill,
  Location,
  MatchDetails,
  MatchPlayer,
  PlayerLocation,
  RoundResult,
} from '../types';

// 把官方 VAL-MATCH-V1 响应规整为项目领域模型 MatchDetails。
//
// 官方与本地（techchrism）schema 的系统性差异：
//  - 玩家 ID：官方 `puuid`            ←→ 本地 `subject`
//  - 击杀时间：官方 `timeSinceGameStartMillis`/`timeSinceRoundStartMillis`
//                                     ←→ 本地 `gameTime`/`roundTime`
//  - 顶层 `kills`：官方【没有】，击杀只在 `roundResults[].playerStats[].kills`
//                  本适配器从回合数据重建带 `round` 的顶层 kills（deriveMoments 依赖）。
//  - 其余（teamId/characterId/viewRadians/location/装置点）两者一致。
//
// 本适配器对两种 shape 都宽松取值，故对本地样例也安全（幂等）。

interface RawLoc {
  x?: number;
  y?: number;
}
interface RawPlayerLoc {
  puuid?: string;
  subject?: string;
  viewRadians?: number;
  location?: RawLoc;
}
interface RawFinishingDamage {
  damageType?: string;
  damageItem?: string;
  isSecondaryFireMode?: boolean;
}
interface RawKill {
  killer?: string;
  victim?: string;
  victimLocation?: RawLoc;
  assistants?: string[];
  playerLocations?: RawPlayerLoc[];
  finishingDamage?: RawFinishingDamage;
  timeSinceGameStartMillis?: number;
  timeSinceRoundStartMillis?: number;
  gameTime?: number;
  roundTime?: number;
}
interface RawPlayerStat {
  puuid?: string;
  subject?: string;
  kills?: RawKill[];
}
interface RawRound {
  roundNum?: number;
  roundResult?: string;
  winningTeam?: string;
  bombPlanter?: string;
  plantRoundTime?: number;
  plantSite?: string;
  plantLocation?: RawLoc;
  plantPlayerLocations?: RawPlayerLoc[] | null;
  defuseRoundTime?: number;
  defuseLocation?: RawLoc;
  defusePlayerLocations?: RawPlayerLoc[] | null;
  playerStats?: RawPlayerStat[];
}
interface RawPlayer {
  puuid?: string;
  subject?: string;
  gameName?: string;
  tagLine?: string;
  teamId?: string;
  characterId?: string;
  competitiveTier?: number;
  stats?: MatchPlayer['stats'];
}
interface RawMatch {
  matchInfo?: {
    matchId?: string;
    mapId?: string;
    gameMode?: string;
    queueId?: string;
    queueID?: string;
    isRanked?: boolean;
    gameStartMillis?: number;
  };
  players?: RawPlayer[];
  teams?: MatchDetails['teams'];
  roundResults?: RawRound[];
}

const pid = (o: { puuid?: string; subject?: string }): string => o.puuid ?? o.subject ?? '';
const loc = (l: RawLoc | undefined): Location => ({ x: l?.x ?? 0, y: l?.y ?? 0 });
const playerLoc = (pl: RawPlayerLoc): PlayerLocation => ({
  subject: pid(pl),
  viewRadians: pl.viewRadians ?? 0,
  location: loc(pl.location),
});

function mapKill(k: RawKill, round: number): Kill {
  return {
    killer: k.killer ?? '',
    victim: k.victim ?? '',
    victimLocation: loc(k.victimLocation),
    assistants: k.assistants ?? [],
    playerLocations: (k.playerLocations ?? []).map(playerLoc),
    finishingDamage: {
      damageType: (k.finishingDamage?.damageType ?? '') as Kill['finishingDamage']['damageType'],
      damageItem: k.finishingDamage?.damageItem ?? '',
      isSecondaryFireMode: Boolean(k.finishingDamage?.isSecondaryFireMode),
    },
    gameTime: k.timeSinceGameStartMillis ?? k.gameTime ?? 0,
    roundTime: k.timeSinceRoundStartMillis ?? k.roundTime ?? 0,
    round,
  };
}

function mapRound(r: RawRound): RoundResult {
  const roundNum = r.roundNum ?? 0;
  return {
    roundNum,
    roundResult: (r.roundResult ?? '') as RoundResult['roundResult'],
    winningTeam: r.winningTeam ?? '',
    bombPlanter: r.bombPlanter,
    plantRoundTime: r.plantRoundTime,
    plantSite: (r.plantSite ?? '') as RoundResult['plantSite'],
    plantLocation: loc(r.plantLocation),
    plantPlayerLocations: r.plantPlayerLocations ? r.plantPlayerLocations.map(playerLoc) : null,
    defuseRoundTime: r.defuseRoundTime,
    defuseLocation: loc(r.defuseLocation),
    defusePlayerLocations: r.defusePlayerLocations ? r.defusePlayerLocations.map(playerLoc) : null,
  };
}

/** 规整官方 VAL-MATCH-V1（或本地）响应为领域 MatchDetails。 */
export function normalizeOfficialMatch(raw: unknown): MatchDetails {
  const m = (raw ?? {}) as RawMatch;
  const info = m.matchInfo ?? {};
  const rounds = m.roundResults ?? [];

  // 从回合内 playerStats 重建带 round 的顶层 kills
  const kills: Kill[] = [];
  for (const r of rounds) {
    const roundNum = r.roundNum ?? 0;
    for (const ps of r.playerStats ?? []) {
      for (const k of ps.kills ?? []) kills.push(mapKill(k, roundNum));
    }
  }
  kills.sort((a, b) => a.round - b.round || a.roundTime - b.roundTime);

  return {
    matchInfo: {
      matchId: info.matchId ?? '',
      mapId: info.mapId ?? '',
      gameMode: info.gameMode ?? '',
      queueID: info.queueId ?? info.queueID ?? '',
      isRanked: Boolean(info.isRanked),
      gameStartMillis: info.gameStartMillis ?? 0,
    },
    players: (m.players ?? []).map((p) => ({
      subject: pid(p),
      gameName: p.gameName ?? '',
      tagLine: p.tagLine ?? '',
      teamId: p.teamId ?? '',
      characterId: p.characterId ?? '',
      competitiveTier: p.competitiveTier ?? 0,
      stats: p.stats ?? null,
    })),
    teams: m.teams ?? null,
    roundResults: rounds.map(mapRound),
    kills,
  };
}

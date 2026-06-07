// Riot match-details 响应的忠实子集（只保留复盘所需字段）。
// 完整 schema 见 techchrism/valorant-api-docs：valorant-api-types/src/endpoints/pvp/MatchDetails.ts
// 坐标为游戏世界坐标，需经 mapCalibration 转换到小地图。

export type TeamId = 'Blue' | 'Red' | string;

export interface Location {
  x: number;
  y: number;
}

export interface PlayerLocation {
  subject: string;
  viewRadians: number;
  location: Location;
}

export interface FinishingDamage {
  damageType: 'Weapon' | 'Bomb' | 'Ability' | 'Fall' | 'Melee' | 'Invalid' | '';
  damageItem: string; // 武器 itemID 或 'Ultimate'/'Ability1' 等
  isSecondaryFireMode: boolean;
}

export interface Kill {
  gameTime: number; // 自开局毫秒
  roundTime: number; // 自本回合开始毫秒
  round: number; // 顶层 kills 数组带 round 字段
  killer: string;
  victim: string;
  victimLocation: Location;
  assistants: string[];
  playerLocations: PlayerLocation[]; // 击杀瞬间「存活玩家」位置快照（不含死者）
  finishingDamage: FinishingDamage;
}

export interface PlayerStats {
  score: number;
  roundsPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  abilityCasts?: {
    grenadeCasts: number;
    ability1Casts: number;
    ability2Casts: number;
    ultimateCasts: number;
  } | null;
}

export interface MatchPlayer {
  subject: string;
  gameName: string;
  tagLine: string;
  teamId: TeamId;
  characterId: string; // agent UUID
  competitiveTier: number;
  stats: PlayerStats | null;
}

export interface RoundResult {
  roundNum: number;
  roundResult: 'Eliminated' | 'Bomb detonated' | 'Bomb defused' | 'Surrendered' | 'Round timer expired';
  winningTeam: TeamId;
  bombPlanter?: string;
  plantRoundTime?: number;
  plantSite?: 'A' | 'B' | 'C' | '';
  plantLocation: Location;
  plantPlayerLocations: PlayerLocation[] | null;
  defuseRoundTime?: number;
  defuseLocation: Location;
  defusePlayerLocations: PlayerLocation[] | null;
}

export interface MatchInfo {
  matchId: string;
  mapId: string;
  gameMode: string;
  queueID: string;
  isRanked: boolean;
  gameStartMillis: number;
}

export interface Team {
  teamId: TeamId;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
}

export interface MatchDetails {
  matchInfo: MatchInfo;
  players: MatchPlayer[];
  teams: Team[] | null;
  roundResults: RoundResult[] | null;
  kills: Kill[] | null;
}

// ——— 复盘视图派生模型：把一回合拆成有序的「关键时刻」 ———

export type MomentType = 'kill' | 'plant' | 'defuse';

export interface ReplayMoment {
  type: MomentType;
  roundTime: number; // 回合内毫秒，用于排序与展示
  /** 该时刻全员存活位置快照 */
  locations: PlayerLocation[];
  /** kill 时刻附带：死者位置、击杀者、武器 */
  kill?: Kill;
  /** plant/defuse 时刻附带：装置位置 */
  spikeLocation?: Location;
  /** 触发者（planter/defuser/killer） */
  actor?: string;
}

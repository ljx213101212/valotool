import type { MatchDetails } from '../types';

/** 对局摘要：用于「选择对局」列表，不含完整回合/击杀数据。 */
export interface MatchSummary {
  matchId: string;
  mapId: string;
  mapDisplayName?: string;
  queueId: string;
  isRanked: boolean;
  gameStartMillis: number;
}

/**
 * 复盘视图唯一的数据来源抽象。视图只消费此接口，与具体来源解耦。
 * 计划实现：
 *  - SampleFileSource  —— 当前：打包样例 JSON（离线开发/演示）
 *  - OfficialApiSource —— 后续：VAL-MATCH-V1 + RSO（合规，面向所有国际服玩家）
 *  - LocalClientSource —— 过渡：本地客户端 token（仅本机账号，需游戏在跑）
 */
export interface MatchSource {
  /** 稳定标识，如 'sample' | 'official' | 'local'。 */
  readonly id: string;
  /** 展示名。 */
  readonly label: string;
  /** 列出可复盘的对局（摘要）。 */
  listMatches(): Promise<MatchSummary[]>;
  /** 按 matchId 取完整对局详情。 */
  getMatch(matchId: string): Promise<MatchDetails>;
}

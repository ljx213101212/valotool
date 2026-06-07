import type { MatchDetails } from '../types';
import type { MatchSource, MatchSummary } from './matchSource';
import { normalizeOfficialMatch } from './officialMatchAdapter';

// 官方 VAL-MATCH-V1 数据源。
//
// ⚠️ 前端【不能】直连 Riot：API Key 是机密、且 Riot 不允许浏览器跨域。
// 因此本源调用【你自己的后端代理】（持 Key，服务端转发）。代理契约见 docs/valorant-data-access.md。
// 状态：scaffold —— 需 Production Key + RSO + 部署代理后方可联调；adapter 已单测验证。

interface OfficialApiSourceOptions {
  /** 后端代理基址，默认 /api/val。 */
  baseUrl?: string;
  /** 目标玩家 puuid（经 RSO 登录后取得）。 */
  puuid: string;
}

/** 官方 matchlist 的单条历史（由代理透传 Riot 响应）。 */
interface MatchlistHistoryItem {
  matchId: string;
  gameStartTimeMillis?: number;
  queueId?: string;
}
interface MatchlistResponse {
  history?: MatchlistHistoryItem[];
}

export class OfficialApiSource implements MatchSource {
  readonly id = 'official';
  readonly label = '官方 API';

  private readonly baseUrl: string;
  private readonly puuid: string;
  private readonly cache = new Map<string, MatchDetails>();

  constructor(opts: OfficialApiSourceOptions) {
    this.baseUrl = (opts.baseUrl ?? '/api/val').replace(/\/$/, '');
    this.puuid = opts.puuid;
  }

  async listMatches(): Promise<MatchSummary[]> {
    const data = await this.getJson<MatchlistResponse>(`/matchlist/${this.puuid}`);
    return (data.history ?? []).map((h) => ({
      matchId: h.matchId,
      // matchlist 不含 mapId/玩家数，取到完整对局后再补
      queueId: h.queueId ?? '',
      isRanked: h.queueId === 'competitive',
      gameStartMillis: h.gameStartTimeMillis ?? 0,
    }));
  }

  async getMatch(matchId: string): Promise<MatchDetails> {
    const cached = this.cache.get(matchId);
    if (cached) return cached;
    const raw = await this.getJson<unknown>(`/match/${matchId}`);
    const match = normalizeOfficialMatch(raw);
    this.cache.set(matchId, match);
    return match;
  }

  private async getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`代理请求失败 HTTP ${res.status}：${path}`);
    return (await res.json()) as T;
  }
}

import type { MatchDetails } from '../types';
import { getCalibration } from '../mapCalibration';
import type { MatchSource, MatchSummary } from './matchSource';

interface SampleEntry {
  /** 相对站点根的 JSON 路径（public/ 下）。 */
  url: string;
}

function toSummary(m: MatchDetails): MatchSummary {
  return {
    matchId: m.matchInfo.matchId,
    mapId: m.matchInfo.mapId,
    mapDisplayName: getCalibration(m.matchInfo.mapId)?.displayName,
    queueId: m.matchInfo.queueID,
    isRanked: m.matchInfo.isRanked,
    gameStartMillis: m.matchInfo.gameStartMillis,
  };
}

/** 从打包的样例 JSON 读取对局，按需 fetch 并缓存。 */
export class SampleFileSource implements MatchSource {
  readonly id = 'sample';
  readonly label = '样例数据';

  private readonly entries: SampleEntry[];
  private readonly byMatchId = new Map<string, MatchDetails>();

  constructor(entries: SampleEntry[]) {
    this.entries = entries;
  }

  async listMatches(): Promise<MatchSummary[]> {
    const summaries: MatchSummary[] = [];
    for (const entry of this.entries) {
      summaries.push(toSummary(await this.fetchUrl(entry.url)));
    }
    return summaries;
  }

  async getMatch(matchId: string): Promise<MatchDetails> {
    // 深链直达 /replay/:matchId 时可能未先 listMatches —— 懒加载样例补全缓存后再查
    if (!this.byMatchId.has(matchId)) await this.listMatches();
    const cached = this.byMatchId.get(matchId);
    if (!cached) throw new Error(`未知 matchId：${matchId}`);
    return cached;
  }

  private async fetchUrl(url: string): Promise<MatchDetails> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}：${url}`);
    const data = (await res.json()) as MatchDetails;
    this.byMatchId.set(data.matchInfo.matchId, data);
    return data;
  }
}

/** 默认样例源：当前内置一局 Ascent 竞技样例。 */
export const defaultMatchSource: MatchSource = new SampleFileSource([
  { url: `${import.meta.env.BASE_URL}sample/competitive-ascent.json` },
]);

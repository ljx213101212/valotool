// Cloudflare Worker —— VAL-MATCH-V1 后端代理。
//
// 作用：把 Riot API Key 留在服务端，前端 OfficialApiSource 只调本代理。
// 状态：scaffold —— 需先拿到 Riot Production Key 才能真正工作。
//
// 暴露契约（与 src/features/match-replay/data/officialApiSource.ts 对应）：
//   GET /api/val/matchlist/:puuid  → Riot matchlists/by-puuid
//   GET /api/val/match/:matchId    → Riot match details（含 playerLocations 等坐标）
//
// 还需要（本文件未含，属后续）：
//   - RSO 登录流程，用于获得目标玩家 puuid（前端拿不到别人的 puuid）。
//   - 速率限制与缓存（Riot 有配额；match 详情可长缓存，matchlist 短缓存）。
//
// 启用方式（不改动现有静态部署前请评估）：
//   1. wrangler secret put RIOT_API_KEY
//   2. wrangler.jsonc 增加 "main": "worker/val-proxy.ts" 与 assets 绑定（让 Worker 同时托管 ./dist）
//   3. 设置 VAL_REGION 环境变量（na | eu | ap | kr | latam | br）

interface Env {
  RIOT_API_KEY: string;
  VAL_REGION?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const region = env.VAL_REGION ?? 'na';
    const riotBase = `https://${region}.api.riotgames.com/val/match/v1`;

    let riotUrl: string | undefined;
    const matchlist = url.pathname.match(/^\/api\/val\/matchlist\/([^/]+)$/);
    const match = url.pathname.match(/^\/api\/val\/match\/([^/]+)$/);
    if (matchlist) riotUrl = `${riotBase}/matchlists/by-puuid/${matchlist[1]}`;
    else if (match) riotUrl = `${riotBase}/matches/${match[1]}`;

    if (!riotUrl) return json({ error: 'not found' }, 404);
    if (!env.RIOT_API_KEY) return json({ error: 'RIOT_API_KEY 未配置' }, 500);

    const upstream = await fetch(riotUrl, {
      headers: { 'X-Riot-Token': env.RIOT_API_KEY },
    });
    if (!upstream.ok) {
      return json({ error: 'upstream error', status: upstream.status }, upstream.status);
    }
    // 原样透传 Riot 响应；规整为领域模型由前端 normalizeOfficialMatch 负责
    return json(await upstream.json());
  },
};

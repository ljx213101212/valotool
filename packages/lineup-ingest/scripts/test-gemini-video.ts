/**
 * 调研：用 Gemini 2.5 Flash 视频输入从 Valorant 游戏片段中识别 stand/aim/effect 帧。
 *
 * 用法：
 *   1. 获取 API key：https://aistudio.google.com/apikey
 *   2. 在根目录 .env.local 添加一行：GEMINI_API_KEY=你的key
 *   3. 运行（带代理）：
 *      https_proxy=http://127.0.0.1:7890 npx tsx packages/lineup-ingest/scripts/test-gemini-video.ts
 */
import '../src/env.js';
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(PKG, '.work');

// ── 配置 ────────────────────────────────────────────
const VIDEO_ID = 'BV1Z1Mw6ZEhx';
const SEGMENT_ID = `${VIDEO_ID}-0`;
const START_SEC = 12;
const END_SEC = 34;

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;
const PROXY = process.env.https_proxy ?? process.env.HTTPS_PROXY ?? '';

if (!API_KEY) {
  console.error('❌ 缺少 GEMINI_API_KEY');
  process.exit(1);
}

// ── 步骤 1：从视频中截取片段 ──────────────────────────
const srcVideo = join(WORK, VIDEO_ID, 'video.mp4');
const clipDir = join(WORK, VIDEO_ID, 'clips');
mkdirSync(clipDir, { recursive: true });
const clipPath = join(clipDir, `${SEGMENT_ID}.mp4`);
const duration = END_SEC - START_SEC;

console.log(`🎬 截取视频片段：${START_SEC}s → ${END_SEC}s (${duration}s)`);
execFileSync(
  'ffmpeg',
  ['-y', '-ss', String(START_SEC), '-t', String(duration), '-i', srcVideo, '-c', 'copy', '-avoid_negative_ts', 'make_zero', clipPath],
  { stdio: 'inherit' },
);

// ── 步骤 2：读取视频为 base64 ─────────────────────────
const videoBuffer = readFileSync(clipPath);
const b64 = videoBuffer.toString('base64');
const sizeInMB = (videoBuffer.length / 1024 / 1024).toFixed(1);
console.log(`📦 视频大小：${sizeInMB} MB\n`);

// ── 步骤 3：调用 Gemini API（用 curl，自动走 https_proxy） ─
const prompt = [
  '你是 Valorant《无畏契约》的职业教练，专门分析 Jett（婕提）一突进点教学视频。',
  '当前视频片段标题：「A包点进点 - 飞箱上」（0s-' + duration + 's）。地图：Summit 天枢云阙。',
  '',
  '=== Jett 一突进点标准流程 ===',
  'Jett 进 A 包点的典型动线如下，请按顺序逐一找出对应时间点：',
  '',
  '1. stand（站位帧）',
  '   - 画面特征：Jett 走到起始位置后停下、不再移动。准星开始对准某个参照物（墙角、箱子边缘、云、建筑轮廓）。',
  '   - 这帧回答"玩家站在哪里发起点位"。',
  '',
  '2. aim（瞄准帧）',
  '   - 画面特征：准星已精确对准技能落点的参照物（某个固定环境标记），画面不再晃。HUD 上技能图标为可用状态。',
  '   - 这帧回答"准星瞄在哪个参照物上"。',
  '',
  '3. smoke_landing（瞬云落点）',
  '   - 画面特征：Jett 释放 C 键「瞬云」烟雾弹后，烟雾球飞向目标位置。',
  '   - 识别要点：Jett 左手向前一甩（投掷动画），画面中央会出现一小团移动的灰白色烟雾球。',
  '   - 这帧回答"烟雾弹最终落在了什么位置"。',
  '',
  '4. trigger_timing（触发时机）',
  '   - 画面特征：烟雾完全展开后、Jett 准备 dash 前的最后瞬间。这一瞬准星可能切换方向（朝向 dash 方向而不是烟雾的瞄准方向）。',
  '   - 识别要点：HUD 上 E 技能「逐风」图标亮着可用，Jett 短暂停顿，视角可能开始转动。',
  '',
  '5. dash_landing（dash 落点）',
  '   - 画面特征：Jett 释放 E 键「逐风」冲刺后，落地结束 dash 的瞬间。画面从拖影/运动模糊变清晰，玩家视角稳定在新位置。',
  '   - 这帧回答"dash 后 Jett 落在了什么位置"。',
  '',
  '6. first_angle（第一枪位瞄哪）',
  '   - 画面特征：dash 落点后，Jett 调整视角、准星对准需要优先清掉的第一枪位/躲藏点。这是进点成功的最后一步。',
  '   - 这帧回答"dash 落地后应该先看哪个方向"。',
  '',
  '=== 输出格式 ===',
  '只输出 JSON，不要解释、不要 markdown 代码围栏（不要 ```json）：',
  '{',
  '  "stand":           { "timeSec": <秒>, "desc": "<20字>" },',
  '  "aim":             { "timeSec": <秒>, "desc": "<20字>" },',
  '  "smoke_landing":   { "timeSec": <秒>, "desc": "<20字>" },',
  '  "trigger_timing":  { "timeSec": <秒>, "desc": "<20字>" },',
  '  "dash_landing":    { "timeSec": <秒>, "desc": "<20字>" },',
  '  "first_angle":     { "timeSec": <秒>, "desc": "<20字>" }',
  '}',
  '',
  '重要：',
  '- timeSec 是视频内时间，不是游戏内时间。必须是 0 到 ' + duration + ' 之间的整数秒。',
  '- 6 帧的时间必须严格递增（stand < aim < smoke_landing < trigger_timing < dash_landing < first_angle），不能相等。',
  '- 找不到某帧就填 null，不要编造。例如找不到 first_angle 就写 "first_angle": null。',
].join('\n');

const reqBody = JSON.stringify({
  contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'video/mp4', data: b64 } }] }],
  generationConfig: { temperature: 0 },
});
const reqFile = join(clipDir, `${SEGMENT_ID}-req.json`);
writeFileSync(reqFile, reqBody);

console.log(`🤖 正在调用 ${MODEL} 分析视频...\n`);
const proxyArg = PROXY ? `--proxy ${PROXY}` : '';
const raw = execSync(
  `curl -s ${proxyArg} --max-time 120 -X POST ` +
  `"https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" ` +
  `-H "Content-Type: application/json" -d @${reqFile}`,
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
);
unlinkSync(reqFile);

const data = JSON.parse(raw) as Record<string, unknown>;
if (data.error) {
  console.error('❌ API 错误：', JSON.stringify(data.error, null, 2));
  process.exit(1);
}

const rawText = (data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)?.[0]
  ?.content?.parts?.map((p) => p.text).join('') ?? '';

console.log('📄 模型原始输出：\n' + rawText + '\n');

// ── 步骤 4：解析结果 ──────────────────────────────────
const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
let parsed: Record<string, unknown>;
try {
  parsed = JSON.parse(jsonStr);
} catch {
  console.error('❌ 模型输出不是合法 JSON');
  process.exit(1);
}

// ── 步骤 5：输出结果 ──────────────────────────────────
console.log('═══════════════════════════════════');
console.log('Gemini 视频分析结果');
console.log('═══════════════════════════════════\n');

for (const role of ['stand', 'aim', 'smoke_landing', 'trigger_timing', 'dash_landing', 'first_angle'] as const) {
  const result = parsed[role] as { timeSec?: number; desc?: string } | null;
  console.log(`[${role.toUpperCase()}]`);
  if (result && result.timeSec != null) {
    const absSec = START_SEC + result.timeSec;
    console.log(`  时间：${result.timeSec}s (视频内) / ${absSec}s (原视频绝对时间)`);
    console.log(`  描述：${result.desc ?? '—'}`);
  } else {
    console.log('  未找到');
  }
  console.log();
}

const reportPath = join(clipDir, `${SEGMENT_ID}-gemini-report.json`);
writeFileSync(reportPath, JSON.stringify({ model: MODEL, videoId: VIDEO_ID, segmentId: SEGMENT_ID, startSec: START_SEC, endSec: END_SEC, result: parsed, rawOutput: rawText }, null, 2));
console.log(`📁 报告已保存：${reportPath}`);

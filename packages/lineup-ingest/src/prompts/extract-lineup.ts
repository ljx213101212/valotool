import type { ExtractInput } from '../extractors/types';

/**
 * 构造「字幕 + OCR → 软字段 JSON」的抽取 prompt。
 * 硬字段（map/agent/side/site）不在这里抽——已由调用方用 parseQuery 确定。
 */
export function buildExtractPrompt(input: ExtractInput): string {
  return [
    '你是 Valorant 点位结构化助手。根据下面的字幕与画面 OCR，抽取“单条点位”的软字段。',
    `地图候选（闭词表，必须取其一）：${input.vocab.maps.join('、')}`,
    `角色候选（闭词表，必须取其一）：${input.vocab.agents.join('、')}`,
    input.hints?.map ? `地图提示：${input.hints.map}` : '',
    input.hints?.agent ? `角色提示：${input.hints.agent}` : '',
    '',
    '字幕：',
    input.subtitleText || '（无字幕）',
    'OCR：',
    input.ocrText.join(' | ') || '（无 OCR）',
    '',
    '只输出 JSON，键为：purpose（用途）、technique（stand/jump/...）、origin（站位）、target（落点）、timing（时机，可空）。',
    '若无法判断这是一条点位（如战术讲解、彩蛋），输出 {"notALineup": true}。',
  ]
    .filter(Boolean)
    .join('\n');
}

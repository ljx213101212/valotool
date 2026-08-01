import { buildJettVideoPrompt } from './jett';
import { buildDefaultVideoPrompt } from './default';

/** 按 agent slug 返回对应的视频帧预选 prompt */
export function buildVideoFramePrompt(agentSlug: string, title: string, durationSec: number): string {
  switch (agentSlug) {
    case 'jett':
      return buildJettVideoPrompt(title, durationSec);
    default:
      return buildDefaultVideoPrompt(title, durationSec);
  }
}

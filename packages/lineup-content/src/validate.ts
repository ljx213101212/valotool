import { lineupFileSchema, type Lineup } from './schema';
import { getAgent, getMap } from './registry';

export interface ValidationIssue {
  file: string;
  lineupId?: string;
  message: string;
}

export interface ValidationResult {
  lineups: Lineup[];
  errors: ValidationIssue[];
  /** 不阻断的策展告警（如必学档超过 5 条） */
  warnings: ValidationIssue[];
}

/** 必学档策展上限：同一 地图×英雄×阵营 组合内的目标条数 */
export const MUST_LEARN_CAP = 5;

/**
 * 校验一组内容文件：schema、注册表引用完整性、id 全局唯一、必学档策展约束。
 * @param files 文件名 → 已解析的 JSON 内容（点位数组）
 */
export function validateContent(files: Record<string, unknown>): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const lineups: Lineup[] = [];
  const seenIds = new Map<string, string>();

  for (const [file, raw] of Object.entries(files)) {
    const parsed = lineupFileSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({ file, message: `${issue.path.join('.')}: ${issue.message}` });
      }
      continue;
    }
    for (const lineup of parsed.data) {
      const dupFile = seenIds.get(lineup.id);
      if (dupFile) {
        errors.push({ file, lineupId: lineup.id, message: `id 重复（已存在于 ${dupFile}）` });
        continue;
      }
      seenIds.set(lineup.id, file);

      if (!getMap(lineup.map)) {
        errors.push({ file, lineupId: lineup.id, message: `未知地图 slug: ${lineup.map}` });
      }
      if (!getAgent(lineup.agent)) {
        errors.push({ file, lineupId: lineup.id, message: `未知英雄 slug: ${lineup.agent}` });
      }
      lineups.push(lineup);
    }
  }

  const mustLearnCount = new Map<string, number>();
  for (const l of lineups) {
    if (l.tier !== 'must-learn') continue;
    const key = `${l.map}×${l.agent}×${l.side}`;
    mustLearnCount.set(key, (mustLearnCount.get(key) ?? 0) + 1);
  }
  for (const [key, count] of mustLearnCount) {
    if (count > MUST_LEARN_CAP) {
      warnings.push({
        file: '(策展)',
        message: `必学档超上限：${key} 共 ${count} 条（目标 ≤${MUST_LEARN_CAP}），请把多余条目降档为 advanced`,
      });
    }
  }

  return { lineups, errors, warnings };
}

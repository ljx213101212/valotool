import type { DraftLineup } from '../types';

type Fields = DraftLineup['fields'];

/** 类别字段：可精确判命中 */
const CATEGORICAL = ['abilitySlot', 'technique'] as const;
/** 自由文本：只并排展示，不判命中（精确匹配过严，留人工/后续 LLM-judge） */
const FREE_TEXT = ['origin', 'target', 'purpose', 'timing'] as const;

export interface FieldComparison {
  field: string;
  truth?: string;
  pred?: string;
  /** 仅类别字段有意义；自由文本为 undefined */
  hit?: boolean;
}

export function compareFields(truth: Fields, pred: Fields): FieldComparison[] {
  const out: FieldComparison[] = [];
  for (const f of CATEGORICAL) {
    const t = truth[f] as string | undefined;
    const p = pred[f] as string | undefined;
    out.push({ field: f, truth: t, pred: p, hit: t !== undefined && t === p });
  }
  for (const f of FREE_TEXT) {
    out.push({ field: f, truth: truth[f] as string | undefined, pred: pred[f] as string | undefined });
  }
  return out;
}

export interface CategoricalAccuracy {
  field: string;
  hit: number;
  total: number;
}

/** 聚合多条比较的类别字段命中率（仅统计有 ground truth 的项） */
export function categoricalAccuracy(rows: FieldComparison[][]): CategoricalAccuracy[] {
  const agg = new Map<string, { hit: number; total: number }>();
  for (const row of rows) {
    for (const c of row) {
      if (c.hit === undefined || c.truth === undefined) continue;
      const a = agg.get(c.field) ?? { hit: 0, total: 0 };
      a.total++;
      if (c.hit) a.hit++;
      agg.set(c.field, a);
    }
  }
  return [...agg.entries()].map(([field, a]) => ({ field, ...a }));
}

import { z } from 'zod';

/** 三图卡的图片角色语义：站哪 → 瞄哪 → 落点效果（顺序与展示顺序一致） */
export const IMAGE_ROLES = ['stand', 'aim', 'effect'] as const;
export const imageRoleSchema = z.enum(IMAGE_ROLES);
export type ImageRole = z.infer<typeof imageRoleSchema>;

export const lineupImageSchema = z.object({
  role: imageRoleSchema,
  url: z.string().min(1),
  caption: z.string().optional(),
});
export type LineupImage = z.infer<typeof lineupImageSchema>;

export const sideSchema = z.enum(['attack', 'defense']);
export type Side = z.infer<typeof sideSchema>;

export const siteSchema = z.enum(['A', 'B', 'C', 'mid']);
export type Site = z.infer<typeof siteSchema>;

/** 难度档：必学（急救包默认入口）/ 进阶 / 花活 */
export const tierSchema = z.enum(['must-learn', 'advanced', 'flashy']);
export type Tier = z.infer<typeof tierSchema>;

/** 手法枚举；不在枚举内的细节写进 timing/origin 描述 */
export const techniqueSchema = z.enum([
  'stand',
  'crouch',
  'jump-throw',
  'run-jump-throw',
  'hold-jump-throw',
  'walk-throw',
  'placed',
]);
export type Technique = z.infer<typeof techniqueSchema>;

/** 技能槽位按默认键位 C/Q/E/X 表达（C=Grenade、Q=Ability1、E=Ability2、X=Ultimate） */
export const abilitySlotSchema = z.enum(['C', 'Q', 'E', 'X']);
export type AbilitySlot = z.infer<typeof abilitySlotSchema>;

export const lineupStatusSchema = z.enum(['verified', 'stale', 'draft']);
export type LineupStatus = z.infer<typeof lineupStatusSchema>;

export const lineupSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id 须为 kebab-case'),
    /** 地图 slug，引用地图注册表（如 ascent） */
    map: z.string().min(1),
    /** 英雄 slug，引用英雄注册表（如 sova） */
    agent: z.string().min(1),
    abilitySlot: abilitySlotSchema,
    side: sideSchema,
    site: siteSchema,
    tier: tierSchema,
    title: z.string().min(1),
    /** 用途：封烟进点 / 清点 / 守包反清 / 封闪…… */
    purpose: z.string().min(1),
    technique: techniqueSchema,
    /** 可选时机说明，如「开局沉默 12 秒后」 */
    timing: z.string().optional(),
    /** 起点站位描述（人话，可被搜索） */
    origin: z.string().min(1),
    /** 落点/生效位置描述 */
    target: z.string().min(1),
    images: z.array(lineupImageSchema).min(1).max(3),
    video: z.string().url().optional(),
    /** 最近一次人工验证时的游戏版本，如 "10.11" */
    verifiedPatch: z.string().regex(/^\d+\.\d+$/, 'verifiedPatch 形如 10.11'),
    status: lineupStatusSchema,
    keywords: z.array(z.string()).default([]),
  })
  .superRefine((lineup, ctx) => {
    const roles = lineup.images.map((img) => img.role);
    if (new Set(roles).size !== roles.length) {
      ctx.addIssue({ code: 'custom', path: ['images'], message: '图片 role 不得重复' });
    }
    const order = roles.map((r) => IMAGE_ROLES.indexOf(r));
    if (order.some((v, i) => i > 0 && v < order[i - 1])) {
      ctx.addIssue({
        code: 'custom',
        path: ['images'],
        message: '图片须按 stand → aim → effect 顺序排列',
      });
    }
  });
export type Lineup = z.infer<typeof lineupSchema>;

/** 单个内容文件 = 一个点位数组（通常按 地图×英雄 分文件） */
export const lineupFileSchema = z.array(lineupSchema);

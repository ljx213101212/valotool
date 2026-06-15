// 应用入口（小程序/H5）只消费运行时数据与纯函数，不应打进 zod 校验机器。
// 因此这里对 schema 仅做「类型导出」（编译期擦除，零运行时），
// zod schema 值与 validate 仅供校验脚本/测试按需直接 import（scripts/*、*.test.ts）。
export type {
  AbilitySlot,
  ImageRole,
  Lineup,
  LineupImage,
  LineupStatus,
  Side,
  Site,
  Technique,
  Tier,
} from './schema';
export * from './registry';
export * from './data';
export * from './labels';
export * from './search';
export * from './images';
export { MAP_ALIASES, AGENT_ALIASES, RANKED_POOL } from './curated/aliases';

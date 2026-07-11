/**
 * 人工维护的社区黑话别名与图池标记。
 * 注册表生成脚本（scripts/gen-registry.ts）会把这里的数据按 slug 合并进生成结果。
 * 官方中文名/英文名/拼音不要写在这里——那些由 valorant-api.com + pinyin-pro 生成。
 */

/** 地图 slug → 社区别名（简称、俗称、常见错写） */
export const MAP_ALIASES: Record<string, string[]> = {
  ascent: ['亚海', 'A岛'],
  bind: ['源工', '双传送'],
  haven: ['隐世', '隐士修所', '三点图'],
  // 注意：不要给 split 加「霓虹」别名——与英雄霓虹（Neon）官方名冲突
  split: ['日本图'],
  icebox: ['森寒', '冰图'],
  breeze: ['微风', '大图'],
  fracture: ['裂变', 'H图'],
  pearl: ['深海', '珍珠'],
  lotus: ['莲华', '莲花'],
  sunset: ['日落'],
  abyss: ['幽邃', '无底洞'],
  corrode: ['盐海'],
  summit: ['天枢', '云阙'],
};

/**
 * 当前排位图池（slug）。
 * TODO: 2026-06 图池待竞品调研/官方公告核实后修正；改版时同步维护。
 */
export const RANKED_POOL: string[] = [
  'ascent',
  'bind',
  'haven',
  'icebox',
  'lotus',
  'sunset',
  'corrode',
  'summit',
];

/** 英雄 slug → 社区别名 */
export const AGENT_ALIASES: Record<string, string[]> = {
  brimstone: ['烟爹', '大叔', 'brim'],
  phoenix: ['火男'],
  sage: ['奶妈'],
  sova: ['鸟人', '猎鹰'],
  viper: ['毒姐', '毒蛇'],
  cypher: ['监控男', '帽子哥'],
  reyna: ['吸血鬼'],
  killjoy: ['机器人妹', 'kj'],
  breach: ['震爆男'],
  omen: ['面具人', '瞬移男'],
  jett: ['风女', '刀女'],
  raze: ['火箭妹', '炸弹妹'],
  skye: ['澳洲妹', '狗妹'],
  yoru: ['假身男', '日本男'],
  astra: ['星星姐'],
  kayo: ['机器人', 'k.o', 'ko'],
  chamber: ['法国男', '狙男'],
  neon: ['电女', '跑男'],
  fade: ['噩梦姐'],
  harbor: ['水男'],
  gekko: ['壁虎', '宠物男'],
  deadlock: ['锁妹'],
  iso: ['护盾男'],
  clove: ['不死烟'],
  vyse: ['荆棘'],
  tejo: ['导弹男'],
  waylay: ['光女'],
};

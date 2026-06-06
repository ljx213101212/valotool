/**
 * 特工技能展示配置。`displayIcon` 为相对 `src/assets/abilities/` 的路径（与武器 `displayIcon` 相对
 * `src/assets/weapons/` 一致）；目录名与 valorant-api `displayName` 的 slug 规则对齐，见
 * `scripts/sync_agent_ability_icons.py` 的 `agent_slug`。
 */
type AbilitySlotName = 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate' | 'Passive';

function abilityAsset(
  agentDir: string,
  slot: AbilitySlotName,
  displayName: string,
  maxAmount: number = 2,
) {
  return {
    name: slot,
    displayName,
    displayIcon: `${agentDir}/${slot}.png`,
    maxAmount,
  } as const;
}

/** 按 Ability1 → Ability2 → Grenade → Ultimate → Passive（仅 API 有图时）排列，与资源目录一致。 */
export const ABILITIES_BY_AGENT = {
  astra: [
    abilityAsset('astra', 'Ability1', 'Nova Pulse'),
    abilityAsset('astra', 'Ability2', 'Nebula  / Dissipate'),
    abilityAsset('astra', 'Grenade', 'Gravity Well'),
    abilityAsset('astra', 'Ultimate', 'Astral Form / Cosmic Divide'),
    abilityAsset('astra', 'Passive', 'Astral Form'),
  ],
  breach: [
    abilityAsset('breach', 'Ability1', 'Flashpoint'),
    abilityAsset('breach', 'Ability2', 'Fault Line'),
    abilityAsset('breach', 'Grenade', 'Aftershock'),
    abilityAsset('breach', 'Ultimate', 'Rolling Thunder'),
  ],
  brimstone: [
    abilityAsset('brimstone', 'Ability1', 'Incendiary'),
    abilityAsset('brimstone', 'Ability2', 'Sky Smoke'),
    abilityAsset('brimstone', 'Grenade', 'Stim Beacon'),
    abilityAsset('brimstone', 'Ultimate', 'Orbital Strike'),
  ],
  chamber: [
    abilityAsset('chamber', 'Ability1', 'Headhunter'),
    abilityAsset('chamber', 'Ability2', 'Rendezvous'),
    abilityAsset('chamber', 'Grenade', 'Trademark'),
    abilityAsset('chamber', 'Ultimate', 'Tour De Force'),
  ],
  clove: [
    abilityAsset('clove', 'Ability1', 'Meddle'),
    abilityAsset('clove', 'Ability2', 'Ruse'),
    abilityAsset('clove', 'Grenade', 'Pick-me-up'),
    abilityAsset('clove', 'Ultimate', 'Not Dead Yet'),
  ],
  cypher: [
    abilityAsset('cypher', 'Ability1', 'Cyber Cage'),
    abilityAsset('cypher', 'Ability2', 'Spycam'),
    abilityAsset('cypher', 'Grenade', 'Trapwire'),
    abilityAsset('cypher', 'Ultimate', 'Neural Theft'),
  ],
  deadlock: [
    abilityAsset('deadlock', 'Ability1', 'Sonic Sensor'),
    abilityAsset('deadlock', 'Ability2', 'GravNet'),
    abilityAsset('deadlock', 'Grenade', 'Barrier Mesh'),
    abilityAsset('deadlock', 'Ultimate', 'Annihilation'),
  ],
  fade: [
    abilityAsset('fade', 'Ability1', 'Seize'),
    abilityAsset('fade', 'Ability2', 'Haunt'),
    abilityAsset('fade', 'Grenade', 'Prowler'),
    abilityAsset('fade', 'Ultimate', 'Nightfall'),
  ],
  gekko: [
    abilityAsset('gekko', 'Ability1', 'Wingman'),
    abilityAsset('gekko', 'Ability2', 'Dizzy'),
    abilityAsset('gekko', 'Grenade', 'Mosh Pit'),
    abilityAsset('gekko', 'Ultimate', 'Thrash'),
  ],
  harbor: [
    abilityAsset('harbor', 'Ability1', 'High Tide'),
    abilityAsset('harbor', 'Ability2', 'Cove'),
    abilityAsset('harbor', 'Grenade', 'Storm Surge'),
    abilityAsset('harbor', 'Ultimate', 'Reckoning'),
  ],
  iso: [
    abilityAsset('iso', 'Ability1', 'Undercut'),
    abilityAsset('iso', 'Ability2', 'Double Tap'),
    abilityAsset('iso', 'Grenade', 'Contingency'),
    abilityAsset('iso', 'Ultimate', 'Kill Contract'),
  ],
  jett: [
    abilityAsset('jett', 'Ability1', 'Updraft'),
    abilityAsset('jett', 'Ability2', 'Tailwind'),
    abilityAsset('jett', 'Grenade', 'Cloudburst'),
    abilityAsset('jett', 'Ultimate', 'Blade Storm'),
    abilityAsset('jett', 'Passive', 'Drift'),
  ],
  kayo: [
    abilityAsset('kayo', 'Ability1', 'FLASH/drive'),
    abilityAsset('kayo', 'Ability2', 'ZERO/point'),
    abilityAsset('kayo', 'Grenade', 'FRAG/ment'),
    abilityAsset('kayo', 'Ultimate', 'NULL/cmd'),
  ],
  killjoy: [
    abilityAsset('killjoy', 'Ability1', 'ALARMBOT'),
    abilityAsset('killjoy', 'Ability2', 'TURRET'),
    abilityAsset('killjoy', 'Grenade', 'Nanoswarm'),
    abilityAsset('killjoy', 'Ultimate', 'Lockdown'),
  ],
  miks: [
    abilityAsset('miks', 'Ability1', 'Harmonize'),
    abilityAsset('miks', 'Ability2', 'Waveform'),
    abilityAsset('miks', 'Grenade', 'M-pulse'),
    abilityAsset('miks', 'Ultimate', 'Bassquake'),
  ],
  neon: [
    abilityAsset('neon', 'Ability1', 'Relay Bolt'),
    abilityAsset('neon', 'Ability2', 'High Gear'),
    abilityAsset('neon', 'Grenade', 'Fast Lane'),
    abilityAsset('neon', 'Ultimate', 'Overdrive'),
  ],
  omen: [
    abilityAsset('omen', 'Ability1', 'Paranoia'),
    abilityAsset('omen', 'Ability2', 'Dark Cover'),
    abilityAsset('omen', 'Grenade', 'Shrouded Step'),
    abilityAsset('omen', 'Ultimate', 'From the Shadows'),
  ],
  phoenix: [
    abilityAsset('phoenix', 'Ability1', 'Hot Hands'),
    abilityAsset('phoenix', 'Ability2', 'Curveball'),
    abilityAsset('phoenix', 'Grenade', 'Blaze'),
    abilityAsset('phoenix', 'Ultimate', 'Run it Back'),
  ],
  raze: [
    abilityAsset('raze', 'Ability1', 'Blast Pack'),
    abilityAsset('raze', 'Ability2', 'Paint Shells'),
    abilityAsset('raze', 'Grenade', 'Boom Bot'),
    abilityAsset('raze', 'Ultimate', 'Showstopper'),
  ],
  reyna: [
    abilityAsset('reyna', 'Ability1', 'Devour'),
    abilityAsset('reyna', 'Ability2', 'Dismiss'),
    abilityAsset('reyna', 'Grenade', 'Leer'),
    abilityAsset('reyna', 'Ultimate', 'Empress'),
  ],
  sage: [
    abilityAsset('sage', 'Ability1', 'Slow Orb'),
    abilityAsset('sage', 'Ability2', 'Healing Orb'),
    abilityAsset('sage', 'Grenade', 'Barrier Orb'),
    abilityAsset('sage', 'Ultimate', 'Resurrection'),
  ],
  skye: [
    abilityAsset('skye', 'Ability1', 'Trailblazer'),
    abilityAsset('skye', 'Ability2', 'Guiding Light'),
    abilityAsset('skye', 'Grenade', 'Regrowth'),
    abilityAsset('skye', 'Ultimate', 'Seekers'),
  ],
  sova: [
    abilityAsset('sova', 'Ability1', 'Shock Bolt'),
    abilityAsset('sova', 'Ability2', 'Recon Bolt'),
    abilityAsset('sova', 'Grenade', 'Owl Drone'),
    abilityAsset('sova', 'Ultimate', "Hunter's Fury"),
  ],
  tejo: [
    abilityAsset('tejo', 'Ability1', 'Special Delivery'),
    abilityAsset('tejo', 'Ability2', 'Guided Salvo'),
    abilityAsset('tejo', 'Grenade', 'Stealth Drone'),
    abilityAsset('tejo', 'Ultimate', 'Armageddon'),
  ],
  veto: [
    abilityAsset('veto', 'Ability1', 'Chokehold'),
    abilityAsset('veto', 'Ability2', 'Interceptor'),
    abilityAsset('veto', 'Grenade', 'Crosscut'),
    abilityAsset('veto', 'Ultimate', 'Evolution'),
  ],
  viper: [
    abilityAsset('viper', 'Ability1', 'Poison Cloud'),
    abilityAsset('viper', 'Ability2', 'Toxic Screen'),
    abilityAsset('viper', 'Grenade', 'Snake Bite'),
    abilityAsset('viper', 'Ultimate', "Viper's Pit"),
  ],
  vyse: [
    abilityAsset('vyse', 'Ability1', 'Shear'),
    abilityAsset('vyse', 'Ability2', 'Arc Rose'),
    abilityAsset('vyse', 'Grenade', 'Razorvine'),
    abilityAsset('vyse', 'Ultimate', 'Steel Garden'),
  ],
  waylay: [
    abilityAsset('waylay', 'Ability1', 'Lightspeed'),
    abilityAsset('waylay', 'Ability2', 'Refract'),
    abilityAsset('waylay', 'Grenade', 'Saturate'),
    abilityAsset('waylay', 'Ultimate', 'Convergent Paths'),
  ],
  yoru: [
    abilityAsset('yoru', 'Ability1', 'BLINDSIDE'),
    abilityAsset('yoru', 'Ability2', 'GATECRASH'),
    abilityAsset('yoru', 'Grenade', 'FAKEOUT'),
    abilityAsset('yoru', 'Ultimate', 'DIMENSIONAL DRIFT'),
  ],
} as const;

export type AgentAbilitySlug = keyof typeof ABILITIES_BY_AGENT;

export type AgentAbilityEntry = (typeof ABILITIES_BY_AGENT)[AgentAbilitySlug][number];

/** 与 API `slot`、资源文件名一致。 */
export type AbilitySlot = AgentAbilityEntry['name'];

/** 购买栏从左到右：Grenade → Ability1 → Ability2（不含 Ultimate / Passive）。 */
export const BUY_ROW_ABILITY_ORDER = ['Grenade', 'Ability1', 'Ability2'] as const;
export type BuyRowAbilitySlot = (typeof BUY_ROW_ABILITY_ORDER)[number];

/** ⌘/Ctrl+点击特工后 Popover 内释放栏：C / Q / E / X，与游戏键位一致。 */
export const DEPLOY_ABILITY_ROW = [
  { keyLabel: 'C', slot: 'Grenade' as const, draggable: true },
  { keyLabel: 'Q', slot: 'Ability1' as const, draggable: true },
  { keyLabel: 'E', slot: 'Ability2' as const, draggable: true },
  { keyLabel: 'X', slot: 'Ultimate' as const, draggable: false },
] as const;

export type DeployAbilityRowEntry = (typeof DEPLOY_ABILITY_ROW)[number];

/** `agentsCatalog` 的 `id` 与 `ABILITIES_BY_AGENT` 目录 slug 不完全一致时在此映射。 */
const CATALOG_AGENT_ID_TO_ABILITY_SLUG: Partial<Record<string, AgentAbilitySlug>> = {
  'kay-o': 'kayo',
};

export function agentCatalogIdToAbilitySlug(catalogAgentId: string): AgentAbilitySlug {
  const slug = CATALOG_AGENT_ID_TO_ABILITY_SLUG[catalogAgentId] ?? catalogAgentId;
  if (slug in ABILITIES_BY_AGENT) {
    return slug as AgentAbilitySlug;
  }
  return 'sova';
}

export function getAgentBuyRowAbilities(
  slug: AgentAbilitySlug,
): readonly [AgentAbilityEntry, AgentAbilityEntry, AgentAbilityEntry] {
  const rows = ABILITIES_BY_AGENT[slug];
  const bySlot = new Map<AbilitySlot, AgentAbilityEntry>(rows.map((r) => [r.name, r]));
  const g = bySlot.get('Grenade');
  const a1 = bySlot.get('Ability1');
  const a2 = bySlot.get('Ability2');
  if (!g || !a1 || !a2) {
    throw new Error(`abilities config: missing buy-row slot for agent ${slug}`);
  }
  return [g, a1, a2];
}

/** 技能效果类型（可多选，后续补充位移/闪光等） */
export type AbilityEffectKind =
  | 'smoke-sphere'
  | 'smoke-line-fixed-dual'
  | 'smoke-line-fixed-single'
  | 'smoke-line-drawable'
  | 'movement-direct'
  | 'movement-anchor-static'
  | 'movement-anchor-projectile'
  | 'movement-blast-pack'
  | 'damage'
  | 'flash'
  | 'blind'
  | 'nearsight'
  | 'concuss';

export type SphericalSmokeVariant = 'default' | 'cage';
export type MovementAbilityKind = 'dash' | 'slide' | 'teleport' | 'rewind' | 'blast-pack';
export type AbilityStatusEffectType = 'flash' | 'blind' | 'nearsight' | 'concuss';
export type AbilityAffectsRule = 'all-players' | 'enemies-only';
export type FlashDeliveryKind =
  | 'projectile'
  | 'fixed-curve'
  | 'guided'
  | 'wall-burst'
  | 'enemy-only-source'
  | 'zone-projectile';
export type ConcussDeliveryKind = 'circle' | 'line-zone';
export type AbilityDamageFamily =
  | 'instant-area'
  | 'delayed-area'
  | 'persistent-area'
  | 'linear-beam'
  | 'projectile-direct'
  | 'weapon-equip'
  | 'compound'
  | 'decay-or-nonlethal';
export type AbilityDamageSupportStatus = 'supported' | 'unsupported';
export type AbilityDamageShape =
  | {
      kind: 'circle';
      outerRadius: number;
      innerRadius?: number;
    }
  | {
      kind: 'line';
      length: number;
      width: number;
    }
  | {
      kind: 'beam';
      length: number;
      radius: number;
    };
export type AbilityDamageTiming =
  | { kind: 'instant' }
  | { kind: 'windup'; windupSec: number }
  | { kind: 'persistent'; durationSec: number; tickRatePerSec?: number }
  | {
      kind: 'windup-then-persistent';
      windupSec: number;
      durationSec: number;
      tickRatePerSec?: number;
    };
export type AbilityDamageValues = {
  maxDamage?: number;
  minDamage?: number;
  tickDamage?: number;
  tickRatePerSec?: number;
  ticks?: number;
  totalDamage?: number;
};
export type AbilityDamageSource = {
  name: string;
  url: string;
  verifiedAt: string;
};
export type AbilityDamageMeta = {
  family: AbilityDamageFamily;
  supportStatus: AbilityDamageSupportStatus;
  shape: AbilityDamageShape;
  timing: AbilityDamageTiming;
  targetRule: AbilityAffectsRule;
  friendlyFire: boolean;
  values: AbilityDamageValues;
  source: AbilityDamageSource;
  /** 是否需要手动触发（如 Nanoswarm 需要 armed + trigger） */
  armed?: boolean;
};

export type AbilityEffectMeta = {
  effectKinds: readonly AbilityEffectKind[];
  /** 球型烟雾半径（地图坐标，与特工 token 同系） */
  smokeRadius?: number;
  /** 球型烟雾视觉变体 */
  smokeVariant?: SphericalSmokeVariant;
  /** 烟雾存续时间（秒，与时间轴一致） */
  smokeDurationSec?: number;
  /** 固定双线烟：单条车道长度（地图坐标） */
  smokeLineLength?: number;
  /** 固定双线烟：两条车道中心线间距（地图坐标） */
  smokeLineSpacing?: number;
  /** 固定双线烟：描边宽度 */
  smokeLineStrokeWidth?: number;
  /** 线型烟：自定义颜色（不随阵营变化） */
  smokeLineColor?: string;
  /** 位移距离上限（地图坐标，与特工 token 同系） */
  movementRange?: number;
  /** 位移技能的行为分类，用于 UI 与后续逻辑分支 */
  movementKind?: MovementAbilityKind;
  /** 从施放到移动生效的延迟（秒）；直接位移默认 0 */
  movementActivationDelaySec?: number;
  /** 闪光/致盲/震荡类状态效果 */
  statusEffect?: AbilityStatusEffectType;
  /** 影响队伍规则；安全型技能使用 enemies-only */
  affects?: AbilityAffectsRule;
  /** 闪光/致盲释放形态 */
  flashDelivery?: FlashDeliveryKind;
  /** 震荡释放形态 */
  concussDelivery?: ConcussDeliveryKind;
  /** 状态影响半径（地图坐标） */
  effectRadius?: number;
  /** 线性/推进型状态影响长度（地图坐标） */
  effectLength?: number;
  /** 线性/推进型状态影响宽度（地图坐标） */
  effectWidth?: number;
  /** 状态持续时间（秒） */
  statusDurationSec?: number;
  /** 状态消退时间（秒） */
  statusFadeSec?: number;
  /** 投射物墙体交互的路径长度上限（地图坐标） */
  projectileMaxDistance?: number;
  /** 投射物允许的墙体反弹次数 */
  projectileBounceCount?: number;
  /** 伤害技能元数据；supportStatus 为 unsupported 时只做资料分类，不进入伤害结算 */
  damage?: AbilityDamageMeta;
};

/** 未单独配置时的回退（与 Omen 暗影之罩标定一致） */
const DEFAULT_SMOKE_RADIUS = 25;
const DEFAULT_SMOKE_DURATION_SEC = 15;

/** `specs/ability/smoke.md`：Omen Dark Cover 半径 4.10m 对应地图半径 25 */
const SMOKE_OMEN_RADIUS_METERS = 4.1;
const SMOKE_OMEN_MAP_RADIUS = 25;

/** 按游戏内米制相对 Omen 4.10m↔25 等比换算为地图坐标 */
export function smokeMapUnitsFromMeters(meters: number): number {
  return Math.round((meters / SMOKE_OMEN_RADIUS_METERS) * SMOKE_OMEN_MAP_RADIUS);
}

function smokeMapRadiusFromMeters(radiusMeters: number): number {
  return smokeMapUnitsFromMeters(radiusMeters);
}

/** 霓虹高速通道：头发蓝（`specs/ability/spec.md`） */
export const NEON_FAST_LANE_SMOKE_COLOR = '#3ee8ff';

export const PHOENIX_BLAZE_WALL_COLOR = '#ff6b35';
export const HARBOR_HIGH_TIDE_WALL_COLOR = '#2dd4bf';
export const VIPER_TOXIC_SCREEN_WALL_COLOR = '#36b37e';

const DAMAGE_SOURCE_VERIFIED_AT = '2026-06-06';

function valorantWikiDamageSource(page: string): AbilityDamageSource {
  return {
    name: `Valorant Wiki: ${page.replaceAll('_', ' ')}`,
    url: `https://valorant.fandom.com/wiki/${page}`,
    verifiedAt: DAMAGE_SOURCE_VERIFIED_AT,
  };
}

/**
 * 技能效果元数据（按 agent slug + slot）。球型烟雾半径/时长见 `specs/ability/smoke.md`。
 */
export const ABILITY_EFFECT_META: Partial<
  Record<AgentAbilitySlug, Partial<Record<AbilitySlot, AbilityEffectMeta>>>
> = {
  astra: {
    Ability1: {
      effectKinds: ['concuss'],
      statusEffect: 'concuss',
      concussDelivery: 'circle',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(5),
      statusDurationSec: 3.5,
      statusFadeSec: 0,
    },
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.75),
      smokeDurationSec: 14.25,
    },
  },
  breach: {
    Ability1: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'wall-burst',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(16),
      statusDurationSec: 2,
      statusFadeSec: 1,
    },
    Ability2: {
      effectKinds: ['concuss'],
      statusEffect: 'concuss',
      concussDelivery: 'line-zone',
      affects: 'all-players',
      effectLength: smokeMapUnitsFromMeters(32),
      effectWidth: smokeMapUnitsFromMeters(5),
      statusDurationSec: 3.5,
      statusFadeSec: 0,
    },
    Ultimate: {
      effectKinds: ['concuss'],
      statusEffect: 'concuss',
      concussDelivery: 'line-zone',
      affects: 'all-players',
      effectLength: smokeMapUnitsFromMeters(40),
      effectWidth: smokeMapUnitsFromMeters(16),
      statusDurationSec: 6,
      statusFadeSec: 0,
    },
    Grenade: {
      effectKinds: ['damage'],
      damage: {
        family: 'delayed-area',
        supportStatus: 'unsupported',
        shape: {
          kind: 'line',
          length: smokeMapUnitsFromMeters(10),
          width: smokeMapUnitsFromMeters(6),
        },
        timing: { kind: 'windup', windupSec: 2.2 },
        targetRule: 'all-players',
        friendlyFire: true,
        values: { tickDamage: 80, ticks: 2, totalDamage: 160 },
        source: valorantWikiDamageSource('Aftershock'),
      },
    },
  },
  brimstone: {
    Ability1: {
      effectKinds: ['damage'],
      damage: {
        family: 'persistent-area',
        supportStatus: 'supported',
        shape: {
          kind: 'circle',
          outerRadius: smokeMapUnitsFromMeters(4.5),
        },
        timing: { kind: 'persistent', durationSec: 8, tickRatePerSec: 60 },
        targetRule: 'all-players',
        friendlyFire: true,
        values: { tickDamage: 1, tickRatePerSec: 60, maxDamage: 465 },
        source: valorantWikiDamageSource('Incendiary'),
      },
    },
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.15),
      smokeDurationSec: 19.25,
    },
  },
  clove: {
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.0),
      smokeDurationSec: 12.25,
    },
  },
  chamber: {
    Ability2: {
      effectKinds: ['movement-anchor-static'],
      movementKind: 'teleport',
      movementRange: smokeMapUnitsFromMeters(14),
    },
  },
  jett: {
    Ability2: {
      effectKinds: ['movement-direct'],
      movementKind: 'dash',
      movementRange: smokeMapUnitsFromMeters(11),
    },
    Grenade: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(3.35),
      smokeDurationSec: 2.5,
    },
  },
  omen: {
    Ability1: {
      effectKinds: ['nearsight'],
      statusEffect: 'nearsight',
      flashDelivery: 'zone-projectile',
      affects: 'all-players',
      effectLength: smokeMapUnitsFromMeters(22),
      effectWidth: smokeMapUnitsFromMeters(6),
      statusDurationSec: 2.5,
      statusFadeSec: 0.6,
    },
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: SMOKE_OMEN_MAP_RADIUS,
      smokeDurationSec: 15,
    },
    Grenade: {
      effectKinds: ['movement-direct'],
      movementKind: 'teleport',
      movementRange: smokeMapUnitsFromMeters(15),
      movementActivationDelaySec: 0.5,
    },
  },
  viper: {
    Ability1: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.5),
      smokeDurationSec: 12,
    },
    Ability2: {
      effectKinds: ['smoke-line-fixed-single'],
      smokeLineLength: smokeMapUnitsFromMeters(13),
      smokeDurationSec: 8,
      smokeLineStrokeWidth: 12,
      smokeLineColor: VIPER_TOXIC_SCREEN_WALL_COLOR,
    },
  },
  kayo: {
    Ability1: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'projectile',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(15),
      statusDurationSec: 2.25,
      statusFadeSec: 1,
      projectileMaxDistance: smokeMapUnitsFromMeters(35),
      projectileBounceCount: 1,
    },
  },
  gekko: {
    Grenade: {
      effectKinds: ['damage'],
      damage: {
        family: 'delayed-area',
        supportStatus: 'supported',
        shape: {
          kind: 'circle',
          innerRadius: smokeMapUnitsFromMeters(5.5),
          outerRadius: smokeMapUnitsFromMeters(6.2),
        },
        timing: {
          kind: 'windup-then-persistent',
          windupSec: 3,
          durationSec: 0.5,
        },
        targetRule: 'all-players',
        friendlyFire: true,
        values: { tickDamage: 50, ticks: 3, maxDamage: 180 },
        source: valorantWikiDamageSource('Mosh_Pit'),
      },
    },
    Ability2: {
      effectKinds: ['blind'],
      statusEffect: 'blind',
      flashDelivery: 'enemy-only-source',
      affects: 'enemies-only',
      effectRadius: smokeMapUnitsFromMeters(14),
      statusDurationSec: 2,
      statusFadeSec: 0.8,
    },
  },
  killjoy: {
    Grenade: {
      effectKinds: ['damage'],
      damage: {
        family: 'persistent-area',
        supportStatus: 'supported',
        shape: {
          kind: 'circle',
          outerRadius: smokeMapUnitsFromMeters(4.5),
        },
        timing: { kind: 'persistent', durationSec: 4, tickRatePerSec: 45 },
        targetRule: 'all-players',
        friendlyFire: true,
        values: { tickDamage: 1, tickRatePerSec: 45, totalDamage: 180 },
        armed: true,
        source: valorantWikiDamageSource('Nanoswarm'),
      },
    },
  },
  cypher: {
    Ability1: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(3),
      smokeDurationSec: 7,
      smokeVariant: 'cage',
    },
  },
  phoenix: {
    Ability2: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'fixed-curve',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(13),
      statusDurationSec: 1.5,
      statusFadeSec: 1,
    },
    Grenade: {
      effectKinds: ['smoke-line-drawable'],
      /** `smoke.md`：火墙约 15–20m，取 18m 为路径上限 */
      smokeLineLength: smokeMapUnitsFromMeters(18),
      smokeDurationSec: 8,
      smokeLineStrokeWidth: 14,
      smokeLineColor: PHOENIX_BLAZE_WALL_COLOR,
    },
  },
  reyna: {
    Grenade: {
      effectKinds: ['nearsight'],
      statusEffect: 'nearsight',
      flashDelivery: 'enemy-only-source',
      affects: 'enemies-only',
      effectRadius: smokeMapUnitsFromMeters(16),
      statusDurationSec: 2,
      statusFadeSec: 0.6,
    },
  },
  raze: {
    Ability1: {
      effectKinds: ['movement-blast-pack'],
      movementKind: 'blast-pack',
      movementRange: smokeMapUnitsFromMeters(8),
    },
  },
  harbor: {
    Ability1: {
      effectKinds: ['smoke-line-drawable'],
      smokeLineLength: smokeMapUnitsFromMeters(18),
      smokeDurationSec: 7,
      smokeLineStrokeWidth: 12,
      smokeLineColor: HARBOR_HIGH_TIDE_WALL_COLOR,
    },
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.5),
      smokeDurationSec: 15,
    },
  },
  neon: {
    Ability1: {
      effectKinds: ['concuss'],
      statusEffect: 'concuss',
      concussDelivery: 'circle',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(4),
      statusDurationSec: 3,
      statusFadeSec: 0,
      projectileMaxDistance: smokeMapUnitsFromMeters(30),
      projectileBounceCount: 1,
    },
    Ability2: {
      effectKinds: ['movement-direct'],
      movementKind: 'slide',
      movementRange: smokeMapUnitsFromMeters(7.5),
    },
    Grenade: {
      effectKinds: ['smoke-line-fixed-dual'],
      smokeDurationSec: 6,
      /** `smoke.md`：向前延伸约 50m */
      smokeLineLength: smokeMapUnitsFromMeters(50),
      /** 两道平行光墙间距（米制估值，可实测微调） */
      smokeLineSpacing: smokeMapUnitsFromMeters(4),
      smokeLineStrokeWidth: 10,
      smokeLineColor: NEON_FAST_LANE_SMOKE_COLOR,
    },
  },
  skye: {
    Ability2: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'guided',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(15),
      statusDurationSec: 2,
      statusFadeSec: 1,
    },
  },
  sova: {
    Ability1: {
      effectKinds: ['damage'],
      damage: {
        family: 'instant-area',
        supportStatus: 'supported',
        shape: {
          kind: 'circle',
          innerRadius: smokeMapUnitsFromMeters(1.5),
          outerRadius: smokeMapUnitsFromMeters(4),
        },
        timing: { kind: 'instant' },
        targetRule: 'all-players',
        friendlyFire: true,
        values: { minDamage: 1, maxDamage: 75 },
        source: valorantWikiDamageSource('Shock_Bolt'),
      },
    },
  },
  vyse: {
    Ability2: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'wall-burst',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(14),
      statusDurationSec: 2,
      statusFadeSec: 1,
    },
  },
  waylay: {
    Ability1: {
      effectKinds: ['movement-direct'],
      movementKind: 'dash',
      movementRange: smokeMapUnitsFromMeters(12),
    },
    Ability2: {
      effectKinds: ['movement-anchor-static'],
      movementKind: 'rewind',
    },
  },
  yoru: {
    Ability1: {
      effectKinds: ['flash'],
      statusEffect: 'flash',
      flashDelivery: 'projectile',
      affects: 'all-players',
      effectRadius: smokeMapUnitsFromMeters(14),
      statusDurationSec: 1.75,
      statusFadeSec: 1,
      projectileMaxDistance: smokeMapUnitsFromMeters(35),
      projectileBounceCount: 1,
    },
    Ability2: {
      effectKinds: ['movement-anchor-projectile'],
      movementKind: 'teleport',
      movementRange: smokeMapUnitsFromMeters(20),
    },
  },
};

export function getAbilityEffectMeta(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): AbilityEffectMeta | undefined {
  const slug = agentCatalogIdToAbilitySlug(agentCatalogId);
  return ABILITY_EFFECT_META[slug]?.[abilitySlot];
}

export function isSphericalSmokeAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('smoke-sphere') ?? false;
}

export function isFixedDualLineSmokeAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('smoke-line-fixed-dual') ?? false;
}

export function isFixedSingleLineSmokeAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('smoke-line-fixed-single') ?? false;
}

export function isDrawableCurveSmokeAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('smoke-line-drawable') ?? false;
}

export function isDirectMovementAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('movement-direct') ?? false;
}

export function isStaticAnchorMovementAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('movement-anchor-static') ?? false;
}

export function isBlastPackMovementAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('movement-blast-pack') ?? false;
}

export function isMovementAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.some((kind) => kind.startsWith('movement-')) ?? false;
}

export function isFlashOrBlindAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return (
    meta?.effectKinds.some(
      (kind) => kind === 'flash' || kind === 'blind' || kind === 'nearsight',
    ) ?? false
  );
}

export function isConcussAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('concuss') ?? false;
}

export function isStatusEffectAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  return (
    isFlashOrBlindAbility(agentCatalogId, abilitySlot) ||
    isConcussAbility(agentCatalogId, abilitySlot)
  );
}

export function isDamageAbility(agentCatalogId: string, abilitySlot: AbilitySlot): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.effectKinds.includes('damage') ?? false;
}

export function isSupportedDamageAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  return meta?.damage?.supportStatus === 'supported';
}

/** 预备期可进入释放流程的烟雾类技能 */
export function isReleasePlacementSmokeAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  return (
    isSphericalSmokeAbility(agentCatalogId, abilitySlot) ||
    isFixedDualLineSmokeAbility(agentCatalogId, abilitySlot) ||
    isFixedSingleLineSmokeAbility(agentCatalogId, abilitySlot) ||
    isDrawableCurveSmokeAbility(agentCatalogId, abilitySlot)
  );
}

/** 预备期可进入释放流程的位移技能；复杂锚点/炸药包类后续单独接入 */
export function isReleasePlacementMovementAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  return isDirectMovementAbility(agentCatalogId, abilitySlot);
}

/** 预备期可进入释放流程的技能 */
export function isReleasePlacementAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  return (
    isReleasePlacementSmokeAbility(agentCatalogId, abilitySlot) ||
    isReleasePlacementMovementAbility(agentCatalogId, abilitySlot) ||
    isStatusEffectAbility(agentCatalogId, abilitySlot) ||
    isSupportedDamageAbility(agentCatalogId, abilitySlot)
  );
}

export function getSphericalSmokeVariant(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): SphericalSmokeVariant {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeVariant ?? 'default';
}

export function getFixedLineSmokeLength(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineLength ?? smokeMapUnitsFromMeters(18);
}

export function getFixedDualLineSmokeLength(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineLength ?? smokeMapUnitsFromMeters(50);
}

export function getFixedSingleLineSmokeLength(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getFixedLineSmokeLength(agentCatalogId, abilitySlot);
}

export function getLineSmokeStrokeWidth(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineStrokeWidth ?? 12;
}

export function getLineSmokeColor(agentCatalogId: string, abilitySlot: AbilitySlot): string {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineColor ?? NEON_FAST_LANE_SMOKE_COLOR;
}

/** 可画曲线烟：路径折线总长度上限（地图坐标） */
export function getDrawableCurveMaxLength(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getFixedLineSmokeLength(agentCatalogId, abilitySlot);
}

export function getFixedDualLineSmokeSpacing(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineSpacing ?? smokeMapUnitsFromMeters(4);
}

export function getFixedDualLineSmokeStrokeWidth(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineStrokeWidth ?? 10;
}

export function getFixedDualLineSmokeColor(agentCatalogId: string, abilitySlot: AbilitySlot): string {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineColor ?? NEON_FAST_LANE_SMOKE_COLOR;
}

export function getSmokeDurationSec(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return (
    getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeDurationSec ?? DEFAULT_SMOKE_DURATION_SEC
  );
}

export function getMovementRange(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.movementRange ?? smokeMapUnitsFromMeters(10);
}

export function getAbilityAffectsRule(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): AbilityAffectsRule {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.affects ?? 'all-players';
}

export function getAbilityStatusEffectType(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): AbilityStatusEffectType {
  const meta = getAbilityEffectMeta(agentCatalogId, abilitySlot);
  if (meta?.statusEffect) return meta.statusEffect;
  if (meta?.effectKinds.includes('concuss')) return 'concuss';
  if (meta?.effectKinds.includes('nearsight')) return 'nearsight';
  if (meta?.effectKinds.includes('blind')) return 'blind';
  return 'flash';
}

export function getAbilityEffectRadius(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.effectRadius ?? smokeMapUnitsFromMeters(8);
}

export function getAbilityEffectLength(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.effectLength ?? smokeMapUnitsFromMeters(16);
}

export function getAbilityEffectWidth(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.effectWidth ?? smokeMapUnitsFromMeters(4);
}

export function getAbilityStatusDurationSec(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.statusDurationSec ?? 2;
}

export function getAbilityStatusFadeSec(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.statusFadeSec ?? 1;
}

export function getAbilityProjectileMaxDistance(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.projectileMaxDistance ?? 0;
}

export function getAbilityProjectileBounceCount(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.projectileBounceCount ?? 0;
}

export function getMovementActivationDelaySec(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.movementActivationDelaySec ?? 0;
}

export function getMovementKind(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): MovementAbilityKind {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.movementKind ?? 'dash';
}

export function getSphericalSmokeRadius(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeRadius ?? DEFAULT_SMOKE_RADIUS;
}

export function getSphericalSmokeDurationSec(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getSmokeDurationSec(agentCatalogId, abilitySlot);
}

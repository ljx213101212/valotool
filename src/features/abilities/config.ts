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
export type AbilityEffectKind = 'smoke-sphere' | 'smoke-line-fixed-dual';

export type AbilityEffectMeta = {
  effectKinds: readonly AbilityEffectKind[];
  /** 球型烟雾半径（地图坐标，与特工 token 同系） */
  smokeRadius?: number;
  /** 烟雾存续时间（秒，与时间轴一致） */
  smokeDurationSec?: number;
  /** 固定双线烟：单条车道长度（地图坐标） */
  smokeLineLength?: number;
  /** 固定双线烟：两条车道中心线间距（地图坐标） */
  smokeLineSpacing?: number;
  /** 固定双线烟：描边宽度 */
  smokeLineStrokeWidth?: number;
  /** 固定双线烟：霓虹等自定义颜色（不随阵营变化） */
  smokeLineColor?: string;
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

/**
 * 技能效果元数据（按 agent slug + slot）。球型烟雾半径/时长见 `specs/ability/smoke.md`。
 */
export const ABILITY_EFFECT_META: Partial<
  Record<AgentAbilitySlug, Partial<Record<AbilitySlot, AbilityEffectMeta>>>
> = {
  astra: {
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.75),
      smokeDurationSec: 14.25,
    },
  },
  brimstone: {
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
  harbor: {
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.5),
      smokeDurationSec: 15,
    },
  },
  jett: {
    Grenade: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(3.35),
      smokeDurationSec: 2.5,
    },
  },
  omen: {
    Ability2: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: SMOKE_OMEN_MAP_RADIUS,
      smokeDurationSec: 15,
    },
  },
  viper: {
    Ability1: {
      effectKinds: ['smoke-sphere'],
      smokeRadius: smokeMapRadiusFromMeters(4.5),
      smokeDurationSec: 12,
    },
  },
  neon: {
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

/** 预备期可进入释放流程的烟雾类技能 */
export function isReleasePlacementSmokeAbility(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): boolean {
  return isSphericalSmokeAbility(agentCatalogId, abilitySlot) || isFixedDualLineSmokeAbility(agentCatalogId, abilitySlot);
}

export function getFixedDualLineSmokeLength(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeLineLength ?? smokeMapUnitsFromMeters(50);
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

export function getSphericalSmokeRadius(agentCatalogId: string, abilitySlot: AbilitySlot): number {
  return getAbilityEffectMeta(agentCatalogId, abilitySlot)?.smokeRadius ?? DEFAULT_SMOKE_RADIUS;
}

export function getSphericalSmokeDurationSec(
  agentCatalogId: string,
  abilitySlot: AbilitySlot,
): number {
  return getSmokeDurationSec(agentCatalogId, abilitySlot);
}

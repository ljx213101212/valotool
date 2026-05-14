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
) {
  return {
    name: slot,
    displayName,
    displayIcon: `${agentDir}/${slot}.png`,
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

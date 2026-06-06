import type { AbilitySlot } from '@/features/abilities/config';
import type { CurveSmokeGeometry } from '@/shared/types/curveSmoke';
import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';
import type { DirectMovementGeometry, MovementAnchorGeometry } from '@/shared/types/movement';
import type { AbilityAffectedStatus, AbilityStatusGeometry } from '@/shared/types/abilityStatus';
import type { Point } from '@/shared/types/map';

/** 地图上技能实例的生命周期状态 */
export type AbilityPlacementState = 'initial' | 'active' | 'expired';

export type AbilityProjectilePath = {
  segments: Array<{
    from: Point;
    to: Point;
  }>;
  hits: Array<{
    wallId: string;
    point: Point;
  }>;
  terminal: Point;
};

/** 地图上已释放的技能实例 */
export type AbilityPlacement = {
  id: string;
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  x: number;
  y: number;
  /** initial：已放置、尚未生效（待激活模块处理） */
  state: AbilityPlacementState;
  /** 放置到地图时的时间戳（ms），用于详情抽屉展示施放时间 */
  placedAt: number;
  /** 球型烟雾生效开始时间（时间轴秒，量化后） */
  activeAt?: number;
  /** 球型烟雾消散时间（时间轴秒，量化后） */
  expiresAt?: number;
  /** 固定双线烟（如霓虹高速通道） */
  lineSmoke?: LineSmokeGeometry;
  /** 可画曲线烟（如火墙、水墙） */
  curveSmoke?: CurveSmokeGeometry;
  /** 直接位移路径（如 Jett Tailwind / Omen Shrouded Step） */
  directMovement?: DirectMovementGeometry;
  /** 预部署位移锚点（如 Refract / Rendezvous / Blast Pack） */
  anchorMovement?: MovementAnchorGeometry;
  /** 闪光/致盲/震荡效果在地图上的几何信息 */
  statusEffect?: AbilityStatusGeometry;
  /** 伤害效果在地图上的几何信息 */
  damageEffect?: {
    sourceX: number;
    sourceY: number;
    radius: number;
    /** 是否待手动触发（如 Nanoswarm 初始状态仅 armed，尚未开始伤害） */
    armed?: boolean;
  };
  /** 本次技能施放影响到的特工状态 */
  affectedStatuses?: AbilityAffectedStatus[];
  /** 投射物墙体命中/反弹路径（用于渲染与调试） */
  projectilePath?: AbilityProjectilePath;
};

export type AbilityPopoverAnchor = {
  clientX: number;
  clientY: number;
};

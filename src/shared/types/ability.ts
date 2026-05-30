import type { AbilitySlot } from '@/features/abilities/config';
import type { CurveSmokeGeometry } from '@/shared/types/curveSmoke';
import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';

/** 地图上技能实例的生命周期状态 */
export type AbilityPlacementState = 'initial' | 'active' | 'expired';

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
};

export type AbilityPopoverAnchor = {
  clientX: number;
  clientY: number;
};

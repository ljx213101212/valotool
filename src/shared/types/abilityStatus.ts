import type {
  AbilityStatusEffectType,
  ConcussDeliveryKind,
  FlashDeliveryKind,
} from '@/features/abilities/config';
import type { Point } from '@/shared/types/map';

export type AbilityStatusSeverity = 'miss' | 'back' | 'side' | 'front';

export type AbilityStatusGeometry = {
  kind: AbilityStatusEffectType;
  sourceX: number;
  sourceY: number;
  radius?: number;
  facing?: number;
  length?: number;
  width?: number;
  flashDelivery?: FlashDeliveryKind;
  concussDelivery?: ConcussDeliveryKind;
  impactPoints?: Point[];
};

export type AbilityAffectedStatus = {
  targetPlacementId: string;
  effect: AbilityStatusEffectType;
  severity: AbilityStatusSeverity;
  strength: number;
  startsAt: number;
  endsAt: number;
  fadeEndsAt: number;
  manual?: boolean;
};

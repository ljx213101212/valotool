import type {
  AbilityStatusEffectType,
  ConcussDeliveryKind,
  FlashDeliveryKind,
} from '@/features/abilities/config';

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

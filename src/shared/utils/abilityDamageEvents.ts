import type { AbilityDamageMeta } from '@/features/abilities/config';
import type { DamageEvent } from '@/shared/types/damage';
import type { MapAgentPlacement, MatchupSide } from '@/shared/types/matchup';
import type { MapPoint } from './abilityStatusEffects';

function distance(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundDamage(value: number): number {
  return Math.round(value * 100) / 100;
}

function canAffectTarget(
  casterSide: MatchupSide,
  target: MapAgentPlacement,
  targetRule: AbilityDamageMeta['targetRule'],
): boolean {
  return targetRule === 'all-players' || target.side !== casterSide;
}

function damageForCircleTarget(damage: AbilityDamageMeta, source: MapPoint, target: MapPoint) {
  if (damage.shape.kind !== 'circle') return null;
  const dist = distance(source, target);
  if (dist > damage.shape.outerRadius) return null;

  const maxDamage = damage.values.maxDamage ?? damage.values.tickDamage ?? 0;
  const minDamage = damage.values.minDamage ?? maxDamage;
  const innerRadius = damage.shape.innerRadius ?? 0;
  if (dist <= innerRadius || damage.shape.outerRadius <= innerRadius) return maxDamage;

  const progress = (dist - innerRadius) / (damage.shape.outerRadius - innerRadius);
  return roundDamage(maxDamage - (maxDamage - minDamage) * progress);
}

function eventTimesForDamage(damage: AbilityDamageMeta, startsAt: number): number[] {
  switch (damage.timing.kind) {
    case 'instant':
      return [startsAt];
    case 'windup':
      return [roundTime(startsAt + damage.timing.windupSec)];
    case 'persistent': {
      const tickRate = damage.timing.tickRatePerSec ?? damage.values.tickRatePerSec ?? 1;
      const ticks = Math.floor(damage.timing.durationSec * tickRate);
      return Array.from({ length: ticks }, (_, i) => roundTime(startsAt + i / tickRate));
    }
    case 'windup-then-persistent': {
      const tickRate = damage.timing.tickRatePerSec ?? damage.values.tickRatePerSec ?? 1;
      const ticks = damage.values.ticks ?? Math.floor(damage.timing.durationSec * tickRate);
      const firstTickAt = startsAt + damage.timing.windupSec;
      return Array.from({ length: ticks }, (_, i) => roundTime(firstTickAt + i / tickRate));
    }
  }
}

export function computeAbilityDamageEvents(input: {
  idPrefix: string;
  damage: AbilityDamageMeta;
  abilityId: string;
  casterPlacementId: string;
  deploymentId: string;
  source: MapPoint;
  casterSide: MatchupSide;
  targets: MapAgentPlacement[];
  startsAt: number;
}): DamageEvent[] {
  if (input.damage.supportStatus !== 'supported') return [];
  if (input.damage.shape.kind !== 'circle') return [];

  const times = eventTimesForDamage(input.damage, input.startsAt);
  const rawDamageByTarget = input.targets.flatMap((target) => {
    if (target.eliminated) return [];
    if (!canAffectTarget(input.casterSide, target, input.damage.targetRule)) return [];
    const rawDamage =
      input.damage.timing.kind === 'persistent' ||
      input.damage.timing.kind === 'windup-then-persistent'
        ? input.damage.values.tickDamage
        : damageForCircleTarget(input.damage, input.source, target);
    if (rawDamage == null || rawDamage <= 0) return [];
    if (
      (input.damage.timing.kind === 'persistent' ||
        input.damage.timing.kind === 'windup-then-persistent') &&
      damageForCircleTarget(input.damage, input.source, target) == null
    ) {
      return [];
    }
    return [{ targetPlacementId: target.id, rawDamage }];
  });

  return rawDamageByTarget.flatMap((targetDamage, targetIndex) =>
    times.map((time, tickIndex) => ({
      id: `${input.idPrefix}-${targetIndex}-${tickIndex}`,
      time,
      targetPlacementId: targetDamage.targetPlacementId,
      rawDamage: targetDamage.rawDamage,
      source: {
        type: 'ability',
        abilityId: input.abilityId,
        casterPlacementId: input.casterPlacementId,
        deploymentId: input.deploymentId,
      },
    })),
  );
}

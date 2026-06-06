import assert from 'node:assert/strict';
import {
  getAbilityEffectMeta,
  isDamageAbility,
  isSupportedDamageAbility,
  smokeMapUnitsFromMeters,
} from './config';

const shockBolt = getAbilityEffectMeta('sova', 'Ability1');
assert.ok(shockBolt?.effectKinds.includes('damage'));
assert.equal(shockBolt?.damage?.family, 'instant-area');
assert.equal(shockBolt?.damage?.supportStatus, 'supported');
assert.equal(shockBolt?.damage?.shape.kind, 'circle');
assert.equal(shockBolt?.damage?.shape.outerRadius, smokeMapUnitsFromMeters(4));
assert.equal(shockBolt?.damage?.values.maxDamage, 75);
assert.equal(shockBolt?.damage?.targetRule, 'all-players');
assert.equal(isDamageAbility('sova', 'Ability1'), true);
assert.equal(isSupportedDamageAbility('sova', 'Ability1'), true);

const moshPit = getAbilityEffectMeta('gekko', 'Grenade');
assert.equal(moshPit?.damage?.family, 'delayed-area');
assert.equal(moshPit?.damage?.timing.kind, 'windup-then-persistent');
assert.equal(moshPit?.damage?.timing.windupSec, 3);
assert.equal(moshPit?.damage?.values.maxDamage, 180);

const nanoswarm = getAbilityEffectMeta('killjoy', 'Grenade');
assert.equal(nanoswarm?.damage?.family, 'persistent-area');
assert.equal(nanoswarm?.damage?.timing.kind, 'persistent');
assert.equal(nanoswarm?.damage?.values.tickDamage, 1);
assert.equal(nanoswarm?.damage?.values.tickRatePerSec, 45);

const aftershock = getAbilityEffectMeta('breach', 'Grenade');
assert.equal(aftershock?.damage?.family, 'delayed-area');
assert.equal(aftershock?.damage?.supportStatus, 'unsupported');
assert.equal(isDamageAbility('breach', 'Grenade'), true);
assert.equal(isSupportedDamageAbility('breach', 'Grenade'), false);

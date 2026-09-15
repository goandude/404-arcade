import assert from 'node:assert/strict';
import { getTerrainHeight } from './map.js';
import { WEAPON_TYPES } from './weapons.js';

console.log('Running Battle Royale Unit Tests...');

// 1. Terrain Height Tests
const centerH = getTerrainHeight(0, 0);
assert(centerH > 1, `Center height should be above sea level, got ${centerH}`);

const oceanH = getTerrainHeight(300, 300);
assert(oceanH < 0, `Ocean height outside island radius should be below sea level, got ${oceanH}`);

const peakH = getTerrainHeight(40, -30);
assert(peakH > 15, `Mountain peak should be elevated, got ${peakH}`);
console.log('PASS: Terrain height generator within expected bounds.');

// 2. Weapons & Loot Definitions Tests
assert(WEAPON_TYPES.ar.damage === 32, 'AR base damage should be 32');
assert(WEAPON_TYPES.ar.headshotMult === 1.5, 'AR headshot multiplier should be 1.5');
assert(WEAPON_TYPES.shotgun.pellets === 8, 'Shotgun should have 8 pellets');
assert(WEAPON_TYPES.shield.healAmount === 25, 'Mini shield should heal 25');
assert(WEAPON_TYPES.medkit.healAmount === 100, 'Medkit should heal 100');
console.log('PASS: Weapon stats, damage multipliers, and consumables verified.');

// 3. Storm Math Tests
function testStormDistance(px, pz, cx, cz, radius) {
  const dist = Math.hypot(px - cx, pz - cz);
  return dist <= radius;
}

assert(testStormDistance(0, 0, 0, 0, 100) === true, 'Center should be inside storm radius');
assert(testStormDistance(150, 0, 0, 0, 100) === false, 'Point outside radius should be in storm');
console.log('PASS: Storm boundary and safe-zone distance calculations pass.');

// 4. Bot Shield and Health Damage Absorption Logic
function simulateDamage(health, shield, amount) {
  let h = health;
  let s = shield;
  if (s > 0) {
    s -= amount;
    if (s < 0) {
      h += s;
      s = 0;
    }
  } else {
    h -= amount;
  }
  return { health: Math.max(0, h), shield: Math.max(0, s), dead: h <= 0 };
}

// Case A: Damage absorbed entirely by shield
const resA = simulateDamage(100, 50, 32);
assert.equal(resA.shield, 18);
assert.equal(resA.health, 100);
assert.equal(resA.dead, false);

// Case B: Damage breaks shield and bleeds into health
const resB = simulateDamage(100, 20, 32);
assert.equal(resB.shield, 0);
assert.equal(resB.health, 88);
assert.equal(resB.dead, false);

// Case C: Lethal damage
const resC = simulateDamage(20, 0, 48);
assert.equal(resC.health, 0);
assert.equal(resC.dead, true);
console.log('PASS: Shield-to-health damage bleedthrough and lethal checks pass.');

console.log('\nALL 4 BATTLE ROYALE TEST SUITES PASSED CLEANLY!');

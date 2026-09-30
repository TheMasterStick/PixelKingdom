import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newCampaign,
  troopOffers,
  recruitmentQuote,
  recruitTroops,
  encodeSave,
  decodeSave,
} from '../src/campaign.js';
import { createBattle, orderLine, SOUTH_DEPLOYMENT, tickBattle } from '../src/battle.js';
import {
  generateBattleTerrain,
  prepareNavigation,
  positionClear,
  segmentClear,
  terrainAt,
  moveOnTerrain,
} from '../src/terrain.js';
import { createPerson } from '../src/core.js';

test('recruit offers expose only type, count, and price; hired people keep identity', () => {
  const s = newCampaign('recruitment'),
    t = s.settlements[0],
    people = t.recruits.slice();
  const offers = troopOffers(t);
  assert.deepEqual(Object.keys(offers[0]).sort(), ['count', 'label', 'price', 'type']);
  s.mode = 'settlement';
  s.visiting = t.id;
  const gold = s.gold;
  assert.equal(recruitTroops(s, t, { recruit: 3 }), true);
  assert.equal(s.gold, gold - 54);
  assert.equal(s.party.length, 4);
  assert.equal(t.recruits.length, 2);
  assert.deepEqual(
    s.party.slice(1).map((p) => p.id),
    people.slice(0, 3).map((p) => p.id),
  );
  assert.ok(!s.events[0].message.includes(people[0].name));
  assert.deepEqual(decodeSave(encodeSave(s)).party, s.party);
});
test('bulk recruitment rejects stale counts, insufficient funds, cap, and invalid amounts atomically', () => {
  const s = newCampaign('recruitment'),
    t = s.settlements[0];
  s.mode = 'settlement';
  s.visiting = t.id;
  for (const quantities of [{ recruit: 6 }, { recruit: -1 }, { recruit: 1.5 }, { companion: 1 }]) {
    const before = JSON.stringify(s);
    assert.equal(recruitTroops(s, t, quantities), false);
    assert.equal(JSON.stringify(s), before);
  }
  s.gold = 17;
  assert.equal(recruitmentQuote(s, t, { recruit: 1 }).valid, false);
  s.gold = 1000;
  while (s.party.length < 20) s.party.push(createPerson(s));
  assert.equal(recruitTroops(s, t, { recruit: 1 }), false);
});
test('north–south deployment clamps all rotated formation members to safe southern ground', () => {
  const s = newCampaign('deployment');
  for (let i = 0; i < 18; i++) s.party.push(createPerson(s));
  const b = createBattle(s, { id: 'test', count: 20 });
  assert.equal(b.formations.infantry.angle, 0);
  assert.equal(b.formations.enemy.angle, Math.PI);
  for (const [start, end] of [
    [
      { x: 20, y: 20 },
      { x: 400, y: 20 },
    ],
    [
      { x: 1390, y: 880 },
      { x: 1390, y: 650 },
    ],
    [
      { x: 300, y: 880 },
      { x: 100, y: 880 },
    ],
  ]) {
    orderLine(b, 'infantry', start, end);
    for (const u of b.units.filter((u) => u.side === 0)) {
      assert.ok(u.y >= SOUTH_DEPLOYMENT && u.y <= 895);
      assert.ok(positionClear(b.terrain, u.x, u.y));
    }
  }
});
test('terrain is seeded, includes all requested features, and cover and mud have distinct effects', () => {
  const a = generateBattleTerrain('a'),
    b = generateBattleTerrain('a'),
    c = generateBattleTerrain('c');
  assert.deepEqual(a.objects, b.objects);
  assert.notDeepEqual(a.objects, c.objects);
  for (const kind of ['tree', 'rock', 'bush']) assert.ok(a.objects.some((o) => o.kind === kind));
  const mud = a.patches.find((p) => p.kind === 'mud'),
    brush = a.objects.find((p) => p.kind === 'bush');
  assert.ok(terrainAt(a, mud.x, mud.y).speed < 0.7);
  assert.ok(terrainAt(a, brush.x, brush.y).cover >= 4);
});
test('a moving soldier routes around a solid boulder without crossing it', () => {
  const terrain = { objects: [{ kind: 'rock', x: 400, y: 450, r: 45 }], patches: [] };
  prepareNavigation(terrain);
  const u = { x: 200, y: 450, speed: 60 };
  assert.equal(segmentClear(terrain, u, { x: 600, y: 450 }), false);
  for (let i = 0; i < 500; i++) {
    const prev = { x: u.x, y: u.y };
    moveOnTerrain(terrain, u, 600, 450, 1 / 30);
    assert.ok(positionClear(terrain, u.x, u.y));
    assert.ok(segmentClear(terrain, prev, u));
  }
  assert.ok(Math.hypot(u.x - 600, u.y - 450) < 10);
});
test('solid terrain blocks ranged attacks and battle pause preserves all positions', () => {
  const s = newCampaign('shots');
  s.party.push(createPerson(s, 'archer'));
  const b = createBattle(s, { id: 'shots', count: 1 });
  b.terrain = { objects: [{ kind: 'rock', x: 700, y: 450, r: 25 }], patches: [] };
  prepareNavigation(b.terrain);
  const archer = b.units.find((u) => u.type === 'archer'),
    enemy = b.units.find((u) => u.side === 1);
  archer.x = 700;
  archer.y = 510;
  archer.cooldown = 0;
  enemy.x = 700;
  enemy.y = 390;
  b.formations.archers.stance = 'hold';
  b.formations.enemy.stance = 'hold';
  b.phase = 'battle';
  b.paused = false;
  const hp = enemy.hp;
  tickBattle(b, 1 / 30);
  assert.equal(enemy.hp, hp);
  b.paused = true;
  const positions = b.units.map((u) => [u.x, u.y]);
  tickBattle(b, 1);
  assert.deepEqual(
    b.units.map((u) => [u.x, u.y]),
    positions,
  );
});

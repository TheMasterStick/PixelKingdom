import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newCampaign,
  tickCampaign,
  findPath,
  passable,
  recruit,
  promote,
  elevate,
  encodeSave,
  decodeSave,
  rewardBattle,
} from '../src/campaign.js';
import { createBattle, tickBattle, orderLine, attachHero } from '../src/battle.js';
import { createPerson, addXP } from '../src/core.js';
const campaign = () => newCampaign('test-world', 'Nicholas');
test('seeded worlds reproduce terrain and identities; different seeds diverge', () => {
  const a = campaign(),
    b = campaign(),
    c = newCampaign('other');
  assert.deepEqual(a.terrain, b.terrain);
  assert.equal(a.settlements[0].recruits[0].id, b.settlements[0].recruits[0].id);
  assert.notDeepEqual(a.terrain, c.terrain);
  const names = [];
  for (let i = 0; i < 3000; i++) names.push(createPerson(a).name);
  assert.equal(new Set(names).size, 3000);
});
test('campaign advances only during travel or explicit waiting, never in settlements or battles', () => {
  const s = campaign(),
    hour = s.hour;
  tickCampaign(s, 10);
  assert.equal(s.hour, hour);
  s.waiting = true;
  tickCampaign(s, 1);
  assert.ok(s.hour > hour);
  for (const mode of ['battle', 'settlement']) {
    s.mode = mode;
    const h = s.hour;
    tickCampaign(s, 10);
    assert.equal(s.hour, h);
  }
  s.mode = 'campaign';
  s.paused = true;
  const h = s.hour;
  tickCampaign(s, 10);
  assert.equal(s.hour, h);
});
test('routes use land, reject water, and preserve impassable diagonal corners', () => {
  const s = campaign(),
    start = { x: Math.floor(s.x), y: Math.floor(s.y) };
  let destination;
  for (let y = start.y - 5; y < start.y + 5; y++)
    for (let x = start.x - 5; x < start.x + 5; x++)
      if (passable(s, x, y) && findPath(s, { x, y })) destination = { x, y };
  const path = findPath(s, destination);
  assert.ok(path.length);
  for (const p of path) assert.ok(passable(s, p.x, p.y));
  assert.equal(findPath(s, { x: 0, y: 0 }), null);
});
test('recruitment consumes gold and settlement inventory once, preserving identity', () => {
  const s = campaign(),
    t = s.settlements[0],
    p = t.recruits[0],
    gold = s.gold;
  assert.equal(recruit(s, t, p.id), false);
  s.mode = 'settlement';
  s.visiting = t.id;
  assert.equal(recruit(s, t, p.id), true);
  assert.equal(s.gold, gold - 18);
  assert.equal(s.party.at(-1), p);
  assert.equal(recruit(s, t, p.id), false);
});
test('promotions and companion elevation preserve identity and earned history', () => {
  const s = campaign(),
    p = createPerson(s);
  s.party.push(p);
  const id = p.id;
  assert.equal(promote(s, id, 'spearman'), false);
  addXP(p, 110);
  assert.equal(promote(s, id, 'spearman'), true);
  assert.equal(p.id, id);
  assert.equal(elevate(s, id), true);
  assert.equal(p.type, 'companion');
  assert.equal(p.id, id);
  assert.equal(p.level, 3);
});
test('save roundtrip preserves people and dynasty while clearing transient navigation', () => {
  const s = campaign();
  s.dynasty.heirs = ['future-heir'];
  s.party[0].family.childIds = ['future-heir'];
  s.path = [{ x: 3, y: 3 }];
  s.waiting = true;
  const loaded = decodeSave(encodeSave(s));
  assert.deepEqual(loaded.party, s.party);
  assert.deepEqual(loaded.dynasty, s.dynasty);
  assert.equal(loaded.path.length, 0);
  assert.equal(loaded.waiting, false);
  s.mode = 'battle';
  assert.throws(() => encodeSave(s));
  assert.throws(() => decodeSave('{}'));
});
test('battle deployment, hero attachment, and pause work without advancing campaign', () => {
  const s = campaign();
  s.party.push(createPerson(s));
  s.party[0].health = 50;
  const h = s.hour,
    b = createBattle(s, { id: 'test', count: 4 });
  assert.equal(
    b.units.find((u) => u.type === 'hero').hp,
    b.units.find((u) => u.type === 'hero').maxHp * 0.5,
  );
  orderLine(b, 'infantry', { x: 650, y: 100 }, { x: 650, y: 240 });
  assert.ok(b.units.filter((u) => u.side === 0).every((u) => u.y >= 650));
  assert.ok(b.units.filter((u) => u.side === 1).every((u) => u.y < 250));
  attachHero(b, 'infantry');
  assert.equal(b.units[0].formation, 'infantry');
  const pos = b.units.map((u) => [u.x, u.y]);
  tickBattle(b, 1);
  assert.deepEqual(
    b.units.map((u) => [u.x, u.y]),
    pos,
  );
  b.phase = 'battle';
  b.paused = false;
  tickBattle(b, 1 / 30);
  assert.ok(b.time > 0);
  assert.equal(s.hour, h);
  b.paused = true;
  const time = b.time;
  tickBattle(b, 1);
  assert.equal(b.time, time);
});
test('battles resolve with no negative health, invalid coordinates, or runaway duration', () => {
  const s = campaign();
  for (let i = 0; i < 10; i++) s.party.push(createPerson(s, i % 3 ? 'spearman' : 'archer'));
  const b = createBattle(s, { id: 'test', count: 8 });
  b.phase = 'battle';
  b.paused = false;
  for (const f of Object.values(b.formations)) f.stance = 'charge';
  for (let i = 0; i < 30 * 180 && !b.result; i++) tickBattle(b, 1 / 30);
  assert.ok(b.result);
  assert.ok(b.units.every((u) => u.hp >= 0 && Number.isFinite(u.x) && Number.isFinite(u.y)));
  const hour = s.hour;
  rewardBattle(s, b);
  assert.equal(s.hour, hour);
  assert.equal(s.mode, 'campaign');
  assert.ok(s.party.find((p) => p.id === s.heroId));
});
test('defeat applies ransom, preserves hero, and records wounds', () => {
  const s = campaign(),
    gold = s.gold,
    b = createBattle(s, { id: 'test', count: 5 });
  b.units[0].hp = 0;
  b.result = 'defeat';
  rewardBattle(s, b);
  assert.equal(s.gold, Math.floor(gold * 0.65));
  assert.equal(s.party[0].wounded, true);
  assert.equal(s.party[0].health, 15);
});
test('victory fulfills only the matching contract', () => {
  const s = campaign();
  s.quest = { targetId: 'brigands-A', done: false };
  const b = createBattle(s, { id: 'brigands-B', count: 2 });
  b.result = 'victory';
  rewardBattle(s, b);
  assert.equal(s.quest.done, false);
  const c = createBattle(s, { id: 'brigands-A', count: 2 });
  c.result = 'victory';
  rewardBattle(s, c);
  assert.equal(s.quest.done, true);
});

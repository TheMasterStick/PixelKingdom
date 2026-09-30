import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newCampaign,
  encodeSave,
  decodeSave,
  tickCampaign,
  recruitmentQuote,
} from '../src/campaign.js';
import { stats, createPerson } from '../src/core.js';
import {
  ensureFeatures,
  applyBackground,
  creationTotals,
  trade,
  tradeQuote,
  price,
  equipItem,
  unequipItem,
  learnTalent,
  diplomaticAction,
  diplomaticQuote,
  canVisit,
  ransomPrisoners,
  supplyAction,
  featureDay,
} from '../src/features.js';
function visit() {
  const s = newCampaign('features');
  const t = s.settlements[0];
  s.mode = 'settlement';
  s.visiting = t.id;
  return { s, t };
}
test('history choices apply exact reviewed stats, equipment and biography', () => {
  const s = newCampaign('origin');
  const choices = ['merchant', 'friends', 'scout', 'escape'];
  const expected = creationTotals(choices);
  applyBackground(s, choices, 2, 'female');
  const p = s.party[0];
  assert.deepEqual(p.skills, expected.skills);
  assert.equal(s.gold, expected.gold);
  assert.equal(s.food, expected.food);
  assert.equal(p.talentPoints, 1);
  assert.equal(p.culture, 2);
  assert.equal(p.history.length, 4);
  assert.equal(s.party.length, 1);
});
test('trade is atomic, conserves goods and money, and uses real local stock', () => {
  const { s, t } = visit(),
    gold = s.gold + t.wealth,
    food = s.food + t.stock;
  assert.equal(trade(s, t, { food: 3, sword: 1 }), true);
  assert.equal(s.gold + t.wealth, gold);
  assert.equal(s.food + t.stock, food);
  assert.equal(s.inventory.sword, 1);
  const before = JSON.stringify(s);
  for (const cart of [{ food: 1000 }, { sword: -2 }, { food: 0.5 }, { bogus: 1 }]) {
    assert.equal(trade(s, t, cart), false);
    assert.equal(JSON.stringify(s), before);
  }
  assert.equal(trade(s, t, { sword: -1 }), true);
  assert.equal(s.inventory.sword, 0);
  assert.equal(s.gold + t.wealth, gold);
  s.mode = 'campaign';
  assert.equal(tradeQuote(s, t, { food: 1 }).valid, false);
});
test('equipment is owned, moves between inventory and person, and changes combat stats', () => {
  const { s, t } = visit();
  const p = s.party[0],
    base = stats(p);
  assert.equal(equipItem(s, p.id, 'sword'), false);
  trade(s, t, { sword: 1, mail: 1 });
  assert(equipItem(s, p.id, 'sword'));
  assert(equipItem(s, p.id, 'mail'));
  assert.equal(stats(p).damage, base.damage + 5);
  assert.equal(stats(p).armor, base.armor + 4);
  assert.equal(s.inventory.sword, 0);
  assert(unequipItem(s, p.id, 'weapon'));
  assert.equal(stats(p).damage, base.damage);
  assert.equal(s.inventory.sword, 1);
});
test('diplomatic proposals enforce costs, relation, pact duration and hostile access', () => {
  const { s, t } = visit();
  s.gold = 1000;
  const f = s.factions[t.faction],
    gold = s.gold + f.treasury;
  assert.equal(diplomaticAction(s, f.id, 'trade'), false);
  assert(diplomaticAction(s, f.id, 'gift'));
  assert.equal(f.relations, 10);
  assert(diplomaticAction(s, f.id, 'trade'));
  assert.equal(price(s, t, 'sword'), 51);
  assert.equal(diplomaticAction(s, f.id, 'trade'), false);
  assert(diplomaticAction(s, f.id, 'gift'));
  assert(diplomaticAction(s, f.id, 'pact'));
  assert.equal(diplomaticAction(s, f.id, 'war'), false);
  s.day += 30;
  assert(diplomaticAction(s, f.id, 'war'));
  assert.equal(canVisit(s, t), false);
  assert.equal(recruitmentQuote(s, t, { recruit: 1 }).valid, false);
  assert.equal(trade(s, t, { food: 1 }), false);
  assert(diplomaticAction(s, f.id, 'peace'));
  assert(canVisit(s, t));
  assert.equal(f.diplomacy.trade, false);
  assert.equal(s.gold + f.treasury, gold);
});
test('mercenary payments draw from treasury and stop on resignation', () => {
  const s = newCampaign('service');
  s.renown = 10;
  assert(diplomaticAction(s, 0, 'service'));
  assert.equal(diplomaticAction(s, 1, 'service'), false);
  s.factions[0].treasury = 7;
  const gold = s.gold;
  featureDay(s);
  assert.equal(s.gold, gold + 7);
  assert.equal(s.factions[0].treasury, 0);
  assert(diplomaticAction(s, 0, 'resign'));
  featureDay(s);
  assert.equal(s.gold, gold + 7);
});
test('talent prerequisites, caps and daily recovery have gameplay effects', () => {
  const s = newCampaign('talents');
  const p = s.party[0];
  p.talentPoints = 10;
  assert.equal(learnTalent(p, 'medicine'), false);
  p.skills.scouting = 2;
  assert(learnTalent(p, 'medicine'));
  assert(learnTalent(p, 'vigor'));
  assert.equal(stats(p).hp, 198);
  assert(learnTalent(p, 'vigor'));
  assert(learnTalent(p, 'vigor'));
  assert.equal(learnTalent(p, 'vigor'), false);
  p.health = 40;
  s.hour = 23.99;
  s.waiting = true;
  tickCampaign(s, 0.1);
  assert.equal(p.health, 62);
});
test('old saves migrate once, and new inventories and treaties survive save roundtrip', () => {
  const { s, t } = visit();
  s.gold = 1000;
  trade(s, t, { sword: 1 });
  diplomaticAction(s, 0, 'gift');
  diplomaticAction(s, 0, 'trade');
  let loaded = decodeSave(encodeSave(s));
  assert.deepEqual(loaded.inventory, s.inventory);
  assert.deepEqual(loaded.factions[0].diplomacy, s.factions[0].diplomacy);
  const ids = s.party.map((p) => p.id);
  delete s.inventory;
  delete s.prisoners;
  for (const f of s.factions) {
    delete f.leader;
    delete f.diplomacy;
  }
  loaded = decodeSave(encodeSave(s));
  const next = loaded.nextId;
  ensureFeatures(loaded);
  assert.equal(loaded.nextId, next);
  assert.deepEqual(
    loaded.party.map((p) => p.id),
    ids,
  );
  assert.equal(loaded.factions.length, 6);
});
test('supply work and prisoner ransom transfer resources without duplicate rewards', () => {
  const { s, t } = visit();
  s.food = 30;
  const gold = s.gold + t.wealth,
    food = s.food + t.stock;
  assert(supplyAction(s, t));
  assert(supplyAction(s, t));
  assert.equal(supplyAction(s, t), false);
  assert.equal(s.gold + t.wealth, gold);
  assert.equal(s.food + t.stock, food);
  s.prisoners.push(createPerson(s, 'bandit'), createPerson(s, 'bandit'));
  t.wealth = 12;
  assert.equal(ransomPrisoners(s, t), 1);
  assert.equal(s.prisoners.length, 1);
  assert.equal(ransomPrisoners(s, t), 0);
});

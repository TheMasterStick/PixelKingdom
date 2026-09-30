import { ensureAppearance } from './appearance.js';
import { createPerson, hash, random, clamp, TYPES } from './core.js';

export const ITEMS = {
  food: {
    name: 'Provisions',
    icon: 'grain',
    kind: 'Supplies',
    price: 2,
    description: 'One ration. Feeds your company on the road.',
  },
  timber: {
    name: 'Seasoned timber',
    icon: 'timber',
    kind: 'Materials',
    price: 12,
    description: 'Trade material from the northern forests.',
  },
  iron: {
    name: 'Iron ingots',
    icon: 'iron',
    kind: 'Materials',
    price: 22,
    description: 'Trade material from hillside mines.',
  },
  cloth: {
    name: 'Woven cloth',
    icon: 'cloth',
    kind: 'Materials',
    price: 16,
    description: 'Bales of wool and linen from village looms.',
  },
  sword: {
    name: 'Tempered sword',
    icon: 'sword',
    kind: 'Weapons',
    slot: 'weapon',
    price: 60,
    damage: 5,
    description: '+5 damage. A balanced steel blade.',
  },
  axe: {
    name: 'Bearded axe',
    icon: 'axe',
    kind: 'Weapons',
    slot: 'weapon',
    price: 45,
    damage: 3,
    description: '+3 damage. A sturdy infantry weapon.',
  },
  mail: {
    name: 'Mail hauberk',
    icon: 'armor',
    kind: 'Armor',
    slot: 'armor',
    price: 80,
    armor: 4,
    description: '+4 armor. Riveted mail over a padded coat.',
  },
  gambeson: {
    name: 'Quilted gambeson',
    icon: 'armor',
    kind: 'Armor',
    slot: 'armor',
    price: 35,
    armor: 2,
    description: '+2 armor. Layered linen for the road.',
  },
};
export const TALENTS = {
  vigor: {
    name: 'Iron constitution',
    icon: 'heart',
    branch: 'Warrior',
    skill: 'martial',
    requirement: 0,
    text: '+18 maximum health per rank.',
    scope: 'Personal',
    max: 3,
  },
  shieldcraft: {
    name: 'Master of armor',
    icon: 'shield',
    branch: 'Warrior',
    skill: 'martial',
    requirement: 2,
    text: '+2 armor per rank.',
    scope: 'Personal',
    max: 3,
  },
  inspiration: {
    name: 'Rallying banner',
    icon: 'banner',
    branch: 'Commander',
    skill: 'leadership',
    requirement: 0,
    text: '+2 command strength per rank when leading a formation.',
    scope: 'Formation',
    max: 3,
  },
  drill: {
    name: 'Veteran instructor',
    icon: 'sword',
    branch: 'Commander',
    skill: 'leadership',
    requirement: 2,
    text: '+10% battle XP per rank to the company. Best instructor applies.',
    scope: 'Company',
    max: 3,
  },
  pathfinder: {
    name: 'Pathfinder',
    icon: 'tree',
    branch: 'Wayfarer',
    skill: 'scouting',
    requirement: 0,
    text: '+5% campaign speed per rank. Best pathfinder applies.',
    scope: 'Company',
    max: 3,
  },
  medicine: {
    name: 'Field medicine',
    icon: 'heart',
    branch: 'Wayfarer',
    skill: 'scouting',
    requirement: 2,
    text: '+4 daily health recovery per rank. Best healer applies.',
    scope: 'Company',
    max: 3,
  },
};
export const BACKGROUNDS = [
  {
    title: 'Your family',
    prompt: 'What kind of home shaped your earliest years?',
    choices: [
      {
        id: 'retainer',
        title: 'A retainer’s household',
        text: 'You learned duty at the hearth and discipline in the yard.',
        effect: 'Martial +2',
        skills: { martial: 2 },
      },
      {
        id: 'merchant',
        title: 'Travelling merchants',
        text: 'Coins, distant roads and promises made across a table.',
        effect: 'Leadership +1 · 100 crowns',
        skills: { leadership: 1 },
        gold: 100,
      },
      {
        id: 'hunter',
        title: 'Hunters of the deep woods',
        text: 'Reading tracks was as natural as reading the sky.',
        effect: 'Scouting +2 · 12 provisions',
        skills: { scouting: 2 },
        food: 12,
      },
    ],
  },
  {
    title: 'Childhood',
    prompt: 'As a child, what set you apart?',
    choices: [
      {
        id: 'bold',
        title: 'You never backed away',
        text: 'Bruises taught you how to stand your ground.',
        effect: 'Martial +1',
        skills: { martial: 1 },
      },
      {
        id: 'friends',
        title: 'Others followed your lead',
        text: 'Your games became adventures for the whole village.',
        effect: 'Leadership +1',
        skills: { leadership: 1 },
      },
      {
        id: 'curious',
        title: 'You wandered beyond the fields',
        text: 'There was always another trail beyond the familiar one.',
        effect: 'Scouting +1',
        skills: { scouting: 1 },
      },
    ],
  },
  {
    title: 'Youth',
    prompt: 'Where did you earn your first keep?',
    choices: [
      {
        id: 'watch',
        title: 'On the town watch',
        text: 'Cold walls, long watches and the weight of a spear.',
        effect: 'Martial +1 · Quilted gambeson',
        skills: { martial: 1 },
        item: 'gambeson',
      },
      {
        id: 'caravan',
        title: 'With a merchant caravan',
        text: 'You kept tempers cool when the road turned difficult.',
        effect: 'Leadership +1 · 40 crowns',
        skills: { leadership: 1 },
        gold: 40,
      },
      {
        id: 'scout',
        title: 'Guiding travellers',
        text: 'Your knowledge of the land brought strangers safely home.',
        effect: 'Scouting +1 · 10 provisions',
        skills: { scouting: 1 },
        food: 10,
      },
    ],
  },
  {
    title: 'Turning point',
    prompt: 'When raiders came, how did you answer?',
    choices: [
      {
        id: 'stand',
        title: 'You held the narrow gate',
        text: 'The frightened people behind you gave you a reason to stand.',
        effect: 'Martial +1 · 1 talent point',
        skills: { martial: 1 },
        talents: 1,
      },
      {
        id: 'rally',
        title: 'You rallied your neighbours',
        text: 'Alone they were afraid. Together they drove the raiders away.',
        effect: 'Leadership +1 · 1 talent point',
        skills: { leadership: 1 },
        talents: 1,
      },
      {
        id: 'escape',
        title: 'You led the children to safety',
        text: 'A forgotten forest path became a lifeline.',
        effect: 'Scouting +1 · 1 talent point',
        skills: { scouting: 1 },
        talents: 1,
      },
    ],
  },
];
export function creationTotals(choices) {
  const out = {
    skills: { martial: 0, leadership: 0, scouting: 0 },
    gold: 260,
    food: 24,
    talentPoints: 0,
    items: [],
  };
  BACKGROUNDS.forEach((stage, i) => {
    const c = stage.choices.find((c) => c.id === choices[i]);
    if (!c) return;
    for (const [key, value] of Object.entries(c.skills)) out.skills[key] += value;
    out.gold += c.gold || 0;
    out.food += c.food || 0;
    out.talentPoints += c.talents || 0;
    if (c.item) out.items.push(c.item);
  });
  return out;
}
export function applyBackground(s, choices, culture = 0, sex = 'male') {
  const p = s.party.find((p) => p.id === s.heroId),
    totals = creationTotals(choices);
  p.skills = totals.skills;
  p.talentPoints = totals.talentPoints;
  p.sex = sex;
  delete p.appearance;
  ensureAppearance(p);
  p.culture = culture;
  s.gold = totals.gold;
  s.food = totals.food;
  p.biography = choices.slice();
  p.history = BACKGROUNDS.map((stage, i) => ({
    day: 1,
    event: `${stage.title}: ${stage.choices.find((c) => c.id === choices[i])?.title || 'Unknown'}`,
  }));
  ensureFeatures(s);
  for (const id of totals.items) s.inventory[id] = (s.inventory[id] || 0) + 1;
}
function event(s, text) {
  s.events.unshift({ day: s.day, message: text });
  s.events.length = Math.min(s.events.length, 40);
}
export function ensureFeatures(s) {
  s.inventory ??= {};
  s.prisoners ??= [];
  s.diplomaticEvents ??= [];
  s.supplyQuests ??= {};
  for (const p of s.party) for (const key of Object.keys(TALENTS)) p.talents[key] ??= 0;
  for (const f of s.factions) {
    f.diplomacy ??= { status: 'neutral', trade: false, pactUntil: 0 };
    if (!f.leader) {
      f.leader = createPerson(s, 'companion', f.id % 3);
      f.leader.title = f.id % 2 ? 'Lady' : 'Lord';
      f.leader.sex = f.id % 2 ? 'female' : 'male';
      delete f.leader.appearance;
      f.leader.age = 34 + f.id * 3;
      f.leader.history = [{ day: 1, event: `Rules ${f.name} from its ancestral seat.` }];
    }
  }
  for (const t of s.settlements) {
    const n = hash(t.id + s.seed);
    t.population ??= (t.kind === 'town' ? 1400 : t.kind === 'castle' ? 450 : 230) + (n % 500);
    t.prosperity ??= 40 + (n % 35);
    t.production ??= ['timber', 'iron', 'cloth'][n % 3];
    t.market ??= {
      timber: 5,
      iron: 4,
      cloth: 6,
      axe: 2,
      gambeson: 2,
      ...(t.kind !== 'village' ? { sword: 2, mail: 2 } : {}),
    };
    t.notable ??= {
      name:
        ['Elder', 'Steward', 'Reeve'][n % 3] +
        ' ' +
        ['Alda', 'Edric', 'Hilda', 'Torsten', 'Rowan', 'Iselle'][n % 6],
      role: t.kind === 'village' ? 'Village elder' : 'Settlement steward',
    };
  }
  for (const p of [
    ...s.party,
    ...(s.dead || []),
    ...s.prisoners,
    ...s.factions.map((f) => f.leader),
    ...s.settlements.flatMap((t) => [...t.recruits, ...(t.companion ? [t.companion] : [])]),
  ])
    ensureAppearance(p);
  for (const t of s.settlements) {
    t.notable.id ??= `notable-${t.id}`;
    t.notable.sex ??= ['Alda', 'Hilda', 'Iselle'].some((name) => t.notable.name.endsWith(name))
      ? 'female'
      : 'male';
    ensureAppearance(t.notable);
  }
}
export function bestTalent(s, key) {
  return Math.max(0, ...s.party.filter((p) => !p.wounded).map((p) => p.talents?.[key] || 0));
}
export function learnTalent(p, key) {
  const t = TALENTS[key];
  if (
    !t ||
    !['hero', 'companion'].includes(p.type) ||
    p.talentPoints < 1 ||
    (p.skills[t.skill] || 0) < t.requirement ||
    (p.talents[key] || 0) >= t.max
  )
    return false;
  p.talents[key] = (p.talents[key] || 0) + 1;
  p.talentPoints--;
  return true;
}
export function amount(s, id) {
  return id === 'food' ? s.food : s.inventory?.[id] || 0;
}
function setAmount(s, id, count) {
  if (id === 'food') s.food = count;
  else s.inventory[id] = count;
}
export function marketAmount(t, id) {
  return id === 'food' ? t.stock : t.market?.[id] || 0;
}
export function price(s, t, id, buying = true) {
  const item = ITEMS[id];
  if (!item) return 0;
  const pact = s.factions[t.faction]?.diplomacy?.trade;
  const base = item.price * (t.production === id ? 0.8 : 1);
  return Math.max(1, Math.round(base * (buying ? (pact ? 0.85 : 1) : 0.6)));
}
export function canVisit(s, t) {
  return s.factions[t.faction]?.diplomacy?.status !== 'war';
}
export function tradeQuote(s, t, cart) {
  let cost = 0,
    count = 0;
  if (!t || s.mode !== 'settlement' || s.visiting !== t.id || !canVisit(s, t))
    return { valid: false, cost, count, reason: 'Visit a friendly settlement to trade.' };
  for (const [id, q] of Object.entries(cart)) {
    if (!ITEMS[id] || !Number.isSafeInteger(q) || Math.abs(q) > 10000)
      return { valid: false, cost, count, reason: 'Invalid quantity.' };
    if ((q > 0 && q > marketAmount(t, id)) || (q < 0 && -q > amount(s, id)))
      return { valid: false, cost, count, reason: 'Not enough goods available.' };
    count += Math.abs(q);
    cost += q * price(s, t, id, q > 0);
  }
  const reason = !count
    ? 'Select goods to prepare a trade.'
    : cost > s.gold
      ? 'You need more crowns.'
      : -cost > t.wealth
        ? 'The merchant cannot afford this offer.'
        : '';
  return { valid: !reason, cost, count, reason };
}
export function trade(s, t, cart) {
  const q = tradeQuote(s, t, cart);
  if (!q.valid) return false;
  for (const [id, n] of Object.entries(cart)) {
    setAmount(s, id, amount(s, id) + n);
    if (id === 'food') t.stock -= n;
    else t.market[id] = marketAmount(t, id) - n;
  }
  s.gold -= q.cost;
  t.wealth += q.cost;
  event(s, `Traded at ${t.name}: ${q.cost >= 0 ? 'paid' : 'received'} ${Math.abs(q.cost)} crowns.`);
  return true;
}
export function equipItem(s, personId, id) {
  const p = s.party.find((p) => p.id === personId),
    item = ITEMS[id];
  if (!p || !['hero', 'companion'].includes(p.type) || !item?.slot || amount(s, id) < 1)
    return false;
  const old = Object.entries(ITEMS).find(([, v]) => v.name === p.equipment[item.slot]);
  if (old) setAmount(s, old[0], amount(s, old[0]) + 1);
  setAmount(s, id, amount(s, id) - 1);
  p.equipment[item.slot] = item.name;
  return true;
}
export function unequipItem(s, personId, slot) {
  const p = s.party.find((p) => p.id === personId);
  if (!p || !['hero', 'companion'].includes(p.type) || !['weapon', 'armor'].includes(slot))
    return false;
  const old = Object.entries(ITEMS).find(([, v]) => v.name === p.equipment[slot]);
  if (!old) return false;
  setAmount(s, old[0], amount(s, old[0]) + 1);
  p.equipment[slot] = slot === 'weapon' ? 'Common steel' : 'Travel clothes';
  return true;
}
export const DIPLOMACY = {
  gift: {
    name: 'Send a gift',
    cost: 50,
    text: '+10 relation · 50 crowns',
    detail: 'A gift to the ruler’s treasury improves your standing.',
  },
  trade: {
    name: 'Trade agreement',
    cost: 60,
    text: 'Relation 10 · 60 crowns',
    detail: 'Permanent 15% discount at this kingdom’s markets while at peace.',
  },
  pact: {
    name: 'Non-aggression pact',
    cost: 80,
    text: 'Relation 20 · 80 crowns · 30 days',
    detail: 'Both parties pledge peace. You cannot declare war until the pact expires.',
  },
  service: {
    name: 'Mercenary contract',
    cost: 0,
    text: '10 renown · 10 crowns/day',
    detail:
      'Receive up to 10 crowns daily from this kingdom’s treasury for remaining in its service.',
  },
  resign: {
    name: 'Leave service',
    cost: 0,
    text: 'End your mercenary contract',
    detail: 'Stop receiving wages; you remain independent.',
  },
  war: {
    name: 'Declare hostility',
    cost: 0,
    text: 'Closes markets and recruitment',
    detail:
      'Ends trade and service, sets relation to −50 and bars settlement entry. Kingdom armies and sieges are not yet simulated.',
  },
  peace: {
    name: 'Negotiate peace',
    cost: 100,
    text: '100 crowns',
    detail: 'Restore access to settlements. Former agreements are not restored.',
  },
};
export function diplomaticQuote(s, id, action) {
  const f = s.factions.find((f) => f.id === Number(id)),
    a = DIPLOMACY[action];
  if (!f || !a) return { valid: false, reason: 'Unknown proposal.' };
  const d = f.diplomacy,
    war = d.status === 'war';
  let reason = '';
  if (action === 'peace' && !war) reason = 'You are already at peace.';
  else if (war && action !== 'peace') reason = 'Negotiate peace first.';
  else if (action === 'trade' && (f.relations < 10 || d.trade))
    reason = d.trade ? 'Agreement already in force.' : 'Requires relation 10.';
  else if (action === 'pact' && (f.relations < 20 || d.pactUntil > s.day))
    reason = d.pactUntil > s.day ? 'A pact is already in force.' : 'Requires relation 20.';
  else if (action === 'service' && (s.renown < 10 || s.mercenaryFaction != null))
    reason = s.mercenaryFaction != null ? 'You already serve a kingdom.' : 'Requires 10 renown.';
  else if (action === 'resign' && s.mercenaryFaction !== f.id)
    reason = 'You are not in their service.';
  else if (action === 'war' && d.pactUntil > s.day) reason = `Pact lasts until day ${d.pactUntil}.`;
  if (!reason && s.gold < a.cost) reason = 'Not enough crowns.';
  return { valid: !reason, reason, cost: a.cost };
}
export function diplomaticAction(s, id, action) {
  const q = diplomaticQuote(s, id, action);
  if (!q.valid) return false;
  const f = s.factions.find((f) => f.id === Number(id)),
    d = f.diplomacy;
  s.gold -= q.cost;
  f.treasury += q.cost;
  if (action === 'gift') f.relations = clamp(f.relations + 10, -100, 100);
  if (action === 'trade') d.trade = true;
  if (action === 'pact') d.pactUntil = s.day + 30;
  if (action === 'service') s.mercenaryFaction = f.id;
  if (action === 'resign') s.mercenaryFaction = null;
  if (action === 'war') {
    d.status = 'war';
    d.trade = false;
    f.relations = -50;
    if (s.mercenaryFaction === f.id) s.mercenaryFaction = null;
  }
  if (action === 'peace') {
    d.status = 'neutral';
    f.relations = 0;
  }
  const message = `${DIPLOMACY[action].name}: ${f.name}.`;
  event(s, message);
  s.diplomaticEvents.unshift({ day: s.day, faction: f.id, message });
  s.diplomaticEvents = s.diplomaticEvents.slice(0, 40);
  return true;
}
export function featureDay(s) {
  ensureFeatures(s);
  const f = s.factions.find((f) => f.id === s.mercenaryFaction);
  if (f && f.diplomacy.status !== 'war') {
    const pay = Math.min(10, f.treasury);
    f.treasury -= pay;
    s.gold += pay;
  }
  for (const t of s.settlements)
    t.market[t.production] = Math.min(50, marketAmount(t, t.production) + 2);
}
export function capturePrisoners(s, b) {
  ensureFeatures(s);
  if (b.result !== 'victory') return;
  const room = Math.max(0, Math.floor(s.party.length / 2) - s.prisoners.length);
  const captured = b.units
    .filter((u) => u.side === 1 && u.hp <= 0)
    .filter((u) => random(hash(s.seed + ':capture:' + u.id + ':' + s.day))() < 0.35)
    .slice(0, room);
  for (const u of captured) {
    const p = createPerson(s, 'bandit');
    p.health = 25;
    p.history = [{ day: s.day, event: 'Captured after the battle.' }];
    s.prisoners.push(p);
  }
  if (captured.length) event(s, `${captured.length} defeated brigands taken prisoner.`);
}
export function ransomPrisoners(s, t) {
  if (!t || s.visiting !== t.id || s.mode !== 'settlement' || !canVisit(s, t)) return 0;
  const count = Math.min(s.prisoners.length, Math.floor(t.wealth / 12));
  if (!count) return 0;
  s.prisoners.splice(0, count);
  s.gold += count * 12;
  t.wealth -= count * 12;
  event(s, `Ransomed ${count} prisoners at ${t.name}.`);
  return count;
}
export function supplyAction(s, t) {
  if (!t || s.mode !== 'settlement' || s.visiting !== t.id || !canVisit(s, t)) return false;
  const q = s.supplyQuests[t.id];
  if (q?.active) {
    if (s.food < 20 || t.wealth < 35) return false;
    s.food -= 20;
    t.stock += 20;
    t.wealth -= 35;
    s.gold += 35;
    s.factions[t.faction].relations = clamp(s.factions[t.faction].relations + 2, -100, 100);
    s.supplyQuests[t.id] = { completed: s.day };
    event(s, `Delivered provisions to ${t.name} for 35 crowns.`);
    return true;
  }
  if (q?.completed != null && s.day - q.completed < 7) return false;
  s.supplyQuests[t.id] = { active: true };
  event(s, `Accepted a delivery of 20 provisions to ${t.name}.`);
  return true;
}

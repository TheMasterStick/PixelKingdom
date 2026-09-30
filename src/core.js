export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function hash(str) {
  let h = 2166136261;
  for (const c of String(str)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const CULTURES = [
  {
    name: 'Northmarch',
    color: '#7eb8cf',
    first: ['Gun', 'Thor', 'Arn', 'Sig', 'Eir', 'Hild', 'Astr', 'Ragn'],
    end: ['ar', 'rik', 'ild', 'unn', 'mund', 'a', 'sten', 'dis'],
    last: ['Wind', 'Ash', 'Iron', 'Frost', 'Raven', 'Stone'],
    tail: ['holm', 'son', 'gard', 'strom', 'vik', 'ward'],
  },
  {
    name: 'Westreach',
    color: '#dab96b',
    first: ['Al', 'Ed', 'Wil', 'Row', 'Os', 'El', 'Mar', 'God'],
    end: ['ric', 'win', 'fred', 'an', 'ward', 'en', 'in', 'a'],
    last: ['Green', 'Black', 'Oak', 'West', 'Fair', 'High'],
    tail: ['wood', 'ford', 'brook', 'well', 'field', 'mere'],
  },
  {
    name: 'Valenne',
    color: '#c389a9',
    first: ['Ad', 'Gil', 'Is', 'Lor', 'Em', 'Luc', 'Ros', 'Val'],
    end: ['elle', 'ard', 'ien', 'ise', 'ant', 'ine', 'on', 'a'],
    last: ['Mont', 'Belle', 'Val', 'Clair', 'Rose', 'Beau'],
    tail: ['fort', 'mont', 'court', 'pont', 'val', 'champ'],
  },
];
export function makeName(seed, index, culture = 0) {
  const c = CULTURES[culture % CULTURES.length],
    r = random(hash(seed + ':person:' + index));
  return `${pick(r, c.first)}${pick(r, c.end)} ${pick(r, c.last)}${pick(r, c.tail)}`;
}
export const TYPES = {
  recruit: {
    label: 'Levy',
    hp: 80,
    damage: 9,
    armor: 1,
    speed: 39,
    range: 12,
    cost: 18,
    next: ['spearman', 'archer'],
  },
  spearman: {
    label: 'Spearman',
    hp: 105,
    damage: 13,
    armor: 3,
    speed: 36,
    range: 18,
    cost: 35,
    next: ['veteran'],
  },
  archer: {
    label: 'Archer',
    hp: 75,
    damage: 11,
    armor: 1,
    speed: 40,
    range: 155,
    cost: 35,
    next: ['marksman'],
  },
  veteran: {
    label: 'Veteran guard',
    hp: 145,
    damage: 18,
    armor: 7,
    speed: 34,
    range: 14,
    cost: 70,
    next: [],
  },
  marksman: {
    label: 'Marksman',
    hp: 95,
    damage: 17,
    armor: 3,
    speed: 39,
    range: 190,
    cost: 70,
    next: [],
  },
  hero: { label: 'Hero', hp: 180, damage: 22, armor: 6, speed: 46, range: 15, cost: 0, next: [] },
  companion: {
    label: 'Companion',
    hp: 150,
    damage: 19,
    armor: 5,
    speed: 44,
    range: 15,
    cost: 100,
    next: [],
  },
  bandit: {
    label: 'Brigand',
    hp: 65,
    damage: 8,
    armor: 0,
    speed: 36,
    range: 12,
    cost: 0,
    next: [],
  },
};
export function createPerson(s, type = 'recruit', culture = 0) {
  const index = s.nextId++,
    id = `${s.seed}-${index}`;
  let name = makeName(s.seed, index, culture);
  s.names ??= {};
  let base = name,
    n = 2;
  while (s.names[name]) name = `${base} ${n++}`;
  s.names[name] = true;
  return {
    id,
    name,
    culture,
    type,
    age: 20 + (index % 19),
    sex: index % 2 ? 'female' : 'male',
    xp: 0,
    level: 1,
    skillPoints: 0,
    talentPoints: 0,
    skills: { martial: 0, leadership: type === 'companion' ? 1 : 0, scouting: 0 },
    talents: { vigor: 0, inspiration: 0, shieldcraft: 0, drill: 0, pathfinder: 0, medicine: 0 },
    traits: [['Steadfast', 'Ambitious', 'Cautious', 'Bold'][index % 4]],
    health: 100,
    wounded: false,
    kills: 0,
    equipment: { weapon: 'Common steel', armor: 'Travel clothes' },
    family: { spouseId: null, parentIds: [], childIds: [] },
    history: [],
  };
}
export function addXP(p, amount) {
  p.xp += amount;
  while (p.xp >= p.level * 35) {
    p.xp -= p.level * 35;
    p.level++;
    p.skillPoints++;
    if (p.type === 'hero' || p.type === 'companion') p.talentPoints++;
  }
}
export function stats(p) {
  const t = TYPES[p.type];
  return {
    ...t,
    hp: t.hp + (p.talents?.vigor || 0) * 18,
    damage:
      t.damage +
      (p.skills?.martial || 0) * 2 +
      ({ 'Tempered sword': 5, 'Bearded axe': 3 }[p.equipment?.weapon] || 0),
    armor:
      t.armor +
      ({ 'Mail hauberk': 4, 'Quilted gambeson': 2 }[p.equipment?.armor] || 0) +
      (p.talents?.shieldcraft || 0) * 2,
  };
}

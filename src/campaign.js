import { ensureFeatures, bestTalent, featureDay, capturePrisoners, canVisit } from './features.js';
import { random, hash, pick, clamp, distance, createPerson, addXP, TYPES } from './core.js';
export const WORLD_W = 192,
  WORLD_H = 128;
function noise(x, y, seed) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    u = x - xi,
    v = y - yi;
  const f = (t) => t * t * (3 - 2 * t),
    n = (a, b) => random(hash(`${seed}:${a}:${b}`))();
  return (
    (n(xi, yi) * (1 - f(u)) + n(xi + 1, yi) * f(u)) * (1 - f(v)) +
    (n(xi, yi + 1) * (1 - f(u)) + n(xi + 1, yi + 1) * f(u)) * f(v)
  );
}
export function generateWorld(seed) {
  const terrain = [];
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const edge = Math.min(x / WORLD_W, y / WORLD_H, 1 - x / WORLD_W, 1 - y / WORLD_H);
      const h =
        noise(x / 23, y / 23, seed) * 0.62 +
        noise(x / 8, y / 8, seed + 1) * 0.28 +
        noise(x / 3, y / 3, seed + 2) * 0.1;
      terrain.push(
        edge < 0.025 || h < 0.31 ? 0 : h > 0.72 ? 3 : noise(x / 6, y / 6, seed + 7) > 0.55 ? 2 : 1,
      );
    }
  return terrain;
}
export const tile = (s, x, y) =>
  x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H
    ? 0
    : s.terrain[Math.floor(y) * WORLD_W + Math.floor(x)];
export const passable = (s, x, y) => {
  const t = tile(s, x, y);
  return t === 1 || t === 2;
};
export function newCampaign(seedText = 'The Long March', name = 'Nicholas', history = 'retainer') {
  const seed = hash(seedText),
    rng = random(seed),
    s = {
      version: 1,
      seed,
      seedText,
      nextId: 1,
      names: {},
      terrain: generateWorld(seed),
      day: 1,
      hour: 8,
      gold: 260,
      food: 24,
      renown: 0,
      clanLevel: 0,
      mode: 'campaign',
      party: [],
      dead: [],
      factions: [],
      settlements: [],
      bandits: [],
      events: [],
      quest: null,
      path: [],
      waiting: false,
      paused: false,
      speed: 1,
      selectedSettlement: null,
      visiting: null,
      dynasty: { name: 'House of ' + name, heirs: [], succession: 'designated-heir' },
      flags: {},
      formationLeaders: {},
      heroFormation: 'hero',
    };
  const hero = createPerson(s, 'hero');
  hero.name = name.trim().slice(0, 40) || 'Wanderer';
  hero.history.push({ day: 1, event: 'Born to a ' + history + ' household' });
  if (history === 'retainer') {
    hero.skills.martial = 2;
  }
  if (history === 'merchant') {
    s.gold += 100;
    hero.skills.leadership = 1;
  }
  if (history === 'hunter') {
    hero.skills.scouting = 2;
    s.food += 12;
  }
  s.party.push(hero);
  s.heroId = hero.id;
  const starts = [
      'Alder',
      'Raven',
      'Stone',
      'White',
      'Ash',
      'High',
      'Wind',
      'Oak',
      'Wolf',
      'Green',
      'Dun',
      'Grey',
    ],
    ends = ['ford', 'haven', 'wick', 'mere', 'watch', 'bridge', 'field', 'crest'];
  for (let i = 0; i < 6; i++) {
    let x,
      y,
      tries = 0;
    do {
      x = 15 + rng() * (WORLD_W - 30);
      y = 14 + rng() * (WORLD_H - 28);
    } while (
      (!passable(s, x, y) || s.factions.some((f) => distance(f, { x, y }) < 25)) &&
      ++tries < 5000
    );
    s.factions.push({
      id: i,
      name: ['Northmarch', 'Westreach', 'Valenne', 'Dunwold', 'Eastmere', 'Ravenhold'][i],
      color: ['#7eb8cf', '#dab96b', '#c389a9', '#94b66a', '#c47b62', '#a5a1d4'][i],
      x,
      y,
      treasury: 600,
      grain: 200,
      manpower: 40,
      relations: 0,
    });
  }
  for (let i = 0; i < 36; i++) {
    const faction = i % 6,
      f = s.factions[faction];
    let x,
      y,
      tries = 0;
    do {
      x = Math.round(clamp(f.x + (rng() - 0.5) * 28, 4, WORLD_W - 5));
      y = Math.round(clamp(f.y + (rng() - 0.5) * 24, 4, WORLD_H - 5));
    } while (
      (!passable(s, x, y) || s.settlements.some((t) => distance(t, { x, y }) < 4)) &&
      ++tries < 4000
    );
    if (!passable(s, x, y)) continue;
    const t = {
      id: 'town-' + i,
      name: starts[i % 12] + ends[Math.floor(i / 12) + (i % 5)],
      x: x + 0.5,
      y: y + 0.5,
      faction,
      kind: i < 6 ? 'town' : i < 12 ? 'castle' : 'village',
      recruits: [],
      companion: null,
      stock: 30,
      wealth: 160,
    };
    for (let n = 0; n < 5; n++) t.recruits.push(createPerson(s, 'recruit', faction % 3));
    if (i < 6) {
      t.companion = createPerson(s, 'companion', faction % 3);
    }
    s.settlements.push(t);
  }
  const home = s.settlements[0];
  s.x = home.x;
  s.y = home.y;
  s.homeId = home.id;
  for (let i = 0; i < 24; i++) {
    const near = s.settlements[i % s.settlements.length];
    let x = near.x,
      y = near.y;
    for (let n = 0; n < 100; n++) {
      const a = near.x + (rng() - 0.5) * 16,
        b = near.y + (rng() - 0.5) * 16;
      if (passable(s, a, b) && distance(near, { x: a, y: b }) > 2) {
        x = a;
        y = b;
        break;
      }
    }
    s.bandits.push({
      id: 'bandit-' + i,
      x,
      y,
      homeX: x,
      homeY: y,
      count: 3 + (i % 7),
      phase: rng() * 6,
      alive: true,
    });
  }
  ensureFeatures(s);
  log(s, 'A new house begins. Visit ' + home.name + ' to gather your first followers.');
  return s;
}
export function log(s, message) {
  s.events.unshift({ day: s.day, message });
  s.events = s.events.slice(0, 40);
}
// A* on traversable world tiles. Diagonal corner-cutting is disallowed.
export function findPath(s, target) {
  const sx = Math.floor(s.x),
    sy = Math.floor(s.y),
    tx = Math.floor(target.x),
    ty = Math.floor(target.y);
  if (!passable(s, tx, ty)) return null;
  const start = sy * WORLD_W + sx,
    goal = ty * WORLD_W + tx;
  if (start === goal) return [{ x: tx + 0.5, y: ty + 0.5 }];
  const open = [start],
    cost = new Map([[start, 0]]),
    from = new Map(),
    closed = new Set();
  const h = (id) => Math.hypot((id % WORLD_W) - tx, Math.floor(id / WORLD_W) - ty);
  let visits = 0;
  while (open.length && visits++ < WORLD_W * WORLD_H) {
    let best = 0;
    for (let i = 1; i < open.length; i++)
      if (cost.get(open[i]) + h(open[i]) < cost.get(open[best]) + h(open[best])) best = i;
    const current = open.splice(best, 1)[0];
    if (current === goal) {
      const out = [];
      let c = current;
      while (c !== start) {
        out.unshift({ x: (c % WORLD_W) + 0.5, y: Math.floor(c / WORLD_W) + 0.5 });
        c = from.get(c);
      }
      return out;
    }
    closed.add(current);
    const cx = current % WORLD_W,
      cy = Math.floor(current / WORLD_W);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const x = cx + dx,
        y = cy + dy;
      if (
        !passable(s, x, y) ||
        (dx && dy && (!passable(s, cx + dx, cy) || !passable(s, cx, cy + dy)))
      )
        continue;
      const id = y * WORLD_W + x;
      if (closed.has(id)) continue;
      const c = cost.get(current) + Math.hypot(dx, dy) * (tile(s, x, y) === 2 ? 1.4 : 1);
      if (c < (cost.get(id) ?? Infinity)) {
        cost.set(id, c);
        from.set(id, current);
        if (!open.includes(id)) open.push(id);
      }
    }
  }
  return null;
}
export function travel(s, target) {
  s.pursuitId = null;
  const route = findPath(s, target);
  if (!route) {
    log(s, 'No land route to that destination.');
    return false;
  }
  s.path = route;
  s.waiting = false;
  s.paused = false;
  return true;
}
function daily(s) {
  featureDay(s);
  const upkeep = s.party
    .filter((p) => p.type !== 'hero')
    .reduce((n, p) => n + (p.type === 'companion' ? 3 : Math.ceil(p.level / 2)), 0);
  s.gold = Math.max(0, s.gold - upkeep);
  s.food = Math.max(0, s.food - Math.max(1, Math.ceil(s.party.length / 4)));
  for (const p of s.party) {
    p.health = Math.min(100, p.health + (s.food > 0 ? 18 : 4) + bestTalent(s, 'medicine') * 4);
    p.wounded = p.health < 35;
  }
  for (const t of s.settlements) {
    t.stock = Math.min(80, t.stock + 4);
    t.wealth += 5;
    const f = s.factions[t.faction];
    f.grain += 3;
    if (t.recruits.length < 8 && f.manpower > 0 && f.treasury >= 18) {
      t.recruits.push(createPerson(s, 'recruit', t.faction % 3));
      f.manpower--;
      f.treasury -= 18;
    }
  }
  for (const f of s.factions) {
    f.treasury += 18;
    f.manpower = Math.min(100, f.manpower + 1);
  }
  if (s.gold === 0 && upkeep) log(s, 'The purse is empty. Your troops need wages.');
  if (!s.food) log(s, 'Food stores are empty. Recovery is slow.');
}
export function tickCampaign(s, dt) {
  if (s.mode !== 'campaign' || s.paused) return null;
  const pursued = s.bandits.find((b) => b.id === s.pursuitId && b.alive);
  if (pursued && distance(s, pursued) < 1.4) {
    s.path = [];
    s.pursuitId = null;
    s.waiting = false;
    return pursued;
  }
  if (pursued && !s.path.length) {
    s.path = findPath(s, pursued) || [];
    if (!s.path.length) s.pursuitId = null;
  }
  if (!s.path.length && !s.waiting) return null;
  const activeDt = dt * s.speed;
  let used = activeDt;
  if (s.path.length) {
    const target = s.path[0],
      d = distance(s, target),
      speed =
        (1.5 *
          (1 + (s.party[0].skills.scouting || 0) * 0.08 + bestTalent(s, 'pathfinder') * 0.05)) /
        (tile(s, s.x, s.y) === 2 ? 1.3 : 1),
      step = speed * activeDt;
    if (d <= step) {
      used = d / speed;
      s.x = target.x;
      s.y = target.y;
      s.path.shift();
    } else {
      s.x += ((target.x - s.x) / d) * step;
      s.y += ((target.y - s.y) / d) * step;
    }
  }
  s.hour += used * 0.7;
  while (s.hour >= 24) {
    s.hour -= 24;
    s.day++;
    daily(s);
  }
  for (const b of s.bandits) {
    if (!b.alive) continue;
    b.phase += used * 0.13;
    const nx = b.homeX + Math.cos(b.phase) * 0.9,
      ny = b.homeY + Math.sin(b.phase) * 0.9;
    if (passable(s, nx, ny)) {
      b.x = nx;
      b.y = ny;
    }
    if (distance(s, b) < 0.8) {
      s.path = [];
      s.waiting = false;
      s.pursuitId = null;
      return b;
    }
  }
  return null;
}
// The settlement presents troop categories. Persistent people remain hidden until hired.
export function troopOffers(t) {
  const groups = new Map();
  for (const p of t.recruits) {
    if (p.type === 'hero' || p.type === 'companion') continue;
    if (!groups.has(p.type))
      groups.set(p.type, {
        type: p.type,
        label: TYPES[p.type].label,
        count: 0,
        price: TYPES[p.type].cost,
      });
    groups.get(p.type).count++;
  }
  return [...groups.values()];
}
export function recruitmentQuote(s, t, quantities) {
  let count = 0,
    cost = 0;
  for (const [type, qty] of Object.entries(quantities)) {
    if (
      !Number.isInteger(qty) ||
      qty < 0 ||
      !TYPES[type] ||
      ['hero', 'companion', 'bandit'].includes(type)
    )
      return { valid: false, count: 0, cost: 0 };
    if (qty > t.recruits.filter((p) => p.type === type).length)
      return { valid: false, count: 0, cost: 0 };
    count += qty;
    cost += qty * TYPES[type].cost;
  }
  return {
    count,
    cost,
    valid:
      count > 0 &&
      s.mode === 'settlement' &&
      s.visiting === t.id &&
      canVisit(s, t) &&
      s.party.length + count <= 20 &&
      s.gold >= cost,
  };
}
export function recruitTroops(s, t, quantities) {
  const quote = recruitmentQuote(s, t, quantities);
  if (!quote.valid) return false;
  const remaining = { ...quantities },
    selected = [];
  for (const p of t.recruits)
    if (remaining[p.type] > 0) {
      selected.push(p);
      remaining[p.type]--;
    }
  const ids = new Set(selected.map((p) => p.id));
  t.recruits = t.recruits.filter((p) => !ids.has(p.id));
  for (const p of selected) {
    p.history.push({ day: s.day, event: 'Joined ' + s.dynasty.name });
    s.party.push(p);
  }
  s.gold -= quote.cost;
  log(s, `${quote.count} soldiers joined your company. Inspect the roster to meet them.`);
  return true;
}
export function recruit(s, t, id) {
  if (s.mode !== 'settlement' || s.visiting !== t.id || !canVisit(s, t)) return false;
  const p = t.recruits.find((p) => p.id === id) || t.companion;
  if (!p || p.id !== id) return false;
  const price = TYPES[p.type].cost;
  if (s.gold < price || s.party.length >= 20) return false;
  s.gold -= price;
  if (t.companion?.id === id) t.companion = null;
  else t.recruits = t.recruits.filter((p) => p.id !== id);
  s.party.push(p);
  p.history.push({ day: s.day, event: 'Joined ' + s.dynasty.name });
  log(
    s,
    p.type === 'companion'
      ? p.name + ' joined your company.'
      : 'A ' + TYPES[p.type].label.toLowerCase() + ' joined your company.',
  );
  return true;
}
export function promote(s, id, type) {
  const p = s.party.find((p) => p.id === id);
  if (!p || p.level < 2 || !TYPES[p.type].next.includes(type) || s.gold < 25) return false;
  s.gold -= 25;
  p.type = type;
  p.history.push({ day: s.day, event: 'Promoted to ' + TYPES[type].label });
  return true;
}
export function elevate(s, id) {
  const p = s.party.find((p) => p.id === id);
  if (!p || ['hero', 'companion'].includes(p.type) || p.level < 3 || s.gold < 100) return false;
  s.gold -= 100;
  p.type = 'companion';
  p.talentPoints++;
  p.history.push({ day: s.day, event: 'Raised to companion' });
  return true;
}
export function encodeSave(s) {
  if (s.mode === 'battle') throw Error('Finish the battle before saving.');
  return JSON.stringify({
    version: 1,
    campaign: {
      ...s,
      mode: 'campaign',
      visiting: null,
      path: [],
      pursuitId: null,
      waiting: false,
      paused: false,
    },
  });
}
export function decodeSave(raw) {
  const doc = JSON.parse(raw),
    s = doc.campaign;
  if (
    doc.version !== 1 ||
    !s ||
    s.version !== 1 ||
    !Number.isFinite(s.seed) ||
    !Number.isFinite(s.x) ||
    !Number.isFinite(s.y) ||
    !Number.isFinite(s.gold) ||
    !Array.isArray(s.party) ||
    s.party.length < 1 ||
    s.party.length > 10000 ||
    !s.party.some((p) => p.id === s.heroId) ||
    s.terrain?.length !== WORLD_W * WORLD_H ||
    !Array.isArray(s.settlements) ||
    !Array.isArray(s.bandits) ||
    !Array.isArray(s.factions) ||
    !Array.isArray(s.events) ||
    !s.dynasty
  )
    throw Error('This is not a supported PixelKingdom save.');
  for (const p of s.party)
    if (
      !p ||
      typeof p.id !== 'string' ||
      typeof p.name !== 'string' ||
      !TYPES[p.type] ||
      !Number.isFinite(p.health) ||
      !p.skills ||
      !p.talents ||
      !p.equipment
    )
      throw Error('The saved roster is incomplete.');
  s.mode = 'campaign';
  s.path = [];
  s.pursuitId = null;
  s.waiting = false;
  s.paused = false;
  s.visiting = null;
  ensureFeatures(s);
  return s;
}
export function rewardBattle(s, b) {
  const victory = b.result === 'victory';
  const xpBonus = 1 + bestTalent(s, 'drill') * 0.1;
  const fallen = [];
  for (const u of b.units.filter((u) => u.side === 0)) {
    const p = s.party.find((p) => p.id === u.personId);
    if (!p) continue;
    if (u.hp <= 0) {
      if (
        p.type === 'hero' ||
        p.type === 'companion' ||
        random(hash(p.id + ':' + s.day))() > 0.45
      ) {
        p.health = 15;
        p.wounded = true;
        p.history.push({ day: s.day, event: 'Wounded in battle' });
      } else fallen.push(p);
    } else {
      p.health = Math.max(15, Math.round((u.hp / u.maxHp) * 100));
      p.wounded = p.health < 35;
    }
    p.kills += u.kills;
    addXP(p, Math.round(((victory ? 25 : 10) + u.kills * 10) * xpBonus));
  }
  s.dead.push(...fallen.map((p) => ({ ...p, died: s.day })));
  s.party = s.party.filter((p) => !fallen.some((f) => f.id === p.id));
  for (const key of Object.keys(s.formationLeaders))
    if (!s.party.some((p) => p.id === s.formationLeaders[key])) delete s.formationLeaders[key];
  if (victory) {
    s.gold += b.enemyCount * 12;
    s.renown += b.enemyCount;
    s.clanLevel = Math.floor(s.renown / 50);
    const enemy = s.bandits.find((x) => x.id === b.enemyId);
    if (enemy) enemy.alive = false;
    if (s.quest?.targetId === b.enemyId) {
      s.quest.done = true;
      log(
        s,
        'Contract fulfilled. Return to ' +
          s.settlements.find((t) => t.id === s.quest.townId)?.name +
          '.',
      );
    }
    log(s, `Victory. ${b.enemyCount * 12} crowns recovered; ${fallen.length} soldiers lost.`);
  } else {
    s.gold = Math.floor(s.gold * 0.65);
    s.food = Math.floor(s.food * 0.5);
    const home = s.settlements.find((t) => t.id === s.homeId);
    s.x = home.x;
    s.y = home.y;
    log(
      s,
      `Captured and released after ransom. ${fallen.length} soldiers lost; your survivors return to ${home.name}.`,
    );
  }
  capturePrisoners(s, b);
  s.mode = 'campaign';
  s.path = [];
  s.waiting = false;
  return fallen;
}

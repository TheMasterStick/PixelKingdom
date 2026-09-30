import { stats, createPerson, distance, clamp, random, hash } from './core.js';
import {
  BATTLE_WIDTH,
  BATTLE_HEIGHT,
  SOUTH_DEPLOYMENT,
  generateBattleTerrain,
  openPosition,
  moveOnTerrain,
  positionClear,
  segmentClear,
  terrainAt,
} from './terrain.js';
export const BW = BATTLE_WIDTH,
  BH = BATTLE_HEIGHT;
export { SOUTH_DEPLOYMENT };
export const FORMATIONS = ['infantry', 'archers', 'hero'];
export const FORMATION_NAMES = {
  infantry: 'Foot company',
  archers: 'Bow company',
  hero: 'Your hero',
};
function role(p) {
  return ['archer', 'marksman'].includes(p.type)
    ? 'archers'
    : p.type === 'hero'
      ? 'hero'
      : 'infantry';
}
export function createBattle(s, enemy) {
  const b = {
    phase: 'deployment',
    paused: true,
    time: 0,
    result: null,
    enemyId: enemy.id,
    enemyCount: enemy.count,
    units: [],
    formations: {},
    selected: 'infantry',
    projectiles: [],
    rng: random(hash(s.seed + ':' + enemy.id)),
    report: null,
    terrain: generateBattleTerrain(s.seed + ':' + enemy.id),
  };
  for (const [i, id] of FORMATIONS.entries())
    b.formations[id] = {
      id,
      side: 0,
      x: [570, 825, 700][i],
      y: [710, 770, 830][i],
      width: id === 'hero' ? 20 : 120,
      angle: 0,
      stance: 'formation',
      leader: s.formationLeaders[id] || null,
    };
  b.formations.enemy = {
    id: 'enemy',
    side: 1,
    x: 700,
    y: 150,
    width: Math.min(450, enemy.count * 9),
    angle: Math.PI,
    stance: 'charge',
    leader: null,
  };
  const people = s.party.filter((p) => !p.wounded);
  for (const p of people) {
    let formation = role(p);
    if (p.type === 'hero') formation = s.heroFormation || 'hero';
    else if (p.type === 'companion') {
      const assigned = Object.entries(s.formationLeaders).find(([, id]) => id === p.id);
      if (assigned) formation = assigned[0];
    }
    const st = stats(p);
    b.units.push({
      id: p.id,
      personId: p.id,
      name: p.name,
      type: p.type,
      side: 0,
      formation,
      ...st,
      hp: (st.hp * p.health) / 100,
      maxHp: st.hp,
      cooldown: b.rng(),
      kills: 0,
      morale: 100,
      routed: false,
      targetId: null,
      acquire: 0,
      leadership: p.skills.leadership + (p.talents.inspiration || 0) * 2,
      hero: p.type === 'hero' || p.type === 'companion',
    });
  }
  for (let i = 0; i < enemy.count; i++) {
    const p = createPerson(s, 'bandit');
    const st = stats(p);
    b.units.push({
      id: p.id,
      personId: null,
      name: p.name,
      type: p.type,
      side: 1,
      formation: 'enemy',
      ...st,
      maxHp: st.hp,
      cooldown: b.rng(),
      kills: 0,
      morale: 100,
      routed: false,
      targetId: null,
      acquire: 0,
      leadership: 0,
      hero: false,
    });
  }
  b.initial = [people.length, enemy.count];
  deploy(b);
  if (!b.units.some((u) => u.formation === 'infantry'))
    b.selected = b.units[0]?.formation || 'hero';
  s.mode = 'battle';
  return b;
}
function slots(b) {
  const groups = {};
  for (const u of b.units) {
    if (u.hp <= 0 || u.routed) continue;
    (groups[u.formation] ??= []).push(u);
  }
  for (const [id, units] of Object.entries(groups)) {
    const f = b.formations[id],
      cols = Math.max(1, Math.floor(f.width / 10));
    if (b.phase === 'deployment' && f.side === 0) {
      const rows = Math.ceil(units.length / cols),
        depth = Math.max(0, rows - 1) * 10;
      const half = Math.min(cols, units.length) * 5;
      const extentX = Math.abs(Math.cos(f.angle)) * half;
      const extentY = Math.abs(Math.sin(f.angle)) * half;
      const rearX = -Math.sin(f.angle) * depth,
        rearY = Math.cos(f.angle) * depth;
      f.x = clamp(f.x, 15 + extentX - Math.min(0, rearX), BW - 15 - extentX - Math.max(0, rearX));
      f.y = clamp(
        f.y,
        SOUTH_DEPLOYMENT + 10 + extentY - Math.min(0, rearY),
        BH - 15 - extentY - Math.max(0, rearY),
      );
    }
    for (let i = 0; i < units.length; i++) {
      const row = Math.floor(i / cols),
        col = i % cols,
        rowCount = Math.min(cols, units.length - row * cols),
        along = (col - (rowCount - 1) / 2) * 10,
        depth = row * 10;
      units[i].slotX = clamp(
        f.x + Math.cos(f.angle) * along - Math.sin(f.angle) * depth,
        15,
        BW - 15,
      );
      units[i].slotY = clamp(
        f.y + Math.sin(f.angle) * along + Math.cos(f.angle) * depth,
        15,
        BH - 15,
      );
      const safe = openPosition(
        b.terrain,
        units[i].slotX,
        units[i].slotY,
        b.phase === 'deployment' && f.side === 0 ? SOUTH_DEPLOYMENT + 6 : 6,
      );
      units[i].slotX = safe.x;
      units[i].slotY = safe.y;
    }
  }
  return groups;
}
export function deploy(b) {
  slots(b);
  for (const u of b.units) {
    u.x = u.slotX;
    u.y = u.slotY;
  }
}
export function orderLine(b, id, start, end) {
  const f = b.formations[id];
  if (!f || f.side) return;
  let x = (start.x + end.x) / 2,
    y = (start.y + end.y) / 2;
  if (b.phase === 'deployment') y = Math.max(y, SOUTH_DEPLOYMENT + 10);
  f.x = clamp(x, 25, BW - 25);
  f.y = clamp(y, 25, BH - 25);
  const d = distance(start, end);
  if (d > 15) {
    f.width = clamp(d, 20, 450);
    f.angle = Math.atan2(end.y - start.y, end.x - start.x);
  }
  if (f.stance === 'charge' || f.stance === 'hold') f.stance = 'formation';
  if (b.phase === 'deployment') deploy(b);
}
export function setStance(b, id, stance) {
  if (
    b.formations[id] &&
    ['hold', 'formation', 'shield', 'spear', 'skirmish', 'charge'].includes(stance)
  ) {
    b.formations[id].stance = stance;
    if (stance === 'hold')
      for (const u of b.units.filter((u) => u.formation === id)) {
        u.holdX = u.x;
        u.holdY = u.y;
      }
  }
}
export function attachHero(b, formation) {
  const hero = b.units.find((u) => u.type === 'hero');
  if (!hero || !b.formations[formation]) return;
  hero.formation = formation;
  if (b.phase === 'deployment') deploy(b);
}
const CELL = 50,
  key = (x, y) => Math.floor(x / CELL) + Math.floor(y / CELL) * 64;
function indexUnits(units) {
  const map = new Map();
  for (const u of units) {
    if (u.hp <= 0 || u.routed) continue;
    const k = key(u.x, u.y);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(u);
  }
  return map;
}
function nearest(u, grid, radius) {
  let best = null,
    dist = radius;
  const cx = Math.floor(u.x / CELL),
    cy = Math.floor(u.y / CELL),
    r = Math.ceil(radius / CELL);
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      for (const v of grid.get(x + y * 64) || []) {
        if (v.side === u.side) continue;
        const d = distance(u, v);
        if (d < dist) {
          dist = d;
          best = v;
        }
      }
  return best;
}
function move(b, u, x, y, dt, mult = 1) {
  moveOnTerrain(b.terrain, u, x, y, dt, mult);
}
export function tickBattle(b, dt) {
  if (b.phase !== 'battle' || b.paused || b.result) return;
  b.time += dt;
  const alive = b.units.filter((u) => u.hp > 0 && !u.routed),
    grid = indexUnits(alive),
    byId = new Map(alive.map((u) => [u.id, u])),
    groups = slots(b),
    centers = [
      { x: 0, y: 0, n: 0 },
      { x: 0, y: 0, n: 0 },
    ];
  for (const u of alive) {
    const c = centers[u.side];
    c.x += u.x;
    c.y += u.y;
    c.n++;
  }
  for (const c of centers)
    if (c.n) {
      c.x /= c.n;
      c.y /= c.n;
    }
  const buffs = {};
  const hero = alive.find((u) => u.type === 'hero');
  for (const f of Object.values(b.formations)) {
    const leader = byId.get(f.leader) || (hero?.formation === f.id ? hero : null);
    buffs[f.id] = leader && leader.formation === f.id ? leader.leadership : 0;
  }
  for (const u of alive) {
    if (u.hp <= 0) continue;
    const f = b.formations[u.formation],
      ranged = u.range > 40;
    u.cooldown -= dt;
    u.acquire -= dt;
    let target = byId.get(u.targetId);
    if (!target || target.hp <= 0 || target.routed || u.acquire <= 0) {
      target = nearest(u, grid, ranged ? u.range + 60 : 90);
      u.targetId = target?.id || null;
      u.acquire = 0.2 + b.rng() * 0.15;
    }
    const enemy = centers[1 - u.side],
      d = target ? distance(u, target) : Infinity,
      engage = ['charge', 'skirmish'].includes(f.stance),
      clearShot = target && segmentClear(b.terrain, u, target, 1);
    if (f.stance === 'skirmish' && target && d < 85 && ranged) {
      move(b, u, u.x + (u.x - target.x), u.y + (u.y - target.y), dt);
    } else if (engage && target && (d > u.range || !clearShot)) {
      move(b, u, target.x, target.y, dt);
    } else if (engage && !target && enemy.n) {
      move(b, u, enemy.x, enemy.y, dt);
    } else if (!engage && d > u.range) {
      move(
        b,
        u,
        f.stance === 'hold' ? (u.holdX ?? u.slotX) : u.slotX,
        f.stance === 'hold' ? (u.holdY ?? u.slotY) : u.slotY,
        dt,
        f.stance === 'shield' ? 0.65 : 1,
      );
    }
    if (target && d <= u.range && clearShot && u.cooldown <= 0) {
      const tf = b.formations[target.formation],
        frontal =
          (u.x - target.x) * Math.sin(tf.angle) + (u.y - target.y) * -Math.cos(tf.angle) > 0;
      let defense = target.armor + (ranged ? terrainAt(b.terrain, target.x, target.y).cover : 0);
      if (tf.stance === 'shield' && frontal) defense += ranged ? 8 : 5;
      if (tf.stance === 'spear' && frontal && !ranged) defense += 3;
      const bonus = (buffs[f.id] || 0) * 0.7 + (f.stance === 'spear' && !ranged ? 2 : 0);
      const damage = Math.max(2, u.damage + bonus - defense) * (0.85 + b.rng() * 0.3);
      target.hp -= damage;
      u.cooldown = ranged ? 1.6 : 1.05;
      if (ranged) b.projectiles.push({ x: u.x, y: u.y, tx: target.x, ty: target.y, life: 0.22 });
      if (target.hp <= 0) {
        target.hp = 0;
        u.kills++;
      }
    }
    const losses = 1 - centers[u.side].n / b.initial[u.side];
    u.morale = clamp(
      100 - losses * 90 - (1 - u.hp / u.maxHp) * 28 + (buffs[f.id] || 0) * 3,
      0,
      100,
    );
    if (!u.hero && u.morale < 14) {
      u.routed = true;
      continue;
    }
    // Bounded local separation prevents a quadratic all-army neighbor scan.
    let checked = 0;
    const cx = Math.floor(u.x / CELL),
      cy = Math.floor(u.y / CELL);
    outer: for (let y = cy - 1; y <= cy + 1; y++)
      for (let x = cx - 1; x <= cx + 1; x++)
        for (const v of grid.get(x + y * 64) || []) {
          if (v === u) continue;
          const dd = distance(u, v);
          if (dd > 0 && dd < 7) {
            const push = (7 - dd) * 0.35;
            const nx = u.x + ((u.x - v.x) / dd) * push,
              ny = u.y + ((u.y - v.y) / dd) * push;
            if (positionClear(b.terrain, nx, ny)) {
              u.x = nx;
              u.y = ny;
            }
            if (++checked >= 12) break outer;
          }
        }
  }
  for (const u of b.units)
    if (u.routed && u.hp > 0) move(b, u, u.x, u.side === 0 ? BH - 5 : 5, dt, 1.3);
  b.projectiles = b.projectiles.filter((p) => (p.life -= dt) > 0);
  const counts = [0, 0];
  for (const u of b.units) if (u.hp > 0 && !u.routed) counts[u.side]++;
  if (!counts[0] || !counts[1]) {
    b.result = counts[0] ? 'victory' : 'defeat';
    b.phase = 'result';
    b.paused = true;
  }
}

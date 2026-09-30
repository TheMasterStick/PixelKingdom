import { clamp, distance, hash, random } from './core.js';

export const BATTLE_WIDTH = 1400;
export const BATTLE_HEIGHT = 900;
export const SOUTH_DEPLOYMENT = 650;
const CELL = 20;
const COLS = Math.ceil(BATTLE_WIDTH / CELL);
const ROWS = Math.ceil(BATTLE_HEIGHT / CELL);
const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export function generateBattleTerrain(seed) {
  const rng = random(hash(seed + ':terrain'));
  const terrain = { seed, objects: [], patches: [], routeCache: new Map() };
  const groves = [
    { x: 230, y: 310, r: 120 },
    { x: 415, y: 490, r: 95 },
    { x: 1110, y: 325, r: 130 },
    { x: 1000, y: 580, r: 110 },
    { x: 100, y: 690, r: 70 },
    { x: 1280, y: 735, r: 75 },
  ];
  for (const grove of groves) {
    const gx = grove.x + (rng() - 0.5) * 70,
      gy = grove.y + (rng() - 0.5) * 50;
    terrain.patches.push({ kind: 'woodland', x: gx, y: gy, rx: grove.r, ry: grove.r * 0.8 });
    for (let i = 0; i < 17; i++) {
      const a = rng() * Math.PI * 2,
        d = Math.sqrt(rng()) * grove.r;
      const o = {
        kind: 'tree',
        x: gx + Math.cos(a) * d,
        y: gy + Math.sin(a) * d * 0.8,
        r: 7 + rng() * 3,
        size: 27 + rng() * 17,
        variant: rng() > 0.5 ? 'pine' : 'oak',
      };
      if (!terrain.objects.some((p) => distance(p, o) < p.r + o.r + 11)) terrain.objects.push(o);
    }
  }
  for (let i = 0; i < 22; i++) {
    const x = 90 + rng() * 1220,
      y = 230 + rng() * 390;
    if (Math.abs(x - 700) < 90) continue; // Keep a clear north–south approach.
    const o = { kind: 'rock', x, y, r: 12 + rng() * 12, size: 18 + rng() * 15, variant: rng() };
    if (!terrain.objects.some((p) => distance(p, o) < p.r + o.r + 10)) terrain.objects.push(o);
  }
  for (let i = 0; i < 50; i++) {
    const o = {
      kind: 'bush',
      x: 60 + rng() * 1280,
      y: 200 + rng() * 440,
      r: 14 + rng() * 9,
      size: 13 + rng() * 9,
      variant: rng(),
    };
    terrain.objects.push(o);
  }
  terrain.patches.push({ kind: 'mud', x: 505 + rng() * 50, y: 390 + rng() * 70, rx: 70, ry: 48 });
  terrain.patches.push({ kind: 'mud', x: 840 + rng() * 60, y: 560 + rng() * 30, rx: 90, ry: 40 });
  terrain.patches.push({ kind: 'gravel', x: 835, y: 285, rx: 92, ry: 55 });
  prepareNavigation(terrain);
  return terrain;
}
export function prepareNavigation(terrain) {
  terrain.solids = terrain.objects.filter((o) => o.kind === 'tree' || o.kind === 'rock');
  terrain.blocked = new Uint8Array(COLS * ROWS);
  terrain.costs = new Float32Array(COLS * ROWS);
  terrain.routeCache = new Map();
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const id = y * COLS + x,
        p = { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 };
      // Conservative cell occupancy ensures a clear cell-to-cell path for a soldier's radius.
      terrain.blocked[id] = terrain.solids.some((o) => {
        const dx = Math.max(Math.abs(p.x - o.x) - CELL / 2, 0),
          dy = Math.max(Math.abs(p.y - o.y) - CELL / 2, 0);
        return dx * dx + dy * dy < (o.r + 4) ** 2;
      })
        ? 1
        : 0;
      terrain.costs[id] = 1 / terrainAt(terrain, p.x, p.y).speed;
    }
}
export function terrainAt(terrain, x, y) {
  let speed = 1,
    cover = 0,
    label = 'Open ground';
  for (const p of terrain.patches)
    if (((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 < 1) {
      if (p.kind === 'mud') {
        speed = Math.min(speed, 0.55);
        label = 'Wet ground';
      }
      if (p.kind === 'woodland') {
        speed = Math.min(speed, 0.78);
        cover = Math.max(cover, 3);
        label = 'Woodland';
      }
      if (p.kind === 'gravel') {
        speed = Math.min(speed, 0.85);
        label = 'Stony ground';
      }
    }
  for (const p of terrain.objects)
    if (p.kind === 'bush' && Math.hypot(x - p.x, y - p.y) < p.r) {
      speed = Math.min(speed, 0.68);
      cover = Math.max(cover, 4);
      label = 'Brush';
    }
  return { speed, cover, label };
}
export function positionClear(terrain, x, y, padding = 4) {
  return (
    x >= 5 &&
    x <= BATTLE_WIDTH - 5 &&
    y >= 5 &&
    y <= BATTLE_HEIGHT - 5 &&
    !terrain.solids.some((o) => Math.hypot(x - o.x, y - o.y) < o.r + padding)
  );
}
export function segmentClear(terrain, a, b, padding = 4) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l = dx * dx + dy * dy;
  return !terrain.solids.some((o) => {
    const t = l ? clamp(((o.x - a.x) * dx + (o.y - a.y) * dy) / l, 0, 1) : 0;
    return Math.hypot(a.x + t * dx - o.x, a.y + t * dy - o.y) < o.r + padding;
  });
}
export function openPosition(terrain, x, y, minY = 5, maxY = BATTLE_HEIGHT - 5) {
  const point = { x: clamp(x, 8, BATTLE_WIDTH - 8), y: clamp(y, minY, maxY) };
  if (positionClear(terrain, point.x, point.y)) return point;
  for (let r = 10; r < 180; r += 10)
    for (let i = 0; i < 16; i++) {
      const p = {
        x: clamp(point.x + Math.cos((i * Math.PI) / 8) * r, 8, BATTLE_WIDTH - 8),
        y: clamp(point.y + Math.sin((i * Math.PI) / 8) * r, minY, maxY),
      };
      if (positionClear(terrain, p.x, p.y)) return p;
    }
  return point;
}
function cellId(p) {
  return (
    clamp(Math.floor(p.y / CELL), 0, ROWS - 1) * COLS + clamp(Math.floor(p.x / CELL), 0, COLS - 1)
  );
}
function cellPoint(id) {
  return { x: (id % COLS) * CELL + CELL / 2, y: Math.floor(id / COLS) * CELL + CELL / 2 };
}
function openCell(terrain, p) {
  const id = cellId(p);
  if (!terrain.blocked[id]) return id;
  let best = -1,
    d = Infinity;
  const cx = id % COLS,
    cy = Math.floor(id / COLS);
  for (let y = Math.max(0, cy - 6); y <= Math.min(ROWS - 1, cy + 6); y++)
    for (let x = Math.max(0, cx - 6); x <= Math.min(COLS - 1, cx + 6); x++) {
      const candidate = y * COLS + x,
        dist = distance(p, cellPoint(candidate));
      if (!terrain.blocked[candidate] && dist < d) {
        best = candidate;
        d = dist;
      }
    }
  return best;
}
// Shared, cached A* routes. The cache is bounded and geometry is immutable during a battle.
export function terrainRoute(terrain, start, goal) {
  const from = openCell(terrain, start),
    to = openCell(terrain, goal);
  if (from < 0 || to < 0) return [];
  const cacheKey = from + ':' + to;
  if (terrain.routeCache.has(cacheKey)) return terrain.routeCache.get(cacheKey);
  const open = [from],
    scores = new Map([[from, 0]]),
    parents = new Map(),
    closed = new Set();
  const endpoint = cellPoint(to),
    heuristic = (id) => distance(cellPoint(id), endpoint) / CELL;
  let route = [];
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++)
      if (scores.get(open[i]) + heuristic(open[i]) < scores.get(open[best]) + heuristic(open[best]))
        best = i;
    const current = open.splice(best, 1)[0];
    if (current === to) {
      let id = current;
      while (id !== from) {
        route.unshift(cellPoint(id));
        id = parents.get(id);
      }
      route.unshift(cellPoint(from));
      break;
    }
    closed.add(current);
    const cx = current % COLS,
      cy = Math.floor(current / COLS);
    for (const [dx, dy] of DIRECTIONS) {
      const x = cx + dx,
        y = cy + dy;
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      const id = y * COLS + x;
      if (terrain.blocked[id] || closed.has(id)) continue;
      if (dx && dy && (terrain.blocked[cy * COLS + x] || terrain.blocked[y * COLS + cx])) continue;
      const score = scores.get(current) + Math.hypot(dx, dy) * terrain.costs[id];
      if (score < (scores.get(id) ?? Infinity)) {
        scores.set(id, score);
        parents.set(id, current);
        if (!open.includes(id)) open.push(id);
      }
    }
  }
  if (terrain.routeCache.size >= 192)
    terrain.routeCache.delete(terrain.routeCache.keys().next().value);
  terrain.routeCache.set(cacheKey, route);
  return route;
}
export function moveOnTerrain(terrain, u, x, y, dt, mult = 1) {
  let goal = openPosition(terrain, x, y),
    waypoint = goal;
  if (!segmentClear(terrain, u, goal)) {
    if (!u.navGoal || distance(u.navGoal, goal) > 40 || !u.navRoute?.length) {
      u.navGoal = goal;
      u.navRoute = terrainRoute(terrain, u, goal).map((p) => ({ ...p }));
    }
    while (u.navRoute?.length && distance(u, u.navRoute[0]) < 8) u.navRoute.shift();
    // Skip visible intermediate waypoints so soldiers don't follow an obvious tile grid.
    while (u.navRoute?.length > 1 && segmentClear(terrain, u, u.navRoute[1])) u.navRoute.shift();
    waypoint = u.navRoute?.[0] || goal;
  } else {
    u.navGoal = null;
    u.navRoute = null;
  }
  const d = distance(u, waypoint);
  if (d < 0.5) return;
  const step = Math.min(d, u.speed * dt * mult * terrainAt(terrain, u.x, u.y).speed);
  const next = {
    x: clamp(u.x + ((waypoint.x - u.x) / d) * step, 5, BATTLE_WIDTH - 5),
    y: clamp(u.y + ((waypoint.y - u.y) / d) * step, 5, BATTLE_HEIGHT - 5),
  };
  if (positionClear(terrain, next.x, next.y) && segmentClear(terrain, u, next)) {
    u.x = next.x;
    u.y = next.y;
  }
}

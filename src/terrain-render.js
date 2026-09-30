import { random, hash } from './core.js';
import { BATTLE_WIDTH as W, BATTLE_HEIGHT as H } from './terrain.js';

// Terrain art is derived from the same objects used by navigation and combat.
// Cache the static battlefield once, rather than repainting every tree each frame.
export function paintTerrain(terrain) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d'),
    rng = random(hash(terrain.seed + ':paint'));
  g.fillStyle = '#526b3e';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1700; i++) {
    g.fillStyle = ['#5b744633', '#314f3330', '#81905722'][i % 3];
    g.fillRect(
      Math.floor((rng() * W) / 4) * 4,
      Math.floor((rng() * H) / 4) * 4,
      16 + rng() * 100,
      8 + rng() * 60,
    );
  }
  // A worn track through the clearing leaves distinct open avenues between wooded flanks.
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = '#9c94623d';
  g.lineWidth = 56;
  g.beginPath();
  g.moveTo(705, H);
  g.bezierCurveTo(590, 650, 815, 450, 685, 0);
  g.stroke();
  for (const p of terrain.patches) {
    g.fillStyle = { woodland: '#243e2b42', mud: '#605647', gravel: '#85847078' }[p.kind];
    g.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2,
        r = 0.85 + rng() * 0.25,
        x = p.x + Math.cos(a) * p.rx * r,
        y = p.y + Math.sin(a) * p.ry * r;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    g.fill();
    for (let i = 0; i < 40; i++) {
      const a = rng() * Math.PI * 2,
        r = Math.sqrt(rng()),
        x = p.x + Math.cos(a) * p.rx * r,
        y = p.y + Math.sin(a) * p.ry * r;
      g.fillStyle =
        p.kind === 'mud' ? '#b0b69a30' : p.kind === 'gravel' ? '#b6b39b77' : '#38563b55';
      g.fillRect(x, y, p.kind === 'mud' ? 10 : 3, 2);
    }
  }
  for (let i = 0; i < 1700; i++) {
    const x = Math.floor(rng() * W),
      y = Math.floor(rng() * H);
    g.fillStyle = i % 6 ? '#aac17a44' : '#d6c59888';
    g.fillRect(x, y, 2, 2);
    if (i % 3 === 0) {
      g.fillStyle = '#77945299';
      g.fillRect(x - 2, y - 3, 2, 4);
      g.fillRect(x + 2, y - 4, 2, 5);
    }
  }
  for (const o of [...terrain.objects].sort((a, b) => a.y - b.y)) {
    g.save();
    g.translate(Math.round(o.x), Math.round(o.y));
    if (o.kind === 'tree') tree(g, o);
    else if (o.kind === 'rock') rock(g, o);
    else bush(g, o);
    g.restore();
  }
  return canvas;
}
function polygon(g, points, fill) {
  g.fillStyle = fill;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function tree(g, o) {
  const s = o.size;
  g.fillStyle = '#172d2866';
  g.beginPath();
  g.ellipse(12, 6, s * 0.72, 10, -0.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#443e2d';
  g.fillRect(-4, -8, 8, 17);
  g.fillStyle = '#b1aa7b';
  g.fillRect(-2, -8, 3, 16);
  if (o.variant === 'pine') {
    for (let layer = 0; layer < 3; layer++) {
      const width = s * (0.72 - layer * 0.16),
        base = -9 - layer * s * 0.32;
      polygon(
        g,
        [
          [-width, base],
          [0, base - s * 0.8],
          [width, base],
        ],
        ['#254d39', '#32644a', '#477d56'][layer],
      );
      polygon(
        g,
        [
          [-width, base],
          [0, base - s * 0.8],
          [0, base - 3],
        ],
        ['#376946', '#497d50', '#68975a'][layer],
      );
    }
  } else {
    const clusters = [
      [-s * 0.46, -s * 0.55, s * 0.54],
      [s * 0.36, -s * 0.7, s * 0.57],
      [0, -s, s * 0.6],
      [-s * 0.15, -s * 0.55, s * 0.5],
    ];
    clusters.forEach(([x, y, r], i) => {
      polygon(
        g,
        [
          [x - r, y],
          [x - r * 0.7, y - r * 0.7],
          [x, y - r],
          [x + r * 0.8, y - r * 0.55],
          [x + r, y + r * 0.2],
          [x + r * 0.45, y + r * 0.65],
          [x - r * 0.4, y + r * 0.7],
        ],
        ['#294e32', '#3e683c', '#538044', '#416b35'][i],
      );
      g.fillStyle = '#85a752';
      g.fillRect(x - r * 0.45, y - r * 0.6, r * 0.55, 5);
      g.fillStyle = '#6e9848';
      g.fillRect(x + r * 0.1, y - r * 0.4, r * 0.45, 6);
    });
  }
  // The small ground ring exposes the actual trunk collision footprint.
  g.strokeStyle = '#24372e66';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0, 5, o.r, o.r * 0.5, 0, 0, Math.PI * 2);
  g.stroke();
}
function rock(g, o) {
  const r = o.r;
  g.fillStyle = '#24332b66';
  g.beginPath();
  g.ellipse(5, 6, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
  g.fill();
  polygon(
    g,
    [
      [-r, 2],
      [-r * 0.65, -r * 0.65],
      [r * 0.25, -r],
      [r * 0.9, -r * 0.4],
      [r, 6],
      [r * 0.2, r * 0.55],
      [-r * 0.6, r * 0.4],
    ],
    '#6d7469',
  );
  polygon(
    g,
    [
      [-r, 2],
      [-r * 0.65, -r * 0.65],
      [r * 0.25, -r],
      [r * 0.1, -1],
    ],
    '#afb3a0',
  );
  polygon(
    g,
    [
      [r * 0.25, -r],
      [r * 0.9, -r * 0.4],
      [r, 6],
      [r * 0.1, -1],
    ],
    '#899280',
  );
  g.fillStyle = '#c5c7b0';
  g.fillRect(-r * 0.45, -r * 0.55, r * 0.38, 3);
}
function bush(g, o) {
  const r = o.size;
  g.fillStyle = '#2b442c';
  g.fillRect(-r * 0.8, -4, r * 1.6, 9);
  for (const [x, y, w] of [
    [-r * 0.7, -r * 0.3, r * 0.8],
    [-r * 0.2, -r * 0.6, r],
    [r * 0.35, -r * 0.35, r * 0.6],
  ]) {
    g.fillStyle = '#426b37';
    g.fillRect(x, y, w, r * 0.5);
    g.fillStyle = '#729348';
    g.fillRect(x + 2, y, w * 0.55, 3);
  }
  if (o.variant > 0.8) {
    g.fillStyle = '#b697ba';
    g.fillRect(-4, -4, 3, 3);
    g.fillRect(4, -7, 3, 3);
  }
}

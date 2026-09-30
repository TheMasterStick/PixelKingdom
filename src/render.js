import { WORLD_W, WORLD_H, tile } from './campaign.js';
import { BW, BH, SOUTH_DEPLOYMENT } from './battle.js';
import { paintTerrain } from './terrain-render.js';
import { random, hash } from './core.js';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = { x: 0, y: 0, zoom: 15 };
    this.terrain = null;
    this.seed = null;
    this.dragLine = null;
    this.hover = null;
    this.width = 1;
    this.height = 1;
    this.battleScale = 1;
  }
  resize() {
    const r = this.canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    this.width = r.width;
    this.height = r.height;
    if (
      this.canvas.width !== Math.round(r.width * dpr) ||
      this.canvas.height !== Math.round(r.height * dpr)
    ) {
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  center(s) {
    this.camera.x = s.x;
    this.camera.y = s.y;
  }
  screen(x, y) {
    return {
      x: (x - this.camera.x) * this.camera.zoom + this.width / 2,
      y: (y - this.camera.y) * this.camera.zoom + this.height / 2,
    };
  }
  world(x, y) {
    return {
      x: (x - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (y - this.height / 2) / this.camera.zoom + this.camera.y,
    };
  }
  battlePoint(x, y) {
    return {
      x: (x - this.battleOffsetX) / this.battleScale,
      y: (y - this.battleOffsetY) / this.battleScale,
    };
  }
  prepare(s) {
    const c = document.createElement('canvas');
    c.width = WORLD_W * 8;
    c.height = WORLD_H * 8;
    const g = c.getContext('2d'),
      rng = random(s.seed);
    for (let y = 0; y < WORLD_H; y++)
      for (let x = 0; x < WORLD_W; x++) {
        const t = tile(s, x, y),
          n = rng(),
          col =
            t === 0
              ? ['#284b50', '#2a4e53', '#2c5154']
              : t === 1
                ? ['#718763', '#7e9067', '#83966d', '#788d63']
                : t === 2
                  ? ['#455f4a', '#50694e', '#49654c']
                  : ['#8b907b', '#989985', '#838c79'];
        g.fillStyle = col[Math.floor(n * col.length)];
        g.fillRect(x * 8, y * 8, 8, 8);
        if (t === 2) {
          g.fillStyle = '#2f4c3c';
          g.fillRect(x * 8 + 2, y * 8 + 2, 3, 4);
          g.fillStyle = '#5e7955';
          g.fillRect(x * 8 + 2, y * 8 + 1, 2, 2);
        }
        if (t === 3) {
          g.fillStyle = '#bec1a5';
          g.beginPath();
          g.moveTo(x * 8 + 1, y * 8 + 6);
          g.lineTo(x * 8 + 4, y * 8);
          g.lineTo(x * 8 + 7, y * 8 + 6);
          g.fill();
        }
        if (
          t !== 0 &&
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dy]) => tile(s, x + dx, y + dy) === 0)
        ) {
          g.fillStyle = '#b0ae79';
          g.fillRect(x * 8, y * 8, 8, 2);
        }
      }
    this.terrain = c;
    this.seed = s.seed;
  }
  draw(s, b) {
    this.resize();
    if (b) this.drawBattle(b);
    else this.drawWorld(s);
  }
  drawWorld(s) {
    if (this.seed !== s.seed) this.prepare(s);
    const g = this.ctx,
      { width: w, height: h } = this;
    g.fillStyle = '#294b50';
    g.fillRect(0, 0, w, h);
    const origin = this.screen(0, 0),
      z = this.camera.zoom;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.terrain, origin.x, origin.y, WORLD_W * z, WORLD_H * z);
    // Political claims deliberately occupy only small regions of a much larger neutral world.
    for (const f of s.factions) {
      const p = this.screen(f.x, f.y);
      g.strokeStyle = f.color + '75';
      g.fillStyle = f.color + '0c';
      g.lineWidth = 1.5;
      g.setLineDash([5, 5]);
      g.beginPath();
      g.ellipse(p.x, p.y, 14 * z, 11 * z, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.setLineDash([]);
      if (z < 13) {
        g.textAlign = 'center';
        g.font = '11px Georgia';
        g.fillStyle = '#e4e4c3';
        g.fillText(f.name.toUpperCase(), p.x, p.y - 5 * z);
      }
    }
    if (s.path.length) {
      g.strokeStyle = '#f0d495';
      g.lineWidth = 2;
      g.setLineDash([4, 5]);
      g.beginPath();
      let p = this.screen(s.x, s.y);
      g.moveTo(p.x, p.y);
      for (const point of s.path) {
        p = this.screen(point.x, point.y);
        g.lineTo(p.x, p.y);
      }
      g.stroke();
      g.setLineDash([]);
      g.strokeRect(p.x - 5, p.y - 5, 10, 10);
    }
    for (const t of s.settlements) {
      const p = this.screen(t.x, t.y);
      if (p.x < -80 || p.x > w + 80 || p.y < -40 || p.y > h + 40) continue;
      const color = s.factions[t.faction].color,
        selected = s.selectedSettlement === t.id;
      // Small pixel settlements distinguish rural holdings from fortified seats.
      g.fillStyle = '#1d3027';
      g.fillRect(p.x - 14, p.y + 7, 28, 4);
      if (t.kind === 'village') {
        for (const [dx, dy] of [
          [-10, 0],
          [2, -4],
        ]) {
          g.fillStyle = '#d1b889';
          g.fillRect(p.x + dx, p.y + dy, 10, 9);
          g.fillStyle = '#8b6047';
          g.beginPath();
          g.moveTo(p.x + dx - 2, p.y + dy);
          g.lineTo(p.x + dx + 5, p.y + dy - 7);
          g.lineTo(p.x + dx + 12, p.y + dy);
          g.fill();
          g.fillStyle = '#514332';
          g.fillRect(p.x + dx + 4, p.y + dy + 4, 3, 5);
        }
      } else {
        g.fillStyle = '#a5a78d';
        g.fillRect(p.x - 12, p.y - 3, 24, 13);
        g.fillRect(p.x - 14, p.y - 10, 7, 20);
        g.fillRect(p.x + 7, p.y - 10, 7, 20);
        g.fillStyle = '#d0c5a1';
        for (let k = -14; k <= 12; k += 5) g.fillRect(p.x + k, p.y - 12, 3, 5);
        g.fillStyle = '#434b3b';
        g.fillRect(p.x - 3, p.y + 2, 6, 8);
      }
      g.fillStyle = '#d7bf85';
      g.fillRect(p.x + 13, p.y - 20, 2, 20);
      g.fillStyle = color;
      g.fillRect(p.x + 15, p.y - 20, 10, 6);
      if (selected) {
        g.strokeStyle = '#ffe3a1';
        g.lineWidth = 1;
        g.beginPath();
        g.arc(p.x, p.y, 13, 0, Math.PI * 2);
        g.stroke();
      }
      if (z > 8 || t.kind === 'town' || selected) {
        g.textAlign = 'center';
        g.font = (t.kind === 'town' ? 'bold ' : '') + '12px Georgia';
        g.lineWidth = 4;
        g.strokeStyle = '#2e432ddd';
        g.strokeText(t.name, p.x, p.y + 23);
        g.fillStyle = selected ? '#fff1c6' : '#eff0d9';
        g.fillText(t.name, p.x, p.y + 23);
      }
    }
    for (const b of s.bandits) {
      if (!b.alive) continue;
      const p = this.screen(b.x, b.y);
      g.fillStyle = '#b9654e';
      g.strokeStyle = '#482e26';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(p.x, p.y - 6);
      g.lineTo(p.x + 5, p.y);
      g.lineTo(p.x, p.y + 6);
      g.lineTo(p.x - 5, p.y);
      g.closePath();
      g.fill();
      g.stroke();
      if (z > 13) {
        g.font = '10px system-ui';
        g.textAlign = 'center';
        g.fillStyle = '#ffdac3';
        g.strokeStyle = '#402d27';
        g.lineWidth = 3;
        g.strokeText(b.count, p.x, p.y - 11);
        g.fillText(b.count, p.x, p.y - 11);
      }
    }
    const p = this.screen(s.x, s.y);
    g.strokeStyle = '#f3d693';
    g.lineWidth = 1.5;
    g.fillStyle = '#263d30';
    g.beginPath();
    g.arc(p.x, p.y, 12, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#f9dda0';
    g.beginPath();
    g.moveTo(p.x, p.y - 8);
    g.lineTo(p.x + 5, p.y + 5);
    g.lineTo(p.x, p.y + 2);
    g.lineTo(p.x - 5, p.y + 5);
    g.closePath();
    g.fill();
    g.font = 'bold 11px system-ui';
    g.textAlign = 'center';
    g.fillStyle = '#fff0bb';
    g.strokeStyle = '#253b28';
    g.lineWidth = 4;
    g.strokeText(s.party[0].name, p.x, p.y - 21);
    g.fillText(s.party[0].name, p.x, p.y - 21);
    // Subtle map vignette, with a restrained compass.
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, Math.max(w, h) * 0.65);
    v.addColorStop(0, '#172a1b00');
    v.addColorStop(1, '#10281b66');
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e0ddba';
    g.font = '12px Georgia';
    g.fillText('N', w - 40, 105);
    g.strokeStyle = '#d8d7b799';
    g.beginPath();
    g.moveTo(w - 40, 112);
    g.lineTo(w - 40, 155);
    g.moveTo(w - 54, 138);
    g.lineTo(w - 26, 138);
    g.stroke();
    g.fillStyle = '#d8d7b7';
    g.beginPath();
    g.moveTo(w - 40, 117);
    g.lineTo(w - 44, 130);
    g.lineTo(w - 36, 130);
    g.fill();
  }
  drawBattle(b) {
    const g = this.ctx,
      w = this.width,
      h = this.height;
    g.fillStyle = '#334935';
    g.fillRect(0, 0, w, h);
    this.battleScale = Math.min(w / BW, (h - 130) / BH);
    this.battleOffsetX = (w - BW * this.battleScale) / 2;
    this.battleOffsetY = 70 + (h - 130 - BH * this.battleScale) / 2;
    g.save();
    g.translate(this.battleOffsetX, this.battleOffsetY);
    g.scale(this.battleScale, this.battleScale);
    g.textAlign = 'left';
    if (this.battleTerrain !== b.terrain) {
      this.battleTerrain = b.terrain;
      this.battleGround = paintTerrain(b.terrain);
    }
    g.imageSmoothingEnabled = false;
    g.drawImage(this.battleGround, 0, 0);
    if (b.phase === 'deployment') {
      g.fillStyle = '#73b8d122';
      g.fillRect(0, SOUTH_DEPLOYMENT, BW, BH - SOUTH_DEPLOYMENT);
      g.strokeStyle = '#9ed3dcbb';
      g.lineWidth = 2;
      g.setLineDash([12, 9]);
      g.beginPath();
      g.moveTo(0, SOUTH_DEPLOYMENT);
      g.lineTo(BW, SOUTH_DEPLOYMENT);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#d3eee7';
      g.font = 'bold 16px system-ui';
      g.fillText('SOUTH · YOUR DEPLOYMENT AREA', 24, BH - 22);
    }
    g.textAlign = 'center';
    g.font = 'bold 16px system-ui';
    g.fillStyle = '#201d16aa';
    g.fillRect(BW / 2 - 120, 12, 240, 31);
    g.fillStyle = '#f0c3a3';
    g.fillText('NORTH · ENEMY APPROACH', BW / 2, 33);
    g.textAlign = 'left';
    for (const u of b.units)
      if (u.hp <= 0) {
        g.fillStyle = '#523f33aa';
        g.fillRect(u.x - 3, u.y - 2, 6, 4);
      }
    for (const f of Object.values(b.formations)) {
      if (f.side || f.id !== b.selected) continue;
      g.strokeStyle = '#f6dc89';
      g.lineWidth = 2;
      g.setLineDash([5, 5]);
      g.beginPath();
      g.moveTo(f.x - (Math.cos(f.angle) * f.width) / 2, f.y - (Math.sin(f.angle) * f.width) / 2);
      g.lineTo(f.x + (Math.cos(f.angle) * f.width) / 2, f.y + (Math.sin(f.angle) * f.width) / 2);
      g.stroke();
      g.setLineDash([]);
      const fx = Math.sin(f.angle),
        fy = -Math.cos(f.angle);
      const ax = f.x + fx * 38,
        ay = f.y + fy * 38;
      g.beginPath();
      g.moveTo(f.x, f.y);
      g.lineTo(ax, ay);
      g.moveTo(ax - fx * 10 - fy * 6, ay - fy * 10 + fx * 6);
      g.lineTo(ax, ay);
      g.lineTo(ax - fx * 10 + fy * 6, ay - fy * 10 - fx * 6);
      g.stroke();
    }
    for (const u of b.units) {
      if (u.hp <= 0) continue;
      g.globalAlpha = u.routed ? 0.4 : 1;
      g.fillStyle = u.hero
        ? '#f9d97e'
        : u.side
          ? '#bc604b'
          : u.formation === 'archers'
            ? '#bbd2aa'
            : '#89bdd0';
      // Pixel silhouettes remain batched Canvas primitives, with team-coloured coats.
      const coat = g.fillStyle;
      g.fillStyle = '#23382bc0';
      g.fillRect(u.x - 5, u.y + 4, 11, 3);
      g.fillStyle = coat;
      g.fillRect(u.x - 3, u.y - 2, 7, 7);
      g.fillStyle = '#dbc49e';
      g.fillRect(u.x - 2, u.y - 6, 5, 4);
      g.fillStyle = u.type === 'veteran' ? '#c7c8b3' : '#655b41';
      g.fillRect(u.x - 2, u.y - 7, 5, 2);
      g.fillStyle = '#35362b';
      g.fillRect(u.x - 3, u.y + 5, 3, 3);
      g.fillRect(u.x + 2, u.y + 5, 3, 3);
      g.fillStyle = u.hero ? '#e7c176' : '#b4bea5';
      g.fillRect(u.x + 5, u.y - 5, 1, 10);
      if (u.formation !== 'archers') {
        g.fillStyle = coat;
        g.fillRect(u.x - 6, u.y, 3, 5);
      }
      if (u.hero) {
        g.strokeStyle = '#fce6aa';
        g.beginPath();
        g.arc(u.x, u.y, 9, 0, Math.PI * 2);
        g.stroke();
      }
      if (u.hp < u.maxHp) {
        g.fillStyle = '#422f2b';
        g.fillRect(u.x - 5, u.y - 9, 10, 2);
        g.fillStyle = '#c3d197';
        g.fillRect(u.x - 5, u.y - 9, (10 * u.hp) / u.maxHp, 2);
      }
    }
    g.globalAlpha = 1;
    for (const p of b.projectiles) {
      g.strokeStyle = '#f2e2b3';
      g.lineWidth = 1;
      g.beginPath();
      const t = 1 - p.life / 0.22;
      const x = p.x + (p.tx - p.x) * t,
        y = p.y + (p.ty - p.y) * t;
      g.moveTo(x, y);
      g.lineTo(x + (p.tx - p.x) * 0.05, y + (p.ty - p.y) * 0.05);
      g.stroke();
    }
    if (this.dragLine) {
      g.strokeStyle = '#fff1b5';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(this.dragLine.start.x, this.dragLine.start.y);
      g.lineTo(this.dragLine.end.x, this.dragLine.end.y);
      g.stroke();
    }
    g.restore();
  }
}

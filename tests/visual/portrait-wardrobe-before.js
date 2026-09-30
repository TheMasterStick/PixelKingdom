import { appearanceOf } from '../../src/appearance.js';

// Source crops and measured attachment points from premade component atlases.
const rects = {
  head: [
    [18, 45, 292, 416],
    [329, 46, 292, 420],
    [648, 57, 269, 422],
    [952, 61, 284, 410],
  ],
  eyes: [
    [5, 568, 310, 136],
    [322, 568, 307, 136],
    [636, 568, 297, 135],
    [938, 568, 308, 138],
  ],
  nose: [
    [72, 744, 164, 240],
    [370, 744, 212, 240],
    [699, 744, 166, 249],
    [998, 750, 180, 239],
  ],
  mouth: [
    [29, 1048, 276, 128],
    [339, 1043, 289, 141],
    [656, 1048, 263, 133],
    [954, 1047, 289, 137],
  ],
  hair: [
    [35, 365, 259, 290],
    [333, 363, 281, 288],
    [651, 357, 268, 317],
    [965, 358, 265, 285],
  ],
  beard: [
    [47, 678, 242, 153],
    [351, 676, 248, 200],
    [661, 681, 241, 168],
    [958, 681, 283, 191],
  ],
};
// Neck anchors are measured in atlas pixels, not inferred from cell centers.
// A dressed torso includes its own neck, sleeves and shoulders: no second shirt
// is stretched over a differently shaped body. Rows are masculine/feminine.
const wardrobe = [
  { rect: [0, 20, 373, 411], neck: [192, 30] },
  { rect: [373, 20, 355, 411], neck: [552, 30] },
  { rect: [728, 20, 330, 411], neck: [891, 30] },
  { rect: [1058, 20, 357, 411], neck: [1234, 30] },
  { rect: [1415, 20, 359, 411], neck: [1588, 30] },
  { rect: [0, 441, 369, 420], neck: [189, 449] },
  { rect: [369, 441, 359, 420], neck: [550, 449] },
  { rect: [728, 441, 336, 420], neck: [890, 449] },
  { rect: [1064, 441, 351, 420], neck: [1235, 449] },
  { rect: [1415, 441, 359, 420], neck: [1590, 449] },
];
rects.wardrobe = wardrobe.map((part) => part.rect);
const skinTones = [
  [225, 167, 124],
  [180, 113, 73],
  [196, 143, 96],
  [118, 72, 51],
];
const faceBases = [
  [224, 165, 120],
  [177, 105, 65],
  [219, 159, 110],
  [124, 72, 47],
];
const sheets = {},
  pieces = new Map(),
  portraits = new Map();
let ready = false;
export function portraitReady() {
  return ready;
}
if (typeof Image !== 'undefined') {
  Promise.all(
    ['face', 'body', 'wardrobe'].map(
      (key) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            sheets[key] = img;
            resolve();
          };
          img.onerror = reject;
          img.src =
            key === 'wardrobe'
              ? '/assets/portraits/wardrobe-v2.png'
              : `/assets/portraits/${key}-parts.png`;
        }),
    ),
  )
    .then(() => {
      ready = true;
      window.dispatchEvent(new Event('portraits-ready'));
    })
    .catch(() => window.dispatchEvent(new Event('portraits-error')));
}
function isNeckPixel(index, x, y) {
  const [cx, top] = wardrobe[index].neck;
  const dy = y - top,
    dx = Math.abs(x - cx);
  if (dy < -4) return false;
  // Bound tinting to exposed skin so burgundy cloth, gold and leather retain color.
  if (index < 5) return dy < 73 && dx < Math.min(57, 31 + Math.max(0, dy - 18) * 0.85);
  return dy < 93 && dx < Math.min(67, 29 + Math.max(0, dy - 16) * 1.1);
}
function piece(kind, index, skin) {
  const key = `${kind}:${index}:${skin}`;
  if (pieces.has(key)) return pieces.get(key);
  const face = ['head', 'eyes', 'nose', 'mouth'].includes(kind);
  const [x, y, w, h] = rects[kind][index],
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(
    sheets[kind === 'wardrobe' ? 'wardrobe' : face ? 'face' : 'body'],
    x,
    y,
    w,
    h,
    0,
    0,
    w,
    h,
  );
  const image = ctx.getImageData(0, 0, w, h),
    d = image.data;
  if (!face && kind !== 'wardrobe') {
    // Only remove slate connected to the outside of the cutout. A global colour
    // key was punching holes in blue surcoats and dark hair inside the artwork.
    const marked = new Uint8Array(w * h),
      queue = new Int32Array(w * h);
    let read = 0,
      write = 0;
    const add = (pixel) => {
      if (marked[pixel]) return;
      const i = pixel * 4,
        r = d[i],
        g = d[i + 1],
        b = d[i + 2];
      if (b - r < 5 || b - r > 25 || b - g < 3 || b - g > 22 || r > 70 || b > 90) return;
      marked[pixel] = 1;
      queue[write++] = pixel;
    };
    for (let x = 0; x < w; x++) {
      add(x);
      add((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      add(y * w);
      add(y * w + w - 1);
    }
    while (read < write) {
      const pixel = queue[read++],
        x = pixel % w;
      if (x) add(pixel - 1);
      if (x + 1 < w) add(pixel + 1);
      if (pixel >= w) add(pixel - w);
      if (pixel + w < w * h) add(pixel + w);
    }
    for (let i = 0; i < marked.length; i++) if (marked[i]) d[i * 4 + 3] = 0;
  }
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    // Discard near-transparent export noise; remove only the slate sheet backing.
    const enclosedBackdrop =
      ['hair', 'beard'].includes(kind) &&
      r >= 25 &&
      r <= 70 &&
      b >= 40 &&
      b <= 90 &&
      b - r >= 5 &&
      b - r <= 25 &&
      b - g >= 3 &&
      b - g <= 22;
    if (d[i + 3] < 40 || enclosedBackdrop) {
      d[i + 3] = 0;
      continue;
    }
    if (
      skin !== undefined &&
      (['head', 'eyes', 'nose'].includes(kind) ||
        (kind === 'wardrobe' &&
          isNeckPixel(index, x + ((i / 4) % w), y + Math.floor(i / 4 / w)))) &&
      r > g * 1.12 &&
      g > b * 1.12 &&
      r > 65
    ) {
      const source =
        kind === 'wardrobe' ? [225, 167, 124] : kind === 'eyes' ? [204, 139, 98] : faceBases[index];
      const target = skinTones[skin];
      for (let ch = 0; ch < 3; ch++)
        d[i + ch] = Math.min(255, (d[i + ch] * target[ch]) / source[ch]);
    }
    if (kind === 'eyes') {
      const px = (i / 4) % w,
        py = Math.floor(i / 4 / w);
      const cx = px < w / 2 ? w * 0.245 : w * 0.755;
      const radius = Math.hypot((px - cx) / (w * 0.245), (py - h * 0.52) / (h * 0.49));
      d[i + 3] *= Math.max(0, Math.min(1, (1.06 - radius) / 0.22));
    }
    if (kind === 'nose') {
      const px = (i / 4) % w,
        py = Math.floor(i / 4 / w);
      const radius = Math.hypot((px - w / 2) / (w * 0.52), (py - h * 0.55) / (h * 0.59));
      d[i + 3] *= Math.max(0, Math.min(1, (1.05 - radius) / 0.25));
    }
    if (kind === 'eyes' || kind === 'nose' || kind === 'mouth') {
      // Soften skin-patch edges, keeping the actual eyes/nose/lips fully opaque.
      const px = (i / 4) % w,
        py = Math.floor(i / 4 / w);
      const edge = Math.min(px, w - 1 - px, py, h - 1 - py);
      d[i + 3] *= Math.min(1, edge / 9);
    }
  }
  ctx.putImageData(image, 0, 0);
  if (kind === 'head') {
    // Follow the drawn jaw, not the atlas alpha: the source heads include a
    // neck/shoulders behind the jaw. None of that belongs to the head layer.
    const outlines = [
      [
        [18, 45],
        [310, 45],
        [310, 270],
        [270, 270],
        [250, 306],
        [226, 338],
        [194, 367],
        [145, 367],
        [115, 338],
        [92, 305],
        [72, 270],
        [18, 270],
      ],
      [
        [329, 46],
        [621, 46],
        [621, 272],
        [584, 272],
        [562, 311],
        [513, 368],
        [450, 368],
        [410, 318],
        [388, 272],
        [329, 272],
      ],
      [
        [648, 57],
        [917, 57],
        [917, 279],
        [867, 279],
        [846, 311],
        [808, 350],
        [798, 360],
        [765, 360],
        [750, 350],
        [717, 310],
        [699, 279],
        [648, 279],
      ],
      [
        [952, 61],
        [1236, 61],
        [1236, 270],
        [1185, 270],
        [1160, 310],
        [1117, 361],
        [1076, 361],
        [1033, 310],
        [1014, 270],
        [952, 270],
      ],
    ];
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    outlines[index].forEach(([px, py], i) =>
      i ? ctx.lineTo(px - x, py - y) : ctx.moveTo(px - x, py - y),
    );
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  pieces.set(key, c);
  return c;
}
export function composePortrait(p) {
  if (!ready) return null;
  const a = appearanceOf(p),
    key = JSON.stringify(a);
  if (portraits.has(key)) return portraits.get(key);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 640;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const bg = ctx.createLinearGradient(0, 0, 0, 640);
  bg.addColorStop(0, '#343b45');
  bg.addColorStop(1, '#192722');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);
  const draw = (kind, index, x, y, w, h, skin) =>
    ctx.drawImage(piece(kind, index, skin), x, y, w, h);
  // Each head has its own measured face width and feature anchors. The atlas
  // cells are not interchangeable bounding boxes: their margins and jaws differ.
  const profiles = [
    { x: 132, y: 34, w: 248, h: 354, eyes: 166, eyeY: 140, noseY: 184, mouthY: 254, chin: 302 },
    { x: 120, y: 30, w: 272, h: 366, eyes: 180, eyeY: 143, noseY: 188, mouthY: 264, chin: 314 },
    { x: 140, y: 35, w: 232, h: 354, eyes: 157, eyeY: 134, noseY: 178, mouthY: 243 },
    { x: 134, y: 38, w: 244, h: 350, eyes: 164, eyeY: 136, noseY: 179, mouthY: 247 },
  ];
  const f = profiles[a.head];
  const torsoIndex = (a.body >= 2 ? 5 : 0) + a.outfit;
  const torso = wardrobe[torsoIndex];
  // Width variants scale around the attachment point, never around image bounds.
  const bodyScale = [1.07, 1.17, 1.04, 1.13][a.body];
  const neckTop = 282;
  draw(
    'wardrobe',
    torsoIndex,
    256 - (torso.neck[0] - torso.rect[0]) * bodyScale,
    neckTop - (torso.neck[1] - torso.rect[1]) * bodyScale,
    torso.rect[2] * bodyScale,
    torso.rect[3] * bodyScale,
    a.skin,
  );
  const chinSourceY = [367, 368, 360, 361][a.head];
  const chin = f.y + ((chinSourceY - rects.head[a.head][1]) / rects.head[a.head][3]) * f.h;
  const headScale = 0.82;
  ctx.save();
  ctx.translate(256, neckTop + 18);
  ctx.scale(headScale, headScale);
  ctx.translate(-256, -chin);
  ctx.save();
  if (a.hair === 4) {
    // The swept-back cutout contains its own crown; exclude the bald dome
    // behind it instead of allowing skin to protrude above the silver hair.
    ctx.beginPath();
    ctx.rect(0, f.y + 48, 512, 640);
    ctx.clip();
  }
  const faceCenter = [150, 149, 133.5, 144.5][a.head] / rects.head[a.head][2];
  draw('head', a.head, 256 - faceCenter * f.w, f.y, f.w, f.h, a.skin);
  ctx.restore();
  draw('eyes', a.eyes, 256 - f.eyes / 2, f.eyeY, f.eyes, 61, a.skin);
  const noseWidths = [48, 61, 48, 54],
    noseHeights = [72, 68, 77, 69];
  draw(
    'nose',
    a.nose,
    256 - noseWidths[a.nose] / 2,
    f.noseY,
    noseWidths[a.nose],
    noseHeights[a.nose],
    a.skin,
  );
  const mouthWidths = [63, 72, 65, 70];
  draw('mouth', a.mouth, 256 - mouthWidths[a.mouth] / 2, f.mouthY, mouthWidths[a.mouth], 28);
  if (a.beard) {
    const sizes = [
      [152, 96],
      [163, 149],
      [117, 96],
      [175, 135],
    ][a.beard - 1];
    // Align the moustache/mouth opening, not the top edge of its atlas cell.
    const sourceGap = [54, 52, 58, 55][a.beard - 1];
    const top = f.mouthY + 12 - (sourceGap / rects.beard[a.beard - 1][3]) * sizes[1];
    draw('beard', a.beard - 1, 256 - sizes[0] / 2, top, sizes[0], sizes[1]);
  }
  if (a.hair) {
    const skull = f.w / 248;
    if (a.hair === 2 || a.hair === 3) {
      const img = piece('hair', a.hair - 1),
        cut = Math.round(img.width * 0.34),
        center = img.width - cut * 2;
      const gap = f.eyes + 8,
        side = 77 * skull,
        height = a.hair === 3 ? 375 : 345;
      ctx.drawImage(img, 0, 0, cut, img.height, 256 - gap / 2 - side, 9, side, height);
      ctx.drawImage(img, cut, 0, center, img.height, 256 - gap / 2, 9, gap, height);
      ctx.drawImage(img, cut + center, 0, cut, img.height, 256 + gap / 2, 9, side, height);
    } else {
      const width = (a.hair === 1 ? 277 : 307) * skull;
      draw('hair', a.hair - 1, 256 - width / 2, 7, width, a.hair === 1 ? 292 : 282);
    }
  }
  ctx.restore();
  const url = c.toDataURL('image/webp', 0.92);
  // Bound memory during repeated character-builder experiments.
  if (portraits.size >= 128) portraits.delete(portraits.keys().next().value);
  portraits.set(key, url);
  return url;
}

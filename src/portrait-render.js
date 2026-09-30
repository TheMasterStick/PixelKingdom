import { appearanceOf } from './appearance.js';

// Exact source rectangles from the two premade art sheets; no generated portraits.
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
  body: [
    [20, 10, 287, 339],
    [333, 10, 281, 339],
    [647, 10, 274, 339],
    [949, 10, 288, 339],
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
  outfit: [
    [7, 877, 309, 351],
    [319, 877, 310, 355],
    [637, 877, 300, 354],
    [948, 877, 292, 355],
  ],
};
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
    ['face', 'body'].map(
      (key) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            sheets[key] = img;
            resolve();
          };
          img.onerror = reject;
          img.src = `/assets/portraits/${key}-parts.png`;
        }),
    ),
  )
    .then(() => {
      ready = true;
      window.dispatchEvent(new Event('portraits-ready'));
    })
    .catch(() => window.dispatchEvent(new Event('portraits-error')));
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
  ctx.drawImage(sheets[face ? 'face' : 'body'], x, y, w, h, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h),
    d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    // Discard near-transparent export noise; remove only the slate sheet backing.
    if (d[i + 3] < 40 || (!face && b > r && b > g && b - r > 6 && b < 110 && r < 90)) {
      d[i + 3] = 0;
      continue;
    }
    if (
      skin !== undefined &&
      ['head', 'eyes', 'nose', 'body'].includes(kind) &&
      r > g * 1.12 &&
      g > b * 1.12 &&
      r > 65
    ) {
      const source =
        kind === 'body' ? faceBases[0] : kind === 'eyes' ? [204, 139, 98] : faceBases[index];
      const target = skinTones[skin];
      for (let ch = 0; ch < 3; ch++)
        d[i + ch] = Math.min(255, (d[i + ch] * target[ch]) / source[ch]);
    }
    if (kind === 'head') {
      const px = (i / 4) % w,
        py = Math.floor(i / 4 / w);
      if (py > h * 0.78) {
        const half = w * (0.23 - 0.05 * ((py / h - 0.78) / 0.22));
        d[i + 3] *= Math.max(0, Math.min(1, (half - Math.abs(px - w / 2)) / 5));
      }
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
  draw('head', a.head, 126, 25, 260, 370, a.skin);
  const bodyWidth = [410, 480, 390, 455][a.body];
  draw('body', a.body, 256 - bodyWidth / 2, 325, bodyWidth, 522, a.skin);
  if (a.outfit) draw('outfit', a.outfit - 1, 248 - bodyWidth / 2, 332, bodyWidth + 16, 520);
  // Fixed attachment anchors shared across the four compatible frontal head bases.
  draw('eyes', a.eyes, 163, 152, 186, 75, a.skin);
  draw('nose', a.nose, 224, 199, 64, 89, a.skin);
  draw('mouth', a.mouth, 221, 282, 70, 31);
  if (a.beard) {
    const sizes = [
      [154, 106],
      [170, 158],
      [135, 106],
      [182, 145],
    ][a.beard - 1];
    draw('beard', a.beard - 1, 256 - sizes[0] / 2, 263, sizes[0], sizes[1]);
  }
  if (a.hair) {
    const boxes = [
      [117, 0, 280, 319],
      [111, 2, 289, 347],
      [108, -2, 296, 386],
      [96, 0, 325, 310],
    ];
    if (a.hair === 2 || a.hair === 3) {
      // Keep side locks at their native proportions while widening the forehead
      // opening to the common face anchors; prevents braids covering the eyes.
      const img = piece('hair', a.hair - 1);
      const cut = Math.round(img.width * 0.34),
        center = img.width - cut * 2;
      const height = a.hair === 3 ? 386 : 347;
      ctx.drawImage(img, 0, 0, cut, img.height, 86, 0, 76, height);
      ctx.drawImage(img, cut, 0, center, img.height, 162, 0, 188, height);
      ctx.drawImage(img, cut + center, 0, cut, img.height, 350, 0, 76, height);
    } else draw('hair', a.hair - 1, ...boxes[a.hair - 1]);
  }
  const url = c.toDataURL('image/webp', 0.92);
  // Bound memory during repeated character-builder experiments.
  if (portraits.size >= 128) portraits.delete(portraits.keys().next().value);
  portraits.set(key, url);
  return url;
}

import { composePortrait } from './portrait-render.js';
import { appearanceOf } from './appearance.js';
import { hash, random } from './core.js';
export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const svg = (body, view, cls, label = '') =>
  `<svg class="${cls}" ${cls === 'settlement-art' ? 'preserveAspectRatio="xMidYMid slice"' : ''} viewBox="${view}" xmlns="http://www.w3.org/2000/svg" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${body}</svg>`;
export function icon(type, cls = 'item-icon') {
  const paths = {
    sword:
      '<path d="M21 2l3 3-13 14-3-3z" fill="#b9c8c6"/><path d="M5 14l9 9-3 2-9-9z" fill="#cfaa62"/><path d="M4 21l3 3-4 5-3-3z" fill="#936346"/>',
    axe: '<path d="M20 1l4 3L6 30l-4-3z" fill="#9c7650"/><path d="M13 4l10 6 7-1-2 11-7 1L9 12z" fill="#a7b3ad"/>',
    armor:
      '<path d="M8 3l5-2h6l5 2 7 9-7 5-2-5v18H9V12l-3 5-6-5z" fill="#859698"/><path d="M11 4l5 4 5-4v7H11z" fill="#d0bd8b"/><path d="M10 14h12v3H10zm0 6h12v2H10z" fill="#526a71"/>',
    shield:
      '<path d="M3 3h26v16L16 31 3 19z" fill="#c8a265"/><path d="M6 6h20v12L16 27 6 18z" fill="#617f88"/><path d="M14 6h4v20h-4z" fill="#e0c58b"/>',
    banner:
      '<path d="M4 2h3v29H4z" fill="#cab889"/><path d="M7 3h21l-5 8 5 8H7z" fill="#a45c47"/><path d="M12 6h5v10h-5z" fill="#debd76"/>',
    grain:
      '<path d="M15 2h3v29h-3z" fill="#b68a45"/><path d="M2 3h8l6 8H8zm28 0h-8l-6 8h8zM2 13h8l6 8H8zm28 0h-8l-6 8h8z" fill="#e0bb63"/>',
    timber:
      '<path d="M3 8l20-6 7 7-20 7z" fill="#ad784f"/><path d="M3 8v14l7 8V16zm7 8l20-7v13l-20 8z" fill="#765239"/><path d="M5 11l3 4v10l-3-4z" fill="#ccaa6e"/>',
    iron: '<path d="M8 7h20l4 9-8 9H1L0 16z" fill="#adbcb7"/><path d="M0 16h23l9-9v9l-8 9H1z" fill="#677d81"/>',
    cloth:
      '<path d="M4 5h23v24H4z" fill="#b66b64"/><path d="M6 3h23v22H6z" fill="#d48b78"/><path d="M10 3h3v22h-3zm9 0h2v22h-2z" fill="#e3b090"/>',
    heart:
      '<path d="M2 5h9l5 5 5-5h9v12L16 30 2 17z" fill="#b86356"/><path d="M6 8h5v3H6z" fill="#e2a582"/>',
    tree: '<path d="M14 21h5v11h-5z" fill="#97764e"/><path d="M16 0L4 15h6L0 26h32L22 15h6z" fill="#759671"/><path d="M16 5v19H6l7-9H9z" fill="#a1b17a"/>',
    coin: '<path d="M8 2h16l7 7v15l-7 7H8l-7-7V9z" fill="#9f773d"/><path d="M9 4h14l5 6v13l-5 5H9l-5-5V10z" fill="#dfba68"/><path d="M15 9h3v15h-3zm-4 3h11v3H11z" fill="#9f773d"/>',
    book: '<path d="M3 3h12l2 3 2-3h11v24H19l-2 3-2-3H3z" fill="#ccb884"/><path d="M5 6h8v2H5zm0 6h8v2H5zm15-6h8v2h-8zm0 6h8v2h-8z" fill="#6e604b"/>',
  };
  return svg(paths[type] || paths.shield, '0 0 32 32', cls);
}
export function portrait(p, full = false) {
  const url = composePortrait(p);
  if (url)
    return `<svg class="${full ? 'figure-art' : 'portrait-art'} composed-portrait" viewBox="${full ? '0 0 512 640' : '120 0 272 330'}" role="img" aria-label="${esc('Portrait of ' + (p.name || 'your character'))}" data-appearance="${esc(JSON.stringify(appearanceOf(p)))}" xmlns="http://www.w3.org/2000/svg"><image href="${url}" width="512" height="640"/></svg>`;
  const n = hash(p.id || p.name || 'hero'),
    hair = ['#684531', '#372d29', '#b58d51', '#bdb4a0'][n % 4],
    skin = ['#d8ae82', '#bd8b64', '#dfbd97'][n % 3],
    cape = ['#637f87', '#906555', '#707953', '#77708b'][p.culture % 4 || 0],
    mail = p.equipment?.armor === 'Mail hauberk',
    armor = mail ? '#8c9c9b' : p.equipment?.armor === 'Quilted gambeson' ? '#a58a59' : '#7c795e';
  let body = `<rect width="96" height="128" fill="#202927"/><path d="M0 90L48 25 96 90v38H0z" fill="#313a32"/><path d="M24 42h48l10 61H14z" fill="${cape}"/><path d="M28 103h15v21H25zm25 0h15l4 21H53z" fill="#3e3931"/><path d="M24 117h20v9H21zm29 0h21v9H53z" fill="#26251f"/><path d="M24 47h48v56H24z" fill="${armor}"/><path d="M18 51h9v40h-9zm51 0h10v40H69z" fill="${armor}"/><path d="M18 85h9v13h-9zm51 0h10v13H69z" fill="${skin}"/><path d="M24 84h48v7H24z" fill="#453a2c"/><path d="M45 83h7v9h-7z" fill="#d0ae69"/><path d="M36 17h25v27H36z" fill="${skin}"/><path d="M33 14h30v12H33zm0 8h5v15h-5zm25 0h5v15h-5z" fill="${hair}"/><path d="M39 28h4v3h-4zm14 0h4v3h-4z" fill="#2c2a25"/><path d="M45 36h9v3h-9z" fill="#8f5f46"/><path d="M39 44l9 7 9-7v9H39z" fill="#dac19a"/>`;
  if (p.sex === 'female') body += `<path d="M30 22h7v28h-7zm30 0h7v28h-7z" fill="${hair}"/>`;
  if (mail)
    for (let y = 58; y < 82; y += 6)
      for (let x = 30; x < 68; x += 6)
        body += `<rect x="${x}" y="${y}" width="3" height="2" fill="#bdc1b0"/>`;
  if (full)
    body += `<path d="M77 52h4v57h-4z" fill="#d3d8c3"/><path d="M72 94h13v4H72z" fill="#bb9857"/><path d="M75 98h6v15h-6z" fill="#6f4e35"/><path d="M12 60h22v29L23 103 12 89z" fill="#b69457"/><path d="M15 63h16v24l-8 11-8-11z" fill="${cape}"/><path d="M21 64h4v30h-4z" fill="#d7bd80"/>`;
  return svg(
    body,
    full ? '0 0 96 128' : '22 8 52 54',
    full ? 'figure-art' : 'portrait-art',
    full ? 'Pixel portrait of ' + (p.name || 'your character') : '',
  );
}
export function herald(f, cls = 'herald') {
  return svg(
    `<path d="M4 2h48v43L28 64 4 45z" fill="${f?.color || '#b99961'}"/><path d="M8 6h40v37L28 58 8 43z" fill="#252c28"/><path d="M15 20h26v6H15zm4 6h18v19H19zm-4-12h6v10h-6zm10 0h6v10h-6zm10 0h6v10h-6z" fill="${f?.color || '#b99961'}"/>`,
    '0 0 56 66',
    cls,
  );
}
export function settlementArt(t, f) {
  const r = random(hash(t.id || 'creation')),
    village = t.kind === 'village',
    castle = t.kind === 'castle';
  let a = '';
  const rect = (x, y, w, h, c) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  a +=
    rect(0, 0, 800, 400, '#8c9b95') +
    rect(0, 0, 800, 55, '#748b8c') +
    rect(0, 55, 800, 35, '#839794') +
    rect(580, 42, 46, 46, '#d9c798');
  a +=
    '<path d="M0 170L90 60 150 115 240 45 330 149 390 93 510 160 640 62 800 150V270H0z" fill="#667d77"/><path d="M0 215L170 123 310 211 480 149 630 201 800 114v170H0z" fill="#536c60"/><path d="M0 260L140 206 350 247 570 214 800 267v133H0z" fill="#68794f"/>';
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(r() * 800),
      y = Math.floor(150 + r() * 180);
    if (x > 180 && x < 630) continue;
    a += `<path d="M${x} ${y - 30}l-18 37h12v10h12V${y + 7}h12z" fill="${i % 2 ? '#3e5b4b' : '#49664d'}"/>`;
  }
  a +=
    '<path d="M352 400l37-150h36l82 150z" fill="#ae9870"/><path d="M387 400l16-126h10l54 126z" fill="#c1aa7d"/>';
  const house = (x, y, w = 58, h = 48) =>
    `<g>${rect(x, y, w, h, '#d0bd8e')}<path d="M${x - 7} ${y + 2}l${w / 2 + 7}-${h / 2} ${w / 2 + 7} ${h / 2}z" fill="#7d503c"/>${rect(x + 5, y + 5, 4, h - 5, '#675942')}${rect(x + w - 9, y + 5, 4, h - 5, '#675942')}${rect(x, y + h - 8, w, 4, '#675942')}${rect(x + w / 2 - 6, y + h - 23, 12, 23, '#493f30')}${rect(x + 12, y + 14, 10, 10, '#555949')}${rect(x + w - 24, y + 14, 10, 10, '#555949')}</g>`;
  if (!village) {
    a += rect(260, 172, 284, 84, '#a39e82') + rect(251, 167, 300, 9, '#c1b798');
    for (let x = 251; x < 551; x += 20) a += rect(x, 158, 12, 15, '#bab395');
    a += rect(367, 209, 35, 47, '#4b5144');
    for (const x of [246, 520]) {
      a += rect(x, 130, 45, 140, '#a6a289') + rect(x - 5, 124, 55, 10, '#d1c5a2');
      for (let k = 0; k < 3; k++) a += rect(x - 5 + k * 21, 110, 13, 20, '#c8bd9c');
      a += rect(x + 16, 156, 10, 22, '#4e5b51');
    }
    a += rect(367, 100, 71, 73, '#c1b894');
    a += '<path d="M355 100l48-37 48 37z" fill="#685549"/>';
    a += rect(401, 41, 3, 28, '#d4bd88') + rect(404, 42, 27, 16, f?.color || '#b09355');
  }
  for (const [x, y, w, h] of village
    ? [
        [160, 230, 85, 62],
        [264, 263, 65, 48],
        [465, 243, 76, 60],
        [580, 267, 65, 51],
      ]
    : castle
      ? [
          [167, 279, 76, 54],
          [558, 295, 66, 45],
        ]
      : [
          [164, 247, 76, 54],
          [287, 285, 60, 45],
          [469, 277, 64, 49],
          [576, 286, 74, 53],
        ])
    a += house(x, y, w, h);
  if (village) {
    a += '<path d="M55 330h150l-25 60H10zM570 350h210l20 50H560z" fill="#bca061"/>';
    for (let i = 0; i < 8; i++)
      a += `<path d="M${30 + i * 20} 385l25-50" stroke="#7e784a" stroke-width="4"/>`;
    a +=
      rect(554, 188, 15, 94, '#b0a786') +
      '<path d="M560 212l-42-40m42 40l42 40m-42-40l40-42m-40 42l-40 42" stroke="#d6c798" stroke-width="8"/>';
  } else {
    a +=
      rect(338, 307, 62, 9, '#bc795c') +
      rect(335, 316, 68, 7, '#d0b687') +
      rect(338, 323, 4, 28, '#6a5941') +
      rect(394, 323, 4, 28, '#6a5941');
  }
  for (let i = 0; i < 16; i++) {
    const x = 215 + Math.floor(r() * 370),
      y = 302 + Math.floor(r() * 75);
    a +=
      rect(x, y, 4, 4, '#d7b289') +
      rect(x - 1, y + 4, 6, 8, ['#606a74', '#977348', '#9a5742'][i % 3]) +
      rect(x, y + 12, 2, 5, '#464936') +
      rect(x + 3, y + 12, 2, 5, '#464936');
  }
  a += '<path d="M0 391h800v9H0z" fill="#324d3f"/>';
  return svg(a, '0 0 800 400', 'settlement-art', `${t.kind} in the medieval countryside`);
}

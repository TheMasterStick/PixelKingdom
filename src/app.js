import {
  newCampaign,
  tickCampaign,
  travel,
  recruit,
  troopOffers,
  recruitmentQuote,
  recruitTroops,
  promote,
  elevate,
  encodeSave,
  decodeSave,
  rewardBattle,
  log,
} from './campaign.js';
import { TYPES, distance, clamp } from './core.js';
import {
  createBattle,
  tickBattle,
  orderLine,
  setStance,
  attachHero,
  FORMATIONS,
  FORMATION_NAMES,
} from './battle.js';
import { Renderer } from './render.js';
import { updateHTML } from './ui-dom.js';
import {
  ensureFeatures,
  applyBackground,
  ITEMS,
  amount,
  marketAmount,
  trade,
  tradeQuote,
  equipItem,
  unequipItem,
  learnTalent,
  diplomaticAction,
  ransomPrisoners,
  supplyAction,
  canVisit,
} from './features.js';
import {
  creationScreen,
  companyScreen,
  characterScreen,
  settlementScreen,
  encyclopediaScreen,
  diplomacyScreen,
} from './screens.js';
import { portrait, icon } from './art.js';
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
const canvas = $('#game'),
  renderer = new Renderer(canvas),
  modal = $('#modal'),
  SAVE = 'pixelkingdom.campaign.v1';
let state = newCampaign(),
  battle = null,
  tab = 'world',
  last = 0,
  uiTime = 0,
  pointer = null,
  hasCampaign = false,
  toastTimer,
  modalKind = '';
let recruitmentCart = {};
const ui = {
  page: '',
  settlement: 'overview',
  person: null,
  group: 'recruit',
  personTab: 'equipment',
  encyclopedia: 'settlements',
  search: '',
  entity: '',
  faction: 0,
  proposal: null,
  tradeCart: {},
  category: 'All',
  creation: {
    step: 0,
    name: 'Nicholas',
    seed: 'The Long March',
    culture: 0,
    sex: 'male',
    choices: ['retainer', 'bold', 'watch', 'stand'],
  },
};
let lastFeatureRoute = '';
function renderFeature() {
  if (!ui.page) return;
  ensureFeatures(state);
  let html;
  if (ui.page === 'creation') html = creationScreen(ui.creation, hasCampaign);
  if (ui.page === 'company') html = companyScreen(state, ui);
  if (ui.page === 'character') html = characterScreen(state, ui);
  if (ui.page === 'encyclopedia') html = encyclopediaScreen(state, ui);
  if (ui.page === 'diplomacy') html = diplomacyScreen(state, ui);
  if (ui.page === 'settlement') {
    const town = state.settlements.find((t) => t.id === state.visiting);
    if (town) html = settlementScreen(state, town, ui, recruitmentPanel(town));
  }
  if (html) {
    const route = [
      ui.page,
      ui.page === 'creation' ? ui.creation.step : '',
      ui.page === 'character' ? ui.personTab : '',
      ui.page === 'settlement' ? ui.settlement : '',
      ui.page === 'encyclopedia' ? ui.encyclopedia : '',
    ].join(':');
    showModal(html, ui.page);
    if (route !== lastFeatureRoute) modal.querySelector('.window-content')?.scrollTo(0, 0);
    lastFeatureRoute = route;
  }
}
function openFeature(page) {
  if (battle) {
    toast('Finish the battle to open the campaign.');
    return;
  }
  ui.page = page;
  renderFeature();
}

renderer.center(state);
function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
}
function showModal(html, kind = 'info') {
  modalKind = kind;
  modal.classList.toggle(
    'game-window',
    ['creation', 'company', 'character', 'settlement', 'encyclopedia', 'diplomacy'].includes(kind),
  );
  updateHTML(modal, html);
  if (!modal.open) modal.showModal();
}
function closeModal() {
  modal.close();
  modalKind = '';
  ui.page = '';
}
function save(silent = false) {
  try {
    localStorage.setItem(SAVE, encodeSave(state));
    if (!silent) toast('Campaign saved on this browser.');
    return true;
  } catch (e) {
    if (!silent) toast(e.message);
    return false;
  }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE);
    if (!raw) throw Error('No saved campaign found in this browser.');
    state = decodeSave(raw);
    battle = null;
    hasCampaign = true;
    tab = 'world';
    closeModal();
    renderer.center(state);
    updateUI();
    toast('Campaign restored.');
  } catch (e) {
    toast(e.message);
  }
}
function creation() {
  ui.creation.step = 0;
  openFeature('creation');
}
function menu() {
  showModal(
    `<div class="eyebrow">PIXELKINGDOM</div><h2>Your campaign</h2><p class="muted">Saves belong to this browser. Export a copy to carry your campaign to another computer.</p><div class="stack"><button data-action="save" ${battle ? 'disabled' : ''}>Save campaign</button><button data-action="load">Load last save</button><button data-action="export" ${battle ? 'disabled' : ''}>Export save file</button><button data-action="import">Import save file</button><button data-action="new">New campaign…</button></div><div class="notice">Chapter two: settlements, trade, character histories, equipment, talents and diplomatic proposals. Fiefs, vassalage, marriage and succession remain ahead.</div><div class="dialog-actions"><button data-action="close">Return to game</button></div>`,
    'menu',
  );
}
function stageName() {
  const n = state.party.length;
  return n === 1
    ? 'Adventurer'
    : n < 5
      ? 'Adventurer'
      : n < 20
        ? 'Posse'
        : n < 100
          ? 'Company'
          : 'Warband';
}
function leftPanel() {
  const hero = state.party.find((p) => p.id === state.heroId);
  return `<div class="eyebrow">${esc(state.dynasty.name)}</div><div class="identity">${portrait(hero)}<div><h3>${esc(hero.name)}</h3><small>${stageName()} · Level ${hero.level}</small></div></div><div class="stats"><div class="stat"><span>TREASURY</span><strong class="gold">${state.gold} <small>♙</small></strong></div><div class="stat"><span>PROVISIONS</span><strong>${state.food} <small>rations</small></strong></div><div class="stat"><span>COMPANY</span><strong>${state.party.length}<small> / 20</small></strong></div><div class="stat"><span>RENOWN</span><strong>${state.renown}</strong></div></div><div class="divider"></div><div class="row"><strong>Clan tier ${state.clanLevel}</strong><small>${state.renown % 50} / 50</small></div><div class="bar"><i style="width:${(state.renown % 50) * 2}%"></i></div><p class="muted" style="font-size:12px">A name carried by ${state.party.length} ${state.party.length === 1 ? 'traveller' : 'travellers'}.</p><div class="divider"></div><div class="eyebrow">YOUR NEXT STEP</div><h3>${state.party.length === 1 ? 'Gather a company' : state.quest?.done ? 'Collect your reward' : state.quest ? 'Hunt the brigands' : 'Make your name'}</h3><p class="muted" style="font-size:13px">${state.party.length === 1 ? 'Enter a nearby settlement. Recruit levies, hire a companion, and purchase provisions.' : state.quest?.done ? 'Return to the settlement that offered your contract.' : state.quest ? 'Find the marked brigand party. Deploy your company and bring the roads back under control.' : 'Ask a settlement for a contract, or track down a brigand party on the map.'}</p><button class="full" data-action="nearby">Nearest settlement</button><button class="full quiet" data-action="party">Inspect company</button><div class="divider"></div><small style="font-size:11px;line-height:1.6;display:block">* ${state.food} food rations · ${Math.max(1, Math.ceil(state.party.length / 4))} consumed per day.<br>Troops draw daily wages. Wounds heal with time and provisions.</small>`;
}
function rightPanel() {
  const t = state.settlements.find((t) => t.id === state.selectedSettlement),
    q = state.quest;
  return `${t ? `<div class="eyebrow">${esc(state.factions[t.faction].name)} · ${t.kind.toUpperCase()}</div><h2>${esc(t.name)}</h2><p class="muted" style="font-size:12px">${t.recruits.length} available recruits${t.companion ? ' · Companion available' : ''}</p><button class="full primary" data-action="visit" data-id="${t.id}">${distance(state, t) < 1.4 ? 'Enter settlement' : 'Travel to settlement'}</button><div class="divider"></div>` : `<div class="eyebrow">THE BORDERLANDS</div><h2>An unwritten realm</h2><p class="muted" style="font-size:13px">Six small kingdoms. Open frontiers. Click the map to travel, or a settlement to inspect it.</p><div class="divider"></div>`}<div class="eyebrow">CONTRACT</div>${q ? `<h3>Clear the roads</h3><p class="muted" style="font-size:12px">${q.done ? 'The brigands are defeated. Return for payment.' : 'Defeat the marked brigand party near ' + esc(state.settlements.find((t) => t.id === q.townId)?.name) + '.'}</p><div class="row"><span class="badge">${q.done ? 'FULFILLED' : 'ACTIVE'}</span><span style="color:var(--gold)">100 crowns</span></div>${!q.done ? '<button class="full quiet" data-action="track">Locate brigands</button>' : ''}` : '<p class="muted" style="font-size:12px">Visit a settlement to find work.</p>'}<div class="divider"></div><div class="eyebrow">RECENT EVENTS</div>${state.events
    .slice(0, 3)
    .map((e) => `<div class="event"><small>DAY ${e.day}</small>${esc(e.message)}</div>`)
    .join('')}`;
}
function unitCard(p) {
  const advanced = ['hero', 'companion'].includes(p.type);
  return `<article class="card" data-ui-key="${p.id}"><div class="row"><span class="badge">${TYPES[p.type].label}</span><small>LV ${p.level}</small></div><h3>${esc(p.name)}</h3><p class="muted">${esc(p.traits.join(' · '))} · ${p.age} years old${p.wounded ? ' · Wounded' : ''}</p><div class="row"><span>Condition</span><span>${p.health}%</span></div><div class="bar"><i class="health" style="width:${p.health}%"></i></div><div class="row"><span>Experience</span><span>${p.xp} / ${p.level * 35}</span></div><div class="row"><span>Battle record</span><span>${p.kills} kills</span></div><div class="card-actions">${p.level >= 2 ? TYPES[p.type].next.map((type) => `<button data-action="promote" data-id="${p.id}" data-type="${type}" ${state.gold < 25 ? 'disabled' : ''}>${TYPES[type].label} · 25 ♙</button>`).join('') : ''}${!advanced && p.level >= 3 ? `<button data-action="elevate" data-id="${p.id}" ${state.gold < 100 ? 'disabled' : ''}>Raise to companion · 100 ♙</button>` : ''}${advanced ? `<button data-action="character" data-id="${p.id}">Skills & equipment${p.skillPoints || p.talentPoints ? ' •' : ''}</button>` : ''}</div></article>`;
}
function showRoster() {
  return `<div class="eyebrow">${esc(state.dynasty.name)}</div><h2>Your company <small>(${state.party.length})</small></h2><p class="muted">Every name has a history. Surviving soldiers gain experience and can earn promotion.</p><div class="cards">${state.party.map(unitCard).join('')}</div>`;
}
function showJournal() {
  return `<div class="eyebrow">DAY ${state.day} · ${esc(state.seedText)}</div><h2>The chronicle</h2><div class="card"><h3>${esc(state.dynasty.name)}</h3><p class="muted">From an adventurer to a kingdom. Your house’s story is only beginning.</p><p>Adventurer → Posse → Company → Warband → Host → Domain → Kingdom</p><small>This chapter supports a company of up to 20. Fiefs, vassals, marriage, and dynastic succession will extend the campaign later.</small></div><div class="divider"></div>${state.events.map((e) => `<div class="event"><small>DAY ${e.day}</small>${esc(e.message)}</div>`).join('')}${state.dead.length ? `<div class="divider"></div><h3>The fallen</h3>${state.dead.map((p) => `<div class="event">${esc(p.name)} · ${TYPES[p.type].label}<small>Fell on day ${p.died}</small></div>`).join('')}` : ''}`;
}
function updateUI() {
  document.querySelectorAll('.map-buttons button').forEach((el) => (el.disabled = !!battle));
  if (battle) {
    battleUI();
    return;
  }
  updateHTML($('#left-panel'), leftPanel());
  updateHTML($('#right-panel'), rightPanel());
  $('#party-count').textContent = state.party.length;
  updateHTML(
    $('#location-label'),
    `<div class="eyebrow">CAMPAIGN · DAY ${state.day}</div><h2>The Borderlands</h2>`,
  );
  $('#map-caption').textContent = '“A crown is a distant thing. For now, there is the road.”';
  const moving = state.path.length || state.waiting;
  updateHTML(
    $('#map-bottom'),
    `<div><strong style="font:17px Georgia">Day ${state.day}</strong><div class="time-label">${String(Math.floor(state.hour)).padStart(2, '0')}:00 · ${state.mode === 'settlement' ? 'IN SETTLEMENT' : state.paused ? 'PAUSED' : moving ? 'TRAVELLING' : 'WORLD PAUSED'}</div></div><div class="controls"><button data-action="pause" title="Pause campaign">${state.paused ? '▶' : 'Ⅱ'}</button><button data-action="speed" data-speed="1" class="${state.speed === 1 ? 'active' : ''}">1×</button><button data-action="speed" data-speed="3" class="${state.speed === 3 ? 'active' : ''}">3×</button><button data-action="wait" class="${state.waiting ? 'active' : ''}">${state.waiting ? 'Stop waiting' : 'Wait'}</button></div><div class="legend"><span><i style="background:#e1c587"></i>Your company</span><span><i style="background:#cb7455"></i>Brigands</span></div>`,
  );
  $('#status').textContent =
    state.mode === 'settlement'
      ? 'Settlement visit · The world waits'
      : moving
        ? 'On the road · The world moves with you'
        : 'Standing still · The world waits for your next move';
  $('#footer-help').textContent =
    'Click to travel · Scroll to zoom · Right-drag to pan · Space to pause';
  $('#overlay-view').hidden = tab === 'world';
  if (tab !== 'world')
    updateHTML($('#overlay-view'), tab === 'party' ? showRoster() : showJournal());
  document
    .querySelectorAll('[data-tab]')
    .forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  $('#save-btn').disabled = false;
  if (modal.open && ui.page) renderFeature();
}
function recruitmentPanel(t) {
  const offers = troopOffers(t),
    quote = recruitmentQuote(state, t, recruitmentCart);
  return `<p class="muted recruit-intro">Enlist regular troops by type. Meet the individuals in your company roster.</p>${
    offers
      .map((o) => {
        const selected = recruitmentCart[o.type] || 0;
        const capacity = Math.min(
          o.count - selected,
          20 - state.party.length - quote.count,
          Math.floor((state.gold - quote.cost) / o.price),
        );
        return `<div class="recruit-offer"><div class="row"><strong>${esc(o.label)}</strong><span class="badge">${o.count} available</span></div><small>${o.price} crowns each</small><div class="quantity-control"><button data-action="recruit-quantity" data-type="${o.type}" data-change="-1" aria-label="Remove ${esc(o.label)}" ${selected < 1 ? 'disabled' : ''}>−</button><output aria-label="${esc(o.label)} selected">${selected}</output><button data-action="recruit-quantity" data-type="${o.type}" data-change="1" aria-label="Add ${esc(o.label)}" ${capacity < 1 ? 'disabled' : ''}>+</button><button data-action="recruit-quantity" data-type="${o.type}" data-change="5" ${capacity < 1 ? 'disabled' : ''}>+5</button></div></div>`;
      })
      .join('') || '<p class="muted">No recruits available today.</p>'
  }<div class="recruit-summary"><div class="row"><span>Company</span><strong>${state.party.length} → ${state.party.length + quote.count} / 20</strong></div><div class="row"><span>Recruitment cost</span><strong>${quote.cost} crowns</strong></div><button class="full primary" data-action="recruit-confirm" ${!quote.valid ? 'disabled' : ''}>Recruit ${quote.count} ${quote.count === 1 ? 'soldier' : 'soldiers'}</button>${quote.count ? '<button class="full quiet" data-action="recruit-reset">Reset selection</button>' : ''}</div>`;
}
function settlement(t) {
  if (!canVisit(state, t)) {
    toast('This kingdom is hostile. Negotiate peace before entering.');
    return;
  }
  if (state.visiting !== t.id) {
    recruitmentCart = {};
    ui.settlement = 'overview';
    ui.tradeCart = {};
  }
  state.mode = 'settlement';
  state.visiting = t.id;
  state.path = [];
  state.waiting = false;
  openFeature('settlement');
  updateUI();
}
function character(id) {
  if (ui.page !== 'character') ui.personTab = 'equipment';
  ui.person = id;
  openFeature('character');
}
function encounter(enemy) {
  if (modal.open || battle) return;
  state.path = [];
  state.waiting = false;
  showModal(
    `<div class="eyebrow">ENCOUNTER</div><h2>Brigands on the road</h2><p>${enemy.count} brigands stand between you and the open road.</p><p class="muted">Your company has ${state.party.filter((p) => !p.wounded).length} fit soldiers. You can deploy them before the battle begins.</p><div class="dialog-actions"><button data-action="avoid">Keep your distance</button><button class="primary" data-action="fight" data-id="${enemy.id}" ${!state.party.some((p) => !p.wounded) ? 'disabled' : ''}>Deploy company</button></div>`,
    'encounter',
  );
}
function battleUI() {
  const counts = [0, 0];
  for (const u of battle.units) if (u.hp > 0 && !u.routed) counts[u.side]++;
  const f = battle.formations[battle.selected];
  updateHTML(
    $('#left-panel'),
    `<div class="eyebrow">${battle.phase === 'deployment' ? 'DEPLOY YOUR COMPANY' : 'BATTLE COMMAND'}</div><h2>Hold the line.</h2><p class="muted" style="font-size:12px">Select a formation. Drag on the battlefield to draw its front line. Click to send it to a position.</p>${FORMATIONS.map(
      (id, i) => {
        const units = battle.units.filter((u) => u.formation === id && u.hp > 0 && !u.routed);
        return `<button class="full formation ${battle.selected === id ? 'active' : ''}" data-action="select-formation" data-id="${id}"><strong>${i + 1} · ${FORMATION_NAMES[id]}</strong><small>${units.length} standing · ${battle.formations[id].stance}</small></button>`;
      },
    ).join('')}<div class="divider"></div><h3>Orders</h3><div class="commands">${[
      ['hold', 'Hold position'],
      ['formation', 'Formation'],
      ['shield', 'Shield wall'],
      ['spear', 'Spear wall'],
      ['skirmish', 'Skirmish'],
      ['charge', 'Charge'],
    ]
      .map(
        ([id, label]) =>
          `<button class="${f.stance === id ? 'active' : ''}" data-action="stance" data-id="${id}">${label}</button>`,
      )
      .join(
        '',
      )}</div><div class="divider"></div><h3>Hero attachment</h3><select id="hero-attachment">${FORMATIONS.map((id) => `<option value="${id}" ${battle.units.find((u) => u.type === 'hero')?.formation === id ? 'selected' : ''}>${id === 'hero' ? 'Independent hero' : FORMATION_NAMES[id]}</option>`).join('')}</select><p class="muted" style="font-size:12px;margin-top:10px">Your hero fights automatically and follows the orders of their formation.</p>`,
  );
  updateHTML(
    $('#right-panel'),
    `<div class="eyebrow">FIELD REPORT</div><h2>${battle.phase === 'deployment' ? 'Before the clash' : battle.paused ? 'Orders, commander.' : 'The lines meet.'}</h2><div class="stats"><div class="stat"><span>YOUR COMPANY</span><strong>${counts[0]} <small>/ ${battle.initial[0]}</small></strong></div><div class="stat"><span>BRIGANDS</span><strong>${counts[1]} <small>/ ${battle.initial[1]}</small></strong></div></div><div class="divider"></div><p class="muted" style="font-size:13px">Shield walls resist frontal attacks. Spear walls strengthen close combat. Archers skirmish away from nearby enemies. Charge releases soldiers to pursue.</p><p class="muted" style="font-size:13px">A formation’s line follows your drag direction. You deploy in the south; the enemy starts in the north. Draw left to right to face north, or right to left to face south.</p><div class="terrain-guide"><strong>The ground matters</strong><small>Trees and boulders block movement and shots. Woodland and bushes give ranged cover. Brush and wet ground slow troops.</small></div><div class="notice"><span class="key">SPACE</span> Pause or resume<br><span class="key">1–3</span> Select formation<br><span class="key">C</span> Charge selected formation</div><button class="full danger" data-action="retreat">Retreat from battle</button>`,
  );
  updateHTML(
    $('#location-label'),
    `<div class="eyebrow">TACTICAL BATTLE · NORTH ↑</div><h2>The wooded marches</h2>`,
  );
  $('#map-caption').textContent =
    battle.phase === 'deployment'
      ? 'Deploy in the southern blue zone. Draw left to right to face the enemy to the north.'
      : battle.paused
        ? 'Time is stopped. Give your orders.'
        : '';
  updateHTML(
    $('#map-bottom'),
    `<div><strong>${battle.phase === 'deployment' ? 'Deployment' : battle.paused ? 'Battle paused' : 'Battle in progress'}</strong><div class="time-label">${Math.floor(battle.time / 60)}:${String(Math.floor(battle.time % 60)).padStart(2, '0')} elapsed · Campaign frozen</div></div><button class="primary" data-action="${battle.phase === 'deployment' ? 'begin-battle' : 'pause-battle'}">${battle.phase === 'deployment' ? 'Begin battle' : battle.paused ? 'Resume battle' : 'Pause · Space'}</button>`,
  );
  $('#overlay-view').hidden = true;
  $('#save-btn').disabled = true;
  $('#status').textContent = 'Formation command · Campaign time is frozen';
  $('#footer-help').textContent = 'Drag to form a line · 1–3 select · Space pauses';
  if (battle.result && modalKind !== 'result') battleResult();
}
function battleResult() {
  const won = battle.result === 'victory',
    our = battle.units.filter((u) => u.side === 0),
    lost = our.filter((u) => u.hp <= 0).length;
  const groups = [...new Set(our.map((u) => u.type))];
  showModal(
    `<div class="eyebrow">THE FIELD FALLS SILENT</div><h1>${won ? 'Victory' : 'Defeat'}</h1><p class="muted">${won ? 'Your company holds the field.' : 'The survivors gather after a bitter defeat.'}</p><table class="battle-ledger"><thead><tr><th>Troop</th><th>Deployed</th><th>Standing</th><th>Down</th><th>Kills</th></tr></thead><tbody>${groups
      .map((type) => {
        const units = our.filter((u) => u.type === type);
        return `<tr><td>${TYPES[type].label}</td><td>${units.length}</td><td>${units.filter((u) => u.hp > 0).length}</td><td>${units.filter((u) => u.hp <= 0).length}</td><td>${units.reduce((n, u) => n + u.kills, 0)}</td></tr>`;
      })
      .join(
        '',
      )}</tbody></table><div class="ledger-stats">${won ? `<div class="ledger-stat"><small>Recovered crowns</small><strong>${battle.enemyCount * 12}</strong></div>` : '<div class="ledger-stat"><small>Ransom</small><strong>35% of treasury</strong></div>'}<div class="ledger-stat"><small>Downed soldiers</small><strong>${lost}</strong></div></div><p class="muted">Downed soldiers may be wounded or killed. Your hero and companions survive this chapter. The survivors retain their names, equipment and experience.</p><div class="dialog-actions"><button class="primary" data-action="resolve">Return to campaign</button></div>`,
    'result',
  );
}
function selectTown(t) {
  state.selectedSettlement = t.id;
  renderer.camera.x = t.x;
  renderer.camera.y = t.y;
  updateUI();
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'creation-form') return;
  e.preventDefault();
  const data = new FormData(e.target);
  state = newCampaign(data.get('seed'), data.get('name'), data.get('history'));
  battle = null;
  tab = 'world';
  hasCampaign = true;
  renderer.center(state);
  state.selectedSettlement = state.homeId;
  closeModal();
  save(true);
  updateUI();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'encyclopedia-search') {
    ui.search = e.target.value;
    ui.entity = '';
    renderFeature();
  }
  if (e.target.id === 'hero-name') ui.creation.name = e.target.value;
  if (e.target.id === 'world-seed') ui.creation.seed = e.target.value;
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'creation-culture') {
    ui.creation.culture = Number(e.target.value);
    renderFeature();
  }
  if (e.target.id === 'creation-sex') {
    ui.creation.sex = e.target.value;
    renderFeature();
  }

  if (e.target.id === 'leader-formation') {
    const id = e.target.dataset.person;
    for (const f of Object.keys(state.formationLeaders))
      if (state.formationLeaders[f] === id) delete state.formationLeaders[f];
    if (e.target.value) state.formationLeaders[e.target.value] = id;
    save(true);
    toast('Command assignment updated.');
  }
  if (e.target.id === 'hero-attachment' && battle) {
    attachHero(battle, e.target.value);
    state.heroFormation = e.target.value;
    battleUI();
  }
});
document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el || el.disabled) return;
  if (el.dataset.tab === 'party') {
    openFeature('company');
    return;
  }
  if (el.dataset.tab) {
    if (battle) {
      toast('Finish the battle to open the campaign.');
      return;
    }
    tab = el.dataset.tab;
    updateUI();
    return;
  }
  const a = el.dataset.action,
    id = el.dataset.id;
  if (!a) return;
  const t = state.settlements.find((t) => t.id === state.visiting);
  if (a.startsWith('ui-')) {
    if (battle) return;
    switch (a) {
      case 'ui-close':
        if (ui.page === 'creation' && !hasCampaign) return;
        if (state.visiting && ui.page !== 'settlement') {
          ui.settlement = 'overview';
          openFeature('settlement');
        } else {
          if (state.visiting) {
            state.mode = 'campaign';
            state.visiting = null;
            save(true);
          }
          closeModal();
        }
        break;
      case 'ui-company':
        openFeature('company');
        break;
      case 'ui-group':
        ui.group = ui.group === id ? '' : id;
        renderFeature();
        break;
      case 'ui-person':
        ui.person = id;
        renderFeature();
        break;
      case 'ui-character':
        character(id || state.heroId);
        break;
      case 'ui-character-tab':
        ui.personTab = id;
        renderFeature();
        break;
      case 'ui-talent': {
        const person = state.party.find((p) => p.id === (ui.person || state.heroId));
        if (person && learnTalent(person, id)) {
          save(true);
          toast('Talent learned.');
        }
        renderFeature();
        break;
      }
      case 'ui-equip':
        if (equipItem(state, ui.person || state.heroId, id)) {
          save(true);
          toast('Equipment updated.');
        }
        renderFeature();
        break;
      case 'ui-unequip':
        unequipItem(state, ui.person || state.heroId, id);
        save(true);
        renderFeature();
        break;
      case 'ui-settlement-tab':
        ui.settlement = id;
        renderFeature();
        break;
      case 'ui-market-category':
        ui.category = id;
        renderFeature();
        break;
      case 'ui-trade-add': {
        if (!t || !ITEMS[id]) break;
        const direction = Number(el.dataset.direction),
          old = ui.tradeCart[id] || 0,
          limit = direction > 0 ? marketAmount(t, id) : amount(state, id);
        ui.tradeCart[id] = Math.max(
          -amount(state, id),
          Math.min(marketAmount(t, id), old + direction * Math.min(e.shiftKey ? 5 : 1, limit)),
        );
        renderFeature();
        break;
      }
      case 'ui-trade-clear':
        delete ui.tradeCart[id];
        renderFeature();
        break;
      case 'ui-trade-reset':
        ui.tradeCart = {};
        renderFeature();
        break;
      case 'ui-trade-confirm':
        if (t && trade(state, t, ui.tradeCart)) {
          ui.tradeCart = {};
          save(true);
          toast('Trade completed.');
        } else toast('The offer is no longer available.');
        renderFeature();
        break;
      case 'ui-ransom':
        if (t) {
          const n = ransomPrisoners(state, t);
          toast(n ? `${n} prisoners ransomed.` : 'No affordable ransom available.');
          save(true);
          renderFeature();
        }
        break;
      case 'ui-supply':
        if (t) {
          if (!supplyAction(state, t)) toast('Check provisions and the settlement treasury.');
          save(true);
          renderFeature();
        }
        break;
      case 'ui-diplomacy':
        if (id != null && id !== '') ui.faction = Number(id);
        ui.proposal = null;
        openFeature('diplomacy');
        break;
      case 'ui-faction':
        ui.faction = Number(id);
        ui.proposal = null;
        renderFeature();
        break;
      case 'ui-proposal':
        ui.proposal = id;
        renderFeature();
        break;
      case 'ui-proposal-cancel':
        ui.proposal = null;
        renderFeature();
        break;
      case 'ui-proposal-confirm': {
        if (diplomaticAction(state, ui.faction, ui.proposal)) {
          toast('Agreement recorded.');
          ui.proposal = null;
          if (t && !canVisit(state, t)) {
            state.visiting = null;
            state.mode = 'campaign';
          }
          save(true);
        } else toast('The proposal requirements are not met.');
        renderFeature();
        break;
      }
      case 'ui-encyclopedia':
        openFeature('encyclopedia');
        break;
      case 'ui-encyclopedia-tab':
        ui.encyclopedia = id;
        ui.entity = '';
        ui.search = '';
        renderFeature();
        break;
      case 'ui-entity':
        ui.entity = id;
        renderFeature();
        break;
      case 'ui-encyclopedia-entity':
        ui.entity = id;
        ui.encyclopedia = id.startsWith('person:')
          ? 'people'
          : id.startsWith('faction:')
            ? 'kingdoms'
            : 'settlements';
        ui.search = '';
        openFeature('encyclopedia');
        break;
      case 'ui-locate': {
        const town = state.settlements.find((t) => t.id === id);
        if (town) {
          if (state.visiting) {
            state.mode = 'campaign';
            state.visiting = null;
          }
          closeModal();
          tab = 'world';
          state.selectedSettlement = town.id;
          renderer.camera.x = town.x;
          renderer.camera.y = town.y;
          toast(town.name + ' located.');
        }
        break;
      }
      case 'ui-origin':
        ui.creation.choices[ui.creation.step - 1] = id;
        renderFeature();
        break;
      case 'ui-creation-next':
        ui.creation.step = Math.min(5, ui.creation.step + 1);
        renderFeature();
        break;
      case 'ui-creation-back':
        ui.creation.step = Math.max(0, ui.creation.step - 1);
        renderFeature();
        break;
      case 'ui-create': {
        const c = ui.creation;
        state = newCampaign(c.seed || 'The Long March', c.name || 'Wanderer', c.choices[0]);
        applyBackground(state, c.choices, c.culture, c.sex);
        battle = null;
        tab = 'world';
        hasCampaign = true;
        renderer.center(state);
        state.selectedSettlement = state.homeId;
        closeModal();
        save(true);
        break;
      }
    }
    updateUI();
    return;
  }
  switch (a) {
    case 'close':
      closeModal();
      break;
    case 'save':
      save();
      break;
    case 'load':
      load();
      break;
    case 'new':
      creation();
      break;
    case 'export': {
      try {
        const blob = new Blob([encodeSave(state)], { type: 'application/json' }),
          url = URL.createObjectURL(blob),
          link = document.createElement('a');
        link.href = url;
        link.download = 'PixelKingdom-save.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        toast(err.message);
      }
      break;
    }
    case 'import':
      $('#import-save').click();
      break;
    case 'nearby': {
      const town = [...state.settlements].sort(
        (a, b) => distance(state, a) - distance(state, b),
      )[0];
      tab = 'world';
      selectTown(town);
      break;
    }
    case 'party':
      openFeature('company');
      break;
    case 'visit': {
      const town = state.settlements.find((t) => t.id === id);
      if (distance(state, town) < 1.4) settlement(town);
      else {
        travel(state, town);
        toast('Travelling to ' + town.name + '. Enter when you arrive.');
      }
      break;
    }
    case 'leave':
      state.mode = 'campaign';
      state.visiting = null;
      closeModal();
      save(true);
      break;
    case 'recruit-quantity':
      if (t) {
        const type = el.dataset.type,
          offer = troopOffers(t).find((o) => o.type === type);
        if (offer) {
          const quote = recruitmentQuote(state, t, recruitmentCart),
            selected = recruitmentCart[type] || 0;
          const maxAdd = Math.max(
            0,
            Math.min(
              offer.count - selected,
              20 - state.party.length - quote.count,
              Math.floor((state.gold - quote.cost) / offer.price),
            ),
          );
          const change = Number(el.dataset.change);
          recruitmentCart[type] = Math.max(
            0,
            selected + (change > 0 ? Math.min(change, maxAdd) : change),
          );
          settlement(t);
        }
      }
      break;
    case 'recruit-reset':
      recruitmentCart = {};
      if (t) settlement(t);
      break;
    case 'recruit-confirm':
      if (t) {
        if (recruitTroops(state, t, recruitmentCart))
          toast('Soldiers enlisted. Their names are in your company roster.');
        else toast('Check available troops, funds, and company capacity.');
        recruitmentCart = {};
        settlement(t);
      }
      break;
    case 'recruit':
      if (t) {
        if (!recruit(state, t, id)) toast('Recruitment is unavailable.');
        recruitmentCart = {};
        settlement(t);
      }
      break;
    case 'food':
      if (t && state.gold >= 10 && t.stock >= 10) {
        state.gold -= 10;
        state.food += 10;
        t.stock -= 10;
        settlement(t);
      }
      break;
    case 'contract':
      if (t && !state.quest) {
        const target = [...state.bandits]
          .filter((b) => b.alive && b.count <= 5)
          .sort((a, b) => distance(t, a) - distance(t, b))[0];
        if (target) {
          state.quest = { townId: t.id, targetId: target.id, done: false };
          log(state, 'Accepted a road-clearing contract at ' + t.name + '.');
        } else toast('The roads are clear of small brigand parties.');
        settlement(t);
      }
      break;
    case 'claim':
      if (t && state.quest?.done && state.quest.townId === t.id) {
        state.gold += 100;
        state.renown += 10;
        state.clanLevel = Math.floor(state.renown / 50);
        state.quest = null;
        log(state, 'Received 100 crowns for securing the roads.');
        settlement(t);
      }
      break;
    case 'track': {
      const b = state.bandits.find((b) => b.id === state.quest?.targetId);
      if (b) {
        renderer.camera.x = b.x;
        renderer.camera.y = b.y;
        tab = 'world';
        toast('Target located: ' + b.count + ' brigands. Click the red marker to approach.');
      }
      break;
    }
    case 'pause':
      state.paused = !state.paused;
      break;
    case 'speed':
      state.speed = Number(el.dataset.speed);
      break;
    case 'wait':
      state.waiting = !state.waiting;
      state.path = [];
      state.paused = false;
      break;
    case 'promote':
      if (promote(state, id, el.dataset.type)) toast('Promotion earned. Their history continues.');
      break;
    case 'elevate':
      if (elevate(state, id)) toast('A soldier becomes a companion.');
      break;
    case 'character':
      character(id);
      break;
    case 'skill':
    case 'talent': {
      const p = state.party.find((p) => p.id === id),
        key = el.dataset.key,
        points = a === 'skill' ? 'skillPoints' : 'talentPoints',
        dict = a === 'skill' ? 'skills' : 'talents';
      if (p[points] > 0 && key in p[dict]) {
        p[points]--;
        p[dict][key]++;
      }
      character(id);
      break;
    }
    case 'equip': {
      const p = state.party.find((p) => p.id === id),
        slot = el.dataset.slot,
        cost = slot === 'weapon' ? 60 : 80;
      if (state.gold >= cost) {
        state.gold -= cost;
        p.equipment[slot] = slot === 'weapon' ? 'Tempered sword' : 'Mail hauberk';
      }
      character(id);
      break;
    }
    case 'avoid':
      state.pursuitId = null;
      closeModal();
      break;
    case 'fight': {
      const enemy = state.bandits.find((b) => b.id === id);
      if (enemy?.alive) {
        closeModal();
        battle = createBattle(state, enemy);
        tab = 'world';
      }
      break;
    }
    case 'select-formation':
      if (battle) battle.selected = id;
      break;
    case 'stance':
      if (battle) setStance(battle, battle.selected, id);
      break;
    case 'begin-battle':
      if (battle) {
        battle.phase = 'battle';
        battle.paused = false;
      }
      break;
    case 'pause-battle':
      if (battle && battle.phase === 'battle') battle.paused = !battle.paused;
      break;
    case 'retreat':
      if (battle) {
        battle.result = 'defeat';
        battle.phase = 'result';
        battle.paused = true;
      }
      break;
    case 'resolve':
      if (battle) {
        rewardBattle(state, battle);
        battle = null;
        renderer.center(state);
        closeModal();
        save(true);
      }
      break;
  }
  updateUI();
});
$('#import-save').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 10_000_000) throw Error('Save file is too large.');
    const imported = decodeSave(await file.text());
    state = imported;
    hasCampaign = true;
    battle = null;
    tab = 'world';
    renderer.center(state);
    closeModal();
    save(true);
    updateUI();
    toast('Save imported.');
  } catch (err) {
    toast(err.message);
  }
  e.target.value = '';
});
modal.addEventListener('cancel', (e) => {
  if (['creation', 'result'].includes(modalKind)) {
    e.preventDefault();
    return;
  }
  if (state.mode === 'settlement') {
    state.mode = 'campaign';
    state.visiting = null;
    save(true);
  }
  modalKind = '';
  ui.page = '';
  updateUI();
});
$('#save-btn').onclick = () => save();
$('#menu-btn').onclick = menu;
$('#zoom-in').onclick = () => {
  if (!battle) renderer.camera.zoom = clamp(renderer.camera.zoom * 1.25, 5, 40);
};
$('#zoom-out').onclick = () => {
  if (!battle) renderer.camera.zoom = clamp(renderer.camera.zoom / 1.25, 5, 40);
};
$('#center-btn').onclick = () => renderer.center(state);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (battle) return;
    const rect = canvas.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top,
      before = renderer.world(x, y);
    renderer.camera.zoom = clamp(renderer.camera.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 5, 40);
    const after = renderer.world(x, y);
    renderer.camera.x += before.x - after.x;
    renderer.camera.y += before.y - after.y;
  },
  { passive: false },
);
canvas.addEventListener('pointerdown', (e) => {
  if (modal.open) return;
  const r = canvas.getBoundingClientRect();
  pointer = {
    x: e.clientX - r.left,
    y: e.clientY - r.top,
    lastX: e.clientX,
    lastY: e.clientY,
    button: e.button,
    moved: false,
  };
  canvas.setPointerCapture(e.pointerId);
  if (battle && e.button === 0) {
    const p = renderer.battlePoint(pointer.x, pointer.y);
    renderer.dragLine = { start: p, end: p };
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointer) return;
  const dx = e.clientX - pointer.lastX,
    dy = e.clientY - pointer.lastY,
    r = canvas.getBoundingClientRect();
  if (Math.hypot(e.clientX - r.left - pointer.x, e.clientY - r.top - pointer.y) > 5)
    pointer.moved = true;
  if (battle && renderer.dragLine)
    renderer.dragLine.end = renderer.battlePoint(e.clientX - r.left, e.clientY - r.top);
  else if (pointer.button === 2 || pointer.button === 1) {
    renderer.camera.x -= dx / renderer.camera.zoom;
    renderer.camera.y -= dy / renderer.camera.zoom;
  }
  pointer.lastX = e.clientX;
  pointer.lastY = e.clientY;
});
canvas.addEventListener('pointerup', (e) => {
  if (!pointer) return;
  const p = pointer;
  pointer = null;
  if (battle) {
    if (renderer.dragLine) {
      orderLine(battle, battle.selected, renderer.dragLine.start, renderer.dragLine.end);
      renderer.dragLine = null;
      battleUI();
    }
    return;
  }
  if (p.button !== 0 || p.moved) return;
  const point = renderer.world(p.x, p.y),
    town = state.settlements.find((t) => distance(t, point) < 12 / renderer.camera.zoom);
  if (town) {
    state.selectedSettlement = town.id;
    if (distance(state, town) < 1.4) settlement(town);
    else updateUI();
    return;
  }
  const enemy = state.bandits.find(
    (b) => b.alive && distance(b, point) < 12 / renderer.camera.zoom,
  );
  if (enemy && distance(state, enemy) < 1.6) {
    encounter(enemy);
    return;
  }
  travel(state, enemy || point);
  state.pursuitId = enemy?.id || null;
  updateUI();
});
canvas.addEventListener('pointercancel', () => {
  pointer = null;
  renderer.dragLine = null;
});
document.addEventListener('keydown', (e) => {
  if (modal.open || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName))
    return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (battle && battle.phase === 'battle') battle.paused = !battle.paused;
    else if (!battle) state.paused = !state.paused;
    updateUI();
  }
  if (battle && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    battle.selected = FORMATIONS[Number(e.code.slice(-1)) - 1];
    battleUI();
  }
  if (battle && e.code === 'KeyC') {
    setStance(battle, battle.selected, 'charge');
    battleUI();
  }
  if (!battle && e.code === 'Escape') {
    state.path = [];
    state.waiting = false;
    state.pursuitId = null;
    updateUI();
  }
});
// Fixed steps keep combat stable across display frame rates; cap catch-up after background tabs.
let accumulator = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.1);
  last = now;
  if (!modal.open) {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= 1 / 30 && steps++ < 4) {
      if (battle) tickBattle(battle, 1 / 30);
      else {
        const enemy = tickCampaign(state, 1 / 30);
        if (enemy) {
          encounter(enemy);
          accumulator = 0;
          break;
        }
      }
      accumulator -= 1 / 30;
    }
  } else accumulator = 0;
  renderer.draw(state, battle);
  uiTime += dt;
  if (uiTime > 0.6) {
    if (!modal.open || battle?.result) updateUI();
    uiTime = 0;
  }
  requestAnimationFrame(frame);
}
window.addEventListener('beforeunload', () => {
  if (hasCampaign && !battle) save(true);
});
updateUI();
creation();
requestAnimationFrame(frame);

import { APPEARANCE_OPTIONS, appearanceOf } from './appearance.js';
import { TYPES, CULTURES, stats, hash } from './core.js';
import {
  ITEMS,
  TALENTS,
  BACKGROUNDS,
  creationTotals,
  amount,
  marketAmount,
  price,
  tradeQuote,
  DIPLOMACY,
  diplomaticQuote,
} from './features.js';
import { esc, portrait, herald, icon, settlementArt } from './art.js';
const btn = (label, action, id = '', extra = '') =>
  `<button data-action="${action}" data-id="${esc(id)}" ${extra}>${label}</button>`;
const stat = (label, value) =>
  `<div class="ledger-stat"><small>${label}</small><strong>${value}</strong></div>`;
const empty = (title, text) =>
  `<div class="empty-state">${icon('banner')}<h3>${title}</h3><p>${text}</p></div>`;
export function frame(title, kicker, body, footer = '', tabs = '', canClose = true) {
  return `<header class="window-header"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1></div>${canClose ? btn('×', 'ui-close', '', 'class="window-close" aria-label="Close window"') : ''}</header>${tabs ? `<nav class="window-tabs">${tabs}</nav>` : ''}<div class="window-content">${body}</div><footer class="window-footer">${footer || '<span>THE LONG MARCH</span><span>Escape to return</span>'}</footer>`;
}
function appearanceControls(p, mode) {
  const a = appearanceOf(p);
  return `<div class="appearance-controls">${Object.entries(APPEARANCE_OPTIONS)
    .map(
      ([key, values]) =>
        `<div><label for="appearance-${mode}-${key}">${key[0].toUpperCase() + key.slice(1)}</label><select id="appearance-${mode}-${key}" data-appearance-part="${key}" data-appearance-mode="${mode}">${values.map((label, i) => `<option value="${i}" ${a[key] === i ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`,
    )
    .join(
      '',
    )}</div><p class="fine-print">Change each part independently. Portrait clothing is cosmetic; equipped items determine combat stats.</p>`;
}
export function creationScreen(c, hasSave) {
  const totals = creationTotals(c.choices),
    p = {
      id: `${hash(c.seed || 'The Long March')}-1`,
      name: c.name || 'Wanderer',
      sex: c.sex,
      appearance: c.appearance,
      culture: c.culture,
      equipment: {
        armor: totals.items.includes('gambeson') ? 'Quilted gambeson' : 'Travel clothes',
      },
    },
    stage = BACKGROUNDS[c.step - 1];
  const rail = `<aside class="creation-rail"><div class="eyebrow">YOUR CHRONICLE</div>${['Identity', ...BACKGROUNDS.map((s) => s.title), 'Review'].map((x, i) => `<div class="chapter-step ${c.step === i ? 'current' : c.step > i ? 'complete' : ''}"><span>${c.step > i ? '✓' : String(i + 1).padStart(2, '0')}</span>${x}</div>`).join('')}<div class="creation-totals">${Object.entries(
    totals.skills,
  )
    .map(([k, v]) => stat(k, v))
    .join(
      '',
    )}${stat('Crowns', totals.gold)}${stat('Provisions', totals.food)}${stat('Talent points', totals.talentPoints)}</div></aside>`;
  let content =
    c.step === 0
      ? `<div class="eyebrow">A NAME BEFORE A CROWN</div><h2>Who will you become?</h2><p class="muted">A life lived before the first march. Choose the experiences that shaped your character.</p><label for="hero-name">Your name</label><input id="hero-name" maxlength="40" value="${esc(c.name)}"><div class="two-col"><div><label for="creation-culture">Culture</label><select id="creation-culture">${CULTURES.map((v, i) => `<option value="${i}" ${c.culture === i ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div><div><label for="creation-sex">Appearance</label><select id="creation-sex"><option value="male" ${c.sex === 'male' ? 'selected' : ''}>Man</option><option value="female" ${c.sex === 'female' ? 'selected' : ''}>Woman</option></select></div></div><label for="world-seed">World seed</label><input id="world-seed" maxlength="80" value="${esc(c.seed)}"><h3>Character appearance</h3>${appearanceControls(p, 'creation')}<p class="fine-print">Your chosen history determines starting abilities.</p>`
      : c.step === 5
        ? `<div class="eyebrow">THE STORY SO FAR</div><h2>${esc(c.name || 'Wanderer')}</h2><p class="muted">${CULTURES[c.culture].name} · A free adventurer</p>${BACKGROUNDS.map(
            (s, i) => {
              const a = s.choices.find((x) => x.id === c.choices[i]);
              return `<div class="history-review"><small>${s.title}</small><strong>${a.title}</strong><span>${a.effect}</span></div>`;
            },
          ).join(
            '',
          )}<div class="notice">You begin alone near Alderford. Recruit a company, earn a name, and decide what your house will stand for.</div>`
        : `<div class="eyebrow">CHAPTER ${c.step} OF 4</div><h2>${stage.prompt}</h2><p class="muted">Each choice becomes part of your biography.</p><div class="origin-choices">${stage.choices.map((a) => btn(`<strong>${a.title}</strong><span>${a.text}</span><small>${a.effect}</small>`, 'ui-origin', a.id, `class="origin-choice ${c.choices[c.step - 1] === a.id ? 'selected' : ''}"`)).join('')}</div>`;
  return frame(
    'A life before the crown',
    'CHARACTER CREATION',
    `<div class="creation-layout">${rail}<div class="character-dais">${portrait(p, true)}<div class="dais-name">${esc(p.name)}</div><small>THE BEGINNING OF A HOUSE</small></div><section class="creation-question">${content}</section></div>`,
    `<div>${c.step > 0 ? btn('← Previous', 'ui-creation-back') : hasSave ? btn('Return to campaign', 'close') : btn('Continue saved campaign', 'load')}</div><span>Step ${c.step + 1} / 6</span>${btn(c.step === 5 ? 'Begin your journey →' : 'Continue →', c.step === 5 ? 'ui-create' : 'ui-creation-next', '', 'class="primary"')}`,
    '',
    hasSave,
  );
}
export function troopGroups(s) {
  return Object.entries(TYPES)
    .filter(([key]) => s.party.some((p) => p.type === key))
    .map(([key, type]) => ({ key, type, people: s.party.filter((p) => p.type === key) }));
}
export function companyScreen(s, u) {
  const selected = s.party.find((p) => p.id === u.person) || s.party[0],
    st = stats(selected);
  const groups = troopGroups(s);
  const list = `<div class="troop-list">${groups.map((g) => `<section class="troop-group"><button class="troop-group-heading ${u.group === g.key ? 'active' : ''}" data-action="ui-group" data-id="${g.key}">${icon(g.key === 'archer' || g.key === 'marksman' ? 'tree' : 'shield')}<strong>${g.type.label}</strong><span>× ${g.people.length}</span></button>${u.group === g.key || ['hero', 'companion'].includes(g.key) ? g.people.map((p) => btn(`${portrait(p)}<span><strong>${esc(p.name)}</strong><small>LV ${p.level} · ${p.health}% condition ${p.wounded ? '· Wounded' : ''}</small></span><span class="mini-xp">${p.xp}/${p.level * 35} XP</span>`, 'ui-person', p.id, `class="person-row ${selected.id === p.id ? 'selected' : ''}"`)).join('') : ''}</section>`).join('')}</div>`;
  const detail = `<div class="person-detail"><div class="eyebrow">${TYPES[selected.type].label} · LEVEL ${selected.level}</div><h2>${esc(selected.name)}</h2><p class="muted">${esc(selected.traits.join(' · '))} · Age ${selected.age} · ${CULTURES[selected.culture % 3].name}</p><div class="ledger-stats">${stat('Health', selected.health + '%')}${stat('Kills', selected.kills)}${stat('Damage', st.damage)}${stat('Armor', st.armor)}</div><h3>Service record</h3>${
    selected.history
      .slice(-4)
      .map((h) => `<p class="record"><small>DAY ${h.day}</small>${esc(h.event)}</p>`)
      .join('') || '<p class="muted">Their story is just beginning.</p>'
  }<h3>Advancement</h3><p class="muted">${selected.xp} / ${selected.level * 35} XP toward the next level.</p><div class="card-actions">${TYPES[selected.type].next.map((next) => btn(`${TYPES[next].label} · 25 crowns`, 'promote', selected.id, `data-type="${next}" ${selected.level < 2 || s.gold < 25 ? 'disabled' : ''}`)).join('')}${!['hero', 'companion'].includes(selected.type) ? btn('Raise to companion · 100', 'elevate', selected.id, selected.level < 3 || s.gold < 100 ? 'disabled title="Requires level 3 and 100 crowns"' : '') : btn('Character & equipment →', 'character', selected.id, 'class="primary"')}</div>${!['hero', 'companion'].includes(selected.type) && selected.level < 2 ? '<small>Soldiers unlock promotions at level 2.</small>' : ''}</div>`;
  return frame(
    'Your company',
    esc(s.dynasty.name),
    `<div class="ledger-stats company-summary">${stat('Company', s.party.length + ' / 20')}${stat('Fit for service', s.party.filter((p) => !p.wounded).length)}${stat('Wounded', s.party.filter((p) => p.wounded).length)}${stat('Prisoners', s.prisoners.length)}${stat('Treasury', s.gold + ' ♙')}</div><div class="company-layout">${list}<div class="character-dais">${portrait(selected, true)}<span class="badge">${TYPES[selected.type].label}</span></div>${detail}</div>`,
    `<span>Open a troop group to meet its individual soldiers.</span>${btn('Return to campaign', 'ui-close')}`,
  );
}
export function characterScreen(s, u) {
  const p = s.party.find((p) => p.id === u.person) || s.party[0],
    st = stats(p);
  const chooser = s.party
    .filter((p) => ['hero', 'companion'].includes(p.type))
    .map((p2) =>
      btn(
        `${portrait(p2)}<span>${esc(p2.name)}</span>`,
        'ui-character',
        p2.id,
        `class="character-pick ${p.id === p2.id ? 'selected' : ''}"`,
      ),
    )
    .join('');
  const tabs = ['equipment', 'talents', 'biography', 'appearance']
    .map((x) =>
      btn(
        x[0].toUpperCase() + x.slice(1),
        'ui-character-tab',
        x,
        `class="${u.personTab === x ? 'active' : ''}"`,
      ),
    )
    .join('');
  let detail = '';
  if (u.personTab === 'appearance')
    detail = `<div class="section-heading"><div class="eyebrow">MODULAR PORTRAIT TEST</div><h2>A face for your story</h2><p class="muted">These portraits combine the premade parts in your browser. Choose each feature for ${esc(p.name)}; your choices are saved with this character.</p></div>${appearanceControls(p, 'person')}`;
  else if (u.personTab === 'talents')
    detail = `<div class="talent-toolbar"><strong>${p.skillPoints} skill points · ${p.talentPoints} talent points</strong><span>Hover or read each card for its effect.</span></div><div class="skill-bars">${Object.entries(
      p.skills,
    )
      .map(
        ([key, v]) =>
          `<div><span>${key}</span><strong>${v}</strong>${btn('+1', 'skill', p.id, `data-key="${key}" ${p.skillPoints < 1 ? 'disabled' : ''} aria-label="Raise ${key}"`)}</div>`,
      )
      .join('')}</div><div class="talent-branches">${['Warrior', 'Commander', 'Wayfarer']
      .map(
        (branch) =>
          `<section><h3>${branch}</h3>${Object.entries(TALENTS)
            .filter(([, t]) => t.branch === branch)
            .map(
              ([key, t]) =>
                `<div class="talent-node ${(p.talents[key] || 0) > 0 ? 'learned' : ''}">${icon(t.icon)}<span class="badge">${t.scope}</span><h4>${t.name}</h4><div class="rank-dots">${Array.from({ length: 3 }, (_, i) => `<i class="${(p.talents[key] || 0) > i ? 'filled' : ''}"></i>`).join('')}</div><p>${t.text}</p><small>${t.requirement ? `Requires ${t.skill} ${t.requirement}` : 'No skill prerequisite'}</small>${btn((p.talents[key] || 0) >= t.max ? 'Mastered' : 'Learn · 1 point', 'ui-talent', key, `${p.talentPoints < 1 || (p.talents[key] || 0) >= t.max || p.skills[t.skill] < t.requirement ? 'disabled' : ''}`)}</div>`,
            )
            .join('')}</section>`,
      )
      .join('')}</div>`;
  else if (u.personTab === 'biography')
    detail = `<h2>A life in the Borderlands</h2><p class="muted">${esc(p.traits.join(' · '))} · ${p.age} years · ${CULTURES[p.culture % 3].name}</p>${p.history.map((h) => `<div class="history-review"><small>DAY ${h.day}</small><strong>${esc(h.event)}</strong></div>`).join('')}<h3>Household</h3><p>No spouse or children recorded.</p><p class="fine-print">Marriage and succession remain future campaign systems.</p>`;
  else
    detail = `<div class="ledger-stats">${stat('Maximum health', st.hp)}${stat('Damage', st.damage)}${stat('Armor', st.armor)}${stat('Command', p.skills.leadership + (p.talents.inspiration || 0) * 2)}</div><h3>Equipped</h3><div class="equipment-slots">${['weapon', 'armor'].map((slot) => `<div class="equipment-slot">${icon(slot === 'weapon' ? 'sword' : 'armor')}<div><small>${slot.toUpperCase()}</small><strong>${esc(p.equipment[slot])}</strong></div>${btn('Remove', 'ui-unequip', slot, Object.values(ITEMS).some((i) => i.name === p.equipment[slot]) ? '' : 'disabled')}</div>`).join('')}</div><h3>Company inventory</h3>${
      Object.entries(ITEMS)
        .filter(([id, item]) => item.slot && amount(s, id) > 0)
        .map(
          ([id, item]) =>
            `<div class="inventory-row">${icon(item.icon)}<div><strong>${item.name} × ${amount(s, id)}</strong><small>${item.description}</small></div>${btn('Equip', 'ui-equip', id)}</div>`,
        )
        .join('') ||
      empty(
        'A light pack',
        'Purchase equipment at a settlement market to equip yourself or a companion.',
      )
    }<h3>Formation command</h3>${p.type === 'companion' ? `<label for="leader-formation">Lead a formation</label><select id="leader-formation" data-person="${p.id}"><option value="">Unassigned</option>${['infantry', 'archers'].map((f) => `<option value="${f}" ${s.formationLeaders[f] === p.id ? 'selected' : ''}>${f === 'infantry' ? 'Foot company' : 'Bow company'}</option>`).join('')}</select>` : '<p class="muted">Attach your hero to a formation during battle deployment to apply command bonuses.</p>'}`;
  return frame(
    esc(p.name),
    `${TYPES[p.type].label.toUpperCase()} · LEVEL ${p.level}`,
    `<div class="character-layout"><aside class="character-sidebar">${chooser}<div class="character-dais">${portrait(p, true)}</div><small>${esc(s.dynasty.name)}</small></aside><section class="character-content">${detail}</section></div>`,
    `<span>${s.gold} crowns · ${p.skillPoints} skill points · ${p.talentPoints} talent points</span>${btn('Back to company', 'ui-company')}`,
    tabs,
  );
}
function shopScreen(s, t, u) {
  const quote = tradeQuote(s, t, u.tradeCart),
    ids = Object.keys(ITEMS).filter((id) => u.category === 'All' || ITEMS[id].kind === u.category);
  const rows = (selling) =>
    ids
      .map((id) => {
        const i = ITEMS[id],
          stock = selling ? amount(s, id) : marketAmount(t, id),
          n = u.tradeCart[id] || 0;
        if (!stock && !(selling ? n < 0 : n > 0)) return '';
        return `<div class="inventory-row" data-ui-key="${selling ? 'owned' : 'market'}-${id}">${icon(i.icon)}<div><strong>${i.name}</strong><small>${i.description}</small><span>${stock} available · ${price(s, t, id, !selling)} ♙ each</span></div><div class="trade-quantity">${btn(selling ? '←' : '→', 'ui-trade-add', id, `data-direction="${selling ? -1 : 1}" ${stock < 1 ? 'disabled' : ''} aria-label="${selling ? 'Sell' : 'Buy'} ${i.name}"`)}${(selling ? n < 0 : n > 0) ? `<span class="gold">${Math.abs(n)} selected</span>${btn('×', 'ui-trade-clear', id, `aria-label="Reset ${i.name}"`)}` : ''}</div></div>`;
      })
      .join('');
  return `<div class="market-toolbar"><div class="window-tabs">${['All', 'Supplies', 'Weapons', 'Armor', 'Materials'].map((c) => btn(c, 'ui-market-category', c, `class="${u.category === c ? 'active' : ''}"`)).join('')}</div><small>Click to move one · Shift-click to move five</small></div><div class="trade-layout"><section><h3>Settlement market <small>${t.wealth} crowns</small></h3>${rows(false) || empty('No stock', 'No goods in this category.')}</section><div class="trade-seal">${icon('coin')}<span>FAIR EXCHANGE</span></div><section><h3>Your inventory <small>${s.gold} crowns</small></h3>${rows(true) || empty('Nothing here', 'Your purchases will appear here after confirmation.')}</section></div><div class="transaction-bar"><div><small>${quote.cost >= 0 ? 'YOU PAY' : 'YOU RECEIVE'}</small><strong>${Math.abs(quote.cost)} crowns</strong><span>${quote.reason || `${quote.count} goods in this offer`}</span></div>${btn('Reset offer', 'ui-trade-reset')}${btn('Confirm trade', 'ui-trade-confirm', '', `class="primary" ${!quote.valid ? 'disabled' : ''}`)}</div>`;
}
export function settlementScreen(s, t, u, recruitMarkup) {
  const f = s.factions[t.faction],
    q = s.quest,
    section = u.settlement;
  const nav = [
    ['overview', 'The settlement', 'shield'],
    ['recruit', 'Recruit troops', 'banner'],
    ['market', 'Trade & equipment', 'coin'],
    ['tavern', t.kind === 'village' ? 'The common hall' : 'The tavern', 'heart'],
    ['quests', 'Local work', 'book'],
    ['economy', 'Economy', 'grain'],
    ['prisoners', 'Prisoners', 'shield'],
    ['court', 'The ruling house', 'banner'],
  ];
  const side = `<aside class="settlement-nav">${herald(f)}<small>${esc(f.name)}</small>${nav.map(([id, name, ico]) => btn(`${icon(ico)}${name}`, 'ui-settlement-tab', id, `class="${section === id ? 'active' : ''}"`)).join('')}<div class="nav-spacer"></div>${btn('Leave settlement →', 'leave', '', 'class="leave-button"')}</aside>`;
  let body = '';
  if (section === 'overview')
    body = `<div class="settlement-illustration">${settlementArt(t, f)}<div class="scene-title"><div class="eyebrow">${esc(f.name)} · ${t.kind.toUpperCase()}</div><h2>${esc(t.name)}</h2><p>${t.kind === 'village' ? 'Smoke rises from the hearths. The fields sustain a kingdom.' : t.kind === 'castle' ? 'Stone walls guard the old road. Banners turn in the wind.' : 'Trade, ambition and a thousand small lives behind the walls.'}</p></div></div><div class="ledger-stats">${stat('Population', t.population.toLocaleString())}${stat('Prosperity', t.prosperity + ' / 100')}${stat('Provisions', t.stock)}${stat('Recruits', t.recruits.length)}</div><div class="settlement-overview"><section><div class="eyebrow">WITHIN THESE WALLS</div><h3>${t.kind === 'village' ? 'A place to begin' : 'Crossroads of the Borderlands'}</h3><p class="muted">${esc(t.name)} is held by ${esc(f.leader.title + ' ' + f.leader.name)} of ${esc(f.name)}. Local workshops produce ${ITEMS[t.production].name.toLowerCase()}. There are ${t.recruits.length} regular soldiers available for recruitment.</p><div class="card-actions">${btn('Visit the market', 'ui-settlement-tab', 'market')}${btn('Find work', 'ui-settlement-tab', 'quests')}</div></section><section class="notable-card">${portrait(t.notable)}<div><small>${esc(t.notable.role)}</small><h3>${esc(t.notable.name)}</h3><p>“There is always work for a willing company.”</p>${btn('Speak about work', 'ui-settlement-tab', 'quests')}</div></section></div>`;
  if (section === 'recruit')
    body = `<div class="section-heading"><div class="eyebrow">THE MUSTER GROUND</div><h2>New hands for your banner</h2><p class="muted">Recruit by troop type. Meet the individuals in your company afterward.</p></div><div class="recruit-layout"><section>${recruitMarkup}</section><section><h3>Your company <small>${s.party.length} / 20</small></h3>${troopGroups(
      s,
    )
      .map(
        (g) =>
          `<div class="inventory-row">${icon('shield')}<strong>${g.type.label}</strong><span>× ${g.people.length}</span></div>`,
      )
      .join('')}</section></div>`;
  if (section === 'market') body = shopScreen(s, t, u);
  if (section === 'tavern')
    body = `<div class="tavern-banner"><div class="eyebrow">${t.kind === 'village' ? 'THE COMMON HALL' : 'A FIRE AND A FAMILIAR STORY'}</div><h2>${t.kind === 'village' ? 'Around the village hearth' : 'The Wayfarer’s Rest'}</h2></div>${t.companion ? `<div class="companion-offer"><div class="character-dais">${portrait(t.companion, true)}</div><div><span class="badge">COMPANION FOR HIRE</span><h2>${esc(t.companion.name)}</h2><p class="muted">${esc(t.companion.traits.join(' · '))} · ${t.companion.age} years old</p><p>“I’ve served under enough banners to know that the person carrying one matters more than its colour. Is there room in your company?”</p><div class="ledger-stats">${stat('Martial', t.companion.skills.martial)}${stat('Leadership', t.companion.skills.leadership)}${stat('Hiring fee', '100 ♙')}</div>${btn('Hire companion · 100 crowns', 'recruit', t.companion.id, `class="primary" ${s.gold < 100 || s.party.length >= 20 ? 'disabled' : ''}`)}</div></div>` : empty('No companions seeking work', t.kind === 'village' ? 'Try a larger town to find experienced travellers.' : 'The travellers here have their own roads to follow.')}<div class="notice">Companions have their own equipment, skills and talents. Assign them to command formations from their character sheet.</div>`;
  if (section === 'quests') {
    const sq = s.supplyQuests[t.id],
      cool = sq?.completed != null && s.day - sq.completed < 7;
    body = `<div class="section-heading"><div class="eyebrow">CONTRACTS & COMMISSIONS</div><h2>Work on the roads</h2><p class="muted">Promises made to real settlements and people.</p></div><article class="quest-card"><div>${icon('sword')}<span class="badge">ROAD CONTRACT</span><h3>Clear the roads</h3><p>Brigands are troubling the countryside. The steward offers payment for defeating the marked party and returning.</p><small>${q ? 'Current contract: ' + esc(s.settlements.find((x) => x.id === q.townId)?.name) : 'Offered by ' + esc(t.notable.name)}</small></div><div><strong>100 crowns</strong>${!q ? btn('Accept contract', 'contract', '', 'class="primary"') : q.townId === t.id && q.done ? btn('Collect 100 crowns', 'claim', '', 'class="primary"') : '<span class="badge">' + (q.done ? 'READY TO CLAIM' : 'IN PROGRESS') + '</span>'}</div></article><article class="quest-card"><div>${icon('grain')}<span class="badge">LOCAL SUPPLIES</span><h3>Fill the storehouse</h3><p>Deliver 20 provisions to the settlement. You currently carry ${s.food}.</p><small>+2 relation with ${esc(f.name)} · ${sq?.active ? 'Accepted' : cool ? 'Available again on day ' + (sq.completed + 7) : 'Offered by ' + esc(t.notable.name)}</small></div><div><strong>35 crowns</strong>${btn(sq?.active ? 'Deliver 20 provisions' : cool ? 'Completed' : 'Accept commission', 'ui-supply', '', `${cool || (sq?.active && (s.food < 20 || t.wealth < 35)) ? 'disabled' : ''} class="primary"`)}</div></article>`;
  }
  if (section === 'economy')
    body = `<div class="section-heading"><div class="eyebrow">THE WEALTH OF A SETTLEMENT</div><h2>Fields, workshops & stores</h2><p class="muted">Stocks and treasury change through trade and daily production.</p></div><div class="ledger-stats">${stat('Merchant treasury', t.wealth + ' ♙')}${stat('Population', t.population)}${stat('Prosperity', t.prosperity)}${stat('Food stores', t.stock)}</div><div class="economy-feature">${icon(ITEMS[t.production].icon)}<div><h3>${ITEMS[t.production].name}</h3><p>Local production adds 2 units each campaign day, up to 50 in stock. Local prices are 20% lower.</p><small>Current stock: ${marketAmount(t, t.production)}</small></div></div><div class="ledger-table"><div><span>Food production</span><strong>+4 provisions / day · capacity 80</strong></div><div><span>Merchant income</span><strong>+5 crowns / day</strong></div><div><span>Recruitment</span><strong>Funded by ${esc(f.name)}’s treasury and manpower</strong></div><div><span>Trade access</span><strong>${f.diplomacy.trade ? 'Trade agreement · 15% buying discount' : 'Standard market prices'}</strong></div></div><p class="fine-print">Population and prosperity are settlement descriptors in this chapter; detailed growth, workshops and construction are not yet simulated.</p>`;
  if (section === 'prisoners')
    body = `<div class="section-heading"><div class="eyebrow">CAPTIVES & RANSOM</div><h2>Prisoners of your company</h2><p class="muted">Capacity ${s.prisoners.length} / ${Math.floor(s.party.length / 2)} · Ransom value: 12 crowns each</p></div>${s.prisoners.length ? s.prisoners.map((p) => `<div class="person-row">${portrait(p)}<div><strong>${esc(p.name)}</strong><small>Captured brigand</small></div><span>12 ♙</span></div>`).join('') : empty('No prisoners', 'Defeated brigands may survive and be taken captive after a victory. You need at least two company members to hold a prisoner.')}<div class="transaction-bar"><span>Merchant treasury: ${t.wealth} crowns</span>${btn('Ransom available prisoners', 'ui-ransom', '', `class="primary" ${!s.prisoners.length || t.wealth < 12 ? 'disabled' : ''}`)}</div>`;
  if (section === 'court')
    body = `<div class="court-banner">${herald(f)}<div><div class="eyebrow">THE RULING HOUSE</div><h2>${esc(f.name)}</h2><p>Independent kingdom · ${s.settlements.filter((t2) => t2.faction === f.id).length} settlements</p></div></div><div class="companion-offer"><div class="character-dais">${portrait(f.leader, true)}</div><div><span class="badge">RULER</span><h2>${esc(f.leader.title + ' ' + f.leader.name)}</h2><p class="muted">Your relation: ${f.relations > 0 ? '+' : ''}${f.relations}</p><p>Petition the ruling house, send a gift or negotiate an agreement through its envoys.</p>${btn('Open diplomacy →', 'ui-diplomacy', f.id, 'class="primary"')}<p class="fine-print">Vassalage, ownership transfers and marriages require later land and dynasty systems.</p></div></div>`;
  return frame(
    esc(t.name),
    `${t.kind.toUpperCase()} · ${esc(f.name)}`,
    `<div class="settlement-layout">${side}<section class="settlement-main">${body}</section></div>`,
    `<span>${icon('coin')} ${s.gold} crowns</span><span>${icon('grain')} ${s.food} provisions</span><span class="badge">CAMPAIGN PAUSED · DAY ${s.day}</span>`,
  );
}
export function diplomacyScreen(s, u) {
  const f = s.factions.find((f) => f.id === u.faction) || s.factions[0],
    d = f.diplomacy,
    owned = s.settlements.filter((t) => t.faction === f.id),
    capital = owned.find((t) => t.kind === 'town') || owned[0];
  const list = `<aside class="faction-list"><div class="eyebrow">KINGDOMS OF THE BORDERLANDS</div>${s.factions.map((k) => btn(`${herald(k)}<span><strong>${esc(k.name)}</strong><small>${k.diplomacy.status === 'war' ? 'Hostile' : k.diplomacy.pactUntil > s.day ? 'Non-aggression pact' : k.diplomacy.trade ? 'Trade partner' : 'At peace'} · ${k.relations > 0 ? '+' : ''}${k.relations}</small></span>`, 'ui-faction', k.id, `class="faction-row ${f.id === k.id ? 'selected' : ''}"`)).join('')}<div class="notice">You lead an independent company.${s.mercenaryFaction != null ? ' In service to ' + esc(s.factions[s.mercenaryFaction].name) + '.' : ''}</div></aside>`;
  const bars = [
    ['Company / manpower', s.party.length, f.manpower],
    ['Treasury', s.gold, f.treasury],
    ['Food / grain', s.food, f.grain],
    ['Settlements', 0, owned.length],
  ]
    .map(
      ([label, a, b]) =>
        `<div class="comparison"><div><strong>${a}</strong><small>${label}</small><strong>${b}</strong></div><div class="comparison-bar"><i style="width:${Math.max(2, (100 * a) / (a + b || 1))}%"></i></div></div>`,
    )
    .join('');
  const proposal = u.proposal && DIPLOMACY[u.proposal],
    quote = proposal ? diplomaticQuote(s, f.id, u.proposal) : null;
  const body = `<div class="diplomacy-layout">${list}<section class="diplomacy-main"><div class="diplomacy-title">${herald({ color: '#d1b478' })}<div><div class="eyebrow">${esc(s.dynasty.name)} & ${esc(f.name)}</div><h2>${d.status === 'war' ? 'Relations severed' : d.pactUntil > s.day ? 'A pledge of peace' : d.trade ? 'Partners in trade' : 'An open conversation'}</h2><span class="badge">${d.status === 'war' ? 'HOSTILE' : 'AT PEACE'} · RELATION ${f.relations}</span></div>${herald(f)}</div>${bars}<div class="diplomacy-actions">${Object.entries(
    DIPLOMACY,
  )
    .filter(([id]) =>
      d.status === 'war'
        ? id === 'peace'
        : id !== 'peace' && (id !== 'resign' || s.mercenaryFaction === f.id),
    )
    .map(([id, a]) => {
      const q = diplomaticQuote(s, f.id, id);
      return btn(
        `<strong>${a.name}</strong><small>${q.reason || a.text}</small>`,
        'ui-proposal',
        id,
        `class="${u.proposal === id ? 'selected' : ''}" ${!q.valid ? 'disabled' : ''}`,
      );
    })
    .join(
      '',
    )}</div>${proposal ? `<div class="proposal-card"><div class="eyebrow">DRAFT PROPOSAL</div><h3>${proposal.name}</h3><p>${proposal.detail}</p><div class="offer-sides"><span>Your offer<br><strong>${quote.cost} crowns</strong></span><span>⇄</span><span>${esc(f.name)}<br><strong>${proposal.name}</strong></span></div><div class="card-actions">${btn('Cancel', 'ui-proposal-cancel')}${btn('Confirm proposal', 'ui-proposal-confirm', '', `class="primary" ${!quote.valid ? 'disabled' : ''}`)}</div></div>` : '<p class="fine-print">Choose a proposal to review its terms before committing. Kingdom armies and sieges are not yet simulated.</p>'}</section><aside class="ruler-sidebar">${portrait(f.leader, true)}<div class="eyebrow">RULER</div><h3>${esc(f.leader.title + ' ' + f.leader.name)}</h3><p>Seat: ${esc(capital?.name)}</p><p>${owned.length} settlements · Human kingdom</p>${btn('View encyclopedia', 'ui-encyclopedia-entity', 'faction:' + f.id)}<h4>Recent dealings</h4>${
    s.diplomaticEvents
      .filter((e) => e.faction === f.id)
      .slice(0, 4)
      .map((e) => `<p class="record"><small>DAY ${e.day}</small>${esc(e.message)}</p>`)
      .join('') || '<p class="muted">No dealings recorded.</p>'
  }</aside></div>`;
  return frame(
    'Diplomacy',
    'KINGDOMS & ALLEGIANCE',
    body,
    `<span>${s.gold} crowns · ${s.renown} renown</span>${btn('Return', 'ui-close')}`,
  );
}
export function encyclopediaScreen(s, u) {
  const people = [
    ...s.party,
    ...s.factions.map((f) => f.leader),
    ...s.settlements.map((t) => t.companion).filter(Boolean),
    ...s.dead,
  ];
  const entries = [
    ...s.settlements.map((t) => ({
      key: 'settlement:' + t.id,
      type: 'settlements',
      name: t.name,
      data: t,
    })),
    ...s.factions.map((f) => ({ key: 'faction:' + f.id, type: 'kingdoms', name: f.name, data: f })),
    ...people.map((p) => ({ key: 'person:' + p.id, type: 'people', name: p.name, data: p })),
  ];
  const found = entries.filter(
    (e) => e.type === u.encyclopedia && e.name.toLowerCase().includes(u.search.toLowerCase()),
  );
  const selected = entries.find((e) => e.key === u.entity) || found[0];
  let detail = '';
  if (selected) {
    const d = selected.data;
    if (selected.type === 'settlements') {
      const f = s.factions[d.faction];
      detail = `${settlementArt(d, f)}<div class="entry-copy"><span class="badge">${d.kind.toUpperCase()}</span><h2>${esc(d.name)}</h2><p>A ${d.kind} held by ${esc(f.name)}, known for ${ITEMS[d.production].name.toLowerCase()}.</p><div class="ledger-stats">${stat('Population', d.population)}${stat('Prosperity', d.prosperity)}${stat('Location', Math.round(d.x) + ', ' + Math.round(d.y))}</div><h3>Ownership</h3>${btn(esc(f.name), 'ui-encyclopedia-entity', 'faction:' + f.id)} ${btn(esc(f.leader.title + ' ' + f.leader.name), 'ui-encyclopedia-entity', 'person:' + f.leader.id)}<div class="dialog-actions">${btn('Locate on campaign map', 'ui-locate', d.id, 'class="primary"')}</div></div>`;
    }
    if (selected.type === 'kingdoms') {
      const towns = s.settlements.filter((t) => t.faction === d.id);
      detail = `<div class="entry-copy"><div class="court-banner">${herald(d)}<div><span class="badge">KINGDOM</span><h2>${esc(d.name)}</h2></div></div><p>An independent human kingdom of the Borderlands.</p><h3>Ruler</h3>${btn(`${portrait(d.leader)} ${esc(d.leader.title + ' ' + d.leader.name)}`, 'ui-encyclopedia-entity', 'person:' + d.leader.id, 'class="person-row"')}<h3>Settlements</h3><div class="entry-links">${towns.map((t) => btn(esc(t.name), 'ui-encyclopedia-entity', 'settlement:' + t.id)).join('')}</div><div class="dialog-actions">${btn('Open diplomacy', 'ui-diplomacy', d.id, 'class="primary"')}</div></div>`;
    }
    if (selected.type === 'people') {
      const faction = s.factions.find((f) => f.leader.id === d.id),
        town = s.settlements.find((t) => t.companion?.id === d.id),
        inParty = s.party.some((p) => p.id === d.id);
      detail = `<div class="person-entry"><div class="character-dais">${portrait(d, true)}</div><div><span class="badge">${faction ? 'RULER' : TYPES[d.type].label.toUpperCase()}</span><h2>${esc(d.name)}</h2><p>${CULTURES[d.culture % 3].name} · Age ${d.age} · ${esc(d.traits.join(' · '))}</p><h3>Whereabouts</h3><p>${inParty ? 'Travelling with your company' : faction ? 'At the seat of ' + esc(faction.name) : town ? 'At the tavern in ' + esc(town.name) : 'Recorded among the fallen'}</p><h3>History</h3>${d.history.map((h) => `<p class="record"><small>DAY ${h.day}</small>${esc(h.event)}</p>`).join('') || '<p class="muted">No deeds recorded yet.</p>'}${faction ? btn('Ruling house →', 'ui-encyclopedia-entity', 'faction:' + faction.id) : town ? btn('Settlement →', 'ui-encyclopedia-entity', 'settlement:' + town.id) : inParty ? btn('Open company', 'ui-company') : ''}</div></div>`;
    }
  }
  return frame(
    'Encyclopedia',
    'PEOPLE, PLACES & POWERS',
    `<div class="encyclopedia-layout"><aside><label for="encyclopedia-search">Search ${u.encyclopedia}</label><input id="encyclopedia-search" placeholder="Search by name…" value="${esc(u.search)}"><div class="encyclopedia-list">${found.map((e) => btn(`<strong>${esc(e.name)}</strong><small>${e.type === 'settlements' ? e.data.kind : e.type === 'kingdoms' ? 'Kingdom' : TYPES[e.data.type].label}</small>`, 'ui-entity', e.key, `class="${selected?.key === e.key ? 'selected' : ''}"`)).join('') || '<p class="muted">No matching entries.</p>'}</div></aside><section>${detail || empty('No entries', 'Try a different search.')}</section></div>`,
    `<span>${found.length} entries · World records</span>${btn('Close', 'ui-close')}`,
    ['settlements', 'kingdoms', 'people']
      .map((c) =>
        btn(
          c[0].toUpperCase() + c.slice(1),
          'ui-encyclopedia-tab',
          c,
          `class="${u.encyclopedia === c ? 'active' : ''}"`,
        ),
      )
      .join(''),
  );
}

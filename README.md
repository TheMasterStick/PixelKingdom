# PixelKingdom — The Long March

A browser-first, single-player medieval campaign and formation tactics prototype. The player grows from an adventurer toward a future dynasty and kingdom. See [the agreed design](docs/DESIGN.md) for the full scope and [progress](PROGRESS.md) for what is actually implemented.

## Play / run

- Hosted play link: https://pixelkingdom-the-long-march.themasterstick.chatgpt.site (private owner preview).
- With Node 20+: `npm start`, then open `http://localhost:3000`. The game itself has no runtime package dependencies.
- For development: `npm ci`, then `npm run dev`.
- Production static bundle: `npm run build`. Serve `dist/` over HTTP.
- Simulation checks: `npm test`.
- UI regression checks: with the dev server running, open `/tests/ui-regression.html` for eight real-browser control-preservation checks.
- Large-army simulation benchmark: `npm run benchmark` (2,000 units, not a frame-rate guarantee).

## First journey

1. Choose a name, culture and appearance; answer four life-history questions and review their effects.
2. Enter your starting settlement, choose a quantity of levies, hire a companion, and accept a road-clearing contract.
3. Leave, locate the brigands, and click their marker to approach.
4. Deploy formations, begin battle, pause with Space, and issue orders.
5. Return for payment, inspect your company, promote experienced soldiers, and save.

## Controls

| Context | Control | Action |
|---|---|---|
| Campaign | Left click terrain | Travel by a land route |
| Campaign | Left click settlement | Inspect / enter when nearby |
| Campaign | Left click brigands | Approach / encounter when nearby |
| Campaign | Right drag | Pan map |
| Campaign | Wheel / + / − | Zoom |
| Campaign | Space | Pause/resume current travel or waiting |
| Campaign | Escape | Stop travel or waiting |
| Battle | 1 / 2 / 3 | Select foot / bow / hero formation |
| Battle | Left click | Move selected formation |
| Battle | Left drag | Draw selected formation's frontage |
| Battle | Space | Pause/resume after Begin Battle |
| Battle | C | Charge selected formation |

Friendlies deploy in the south; enemies start in the north. Drag left-to-right to face north, or right-to-left to face south. In deployment, the entire formation stays inside the blue southern region. The hero-attachment menu moves your hero into the selected formation or back into an independent unit. Companion commands are assigned through Company → Character & equipment.

Trees and boulders block movement and shots. Soldiers route around solid obstacles; woodland and bushes provide ranged cover, while brush and mud slow movement. Settlement recruitment shows troop types, availability and quantities. Open Company after hiring to discover each soldier’s name and history. Companions remain individually named tavern hires.

## Chapter II interfaces

- **Settlements:** illustrated town, castle and village windows; overview, recruitment, market, tavern/common hall, quests, economy, prisoners and ruling house.
- **Company:** troop stacks expand into persistent named people; select a soldier to inspect health, history, equipment and promotion options.
- **Character:** hero/companion selector, owned equipment, biography and three talent branches. Purchases move to the shared inventory; equipping moves items onto the selected person.
- **Trade:** two inventories, category filters, one/five-unit transfers, pending totals, reset and atomic confirmation. Settlement stock and merchant funds are real campaign resources.
- **Encyclopedia:** searchable settlements, kingdoms and known named people, linked ownership/history, and locate-on-map actions.
- **Diplomacy:** six kingdoms, resource comparisons, ruler profiles, two-sided proposal review, gifts, trade discounts, timed non-aggression pacts, paid mercenary service, hostility and negotiated peace. Hostility closes settlement access; kingdom armies and sieges are not yet simulated.
- **Local work and prisoners:** deliver provisions for payment/relation; some defeated brigands survive to become captives and can be ransomed against a settlement's funds.

## Saves

Manual saves and autosaves after creation, settlement exit, battle resolution, and closing the page use browser local storage. Menu provides JSON export/import for moving between computers. Battle saves are deliberately disabled; reloading mid-battle restores the prior campaign save. Save format is versioned. There is no server account or cloud-save synchronization.

## Architecture

- `src/core.js`: seeded RNG, identities, cultural name pools, person progression and combat stats.
- `src/campaign.js`: world generation, A* routes, time/economy, roster changes, outcomes and saves.
- `src/battle.js`: tactical formation state, fixed-step combat, local spatial indexing and morale.
- `src/terrain.js`: seeded battlefield terrain, navigation, movement costs and cover.
- `src/terrain-render.js`: cached terrain artwork generated from simulation geometry.
- `src/render.js`: Canvas world and battlefield visualization, separate from simulation.
- `src/app.js`: browser UI, input, dialogs, clock and persistence.
- `src/features.js`: trade, equipment inventory, histories, talents, diplomacy, supplies and prisoners.
- `src/screens.js`: reference-informed campaign windows and navigation layouts.
- `src/art.js`: original pixel portraits, heraldry, item icons and settlement illustrations.
- `src/ui-dom.js`: incremental panel updates that preserve interactive controls and focus.

Simulation modules run in both Node and the browser without DOM access. This permits profiling and regression testing separately from rendering. A later desktop wrapper can reuse the browser client; none is currently included.

## Current boundaries

This is a playable first slice, not the finished sandbox. The campaign has a 20-person cap, six preset-named factions, generated settlement locations/names, and a 192×128-tile world. Battles feature seeded woodland, bushes, rocks, mud and gravel with obstacle routing and simple cover. Unit collision and immediate ranged damage remain simplified; large-army terrain performance has not yet been established. Faction resources and recruitment replenish through a basic daily model, with basic player trade and diplomacy now available. AI expansion, faction field armies, comprehensive barter, crafting, fief ownership, vassalage, sieges, marriage, aging, and succession are not implemented. Population/prosperity are descriptors, not a simulated growth model. Family and dynasty records currently reserve persistent relationships only.

Keyboard/mouse desktop browsers are the primary input target. The layout adapts to smaller displays, but touch battlefield controls have not been validated.

## Modular portrait test

Open **Character → Appearance** to independently choose head, body, eyes, nose,
mouth, hair, beard, clothing line and skin. The same controls appear during character
creation. Choices are stored on each person and survive save/load; existing saves
receive deterministic initial combinations. Companions can also be edited.

Portraits are composed locally using exact crops from premade
component sheets in `public/assets/portraits/`. There are no AI calls or pre-rendered
complete-character presets. A cached Canvas compositor removes the sheet backdrop,
normalizes skin shades and layers the selected parts. Small and large portraits
use the same composition throughout the campaign UI.
Heads are masked at the jaw and layered above the body, which supplies the neck.
Measured chin anchors keep the smaller head and its features aligned as one group.
The new `wardrobe-v2.png` supplies ten clothed bodies: masculine and feminine
versions of Commoner, Citizen, Noble, Ruler and Warrior. Each includes a neck,
with a measured center/attachment point. Lean/Broad and Slender/Sturdy are two
size variants of these body styles. Existing outfit selections migrate once.
See `docs/portrait-wardrobe-v2.md` for the generation prompt and asset contract.

This is an initial modular art test: feature transitions, matching all hair/head
combinations, and skin shading need further art refinement. Outfits are cosmetic
and do not follow equipped armor yet. Battlefield sprites remain unchanged.

Facial spacing review: `/tests/visual/face-spacing-review.html` shows each head
shape before/after the raised nose/mouth and lower head placement.

Current clothing review: open `/tests/visual/wardrobe-review.html` locally for all
ten combinations, a centerline guide, complexion options and broader builds.

Historical portrait alignment review: during local development, open
`/tests/visual/portraits.html` for the 36-combination before/after grid or
`/tests/visual/portrait-review.html` for four representative comparisons.
The old compositor is preserved there solely as a visual regression baseline.

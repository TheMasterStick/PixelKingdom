# PixelKingdom — The Long March

A browser-first, single-player medieval campaign and formation tactics prototype. The player grows from an adventurer toward a future dynasty and kingdom. See [the agreed design](docs/DESIGN.md) for the full scope and [progress](PROGRESS.md) for what is actually implemented.

## Play / run

- Hosted play link: https://pixelkingdom-the-long-march.themasterstick.chatgpt.site (private owner preview).
- With Node 20+: `npm start`, then open `http://localhost:3000`. The game itself has no runtime package dependencies.
- For development: `npm ci`, then `npm run dev`.
- Production static bundle: `npm run build`. Serve `dist/` over HTTP.
- Simulation checks: `npm test`.
- Large-army simulation benchmark: `npm run benchmark` (2,000 units, not a frame-rate guarantee).

## First journey

1. Choose a name, seed, and background.
2. Enter your starting settlement, hire levies and a companion, and accept a road-clearing contract.
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

Drag top-to-bottom to face right, or bottom-to-top to face left. In deployment, orders are limited to the blue deployment region. The hero-attachment menu moves your hero into the selected formation or back into an independent unit. Companion commands are assigned through Company → Skills & equipment.

## Saves

Manual saves and autosaves after creation, settlement exit, battle resolution, and closing the page use browser local storage. Menu provides JSON export/import for moving between computers. Battle saves are deliberately disabled; reloading mid-battle restores the prior campaign save. Save format is versioned. There is no server account or cloud-save synchronization.

## Architecture

- `src/core.js`: seeded RNG, identities, cultural name pools, person progression and combat stats.
- `src/campaign.js`: world generation, A* routes, time/economy, roster changes, outcomes and saves.
- `src/battle.js`: tactical formation state, fixed-step combat, local spatial indexing and morale.
- `src/render.js`: Canvas world and battlefield visualization, separate from simulation.
- `src/app.js`: browser UI, input, dialogs, clock and persistence.

Simulation modules run in both Node and the browser without DOM access. This permits profiling and regression testing separately from rendering. A later desktop wrapper can reuse the browser client; none is currently included.

## Current boundaries

This is a playable first slice, not the finished sandbox. The campaign has a 20-person cap, six preset-named factions, generated settlement locations/names, and a 192×128-tile world. Battles are open fields with simplified collision, immediate ranged damage, and no obstacle pathfinding. Faction resources and recruitment replenish through a basic daily model, but AI expansion, diplomacy, commerce, crafting, fief ownership, sieges, marriage, aging, and succession are not implemented. Family and dynasty records currently reserve persistent relationships only.

Keyboard/mouse desktop browsers are the primary input target. The layout adapts to smaller displays, but touch battlefield controls have not been validated.

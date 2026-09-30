# Progress

## 2026-09-30 — First playable slice

Implemented:
- Three character-history choices with distinct starting stats/resources.
- Seeded terrain, six faction regions, 36 settlements, neutral land, and brigand parties.
- Land-only A* routing and Bannerlord-style travel/wait campaign clock; settlement and battle freeze.
- Named individuals, trait labels, persistent IDs, recruitment, companions, and personal histories.
- Company inventory basics: food, daily wages/recovery, hero/companion weapon and armor upgrades.
- Deployment, drawn frontage/facing, independent or attached hero, companion leadership, six stances, Space pause, autonomous fighting, casualties/routing and outcome resolution.
- XP/levels, skill/talent allocation, troop promotions, and level-3 soldier-to-companion elevation.
- Real-party contract target, victory reward, quest completion and payment.
- Browser saves and JSON export/import; dynasty/relationship data reserved for later simulation.

Validation:
- 10 automated simulation tests pass: seeded generation/identity, clock rules, routes, recruitment, promotions, save roundtrip, deployment/attachment/pause, battle termination, defeat, and contract targeting.
- Initial 2,000-unit Node simulation benchmark, 450 ticks / 15 simulated seconds: median 24.44 ms, p95 42.32 ms, max 75.07 ms on this runner. This does not establish acceptable browser performance or sustained large-battle behavior. More profiling, unit spacing, target acquisition, typed storage/workers, and rendering work will be needed.
- Browser walkthrough passed: merchant creation, 5 levies + companion, contract, travel/encounter, drawn deployment, hero attachment, Space pause, charge, victory, contract fulfillment, and save/reload preserving all 7 people and rewards. Visual review of campaign and battlefield completed. Browser extension metadata errors were present; no game error surfaced during the walkthrough.
- Follow-up fixes: hold orders stop at current unit positions, selected formation contrast, pursuit of moving brigands, disabled campaign zoom controls during battle, and hero leadership applying to an attached formation when no companion commands it.

Next priorities: richer formation control and battle camera; deeper backgrounds/talents; troop economics and faction supply chains; scalable armies; fiefs, diplomacy, and dynasties as described in docs/DESIGN.md.

- Final browser checks also confirmed contract payment and earned soldier promotion.

## 2026-09-30 — Wooded battlefields and company recruitment

- Friendly formations deploy south facing north; enemies begin north facing south. Drawn frontage respects the full formation footprint and southern deployment boundary. Routing soldiers flee toward their own map edge.
- Seeded woodland, pine/oak trees, bushes, boulders, mud, gravel and a central track. Trees and rocks block movement/shots; vegetation provides ranged cover and difficult ground slows movement. Cached terrain rendering and bounded route caching keep static work out of the frame loop.
- Troop-category recruitment with availability, quantity controls, total cost and party capacity. Batch purchases preserve existing IDs, names and histories; names appear in Company, while companions remain named tavern hires. Existing save format is unchanged.
- Six new regression tests cover anonymous offers/persistent identities, atomic recruitment validation, deployment bounds/facing, seeded terrain/cover, obstacle routing and blocked shots/pause. All 16 simulation tests pass.
- Browser checks confirmed quantity purchase, post-hire named roster, south/north deployment, terrain visuals, drawn frontage, hero attachment and Space pause.
- This remains the 20-person first slice. Large-army performance with the new terrain needs profiling before raising that limit.

## 2026-09-30 — Stable UI refresh fix

- Root cause: the 600 ms UI refresh assigned whole-panel `innerHTML`, destroying and recreating hovered/pressed buttons. This restarted hover transitions and could disconnect a target between mouse-down and click.
- Added a shared DOM reconciler: unchanged panels perform no writes; changed text/attributes update in place. Action/person keys preserve the correct controls in campaign, roster, settlement and battle panels. Native dropdowns now remain intact while telemetry refreshes.
- Removed the workaround that stopped telemetry while a select held focus. Existing simulation timing, keyboard shortcuts and save format are unchanged.
- Validation: 16 simulation tests, production build and 8 real-browser DOM regressions pass. Browser checks cover unchanged refreshes, a press spanning refreshes, counter/style/disabled updates, select focus/selection, roster identity, changed action identity, typed inputs and scroll retention.
- Recorded all ten additional questionnaire, encyclopedia, barter, equipment, town, village, troop, talent and diplomacy references in docs/DESIGN.md as future design direction.


## 2026-09-30 — Chapter II: life, settlements and diplomacy

Implemented from the full twenty-reference set:
- Brass/oak window frames, persistent navigation, original pixel portraits, heraldry and item icons; illustrated town, castle and village views with different scenery. Windows retain their header/footer while long content and inventories scroll.
- Six-step creation: identity, four background questions and review. Choices apply the displayed skills, crowns, provisions, starting equipment and talent point, with a persistent biography.
- Settlement sections for overview, quantity recruitment, market, tavern/common hall, local work, economy, captives and ruling house. Recruitment stays anonymous until the company roster; companions are individual hires.
- Two-sided market with categories, staged purchases/sales, Shift-click quantities, cancel/reset and confirmation. Real inventory, merchant funds, local production discounts, daily stocks and trade-agreement prices.
- Hero/companion equipment sheet with character selector, two implemented equipment slots, shared owned inventory, equip/unequip, live stats and formation command. Six talents across three branches affect health, armor, command strength, XP, travel and recovery.
- Grouped troop roster with named member details, service records and promotions; pixel soldier silhouettes and settlement markers; battle results broken down by troop type.
- Searchable, linked encyclopedia for settlements, kingdoms and named known people, plus map location actions.
- Diplomacy with rulers, comparisons and explicit proposal review: gifts, market agreements, 30-day non-aggression pacts, treasury-funded mercenary wages, hostility and paid peace. Treaties and resources persist. Hostile settlements deny entry and recruitment/trade.
- Provision-delivery commissions, victory prisoner capture, and treasury-limited ransoms.

Validation: all 24 simulation/feature tests pass, including transaction conservation/atomicity, exact character-creation effects, equipment stats, treaty requirements, daily wages, talent effects, migration, commissions and ransom. Production build passes. Browser walkthrough covered creation/review, town navigation, purchase and recruitment, companion hire, quest acceptance, equip, talent allocation, gift/trade agreement, save restoration, encyclopedia search and village entries, and formation assignment.

Scope: this is a working interface and feature expansion, not complete kingdom simulation. The twenty references are addressed through the applicable screen families; free-form noble/vassal barter, fief transfers, marriage, alliances, protectorates, sieges, detailed crafting/economy and player realm ownership still require future underlying systems. No decorative button claims to perform these actions. Company limit remains 20; thousand-unit terrain battles remain unverified.

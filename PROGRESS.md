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

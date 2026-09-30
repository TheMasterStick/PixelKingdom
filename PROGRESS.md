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
- Follow-up fixes: hold orders stop at current unit positions, selected formation contrast, pursuit of moving brigands, and disabled campaign zoom controls during battle.

Next priorities: richer formation control and battle camera; deeper backgrounds/talents; troop economics and faction supply chains; scalable armies; fiefs, diplomacy, and dynasties as described in docs/DESIGN.md.

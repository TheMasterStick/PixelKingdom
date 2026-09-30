# PixelKingdom: agreed design

## Core contract — 30 September 2026

Single-player, human medieval sandbox. Browser first; an eventual desktop client should reuse the simulation. The player begins alone, choosing personal history to establish starting abilities. The intended progression is Adventurer → Posse → Company → Warband → Host → Domain → Kingdom. Numbers are approximate design targets, not final hard gates: around 1, 5, 20, 100, then larger hosts. Domain requires a fief; kingdom requires multiple fiefs and vassals, sufficient renown and clan standing. The exact Host threshold remains open.

Campaign time advances while the player travels or explicitly waits, like Bannerlord. It stops when the player stands still. Battles and settlement visits freeze the wider world, with no elapsed-time catch-up afterward. No offline progression.

Combat is entirely RTS/Total War style. The player character is a hero/general unit who receives movement and stance orders and fights autonomously, independently or attached to a formation. There is no directional personal combat. Space stops battle time for issuing orders. Deployment precedes Begin Battle; drawing a line determines formation frontage and facing. Commands include hold, formation movement, shield wall, spear wall, skirmish, and charge. Companions can command formations and improve them through skills/talents. The long-term requirement is multi-thousand-soldier battles; a small first slice is not the final scale.

Battle orientation is fixed: friendly deployment is south, the enemy begins north. Battle maps contain trees, bushes, rocks and other terrain, with clearings and approaches that support formation tactics. Obstacles, slower ground and cover should matter mechanically. Sword & Banner references guide the readable wooded battlefields and quantity-based recruitment.

Normal settlement recruitment presents troop categories and quantities. Names are discovered afterward in the company roster; companions may be introduced individually in taverns. Every soldier has a persistent ID, culturally assembled name, age, traits, history, equipment, XP and progression. Names are labels, not primary keys. Avoid repeated full names using a registry and fallback disambiguation. Promotion retains identity; prominent soldiers can become companions. Hero and companions gain individual skill/talent allocations. Individual and formation-wide talents both matter.

Soldiers can die permanently or survive wounded. First-slice player defeat means capture, ransom, losses, and recovery. Companions survive in this first chapter; a configurable death rule remains planned. Marriage, children, aging, dynasty succession, and diplomatic marriage are confirmed future systems, not optional discarded ideas.

## World and political simulation

A gigantic seed-generated world with procedural geography, people, settlements, factions, kingdoms, and quests. Initial kingdoms occupy modest territories, leaving extensive neutral space. NPC powers should procure manpower, equipment, food, construction resources, and money under the same meaningful restrictions as the player. Distant simulation can be coarser, but cannot fabricate free armies or resources. Building a new fief and capturing an existing one must both be viable routes to rule.

Planned diplomacy: trade agreements, marriages, alliances, wars, protectorates, demands, gifts, mercenary contracts, and vassal relationships. Crafting and settlement construction are core planned systems. Quests should originate in tracked world circumstances and reference real entities.

## Milestone sequence

1. **The Long March:** character background, generated map, travel clock, settlements, category-based recruitment, named company roster and companion, tactical deployment and battle, wounds/casualties, XP/promotions, equipment, save/load.
2. **Living companies:** deeper character creation, individual biographies/traits influencing behavior, multiple troop trees, richer skills/talents, formation commanders, larger party tiers, battle camera and selection tools.
3. **A world in motion:** resource-producing settlements, inventories, caravans, recruitment/equipment supply chains, purposeful faction parties, opportunity-driven quests, economic parity.
4. **Land and allegiance:** crafting, construction, player-founded fiefs, sieges, capture, mercenary/vassal service, territory and diplomacy.
5. **Houses and crowns:** marriages, family relationships, aging, heirs/succession, noble houses, protectorates, kingdom legitimacy and vassals.
6. **Grand warfare:** profile and progressively scale to multi-thousand battles; terrain tactics, cavalry, morale/cohesion, reinforcements, sieges, richer unit visuals.

Scale work should continue across milestones rather than wait until the last step. Pixel sprites can replace the primitive renderer without changing persistent identities or simulation rules.

## Interface reference direction — 30 September 2026

Reviewed the ten additional Bannerlord screenshots supplied after the wooded-battlefield pass. They guide information hierarchy and interaction patterns, adapted to PixelKingdom's human medieval pixel presentation. These references informed the Chapter II implementation. See PROGRESS.md for the exact implemented subset and remaining simulation work.

| Reference screen | Direction for PixelKingdom |
|---|---|
| Character history question + final review | Multi-stage life-history questionnaire, visible stat/skill/talent effects, back navigation and a review of the completed biography before starting. Preserve the existing skill-point and talent-point model rather than copying Bannerlord's numbers. |
| Encyclopedia | Searchable, linked people, clans, kingdoms and settlements; biography, relationships, ownership and event history. Show last-known location with the age of the report rather than implying perfect real-time knowledge. |
| Player–noble/vassal barter | Two-sided offer panels, expandable categories, money and eligible items/assets/agreements, clear pending offer and explicit acceptance. Transfers must validate ownership and resources atomically. |
| Equipment / shop / loot | Character selector and equipment slots between two inventories. Categories, quantities, comparison details, party capacity, total transaction cost, confirm/cancel. |
| Town | Settlement identity and owner, local conditions/resources and notable residents; clear actions for recruitment, trade, tavern, work, keep and eventual arena/management. |
| Village | A distinct rural menu and illustration, local notables, production and village work. Keep common actions consistent with towns without giving every village a town's facilities. |
| Troops | Troop-type stacks with counts, health/readiness and promotion indicators; expand to persistent named individuals. Companions/hero remain individually selectable. Transfer panes become relevant with garrisons and other parties. |
| Talents | Skill categories beside a readable progression path with prerequisites, available points, current rank, previews and individual/party/formation effects. |
| Diplomacy | Faction list grouped by relation or war status; counterpart leaders, comparative strength, prisoners and war record, with proposals and their costs/requirements visible. Add trade, alliance, marriage, protectorate and mercenary options as their simulations arrive. |

Keep the campaign-clock contract: visits and battles freeze the world. Dense menus should offer summaries and details without hiding names permanently or treating regular recruitment as companion selection. Use original interface/art assets rather than copying reference screenshots into game screens.

UI reliability rule: periodic telemetry refreshes must preserve interactive DOM elements, hover, keyboard focus, open selections and scroll position. Changes to a clock or casualty count must not replace adjacent buttons. Keep action identities distinct when changing screens or modes.

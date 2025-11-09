# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pantheon Pandemonium** is a turn-based strategy game where players become proto-gods, shaping the land to their Domain while competing against rivals and the ever-creeping Shadow faction. This is a mobile-first, data-driven roguelite strategy game built with Unity 2D.

## Project Status

This repository is currently in the design phase with no code implementation yet. The complete game design document and technical specification are in:
- `Pantheon-Pandemonium-Design.txt` - High-level system design and variable interactions
- `Pantheon-Pandemonium-Plan.txt` - Comprehensive technical specification including rules, content, systems, UI/UX, data schemas, and implementation plan

## Core Architecture (Planned)

### Data-Driven Design Philosophy
Almost all game content is defined in JSON files to enable rapid iteration without code changes:
- Tile types, domains, units, events, relics, and miracles are all data-driven
- All costs, thresholds, and balance values are externalized to a Config JSON
- Domain abilities use a tag/modifier system instead of hard-coded logic

### Key Systems

**Turn System**
- Start phase: Refill Divinity → Apply events → Shadow spreads → Units refresh
- Action phase: Players spend Divinity on Explore/Capture/Manage/Sanctify/Summon/Miracle
- End phase: Unspent Divinity → Aegis (defensive reserve) → Victory check

**Resource Economy**
- Divinity: Primary action currency (refreshed each turn)
- Faith: Slow-build economy resource (unlocks miracles, improves income)
- Shadow Energy: Risky resource for Shadow-related actions
- Relics & Miracles: Special powers from events/ruins

**Map & Tiles**
- Square grid (MVP; designed to upgrade to hex later)
- Each tile has: Owner, Type, Domain Influence, Stability (0-10), Corruption (0-2), Yield
- Fog of War with Hidden → Seen → Visible states
- Tiles visually attune to player's Domain when Sanctified

**Shadow System**
- Neutral faction that spreads corruption probabilistically each turn
- Spread chance: `BASE(0.10) + 0.05*corrupted_neighbors - 0.03*sanctified_neighbors` (plus modifiers)
- Players can fight it (Purify) or befriend it (Shadow Accord victory condition)
- Shadow Alignment Meter tracks player relationship with Shadow faction

**Domains**
8 domains each with Passive + Minor Power + Major Rite:
- Fire: Aggressive capture, volcano transformation
- Water: Mobility, stealth via Mist
- Earth: Defense, fortification
- Air: Perception, movement
- Life: Faith generation, healing
- Death: Corruption manipulation, spawning blockers
- Order: Shadow resistance, guaranteed captures
- Chaos: Random events, teleportation

**Victory Conditions** (multi-win roguelite style)
- Conquest: Control ≥75% of revealed tiles
- Sanctifier: Sanctify N holy sites (6 on medium map)
- Shadow Accord: Convert Shadow Alignment Meter to your side (≥100 Influence)
- Relic Ascension (optional): Assemble 3 unique Relics

### Planned Code Structure (Unity C#)

**Core Models**
- `Tile`: Position, type, owner, stability, corruption, sanctified status, visibility
- `Unit`: Type, owner, position, movement, perception
- `PlayerState`: Domain, resources (divinity/faith/shadow energy/aegis), owned tiles, units

**Systems**
- `TurnSystem`: Manages turn phases, resource generation, win/loss checks
- `CaptureSystem`: Handles tile capture resolution with cost formula
- `ShadowSystem`: Probabilistic spread algorithm
- `FogOfWarSystem`: Visibility calculations based on unit perception
- `AIController`: Utility-based AI with personality weights
- `EventBus`: Decoupled event system for game events

**Data Loading**
- `Database`: Loads all JSON definitions (tiles, domains, units, events, config)
- ScriptableObjects or direct JSON deserialization

### Important Formulas

**Divinity Income**
```
divinity_gain = BASE_D(6) + Σ(tile.divinity_yield) + domain_passive_bonus + relic_passives
```

**Capture Cost**
```
capture_cost = 4 + target.stability - adjacency_bonus - domain_modifiers - unit_support + shadow_penalty
```
- Adjacency bonus: -1 if ≥2 owned neighbors, -2 if ≥4

**Aegis (Defensive Reserve)**
```
aegis_next_turn = floor(remaining_divinity / 2)
```

**Shadow Spread Probability (per tile per turn)**
```
p = 0.10 + 0.05*corrupted_neighbors - 0.03*sanctified_neighbors - modifiers
clamped to [0.02, 0.60]
```

### Content Authoring Guidelines

**Stability Rules**
- Caps at 10; no effect should change stability by more than ±3 at once
- Start values: Most tiles 1-2, Mountains 10

**Economy Balance**
- Divinity income target: +1 to +2 per 5 owned tiles
- Shadow spread early game: ~1-2 tiles/turn (unless High aggression)
- Domain power budgets should be comparable (balance via costs/cooldowns)

**Tile Types Key Features**
- Plains (1 move, stability 1): Baseline
- Forest/Hills (2 move, stability 2): Earth/Air synergies
- Swamp (3 move): Water synergy, slows enemies
- Sacred Well: +3 Divinity/turn
- Villages: +1 Faith/turn, can upgrade to Shrine

## JSON Schema Structure

All content follows modular schemas with tag-based effects:

**TileType**: id, name, move_cost, impassable, base_stability, divinity_yield, tags, events, visual_variants

**Domain**: id, name, passive (modifiers array), minor_power (cost, effect), major_rite (cost, effect_area, delta)

**Unit**: id, name, cost_divinity, move, perception, abilities

**Event**: id, triggers, conditions, outcomes (with weights/chances)

**Config**: All base costs, thresholds, caps, formulas

## Implementation Priority (MVP Backlog)

1. Project skeleton: Data loaders, event bus, service locator
2. Grid + Map Generation (Perlin noise for terrain)
3. Turn system & resources
4. Fog of war
5. Actions (Explore, Capture, Manage, Sanctify)
6. Shadow spread system
7. Domains & abilities (modifier system)
8. AI (utility-based scoring)
9. Victory/defeat states
10. Content pass (events, relics, miracles)
11. Polish (VFX, sound, tutorial)

## Map Generation Algorithm

1. Height noise (Perlin) → Mountains (high), Water/Coast (low)
2. Moisture noise → Swamp (high moisture + low height), Forest (mid)
3. Feature scatter: Villages, Sacred Wells, Ruins (min distance constraints)
4. Shadow seeds: Random tiles away from spawn

## Testing Strategy

- Unit tests: Formulas (capture cost, sanctify, shadow spread), fog logic
- Property tests: No impassable at spawn, sacred well spacing
- Playtests: Domain win rates, turns-to-shrine, Shadow takeover rates
- Performance: 60fps on mid-range mobile, memory budget via pooling

## Monetization Model

Premium one-time purchase (recommended for MVP). Cosmetics unlock via achievements (tile skins, domain VFX). Future DLC: New domains/biomes packs.

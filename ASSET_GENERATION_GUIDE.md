# Asset Generation Guide for Pantheon Pandemonium

This document provides comprehensive specifications for generating all visual assets for the game using ComfyUI or other AI image generation tools.

## Table of Contents
1. [Technical Specifications](#technical-specifications)
2. [Tile Assets](#tile-assets)
3. [Unit Assets](#unit-assets)
4. [UI Elements](#ui-elements)
5. [Effects & Particles](#effects--particles)
6. [Domain-Specific Variants](#domain-specific-variants)
7. [Icon Assets](#icon-assets)
8. [Prompt Guidelines](#prompt-guidelines)

---

## Technical Specifications

### General Requirements
- **File Format**: PNG with transparency (RGBA)
- **Color Mode**: RGB + Alpha
- **Bit Depth**: 8-bit per channel
- **Style**: Stylized 2D, painterly/cel-shaded aesthetic
- **Lighting**: Top-down isometric lighting (45° angle)
- **Consistency**: Use consistent color palette and art style across all assets

### Color Palette (Domain Colors)
- **Fire**: `#ef4444` (Red-orange)
- **Water**: `#3b82f6` (Blue)
- **Earth**: `#84cc16` (Green-yellow)
- **Air**: `#06b6d4` (Cyan)
- **Life**: `#10b981` (Emerald green)
- **Death**: `#7c3aed` (Purple)
- **Order**: `#eab308` (Gold/yellow)
- **Chaos**: `#ec4899` (Pink/magenta)
- **Shadow**: `#1e1b4b` (Deep purple-black)
- **Neutral**: `#78716c` (Warm gray)

---

## Tile Assets

All tile assets are viewed from a **top-down/isometric perspective** (30° angle recommended).

### Base Tile Dimensions
- **Tile Size**: 128x128 pixels (square grid MVP)
- **Padding**: 8px transparent border for seamless tiling
- **Effective Draw Area**: 112x112 pixels
- **Export Scale**: 2x for retina displays (256x256 actual)

### Tile Types to Generate

#### 1. Plains (3 variants)
- **Dimensions**: 128x128px
- **Variants**: grass, meadow, steppe
- **Prompts**:
  - "Top-down view of grassy plains, stylized game art, soft green grass with small flowers, gentle lighting, painterly style"
  - "Top-down meadow with wildflowers, game tile art, warm sunlight, colorful blooms"
  - "Top-down steppe grassland, dry grass, game tile, earthy tones"

#### 2. Forest (3 variants)
- **Dimensions**: 128x128px
- **Variants**: pine, oak, jungle
- **Prompts**:
  - "Top-down pine forest tile, dense evergreen trees, dark green foliage, game art style"
  - "Top-down oak forest, deciduous trees, dappled sunlight through canopy, stylized"
  - "Top-down jungle tile, tropical vegetation, vibrant greens, dense foliage"

#### 3. Swamp (3 variants)
- **Dimensions**: 128x128px
- **Variants**: murky, foggy, fetid
- **Prompts**:
  - "Top-down swamp tile, murky water, reeds, dark water with algae, game art"
  - "Top-down misty swamp, fog effects, mysterious atmosphere, muted greens and blues"
  - "Top-down fetid swamp, rotting vegetation, dark water, eerie lighting"

#### 4. Hills (3 variants)
- **Dimensions**: 128x128px
- **Variants**: grassy, rocky, barren
- **Elevation**: Slight raised appearance
- **Prompts**:
  - "Top-down grassy hills, rolling terrain, elevation visible, soft shadows, game tile"
  - "Top-down rocky hills, exposed stone, rough terrain, gray-brown tones"
  - "Top-down barren hills, dry earth, sparse vegetation, dusty appearance"

#### 5. Desert (3 variants)
- **Dimensions**: 128x128px
- **Variants**: sand, dunes, wasteland
- **Prompts**:
  - "Top-down desert sand tile, golden sand, ripple patterns, warm lighting"
  - "Top-down sand dunes, flowing dune patterns, shadows showing elevation"
  - "Top-down desert wasteland, cracked earth, rocky sand, harsh sunlight"

#### 6. Mountain (3 variants)
- **Dimensions**: 128x128px
- **Variants**: rocky, snowy, volcanic
- **Special**: Should appear impassable, tall
- **Prompts**:
  - "Top-down rocky mountain peak, gray stone, sharp angles, dramatic shadows"
  - "Top-down snow-capped mountain, white peaks, ice, cold blue tones"
  - "Top-down volcanic mountain, dark rock, red-orange glow, smoke wisps"

#### 7. Water/Coast (2 types × 3 variants each)
- **Dimensions**: 128x128px
- **Coast variants**: beach, rocky_shore, tidal
- **Water variants**: lake, ocean, river
- **Prompts**:
  - "Top-down coastal beach, sand meeting water, gentle waves, turquoise water"
  - "Top-down rocky shoreline, stones and boulders, water lapping at rocks"
  - "Top-down deep water, blue with wave patterns, reflective surface"

#### 8. Sacred Well (3 variants)
- **Dimensions**: 128x128px
- **Variants**: glowing, ancient, blessed
- **Special**: Mystical glow effect
- **Prompts**:
  - "Top-down sacred well, glowing blue-white light, stone structure, magical aura"
  - "Top-down ancient well, weathered stone, mystical energy, divine light beams"
  - "Top-down blessed well, golden light, holy energy, ornate stonework"

#### 9. Village (3 variants)
- **Dimensions**: 128x128px
- **Variants**: hamlet, town, outpost
- **Special**: Small buildings visible
- **Prompts**:
  - "Top-down small village, tiny houses, thatched roofs, cozy settlement"
  - "Top-down town, multiple buildings, paths, populated area, game tile art"
  - "Top-down outpost, wooden structures, defensive walls, frontier settlement"

#### 10. Ancient Ruins (3 variants)
- **Dimensions**: 128x128px
- **Variants**: temple, fortress, monument
- **Special**: Crumbling stone structures
- **Prompts**:
  - "Top-down ancient temple ruins, broken columns, stone debris, overgrown"
  - "Top-down ruined fortress, crumbling walls, weathered stone, mysterious"
  - "Top-down ancient monument, standing stones, mystic symbols, aged stone"

### Domain-Attunement Overlays
**Dimensions**: 128x128px (overlay layer)
**Purpose**: Applied over base tiles when sanctified
**Opacity**: 40-60% blend with base tile

Generate one overlay per domain (8 total):
- **Fire**: Orange-red glow, ember particles, volcanic cracks
- **Water**: Blue shimmer, water droplets, misty effects
- **Earth**: Green moss growth, stone reinforcement, roots
- **Air**: White-blue wind swirls, feather motifs, clouds
- **Life**: Vibrant flowers, green growth, golden light
- **Death**: Purple-gray decay, ghostly wisps, bones
- **Order**: Golden geometric patterns, structured lines, crystalline
- **Chaos**: Pink-purple warped reality, glitch effects, random shapes

---

## Unit Assets

### Unit Sprite Dimensions
- **Base Size**: 64x64 pixels
- **Character Height**: ~50-56 pixels
- **Padding**: 4px on all sides
- **Export Scale**: 2x for retina (128x128 actual)
- **Animation Frames**: 4 frames (idle animation optional for MVP)

### Units to Generate

#### 1. Explorer
- **Style**: Light scout, agile appearance
- **Prompt**: "Top-down view of fantasy explorer character, light armor, backpack, staff or walking stick, adventurous look, stylized game sprite art"

#### 2. Warden
- **Style**: Heavy defender, armored
- **Prompt**: "Top-down armored warden guard, heavy armor, shield, defensive stance, protective appearance, game character sprite"

#### 3. Cultivator
- **Style**: Mystical support, robed figure
- **Prompt**: "Top-down cultivator priest character, flowing robes, staff with crystal, benevolent aura, game sprite art"

#### 4. Herald
- **Style**: Diplomatic influence unit
- **Prompt**: "Top-down herald diplomat, elegant attire, banner or standard, commanding presence, stylized sprite"

#### 5. Guardian
- **Style**: Elite heavy defender
- **Prompt**: "Top-down guardian warrior, ornate heavy armor, large weapon, imposing figure, game character sprite"

#### 6. Elemental Avatar (8 variants - one per domain)
- **Style**: Powerful domain-specific entity
- **Dimensions**: 96x96 pixels (larger than basic units)
- **Prompts** (customize per domain):
  - Fire: "Top-down fire elemental avatar, flames forming humanoid shape, burning aura"
  - Water: "Top-down water elemental avatar, flowing liquid form, aquatic appearance"
  - Earth: "Top-down earth elemental avatar, living stone creature, rocky body"
  - Air: "Top-down air elemental avatar, wind and clouds forming body, ethereal"
  - Life: "Top-down life elemental avatar, plant-based form, blooming flowers"
  - Death: "Top-down death elemental avatar, skeletal wraith, ghostly energy"
  - Order: "Top-down order elemental avatar, crystalline geometric form, radiant"
  - Chaos: "Top-down chaos elemental avatar, shifting unstable form, wild energy"

#### 7. Shadowborn
- **Style**: Dark hybrid creature
- **Prompt**: "Top-down shadowborn unit, dark hooded figure, shadow tendrils, corrupted aura, mysterious game sprite"

#### 8. Wight
- **Style**: Undead temporary blocker
- **Prompt**: "Top-down wight undead creature, skeletal figure, tattered cloak, ghostly appearance, small game sprite"

---

## UI Elements

### Resource Icons
- **Dimensions**: 48x48 pixels
- **Style**: Simple, readable icons with slight glow

#### Icons Needed:
1. **Divinity**: Glowing sun/star symbol - `#fbbf24` (gold)
2. **Faith**: Praying hands/temple - `#a3e635` (lime)
3. **Shadow Energy**: Dark swirling orb - `#581c87` (deep purple)
4. **Aegis**: Shield with glow - `#60a5fa` (light blue)
5. **Stability**: Stone/fortress icon - `#78716c` (gray)
6. **Corruption**: Dark crack/stain - `#4c1d95` (purple-black)

### Action Buttons
- **Dimensions**: 80x80 pixels (icon area), 120x50 (with text)
- **Style**: Icon + label, clear silhouette

#### Buttons Needed:
1. **Explore**: Compass/spyglass
2. **Capture**: Flag/banner
3. **Manage**: Hammer/tools
4. **Sanctify**: Divine light/halo
5. **Summon**: Summoning circle
6. **Miracle**: Lightning bolt/divine energy
7. **End Turn**: Hourglass/clock

### Progress Bars
- **Dimensions**: 200x24 pixels
- **Components**: Background, fill, border
- **Variants**: Stability bar (gray), Corruption pips (purple)

### Panel Backgrounds
- **Large Panel**: 400x600 pixels (tile info panel)
- **Medium Panel**: 300x200 pixels (resource display)
- **Small Panel**: 200x100 pixels (tooltip)
- **Style**: Semi-transparent with border, stone/parchment texture

---

## Effects & Particles

### Particle Sprite Sheets
- **Dimensions**: 512x512 pixels (containing 8x8 grid of 64x64 particles)
- **Format**: PNG with alpha transparency
- **Purpose**: For PIXI.js particle systems

#### Effect Types:

#### 1. Divine Energy Particles
- **Prompt**: "Golden glowing particles, sparkles, divine light motes, magical energy, game VFX sprite sheet"
- **Color**: Gold/yellow tones
- **Usage**: Divinity gains, miracles, sanctification

#### 2. Corruption Particles
- **Prompt**: "Dark purple smoke particles, shadowy wisps, corruption tendrils, game VFX sprite sheet"
- **Color**: Purple-black tones
- **Usage**: Shadow spread, corruption effects

#### 3. Mist/Fog Overlay
- **Dimensions**: 256x256 pixels (tileable)
- **Prompt**: "Tileable fog texture, misty atmosphere, transparent clouds, game overlay"
- **Usage**: Water domain Mist ability, fog of war visual

#### 4. Domain Power Effects (8 variants)
Create one effect sprite sheet per domain for their abilities:
- **Fire**: Flame bursts, embers, heat waves
- **Water**: Water splashes, ripples, bubbles
- **Earth**: Rock fragments, dust, crystal shards
- **Air**: Wind swirls, feathers, clouds
- **Life**: Flower petals, leaves, green sparkles
- **Death**: Ghostly apparitions, bones, dark energy
- **Order**: Geometric light patterns, golden rays
- **Chaos**: Reality distortion, color glitches, random shapes

---

## Domain-Specific Variants

### Sanctified Tile Visual Transformation
When a tile is sanctified, it should visually show domain influence.

**Implementation**: Overlay + color tint on base tile

#### Visual Transformation Examples:

1. **Fire-Sanctified Plains**
   - Add: Volcanic cracks, ember glow, orange-red tint
   - Prompt: "Overlay of volcanic energy, glowing cracks, fire domain influence"

2. **Water-Sanctified Forest**
   - Add: Mist, water droplets, blue shimmer, reflective pools
   - Prompt: "Water domain overlay, mist through trees, aquatic influence"

3. **Earth-Sanctified Hills**
   - Add: Reinforced stone, green moss, fortified appearance
   - Prompt: "Earth domain overlay, stone reinforcement, natural fortification"

4. **Life-Sanctified Village**
   - Add: Blooming flowers, vibrant growth, golden warm glow
   - Prompt: "Life domain overlay, flourishing plants, blessed growth"

5. **Death-Sanctified Ruins**
   - Add: Ghostly wisps, purple decay, spectral energy
   - Prompt: "Death domain overlay, undead energy, ghostly aura"

---

## Icon Assets

### Ability Icons (Domain Powers)
- **Dimensions**: 64x64 pixels
- **Style**: Simple, recognizable symbols
- **Border**: Circular or hexagonal frame

Generate 24 ability icons (3 per domain):
- Each domain needs: Passive icon, Minor Power icon, Major Rite icon

#### Example Prompts:
- **Fire - Blazing Step**: "Icon of flaming footprint, movement trail, fire symbol, game ability icon"
- **Water - Mist**: "Icon of swirling fog, cloud symbol, water domain ability icon"
- **Earth - Bulwark**: "Icon of fortified wall, stone shield, defensive ability icon"

### Relic Icons
- **Dimensions**: 64x64 pixels
- **Quantity**: 20+ icons needed (see relics.json)
- **Style**: Detailed item illustrations, fantasy artifacts

#### Example Prompts:
- **Ancient Compass**: "Fantasy compass icon, glowing needle, ornate design, game item icon"
- **Crown of Dominion**: "Golden crown icon, jewels, royal symbol, game relic icon"
- **Void Heart**: "Dark crystal heart, shadowy aura, mysterious artifact icon"

### Miracle Icons
- **Dimensions**: 64x64 pixels
- **Quantity**: 25+ icons needed (see miracles.json)
- **Style**: Powerful divine spell icons

---

## Prompt Guidelines for ComfyUI

### General Prompt Structure
```
[Subject] + [View/Angle] + [Style] + [Details] + [Lighting] + [Quality Tags]
```

### Recommended Keywords
- **View**: "top-down view", "isometric angle", "bird's eye view"
- **Style**: "stylized game art", "painterly", "2D game sprite", "cel-shaded"
- **Quality**: "high detail", "clean lines", "vibrant colors", "professional"
- **Exclusions**: "no 3D render", "no photorealistic", "no UI elements"

### Negative Prompts (what to avoid)
```
3D render, photorealistic, blurry, low quality, watermark, text, UI, realistic, photograph, ugly, deformed, noisy, cluttered
```

### Batch Generation Recommendations

1. **Generate by category**: All forests together, all units together, etc.
2. **Use consistent seed**: Within a category to maintain style consistency
3. **Iterate on variations**: Generate 3-5 options per asset, pick best
4. **Post-processing**: May need to manually adjust colors for domain consistency

### File Naming Convention
```
[category]_[type]_[variant]_[size].png

Examples:
- tile_forest_pine_128.png
- tile_forest_pine_256.png (2x scale)
- unit_explorer_idle_64.png
- effect_fire_particles_512.png
- icon_ability_blazing_step_64.png
- ui_button_explore_80.png
```

---

## Priority Generation Order

### Phase 1: Core Gameplay (MVP)
1. Basic tile types (plains, forest, hills) - 1 variant each
2. All 8 unit types - base versions
3. Resource icons (4 icons)
4. Action buttons (7 buttons)
5. Basic UI panels

**Estimated Assets**: ~30 images

### Phase 2: Visual Variety
1. Additional tile variants (2 more per type)
2. Domain overlays (8 overlays)
3. Particle effects (3-4 basic effects)
4. Ability icons (24 icons)

**Estimated Assets**: ~80 images

### Phase 3: Polish
1. All relic icons (20 icons)
2. All miracle icons (25 icons)
3. Advanced particle effects
4. Domain-specific unit variants
5. Animated effects

**Estimated Assets**: ~100 images

---

## Total Asset Count Estimate

- **Tiles**: 13 types × 3 variants = 39 tiles
- **Domain Overlays**: 8 overlays
- **Units**: 8 base units + 8 elemental avatars = 16 unit sprites
- **UI Icons**: 80-100 icons (abilities, relics, miracles, resources)
- **Effects**: 10-15 particle sprite sheets
- **UI Elements**: 20-30 panels, buttons, bars

**Grand Total**: ~200-250 unique assets for full game

**MVP Total**: ~50-80 assets for playable prototype

---

## ComfyUI Workflow Tips

1. **Set up a consistent workflow**: Save your prompt templates and settings
2. **Use ControlNet**: For maintaining perspective consistency across tiles
3. **Color grading**: Apply consistent color grading to match domain colors
4. **Upscaling**: Generate at base resolution, then upscale for @2x versions
5. **Batch processing**: Use ComfyUI's batch mode for generating variants
6. **Style references**: Generate a few "style reference" images first, then use those to guide all other generations

---

## Questions to Consider

1. **Art style preference**: Pixel art vs. painted vs. illustrated?
2. **Animation requirements**: Static sprites or animated idles/movements?
3. **Seasonal variants**: Do tiles need seasonal variations?
4. **Accessibility**: Colorblind-friendly palette needed?

---

## Asset Integration Notes

Once generated, assets should be placed in:
```
/public/assets/
  ├── tiles/
  ├── units/
  ├── effects/
  ├── icons/
  │   ├── abilities/
  │   ├── relics/
  │   ├── miracles/
  │   └── resources/
  └── ui/
```

The game engine (PIXI.js) will load these assets at runtime using the AssetManager system.

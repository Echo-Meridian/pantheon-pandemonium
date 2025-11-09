import { Tile, TileType, Owner, TileVisibility, Position, TileKey } from '@/types/game';
import { GameConfig } from '@/types/game';
import { createNoise2D } from 'simplex-noise';
import { alea } from 'seedrandom';

export class MapGenerator {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public async generateMap(
    width: number,
    height: number,
    seed: string
  ): Promise<Tile[]> {
    const tiles: Tile[] = [];
    const rng = alea(seed);
    const heightNoise = createNoise2D(rng);
    const moistureNoise = createNoise2D(rng);
    const featureNoise = createNoise2D(rng);

    // Generate base terrain
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = this.generateTile(x, y, heightNoise, moistureNoise);
        tiles.push(tile);
      }
    }

    // Place features
    this.placeFeatures(tiles, width, height, featureNoise, rng);

    // Place Shadow seeds
    this.placeShadowSeeds(tiles, width, height, rng);

    return tiles;
  }

  private generateTile(
    x: number,
    y: number,
    heightNoise: any,
    moistureNoise: any
  ): Tile {
    const position: Position = { x, y };

    // Sample noise at different scales for variety
    const h1 = heightNoise(x * 0.01, y * 0.01);
    const h2 = heightNoise(x * 0.05, y * 0.05) * 0.5;
    const h3 = heightNoise(x * 0.1, y * 0.1) * 0.25;
    const heightValue = (h1 + h2 + h3) / 1.75;

    const m1 = moistureNoise(x * 0.02, y * 0.02);
    const m2 = moistureNoise(x * 0.08, y * 0.08) * 0.5;
    const moistureValue = (m1 + m2) / 1.5;

    // Determine tile type based on height and moisture
    let type: TileType;
    let moveCost = 1;
    let impassable = false;
    let baseStability = 1;
    let divinityYield = 0;
    let faithYield = 0;

    if (heightValue > 0.75) {
      // Mountain
      type = TileType.Mountain;
      impassable = true;
      baseStability = 10;
    } else if (heightValue < -0.5) {
      // Water
      type = TileType.Water;
      moveCost = 2;
    } else if (heightValue < -0.25) {
      // Coast
      type = TileType.Coast;
      moveCost = 2;
    } else if (moistureValue > 0.6 && heightValue < 0.2) {
      // Swamp
      type = TileType.Swamp;
      moveCost = 3;
    } else if (moistureValue > 0.3) {
      // Forest
      type = TileType.Forest;
      moveCost = 2;
      baseStability = 2;
    } else if (heightValue > 0.4) {
      // Hills
      type = TileType.Hills;
      moveCost = 2;
      baseStability = 2;
    } else if (moistureValue < -0.4) {
      // Desert
      type = TileType.Desert;
      moveCost = 2;
    } else {
      // Plains
      type = TileType.Plains;
    }

    const tile: Tile = {
      id: `${x},${y}`,
      position,
      type,
      owner: Owner.Neutral,
      stability: baseStability,
      corruption: 0,
      sanctified: false,
      visibility: TileVisibility.Hidden,
      hasShrine: false,
      hasFortification: false,
      eventTriggered: false,
      divinityYield,
      faithYield,
      moveCost,
      impassable,
    };

    return tile;
  }

  private placeFeatures(
    tiles: Tile[],
    width: number,
    height: number,
    featureNoise: any,
    rng: () => number
  ): void {
    const tileMap = new Map<string, Tile>();
    tiles.forEach(tile => {
      tileMap.set(`${tile.position.x},${tile.position.y}`, tile);
    });

    // Calculate feature counts based on map size
    const mapArea = width * height;
    const villageCount = Math.floor(mapArea * 0.02);
    const sacredWellCount = Math.floor(mapArea * 0.01);
    const ruinCount = Math.floor(mapArea * 0.015);

    // Place villages
    this.placeFeatureType(
      tileMap,
      TileType.Village,
      villageCount,
      3,
      width,
      height,
      rng,
      (tile) => {
        tile.faithYield = 1;
      }
    );

    // Place sacred wells
    this.placeFeatureType(
      tileMap,
      TileType.SacredWell,
      sacredWellCount,
      5,
      width,
      height,
      rng,
      (tile) => {
        tile.divinityYield = 3;
        tile.stability = 2;
        tile.moveCost = 2;
      }
    );

    // Place ancient ruins
    this.placeFeatureType(
      tileMap,
      TileType.AncientRuins,
      ruinCount,
      4,
      width,
      height,
      rng,
      (tile) => {
        tile.moveCost = 2;
        tile.eventTriggered = false; // Will trigger on first exploration
      }
    );
  }

  private placeFeatureType(
    tileMap: Map<string, Tile>,
    featureType: TileType,
    count: number,
    minDistance: number,
    width: number,
    height: number,
    rng: () => number,
    modifyTile?: (tile: Tile) => void
  ): void {
    const placed: Position[] = [];

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        const tile = tileMap.get(`${x},${y}`);

        if (!tile || tile.impassable || tile.type === TileType.Water) {
          attempts++;
          continue;
        }

        // Check minimum distance from other features
        let tooClose = false;
        for (const pos of placed) {
          const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) {
          attempts++;
          continue;
        }

        // Place the feature
        tile.type = featureType;
        if (modifyTile) {
          modifyTile(tile);
        }
        placed.push({ x, y });
        break;
      }
    }
  }

  private placeShadowSeeds(
    tiles: Tile[],
    width: number,
    height: number,
    rng: () => number
  ): void {
    const shadowCount = Math.floor((width * height) * 0.01);
    const centerX = width / 2;
    const centerY = height / 2;
    const minDistanceFromCenter = Math.min(width, height) * 0.3;

    let placed = 0;
    const maxAttempts = shadowCount * 10;
    let attempts = 0;

    while (placed < shadowCount && attempts < maxAttempts) {
      attempts++;

      // Pick a random tile
      const tile = tiles[Math.floor(rng() * tiles.length)];

      // Skip if too close to center (where players might spawn)
      const distFromCenter = Math.sqrt(
        Math.pow(tile.position.x - centerX, 2) +
        Math.pow(tile.position.y - centerY, 2)
      );

      if (distFromCenter < minDistanceFromCenter) continue;

      // Skip if impassable or special
      if (tile.impassable ||
          tile.type === TileType.Village ||
          tile.type === TileType.SacredWell ||
          tile.type === TileType.AncientRuins) {
        continue;
      }

      // Place Shadow corruption
      tile.corruption = 2;
      tile.owner = Owner.Shadow;
      tile.stability = 3;
      placed++;
    }
  }

  public regenerateArea(
    centerX: number,
    centerY: number,
    radius: number,
    tiles: Map<string, Tile>,
    seed: string
  ): void {
    // Regenerate a specific area (for events/abilities)
    const rng = alea(seed + centerX + centerY);
    const heightNoise = createNoise2D(rng);
    const moistureNoise = createNoise2D(rng);

    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        const distance = Math.abs(x - centerX) + Math.abs(y - centerY);
        if (distance > radius) continue;

        const key = `${x},${y}`;
        const existing = tiles.get(key);
        if (!existing) continue;

        // Keep ownership but change terrain
        const newTile = this.generateTile(x, y, heightNoise, moistureNoise);
        newTile.owner = existing.owner;
        newTile.stability = existing.stability;
        newTile.corruption = existing.corruption;
        newTile.sanctified = existing.sanctified;
        newTile.domainAttunement = existing.domainAttunement;
        newTile.visibility = existing.visibility;

        tiles.set(key, newTile);
      }
    }
  }
}

// Simple seedrandom implementation for browser compatibility
function alea(seed: string): () => number {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = (data: string) => {
    let n = 0xefc8249d;
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000;
    }
    return (n >>> 0) * 2.3283064365386963e-10;
  };

  s0 = mash(' ');
  s1 = mash(' ');
  s2 = mash(' ');

  s0 -= mash(seed);
  if (s0 < 0) s0 += 1;
  s1 -= mash(seed);
  if (s1 < 0) s1 += 1;
  s2 -= mash(seed);
  if (s2 < 0) s2 += 1;

  return function() {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10;
    s0 = s1;
    s1 = s2;
    return s2 = t - (c = t | 0);
  };
}
/**
 * Database - Loads all game content from JSON files
 * This is the central data registry for the game
 */

import tilesData from '@/data/tiles.json';
import domainsData from '@/data/domains.json';
import unitsData from '@/data/units.json';
import eventsData from '@/data/events.json';
import relicsData from '@/data/relics.json';
import miraclesData from '@/data/miracles.json';

import { Domain, Relic, Miracle } from '@/types/game';

export interface TileTypeData {
  id: string;
  type: string;
  name: string;
  description: string;
  moveCost: number;
  impassable: boolean;
  baseStability: number;
  divinityYield: number;
  faithYield: number;
  tags: string[];
  domainSynergies?: any[];
  visualVariants: string[];
  canBuildShrine: boolean;
  eventChance: number;
  uniqueConstraints?: any;
  transformedFrom?: string;
  adjacentEffect?: any;
}

export interface UnitTypeData {
  id: string;
  type: string;
  name: string;
  description: string;
  cost: { divinity?: number; shadowEnergy?: number };
  movePoints: number;
  perception: number;
  abilities: any[];
  stats: { health: number; defense: number };
  tags: string[];
}

export interface EventData {
  id: string;
  category: string;
  name: string;
  description: string;
  triggers: string[];
  conditions: string[];
  outcomes: any[];
}

export class Database {
  private static instance: Database;

  private tiles: Map<string, TileTypeData> = new Map();
  private domains: Map<string, Domain> = new Map();
  private units: Map<string, UnitTypeData> = new Map();
  private events: Map<string, EventData> = new Map();
  private relics: Map<string, Relic> = new Map();
  private miracles: Map<string, Miracle> = new Map();

  private constructor() {
    this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadData(): void {
    // Load tiles
    (tilesData as any).tileTypes?.forEach((tile: TileTypeData) => {
      this.tiles.set(tile.id, tile);
    });

    // Load domains
    (domainsData as any).domains?.forEach((domain: any) => {
      this.domains.set(domain.id, domain as Domain);
    });

    // Load units
    (unitsData as any).units?.forEach((unit: UnitTypeData) => {
      this.units.set(unit.id, unit);
    });

    // Load events
    (eventsData as any).events?.forEach((event: EventData) => {
      this.events.set(event.id, event);
    });

    // Load relics
    (relicsData as any).relics?.forEach((relic: any) => {
      this.relics.set(relic.id, relic as Relic);
    });

    // Load miracles
    (miraclesData as any).miracles?.forEach((miracle: any) => {
      this.miracles.set(miracle.id, miracle as Miracle);
    });

    console.log(`Database loaded: ${this.tiles.size} tiles, ${this.domains.size} domains, ${this.units.size} units, ${this.events.size} events, ${this.relics.size} relics, ${this.miracles.size} miracles`);
  }

  // Tile queries
  public getTileType(id: string): TileTypeData | undefined {
    return this.tiles.get(id);
  }

  public getAllTileTypes(): TileTypeData[] {
    return Array.from(this.tiles.values());
  }

  public getTileTypesByTag(tag: string): TileTypeData[] {
    return Array.from(this.tiles.values()).filter(tile => tile.tags.includes(tag));
  }

  // Domain queries
  public getDomain(id: string): Domain | undefined {
    return this.domains.get(id);
  }

  public getAllDomains(): Domain[] {
    return Array.from(this.domains.values());
  }

  // Unit queries
  public getUnitType(id: string): UnitTypeData | undefined {
    return this.units.get(id);
  }

  public getAllUnitTypes(): UnitTypeData[] {
    return Array.from(this.units.values());
  }

  public getUnitTypesByTag(tag: string): UnitTypeData[] {
    return Array.from(this.units.values()).filter(unit => unit.tags.includes(tag));
  }

  // Event queries
  public getEvent(id: string): EventData | undefined {
    return this.events.get(id);
  }

  public getEventsByCategory(category: string): EventData[] {
    return Array.from(this.events.values()).filter(event => event.category === category);
  }

  public getEventsByTrigger(trigger: string): EventData[] {
    return Array.from(this.events.values()).filter(event => event.triggers.includes(trigger));
  }

  public getRandomEvent(category?: string): EventData | undefined {
    let eventPool = Array.from(this.events.values());

    if (category) {
      eventPool = eventPool.filter(e => e.category === category);
    }

    if (eventPool.length === 0) return undefined;

    return eventPool[Math.floor(Math.random() * eventPool.length)];
  }

  // Relic queries
  public getRelic(id: string): Relic | undefined {
    return this.relics.get(id);
  }

  public getRandomRelic(rarity?: 'common' | 'rare' | 'mythic'): Relic | undefined {
    let relicPool = Array.from(this.relics.values());

    if (rarity) {
      relicPool = relicPool.filter(r => r.rarity === rarity);
    } else {
      // Weight by rarity if no specific rarity requested
      const weights = { common: 70, rare: 25, mythic: 5 };
      const random = Math.random() * 100;

      if (random < weights.common) {
        relicPool = relicPool.filter(r => r.rarity === 'common');
      } else if (random < weights.common + weights.rare) {
        relicPool = relicPool.filter(r => r.rarity === 'rare');
      } else {
        relicPool = relicPool.filter(r => r.rarity === 'mythic');
      }
    }

    if (relicPool.length === 0) return undefined;

    return relicPool[Math.floor(Math.random() * relicPool.length)];
  }

  public getAllRelics(): Relic[] {
    return Array.from(this.relics.values());
  }

  // Miracle queries
  public getMiracle(id: string): Miracle | undefined {
    return this.miracles.get(id);
  }

  public getRandomMiracle(rarity?: 'common' | 'rare' | 'legendary'): Miracle | undefined {
    let miraclePool = Array.from(this.miracles.values());

    if (rarity) {
      miraclePool = miraclePool.filter(m => m.rarity === rarity);
    } else {
      // Weight by rarity
      const weights = { common: 70, rare: 25, legendary: 5 };
      const random = Math.random() * 100;

      if (random < weights.common) {
        miraclePool = miraclePool.filter(m => m.rarity === 'common');
      } else if (random < weights.common + weights.rare) {
        miraclePool = miraclePool.filter(m => m.rarity === 'rare');
      } else {
        miraclePool = miraclePool.filter(m => m.rarity === 'legendary');
      }
    }

    if (miraclePool.length === 0) return undefined;

    return miraclePool[Math.floor(Math.random() * miraclePool.length)];
  }

  public getAllMiracles(): Miracle[] {
    return Array.from(this.miracles.values());
  }

  // Helper methods
  public getContentSummary(): {
    tiles: number;
    domains: number;
    units: number;
    events: number;
    relics: number;
    miracles: number;
  } {
    return {
      tiles: this.tiles.size,
      domains: this.domains.size,
      units: this.units.size,
      events: this.events.size,
      relics: this.relics.size,
      miracles: this.miracles.size,
    };
  }
}

// Export singleton instance
export const db = Database.getInstance();

import { GameState, PlayerState, GameConfig, TileKey } from '@/types/game';

export class ResourceSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public updateResources(state: GameState, player: PlayerState): void {
    // This is called at the start of each turn
    // Resources are primarily managed by TurnSystem
    // This system provides utility methods for resource manipulation
  }

  public spendDivinity(player: PlayerState, amount: number): boolean {
    if (player.divinity < amount) return false;
    player.divinity -= amount;
    return true;
  }

  public spendFaith(player: PlayerState, amount: number): boolean {
    if (player.faith < amount) return false;
    player.faith -= amount;
    return true;
  }

  public spendShadowEnergy(player: PlayerState, amount: number): boolean {
    if (player.shadowEnergy < amount) return false;
    player.shadowEnergy -= amount;
    return true;
  }

  public grantDivinity(player: PlayerState, amount: number): void {
    player.divinity = Math.min(20, player.divinity + amount); // Cap at MAX_DIVINITY_PER_TURN
  }

  public grantFaith(player: PlayerState, amount: number): void {
    player.faith += amount; // Faith has no hard cap
  }

  public grantShadowEnergy(player: PlayerState, amount: number): void {
    player.shadowEnergy = Math.min(10, player.shadowEnergy + amount); // Cap at MAX_SHADOW_ENERGY
  }

  public convertShadowEnergyToDivinity(player: PlayerState, shadowEnergyAmount: number, conversionRate: number = 5): boolean {
    if (player.shadowEnergy < shadowEnergyAmount) return false;

    player.shadowEnergy -= shadowEnergyAmount;
    const divinityGained = shadowEnergyAmount * conversionRate;
    this.grantDivinity(player, divinityGained);

    return true;
  }

  public convertFaithToDivinity(player: PlayerState, faithAmount: number, conversionRate: number = 2): boolean {
    if (player.faith < faithAmount) return false;

    player.faith -= faithAmount;
    const divinityGained = faithAmount * conversionRate;
    this.grantDivinity(player, divinityGained);

    return true;
  }

  public calculateTileValue(state: GameState, tileKey: TileKey): {
    divinity: number;
    faith: number;
    strategic: number;
  } {
    const tile = state.tiles.get(tileKey);
    if (!tile) return { divinity: 0, faith: 0, strategic: 0 };

    let divinity = tile.divinityYield;
    let faith = tile.faithYield;
    let strategic = 0;

    // Strategic value based on type
    switch (tile.type) {
      case 'sacred_well':
        strategic += 10;
        break;
      case 'village':
        strategic += 5;
        break;
      case 'ancient_ruins':
        strategic += 8;
        break;
      case 'hills':
        strategic += 3; // Good for perception
        break;
      case 'mountain':
        strategic += 2; // Defensive barrier
        break;
    }

    // Strategic value based on position (center is more valuable)
    // This would need map dimensions
    // Placeholder for now

    return { divinity, faith, strategic };
  }

  public hasResources(player: PlayerState, required: {
    divinity?: number;
    faith?: number;
    shadowEnergy?: number;
  }): boolean {
    if (required.divinity && player.divinity < required.divinity) return false;
    if (required.faith && player.faith < required.faith) return false;
    if (required.shadowEnergy && player.shadowEnergy < required.shadowEnergy) return false;
    return true;
  }

  public spendResources(player: PlayerState, cost: {
    divinity?: number;
    faith?: number;
    shadowEnergy?: number;
  }): boolean {
    if (!this.hasResources(player, cost)) return false;

    if (cost.divinity) player.divinity -= cost.divinity;
    if (cost.faith) player.faith -= cost.faith;
    if (cost.shadowEnergy) player.shadowEnergy -= cost.shadowEnergy;

    return true;
  }

  public getResourceSummary(player: PlayerState): {
    divinity: { current: number; max: number };
    faith: { current: number };
    shadowEnergy: { current: number; max: number };
    aegis: { current: number };
  } {
    return {
      divinity: {
        current: player.divinity,
        max: 20, // MAX_DIVINITY_PER_TURN
      },
      faith: {
        current: player.faith,
      },
      shadowEnergy: {
        current: player.shadowEnergy,
        max: 10, // MAX_SHADOW_ENERGY
      },
      aegis: {
        current: player.aegis,
      },
    };
  }
}

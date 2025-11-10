import {
  GameState,
  PlayerState,
  GameConfig,
  Unit,
  TileKey
} from '@/types/game';

export class TurnSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public startTurn(state: GameState, player: PlayerState): void {
    // Refresh Divinity based on income
    const divinityIncome = this.calculateDivinityIncome(state, player);
    player.divinity = divinityIncome;

    // Generate Faith
    const faithIncome = this.calculateFaithIncome(state, player);
    player.faith += faithIncome;

    // Generate Shadow Energy (if applicable)
    const shadowEnergyIncome = this.calculateShadowEnergyIncome(state, player);
    player.shadowEnergy = Math.min(
      10, // MAX_SHADOW_ENERGY from BALANCE
      player.shadowEnergy + shadowEnergyIncome
    );

    // Refresh units
    player.units.forEach(unit => {
      this.refreshUnit(unit);
    });

    // Remove temporary units (like Wights that are ephemeral)
    player.units = player.units.filter(unit => {
      if (unit.type === 'wight' && unit.turnsAlive >= 1) {
        state.units.delete(unit.id);
        return false;
      }
      return true;
    });

    // Reset turn-specific counters
    player.capturedThisTurn = 0;
    player.sanctifiedThisTurn = 0;
  }

  public endTurn(state: GameState, player: PlayerState): void {
    // Convert remaining Divinity to Aegis
    const aegisConversion = Math.floor(player.divinity * this.config.shadowSpread.base);
    player.aegis = aegisConversion;
    player.divinity = 0; // All unspent divinity is lost

    // Increment unit ages
    player.units.forEach(unit => {
      unit.turnsAlive++;
    });

    // Apply any end-of-turn effects from relics
    this.applyRelicEndOfTurnEffects(player);

    // Reduce active effect durations
    this.decrementActiveEffects(player);
  }

  private calculateDivinityIncome(state: GameState, player: PlayerState): number {
    let income = this.config.baseDivinity;

    // Add income from owned tiles
    player.ownedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile) {
        income += tile.divinityYield;
      }
    });

    // Add domain passive bonuses
    const domainBonus = this.getDomainDivinityBonus(player.domain);
    income += domainBonus;

    // Add relic passives
    player.relics.forEach(relic => {
      if (relic.passive) {
        relic.passive.forEach(modifier => {
          if (modifier.type === 'divinity_income') {
            income += modifier.value;
          }
        });
      }
    });

    return Math.min(20, income); // MAX_DIVINITY_PER_TURN cap
  }

  private calculateFaithIncome(state: GameState, player: PlayerState): number {
    let income = 0;

    // Add income from tiles with faith yield
    player.ownedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile) {
        income += tile.faithYield;
      }
    });

    // Add domain-specific bonuses
    // (Life domain gets +1 Faith from villages)
    if (player.domain === 'life') {
      player.ownedTiles.forEach(tileKey => {
        const tile = state.tiles.get(tileKey);
        if (tile && tile.type === 'village') {
          income += 1;
        }
      });
    }

    // Add relic passives
    player.relics.forEach(relic => {
      if (relic.passive) {
        relic.passive.forEach(modifier => {
          if (modifier.type === 'faith_income') {
            income += modifier.value;
          }
        });
      }
    });

    return Math.min(10, income); // MAX_FAITH_PER_TURN cap
  }

  private calculateShadowEnergyIncome(state: GameState, player: PlayerState): number {
    let income = 0;

    // Shadow Energy from relics
    player.relics.forEach(relic => {
      if (relic.passive) {
        relic.passive.forEach(modifier => {
          if (modifier.type === 'shadow_energy_income') {
            income += modifier.value;
          }
        });
      }
    });

    // Shadow Energy from corrupted owned tiles (if using Death/Chaos domain)
    if (player.domain === 'death' || player.domain === 'chaos') {
      player.ownedTiles.forEach(tileKey => {
        const tile = state.tiles.get(tileKey);
        if (tile && tile.corruption > 0) {
          income += 0.5; // Small amount
        }
      });
    }

    return Math.floor(income);
  }

  private getDomainDivinityBonus(domain: string): number {
    // Placeholder for domain-specific income bonuses
    // These would be defined in domain data
    return 0;
  }

  private refreshUnit(unit: Unit): void {
    // Restore move points
    unit.movePoints = unit.maxMovePoints;

    // Decrement cooldowns
    unit.cooldowns.forEach((value, key) => {
      if (value > 0) {
        unit.cooldowns.set(key, value - 1);
      }
    });
  }

  private applyRelicEndOfTurnEffects(player: PlayerState): void {
    // Apply any "end of turn" relic effects
    // Most relics are passive or active-use, so this is minimal for now
  }

  private decrementActiveEffects(player: PlayerState): void {
    // Decrement duration of any active temporary effects
    // This would track things like temporary buffs from abilities
    // Implementation depends on how we store active effects
  }

  public calculateTurnOrder(state: GameState): void {
    // Determine turn order for the round
    // For MVP, this is simple: Player -> AI1 -> AI2 -> AI3
    // In future, could be initiative-based or domain-based
  }

  public checkTurnEnd(state: GameState, player: PlayerState): boolean {
    // Check if player can still perform actions
    // Returns true if player should be forced to end turn

    if (player.divinity === 0) {
      // Check if ANY action is affordable
      // For now, simplification: if 0 divinity, turn should end
      return true;
    }

    return false;
  }

  public advanceToNextPlayer(state: GameState): void {
    const players = Array.from(state.players.keys());
    const currentIndex = players.indexOf(state.currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    state.currentPlayer = players[nextIndex];
  }
}

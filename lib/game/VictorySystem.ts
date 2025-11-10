import {
  GameState,
  GameConfig,
  VictoryCondition,
  Owner,
  PlayerState
} from '@/types/game';

export class VictorySystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public checkVictory(state: GameState): { winner: Owner | null; condition: VictoryCondition | null } {
    // Check each enabled victory condition for all players
    for (const [owner, player] of state.players.entries()) {
      for (const condition of state.victoryConditions) {
        if (this.checkPlayerVictoryCondition(state, player, condition)) {
          return { winner: owner, condition };
        }
      }
    }

    // Check for defeat conditions
    const defeated = this.checkDefeatConditions(state);
    if (defeated) {
      return defeated;
    }

    return { winner: null, condition: null };
  }

  private checkPlayerVictoryCondition(
    state: GameState,
    player: PlayerState,
    condition: VictoryCondition
  ): boolean {
    switch (condition) {
      case VictoryCondition.Conquest:
        return this.checkConquestVictory(state, player);

      case VictoryCondition.Sanctifier:
        return this.checkSanctifierVictory(state, player);

      case VictoryCondition.ShadowAccord:
        return this.checkShadowAccordVictory(state, player);

      case VictoryCondition.RelicAscension:
        return this.checkRelicAscensionVictory(state, player);

      default:
        return false;
    }
  }

  private checkConquestVictory(state: GameState, player: PlayerState): boolean {
    // Control ≥75% of revealed tiles
    const revealedCount = state.revealedTiles.size;
    const ownedCount = player.ownedTiles.size;

    const threshold = state.victoryThresholds.get(VictoryCondition.Conquest) || 0.75;
    const percentage = ownedCount / revealedCount;

    // Update victory progress
    player.victoryProgress.set(VictoryCondition.Conquest, percentage * 100);

    return percentage >= threshold;
  }

  private checkSanctifierVictory(state: GameState, player: PlayerState): boolean {
    // Sanctify N holy sites (Sacred Wells or special tiles)
    let holySitesCount = 0;

    player.sanctifiedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile && this.isHolySite(tile.type)) {
        holySitesCount++;
      }
    });

    const threshold = state.victoryThresholds.get(VictoryCondition.Sanctifier) || 6;

    // Update victory progress
    player.victoryProgress.set(VictoryCondition.Sanctifier, (holySitesCount / threshold) * 100);

    return holySitesCount >= threshold;
  }

  private checkShadowAccordVictory(state: GameState, player: PlayerState): boolean {
    // Achieve ≥100 Shadow Alignment
    const alignment = state.shadowAlignmentMeter.get(player.owner) || 0;
    const threshold = state.victoryThresholds.get(VictoryCondition.ShadowAccord) || 100;

    // Update victory progress
    player.victoryProgress.set(VictoryCondition.ShadowAccord, (alignment / threshold) * 100);

    return alignment >= threshold;
  }

  private checkRelicAscensionVictory(state: GameState, player: PlayerState): boolean {
    // Assemble 3 unique Relics (only mythic relics count)
    const mythicRelics = player.relics.filter(r => r.rarity === 'mythic' && r.victoryPoints && r.victoryPoints > 0);
    const relicCount = mythicRelics.length;

    const threshold = state.victoryThresholds.get(VictoryCondition.RelicAscension) || 3;

    // Update victory progress
    player.victoryProgress.set(VictoryCondition.RelicAscension, (relicCount / threshold) * 100);

    return relicCount >= threshold;
  }

  private isHolySite(tileType: string): boolean {
    return tileType === 'sacred_well' || tileType === 'ancient_ruins';
  }

  private checkDefeatConditions(state: GameState): { winner: Owner | null; condition: VictoryCondition | null } | null {
    // Check if Shadow has taken over too much of the map (≥60%)
    let shadowTileCount = 0;
    let totalTiles = 0;

    state.tiles.forEach(tile => {
      if (!tile.impassable) {
        totalTiles++;
        if (tile.owner === Owner.Shadow) {
          shadowTileCount++;
        }
      }
    });

    const shadowPercentage = shadowTileCount / totalTiles;
    if (shadowPercentage >= 0.60) {
      // Shadow wins - all players lose
      return { winner: Owner.Shadow, condition: null };
    }

    // Check if any player has been completely eliminated
    for (const [owner, player] of state.players.entries()) {
      if (player.ownedTiles.size === 0 && player.units.length === 0) {
        // Player is eliminated
        // In multiplayer, game might continue
        // For now, we'll just track this
      }
    }

    return null;
  }

  public getVictoryProgress(state: GameState, player: PlayerState): Map<VictoryCondition, number> {
    const progress = new Map<VictoryCondition, number>();

    state.victoryConditions.forEach(condition => {
      switch (condition) {
        case VictoryCondition.Conquest:
          const revealedCount = state.revealedTiles.size;
          const ownedCount = player.ownedTiles.size;
          const conquestPercent = (ownedCount / revealedCount) * 100;
          progress.set(condition, conquestPercent);
          break;

        case VictoryCondition.Sanctifier:
          let holySites = 0;
          player.sanctifiedTiles.forEach(key => {
            const tile = state.tiles.get(key);
            if (tile && this.isHolySite(tile.type)) holySites++;
          });
          const threshold = state.victoryThresholds.get(condition) || 6;
          progress.set(condition, (holySites / threshold) * 100);
          break;

        case VictoryCondition.ShadowAccord:
          const alignment = state.shadowAlignmentMeter.get(player.owner) || 0;
          const shadowThreshold = state.victoryThresholds.get(condition) || 100;
          progress.set(condition, (alignment / shadowThreshold) * 100);
          break;

        case VictoryCondition.RelicAscension:
          const mythics = player.relics.filter(r => r.rarity === 'mythic' && r.victoryPoints && r.victoryPoints > 0).length;
          const relicThreshold = state.victoryThresholds.get(condition) || 3;
          progress.set(condition, (mythics / relicThreshold) * 100);
          break;
      }
    });

    return progress;
  }

  public getVictoryDescription(condition: VictoryCondition, state: GameState): string {
    const threshold = state.victoryThresholds.get(condition);

    switch (condition) {
      case VictoryCondition.Conquest:
        return `Control ${(threshold! * 100).toFixed(0)}% of revealed tiles`;

      case VictoryCondition.Sanctifier:
        return `Sanctify ${threshold} holy sites`;

      case VictoryCondition.ShadowAccord:
        return `Achieve ${threshold} Shadow Alignment`;

      case VictoryCondition.RelicAscension:
        return `Collect ${threshold} mythic relics`;

      default:
        return 'Unknown victory condition';
    }
  }

  public isCloseToVictory(state: GameState, player: PlayerState, threshold: number = 75): VictoryCondition | null {
    // Check if player is close to any victory condition (for AI decision making)
    const progress = this.getVictoryProgress(state, player);

    for (const [condition, percent] of progress.entries()) {
      if (percent >= threshold) {
        return condition;
      }
    }

    return null;
  }
}

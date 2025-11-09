import { GameState, Tile, Owner, TileKey, GameConfig, DomainType } from '@/types/game';

export class ShadowSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public initializeShadow(state: GameState): void {
    // Set initial shadow influence based on difficulty
    switch (state.shadowAggression) {
      case 'low':
        state.shadowInfluence = 10;
        break;
      case 'normal':
        state.shadowInfluence = 20;
        break;
      case 'high':
        state.shadowInfluence = 35;
        break;
    }

    // Initialize neutral faction alignment
    state.neutralFactionAlignment = 'neutral';
  }

  public spreadShadow(state: GameState): void {
    const tilesToCorrupt: Map<string, number> = new Map();
    const shadowSpreadConfig = this.config.shadowSpread;

    // Iterate through all tiles
    state.tiles.forEach((tile, key) => {
      // Only spread from corrupted tiles
      if (tile.corruption < 1 && tile.owner !== Owner.Shadow) return;

      // Get neighbors
      const neighbors = this.getNeighbors(tile.position.x, tile.position.y, state);

      neighbors.forEach(neighborKey => {
        const neighbor = state.tiles.get(neighborKey);
        if (!neighbor || neighbor.impassable) return;

        // Don't spread to already max corrupted tiles
        if (neighbor.corruption >= 2 && neighbor.owner === Owner.Shadow) return;

        // Calculate spread probability
        let probability = shadowSpreadConfig.base;

        // Count corrupted neighbors for this neighbor tile
        const neighborOfNeighbors = this.getNeighbors(
          neighbor.position.x,
          neighbor.position.y,
          state
        );

        let corruptedNeighborCount = 0;
        let sanctifiedNeighborCount = 0;
        let hasWardenAdjacent = false;

        neighborOfNeighbors.forEach(nnKey => {
          const nn = state.tiles.get(nnKey);
          if (!nn) return;

          if (nn.corruption > 0 || nn.owner === Owner.Shadow) {
            corruptedNeighborCount++;
          }
          if (nn.sanctified) {
            sanctifiedNeighborCount++;
          }

          // Check for Warden units
          state.units.forEach(unit => {
            if (unit.type === 'warden' &&
                unit.position.x === nn.position.x &&
                unit.position.y === nn.position.y) {
              hasWardenAdjacent = true;
            }
          });
        });

        // Apply modifiers
        probability += shadowSpreadConfig.perCorruptedNeighbor * corruptedNeighborCount;
        probability += shadowSpreadConfig.perSanctifiedNeighbor * sanctifiedNeighborCount;

        if (hasWardenAdjacent) {
          probability += shadowSpreadConfig.wardenAdjacent;
        }

        // Check if owner has Order domain
        const owner = state.players.get(neighbor.owner);
        if (owner && owner.domain === DomainType.Order) {
          probability += shadowSpreadConfig.orderOwner;
        }

        // Apply global shadow aggression modifier
        switch (state.shadowAggression) {
          case 'low':
            probability *= 0.5;
            break;
          case 'high':
            probability *= 1.5;
            break;
        }

        // Clamp probability
        probability = Math.max(shadowSpreadConfig.min, Math.min(shadowSpreadConfig.max, probability));

        // Roll for spread
        if (Math.random() < probability) {
          const currentCorruption = tilesToCorrupt.get(neighborKey) || neighbor.corruption;
          tilesToCorrupt.set(neighborKey, currentCorruption + 1);
        }
      });
    });

    // Apply corruption
    tilesToCorrupt.forEach((corruptionLevel, key) => {
      const tile = state.tiles.get(key);
      if (!tile) return;

      tile.corruption = Math.min(2, corruptionLevel);

      // If corruption reaches 2, tile becomes Shadow-owned
      if (tile.corruption >= 2) {
        // Store previous owner for potential restoration
        const previousOwner = tile.owner;

        tile.owner = Owner.Shadow;
        tile.stability = 3;
        tile.sanctified = false;
        tile.domainAttunement = undefined;

        // Remove from previous owner's tiles
        if (previousOwner !== Owner.Neutral && previousOwner !== Owner.Shadow) {
          const player = state.players.get(previousOwner);
          if (player) {
            player.ownedTiles.delete(key);
            player.sanctifiedTiles.delete(key);
          }
        }

        // Increase global shadow influence
        state.shadowInfluence = Math.min(100, state.shadowInfluence + 1);
      }
    });

    // Check if Shadow is becoming too powerful
    this.updateNeutralAlignment(state);
  }

  private getNeighbors(x: number, y: number, state: GameState): TileKey[] {
    const neighbors: TileKey[] = [];
    const directions = [
      { dx: 0, dy: -1 }, // North
      { dx: 1, dy: 0 },  // East
      { dx: 0, dy: 1 },  // South
      { dx: -1, dy: 0 }, // West
    ];

    directions.forEach(({ dx, dy }) => {
      const nx = x + dx;
      const ny = y + dy;

      // Check bounds
      if (nx >= 0 && nx < state.mapSize.width &&
          ny >= 0 && ny < state.mapSize.height) {
        neighbors.push(`${nx},${ny}` as TileKey);
      }
    });

    return neighbors;
  }

  public cleanseCorruption(tile: Tile, amount: number = 1): void {
    tile.corruption = Math.max(0, tile.corruption - amount);

    if (tile.corruption === 0 && tile.owner === Owner.Shadow) {
      tile.owner = Owner.Neutral;
      tile.stability = 1;
    }
  }

  public convertToShadow(tile: Tile): void {
    tile.owner = Owner.Shadow;
    tile.corruption = 2;
    tile.stability = 3;
    tile.sanctified = false;
    tile.domainAttunement = undefined;
  }

  private updateNeutralAlignment(state: GameState): void {
    // Update neutral faction based on Shadow influence
    if (state.shadowInfluence > 60) {
      state.neutralFactionAlignment = 'hostile';
    } else if (state.shadowInfluence > 30) {
      state.neutralFactionAlignment = 'neutral';
    } else {
      state.neutralFactionAlignment = 'friendly';
    }
  }

  public aidShadow(state: GameState, playerId: Owner, amount: number): void {
    // Player aids the Shadow, increasing their alignment
    const current = state.shadowAlignmentMeter.get(playerId) || 0;
    state.shadowAlignmentMeter.set(playerId, current + amount);

    // Check for Shadow Accord victory
    if (current + amount >= this.config.victoryThresholds.shadowAccord) {
      // Victory condition met
      const player = state.players.get(playerId);
      if (player) {
        player.victoryProgress.set('shadow_accord', 100);
      }
    }
  }

  public fightShadow(state: GameState, playerId: Owner, amount: number): void {
    // Player fights the Shadow, decreasing influence
    state.shadowInfluence = Math.max(0, state.shadowInfluence - amount);

    // Decrease player's Shadow alignment
    const current = state.shadowAlignmentMeter.get(playerId) || 0;
    state.shadowAlignmentMeter.set(playerId, Math.max(0, current - amount));
  }

  public calculateShadowStrength(state: GameState): number {
    // Calculate overall Shadow strength for AI/balance purposes
    let shadowTiles = 0;
    let corruptedTiles = 0;

    state.tiles.forEach(tile => {
      if (tile.owner === Owner.Shadow) shadowTiles++;
      if (tile.corruption > 0) corruptedTiles++;
    });

    const tilePercentage = (shadowTiles / state.tiles.size) * 100;
    const corruptionPercentage = (corruptedTiles / state.tiles.size) * 50;

    return Math.min(100, tilePercentage + corruptionPercentage + state.shadowInfluence);
  }

  public getShadowEvents(state: GameState): any[] {
    // Generate Shadow-related events based on current state
    const events = [];
    const shadowStrength = this.calculateShadowStrength(state);

    if (shadowStrength > 75) {
      events.push({
        id: 'shadow_surge',
        name: 'Shadow Surge',
        description: 'The Shadow grows bold and spreads rapidly!',
        effects: [
          { type: 'increase_spread_rate', value: 0.2, duration: 3 }
        ]
      });
    }

    if (state.neutralFactionAlignment === 'hostile') {
      events.push({
        id: 'neutral_uprising',
        name: 'Neutral Uprising',
        description: 'Neutral territories resist all capture attempts!',
        effects: [
          { type: 'neutral_resistance', value: 2, duration: 2 }
        ]
      });
    }

    return events;
  }
}
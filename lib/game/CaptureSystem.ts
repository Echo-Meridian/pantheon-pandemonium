import {
  GameState,
  GameAction,
  GameConfig,
  Owner,
  TileKey,
  Tile,
  PlayerState,
  DomainType
} from '@/types/game';

export class CaptureSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public executeCapture(state: GameState, action: GameAction): boolean {
    if (!action.targetTile) return false;

    const player = state.players.get(state.currentPlayer);
    if (!player) return false;

    const tileKey: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const tile = state.tiles.get(tileKey);

    if (!tile || tile.impassable) {
      action.message = 'Cannot capture impassable tile';
      return false;
    }

    if (tile.owner === player.owner) {
      action.message = 'Already own this tile';
      return false;
    }

    // Calculate capture cost
    const cost = this.calculateCaptureCost(state, player, tile);

    if (player.divinity < cost) {
      action.message = `Insufficient Divinity (need ${cost}, have ${player.divinity})`;
      return false;
    }

    // Execute capture
    const previousOwner = tile.owner;

    // Remove from previous owner's tiles
    if (previousOwner !== Owner.Neutral && previousOwner !== Owner.Shadow) {
      const prevPlayer = state.players.get(previousOwner);
      if (prevPlayer) {
        prevPlayer.ownedTiles.delete(tileKey);
        prevPlayer.sanctifiedTiles.delete(tileKey);
      }
    }

    // Transfer ownership
    tile.owner = player.owner;
    player.ownedTiles.add(tileKey);

    // Reduce stability after capture (tile is shaken by the struggle)
    tile.stability = Math.max(1, tile.stability - 1);

    // De-sanctify if was previously sanctified
    if (tile.sanctified) {
      tile.sanctified = false;
      tile.domainAttunement = undefined;
      // Yield bonuses from sanctification are removed
      if (tile.divinityYield > 0) {
        tile.divinityYield = Math.max(0, tile.divinityYield - 1);
      }
    }

    // Spend divinity
    player.divinity -= cost;
    player.capturedThisTurn++;

    // Apply domain-specific capture effects
    this.applyDomainCaptureEffects(state, player, tile, tileKey);

    // Trigger tile events if this is a special tile
    this.triggerTileEvents(state, player, tile);

    action.cost = { divinity: cost };
    action.message = `Captured tile at (${tile.position.x}, ${tile.position.y})`;

    return true;
  }

  public calculateCaptureCost(state: GameState, player: PlayerState, tile: Tile): number {
    let cost = this.config.captureBaseCost;

    // Add target stability
    cost += tile.stability;

    // Subtract adjacency bonus
    const adjacencyBonus = this.calculateAdjacencyBonus(state, player, tile);
    cost -= adjacencyBonus;

    // Apply domain modifiers
    const domainModifier = this.getDomainCaptureModifier(player.domain, tile);
    cost += domainModifier;

    // Apply unit support (Herald/Guardian effects)
    const unitSupport = this.calculateUnitSupport(state, player, tile);
    cost -= unitSupport;

    // Add shadow penalty if corrupted
    if (tile.corruption > 0) {
      cost += 1;
    }

    // Apply relic modifiers
    player.relics.forEach(relic => {
      if (relic.passive) {
        relic.passive.forEach(modifier => {
          if (modifier.type === 'capture_cost') {
            cost += modifier.value; // Value will be negative for bonuses
          }
        });
      }
    });

    // Minimum capture cost is 1
    return Math.max(1, Math.floor(cost));
  }

  private calculateAdjacencyBonus(state: GameState, player: PlayerState, tile: Tile): number {
    const neighbors = this.getNeighbors(tile.position.x, tile.position.y, state);
    let ownedNeighborCount = 0;

    neighbors.forEach(neighborKey => {
      const neighbor = state.tiles.get(neighborKey);
      if (neighbor && neighbor.owner === player.owner) {
        ownedNeighborCount++;
      }
    });

    // -1 if ≥2 owned neighbors, -2 if ≥4
    if (ownedNeighborCount >= 4) {
      return 2;
    } else if (ownedNeighborCount >= 2) {
      return 1;
    }

    return 0;
  }

  private getDomainCaptureModifier(domain: DomainType, tile: Tile): number {
    // Domain-specific capture cost modifiers
    switch (domain) {
      case DomainType.Fire:
        // Fire: -1 on Desert/Hill tiles
        if (tile.type === 'desert' || tile.type === 'hills') {
          return -1;
        }
        break;

      case DomainType.Order:
        // Order: Minor bonus on all captures
        return -0.5;

      default:
        return 0;
    }

    return 0;
  }

  private calculateUnitSupport(state: GameState, player: PlayerState, tile: Tile): number {
    let support = 0;

    // Check for Herald units adjacent
    player.units.forEach(unit => {
      if (unit.type === 'herald') {
        const distance = Math.abs(unit.position.x - tile.position.x) +
                        Math.abs(unit.position.y - tile.position.y);
        if (distance === 1) {
          support += 1; // Herald provides +1 adjacency bonus
        }
      }
    });

    return support;
  }

  private applyDomainCaptureEffects(
    state: GameState,
    player: PlayerState,
    tile: Tile,
    tileKey: TileKey
  ): void {
    // Apply domain-specific effects on capture
    switch (player.domain) {
      case DomainType.Death:
        // Death domain spawns Wight on captured tile
        this.spawnWight(state, player, tile);
        break;

      case DomainType.Life:
        // Life domain gains extra Faith on capture
        player.faith += 1;
        break;

      case DomainType.Order:
        // Order domain stabilizes captured tiles immediately
        tile.stability = Math.min(10, tile.stability + 1);
        break;

      case DomainType.Chaos:
        // Chaos domain might trigger random event
        if (Math.random() < 0.15) {
          // Trigger random event (implementation would call EventSystem)
          // For now, just a placeholder
        }
        break;
    }
  }

  private spawnWight(state: GameState, player: PlayerState, tile: Tile): void {
    const wight = {
      id: crypto.randomUUID(),
      type: 'wight' as const,
      owner: player.owner,
      position: { x: tile.position.x, y: tile.position.y },
      movePoints: 0,
      maxMovePoints: 0,
      perception: 0,
      abilities: ['ephemeral'],
      cooldowns: new Map(),
      turnsAlive: 0,
    };

    player.units.push(wight);
    state.units.set(wight.id, wight);
  }

  private triggerTileEvents(state: GameState, player: PlayerState, tile: Tile): void {
    // Trigger events based on tile type
    if (tile.eventTriggered) return; // Already triggered

    switch (tile.type) {
      case 'ancient_ruins':
        // Mark for event system to process
        tile.eventTriggered = true;
        // Event system will handle the actual event
        break;

      case 'sacred_well':
        // Immediate blessing
        player.divinity += 2;
        player.faith += 1;
        tile.eventTriggered = true;
        break;

      case 'village':
        // Welcome or resistance based on Shadow alignment
        const alignment = state.shadowAlignmentMeter.get(player.owner) || 0;
        if (alignment < -20) {
          // Resistance
          tile.stability = Math.max(1, tile.stability - 1);
        } else {
          // Welcome
          player.faith += 1;
        }
        tile.eventTriggered = true;
        break;
    }
  }

  private getNeighbors(x: number, y: number, state: GameState): TileKey[] {
    const neighbors: TileKey[] = [];
    const directions = [
      { dx: 0, dy: -1 },  // North
      { dx: 1, dy: 0 },   // East
      { dx: 0, dy: 1 },   // South
      { dx: -1, dy: 0 },  // West
    ];

    directions.forEach(({ dx, dy }) => {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < state.mapSize.width &&
          ny >= 0 && ny < state.mapSize.height) {
        neighbors.push(`${nx},${ny}` as TileKey);
      }
    });

    return neighbors;
  }

  public canCapture(state: GameState, player: PlayerState, tile: Tile): boolean {
    if (tile.impassable) return false;
    if (tile.owner === player.owner) return false;

    const cost = this.calculateCaptureCost(state, player, tile);
    return player.divinity >= cost;
  }

  public getCaptureInfo(state: GameState, player: PlayerState, tile: Tile): {
    cost: number;
    canAfford: boolean;
    breakdown: string[];
  } {
    let cost = this.config.captureBaseCost;
    const breakdown: string[] = [];

    breakdown.push(`Base cost: ${this.config.captureBaseCost}`);

    cost += tile.stability;
    breakdown.push(`Stability: +${tile.stability}`);

    const adjacencyBonus = this.calculateAdjacencyBonus(state, player, tile);
    if (adjacencyBonus > 0) {
      cost -= adjacencyBonus;
      breakdown.push(`Adjacency bonus: -${adjacencyBonus}`);
    }

    const domainModifier = this.getDomainCaptureModifier(player.domain, tile);
    if (domainModifier !== 0) {
      cost += domainModifier;
      breakdown.push(`Domain modifier: ${domainModifier > 0 ? '+' : ''}${domainModifier}`);
    }

    const unitSupport = this.calculateUnitSupport(state, player, tile);
    if (unitSupport > 0) {
      cost -= unitSupport;
      breakdown.push(`Unit support: -${unitSupport}`);
    }

    if (tile.corruption > 0) {
      cost += 1;
      breakdown.push(`Corruption penalty: +1`);
    }

    cost = Math.max(1, Math.floor(cost));
    breakdown.push(`\nTotal: ${cost}`);

    return {
      cost,
      canAfford: player.divinity >= cost,
      breakdown,
    };
  }
}

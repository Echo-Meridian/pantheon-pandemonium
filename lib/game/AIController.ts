import {
  GameState,
  PlayerState,
  GameConfig,
  GameAction,
  ActionType,
  TileKey,
  Tile,
  VictoryCondition
} from '@/types/game';

export class AIController {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public executeTurn(state: GameState, player: PlayerState): GameAction[] {
    const actions: GameAction[] = [];

    // Utility-based AI decision making
    // Generate candidate actions and score them

    while (player.divinity > 0) {
      const bestAction = this.selectBestAction(state, player);

      if (!bestAction) break; // No affordable actions

      actions.push(bestAction);

      // Simulate action execution to update internal state
      // In real implementation, would call GameEngine.executeAction
      this.simulateAction(state, player, bestAction);
    }

    return actions;
  }

  private selectBestAction(state: GameState, player: PlayerState): GameAction | null {
    const candidates: Array<{ action: GameAction; score: number }> = [];

    // Generate candidate actions
    this.generateCaptureActions(state, player, candidates);
    this.generateSanctifyActions(state, player, candidates);
    this.generateFortifyActions(state, player, candidates);
    this.generateExploreActions(state, player, candidates);
    this.generateSummonActions(state, player, candidates);

    // Score candidates using utility function
    candidates.forEach(candidate => {
      candidate.score = this.calculateUtility(state, player, candidate.action);
    });

    // Apply AI personality weights
    this.applyPersonalityWeights(player, candidates);

    // Select best action
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0].action;
  }

  private generateCaptureActions(
    state: GameState,
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Find capturable tiles adjacent to owned tiles
    const capturableTiles: Tile[] = [];

    player.ownedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (!tile) return;

      const neighbors = this.getNeighbors(tile.position.x, tile.position.y, state);

      neighbors.forEach(neighborKey => {
        const neighbor = state.tiles.get(neighborKey);
        if (neighbor &&
            neighbor.owner !== player.owner &&
            !neighbor.impassable &&
            player.divinity >= 2) { // Minimum capture cost
          capturableTiles.push(neighbor);
        }
      });
    });

    // Create capture actions
    capturableTiles.forEach(tile => {
      candidates.push({
        action: {
          id: crypto.randomUUID(),
          type: ActionType.Capture,
          playerId: player.id,
          timestamp: Date.now(),
          targetTile: tile.position,
          success: false,
        },
        score: 0,
      });
    });
  }

  private generateSanctifyActions(
    state: GameState,
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Find owned unsanctified tiles
    player.ownedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile && !tile.sanctified && player.divinity >= 4) {
        candidates.push({
          action: {
            id: crypto.randomUUID(),
            type: ActionType.Sanctify,
            playerId: player.id,
            timestamp: Date.now(),
            targetTile: tile.position,
            success: false,
          },
          score: 0,
        });
      }
    });
  }

  private generateFortifyActions(
    state: GameState,
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Find tiles that need fortification (low stability)
    player.ownedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile && tile.stability < 5 && player.divinity >= 3) {
        candidates.push({
          action: {
            id: crypto.randomUUID(),
            type: ActionType.ManageFortify,
            playerId: player.id,
            timestamp: Date.now(),
            targetTile: tile.position,
            success: false,
          },
          score: 0,
        });
      }
    });
  }

  private generateExploreActions(
    state: GameState,
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Move units to explore new areas
    player.units.forEach(unit => {
      if (unit.movePoints > 0) {
        // Find nearby unexplored tiles
        const nearbyTiles = this.getTilesInRadius(
          unit.position.x,
          unit.position.y,
          unit.movePoints,
          state
        );

        nearbyTiles.forEach(tileKey => {
          const tile = state.tiles.get(tileKey);
          if (tile && tile.visibility === 'hidden') {
            candidates.push({
              action: {
                id: crypto.randomUUID(),
                type: ActionType.Explore,
                playerId: player.id,
                timestamp: Date.now(),
                unitId: unit.id,
                targetTile: tile.position,
                success: false,
              },
              score: 0,
            });
          }
        });
      }
    });
  }

  private generateSummonActions(
    state: GameState,
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Summon explorers if we have Divinity
    if (player.divinity >= 2 && player.units.length < 5) {
      // Find a good spawn location (owned tile)
      const spawnTile = Array.from(player.ownedTiles.values())[0];
      if (spawnTile) {
        candidates.push({
          action: {
            id: crypto.randomUUID(),
            type: ActionType.SummonUnit,
            playerId: player.id,
            timestamp: Date.now(),
            targetTile: state.tiles.get(spawnTile)?.position,
            success: false,
          },
          score: 0,
        });
      }
    }
  }

  private calculateUtility(state: GameState, player: PlayerState, action: GameAction): number {
    let utility = 0;

    // Weights for different considerations
    const w1 = 0.3; // Victory progress
    const w2 = 0.25; // Economy gain
    const w3 = 0.2; // Defense gain
    const w4 = 0.15; // Risk assessment
    const w5 = 0.1; // Domain synergy

    // Calculate each component
    const victoryDelta = this.estimateVictoryProgressDelta(state, player, action);
    const economyGain = this.estimateEconomyGain(state, player, action);
    const defenseGain = this.estimateDefenseGain(state, player, action);
    const risk = this.assessRisk(state, player, action);
    const synergy = this.assessDomainSynergy(state, player, action);

    utility = w1 * victoryDelta +
              w2 * economyGain +
              w3 * defenseGain +
              w4 * risk +
              w5 * synergy;

    // Add some randomness for variety
    utility += (Math.random() - 0.5) * 0.1;

    return utility;
  }

  private estimateVictoryProgressDelta(state: GameState, player: PlayerState, action: GameAction): number {
    // Estimate how much this action advances victory conditions
    let delta = 0;

    switch (action.type) {
      case ActionType.Capture:
        delta += 5; // Advances conquest
        break;

      case ActionType.Sanctify:
        delta += 8; // Advances sanctifier
        if (action.targetTile) {
          const tile = state.tiles.get(`${action.targetTile.x},${action.targetTile.y}`);
          if (tile && (tile.type === 'sacred_well' || tile.type === 'ancient_ruins')) {
            delta += 10; // Holy site sanctification
          }
        }
        break;
    }

    return delta;
  }

  private estimateEconomyGain(state: GameState, player: PlayerState, action: GameAction): number {
    // Estimate resource gain from action
    let gain = 0;

    if (action.type === ActionType.Capture && action.targetTile) {
      const tile = state.tiles.get(`${action.targetTile.x},${action.targetTile.y}`);
      if (tile) {
        gain += tile.divinityYield * 2;
        gain += tile.faithYield * 1.5;
      }
    }

    if (action.type === ActionType.Sanctify) {
      gain += 1; // +1 Divinity/turn from sanctification
    }

    return gain;
  }

  private estimateDefenseGain(state: GameState, player: PlayerState, action: GameAction): number {
    // Estimate defensive value
    let defense = 0;

    if (action.type === ActionType.ManageFortify) {
      defense += 5;
    }

    if (action.type === ActionType.Sanctify) {
      defense += 3; // Sanctified tiles are more stable
    }

    return defense;
  }

  private assessRisk(state: GameState, player: PlayerState, action: GameAction): number {
    // Assess risk of action (Shadow nearby, enemy pressure, etc.)
    let risk = 0;

    if (action.targetTile) {
      const tile = state.tiles.get(`${action.targetTile.x},${action.targetTile.y}`);
      if (tile) {
        // Check for corruption nearby
        const neighbors = this.getNeighbors(tile.position.x, tile.position.y, state);
        neighbors.forEach(key => {
          const neighbor = state.tiles.get(key);
          if (neighbor && neighbor.corruption > 0) {
            risk -= 2; // Risky to expand near corruption
          }
        });
      }
    }

    return risk;
  }

  private assessDomainSynergy(state: GameState, player: PlayerState, action: GameAction): number {
    // Assess how well action synergizes with domain
    let synergy = 0;

    if (action.type === ActionType.Capture && action.targetTile) {
      const tile = state.tiles.get(`${action.targetTile.x},${action.targetTile.y}`);
      if (tile) {
        // Domain-specific tile preferences
        if (player.domain === 'fire' && (tile.type === 'desert' || tile.type === 'hills')) {
          synergy += 3;
        }
        if (player.domain === 'earth' && (tile.type === 'forest' || tile.type === 'hills')) {
          synergy += 3;
        }
        if (player.domain === 'water' && (tile.type === 'swamp' || tile.type === 'water')) {
          synergy += 3;
        }
      }
    }

    return synergy;
  }

  private applyPersonalityWeights(
    player: PlayerState,
    candidates: Array<{ action: GameAction; score: number }>
  ): void {
    // Apply personality-specific weight adjustments
    const personality = player.aiPersonality || 'balanced';

    candidates.forEach(candidate => {
      switch (personality) {
        case 'aggressive':
          if (candidate.action.type === ActionType.Capture) {
            candidate.score *= 1.5;
          }
          break;

        case 'defensive':
          if (candidate.action.type === ActionType.ManageFortify ||
              candidate.action.type === ActionType.Sanctify) {
            candidate.score *= 1.5;
          }
          break;

        case 'opportunist':
          if (candidate.action.type === ActionType.Capture ||
              candidate.action.type === ActionType.Sanctify) {
            candidate.score *= 1.3;
          }
          break;
      }
    });
  }

  private simulateAction(state: GameState, player: PlayerState, action: GameAction): void {
    // Simulate action execution for internal AI state tracking
    // This doesn't actually modify the game state
    // Just updates player's Divinity estimate for next action selection

    const baseCosts: { [key: string]: number } = {
      [ActionType.Capture]: 4,
      [ActionType.Sanctify]: 6,
      [ActionType.ManageFortify]: 3,
      [ActionType.SummonUnit]: 2,
    };

    const cost = baseCosts[action.type] || 0;
    player.divinity = Math.max(0, player.divinity - cost);
  }

  private getNeighbors(x: number, y: number, state: GameState): TileKey[] {
    const neighbors: TileKey[] = [];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
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

  private getTilesInRadius(x: number, y: number, radius: number, state: GameState): TileKey[] {
    const tiles: TileKey[] = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= radius) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < state.mapSize.width &&
              ny >= 0 && ny < state.mapSize.height) {
            tiles.push(`${nx},${ny}` as TileKey);
          }
        }
      }
    }

    return tiles;
  }
}

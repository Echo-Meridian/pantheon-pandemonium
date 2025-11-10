import { GameState, GameConfig, Unit, Tile, Owner, TileKey } from '@/types/game';

export class CombatSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  public canAttack(attacker: Unit, defender: Unit): boolean {
    // Check if attacker can attack defender
    if (attacker.owner === defender.owner) return false;

    // Check if units are adjacent
    const distance = Math.abs(attacker.position.x - defender.position.x) +
                    Math.abs(attacker.position.y - defender.position.y);

    return distance === 1; // Only adjacent units can attack
  }

  public executeAttack(state: GameState, attackerId: string, defenderId: string): boolean {
    const attacker = state.units.get(attackerId);
    const defender = state.units.get(defenderId);

    if (!attacker || !defender) return false;

    if (!this.canAttack(attacker, defender)) return false;

    // Calculate damage (simplified for MVP)
    // In full version, would consider unit stats, terrain, buffs, etc.
    const damage = 1;

    // Apply damage (units have health in full implementation)
    // For MVP, one hit destroys unit
    this.destroyUnit(state, defender);

    return true;
  }

  private destroyUnit(state: GameState, unit: Unit): void {
    // Remove unit from game state
    state.units.delete(unit.id);

    // Remove from player's unit list
    const player = state.players.get(unit.owner);
    if (player) {
      player.units = player.units.filter(u => u.id !== unit.id);
    }
  }

  public getUnitsOnTile(state: GameState, tileKey: TileKey): Unit[] {
    const units: Unit[] = [];
    const tile = state.tiles.get(tileKey);
    if (!tile) return units;

    state.units.forEach(unit => {
      if (unit.position.x === tile.position.x &&
          unit.position.y === tile.position.y) {
        units.push(unit);
      }
    });

    return units;
  }

  public canUnitMoveToTile(state: GameState, unit: Unit, tile: Tile): boolean {
    // Check if tile is impassable
    if (tile.impassable) return false;

    // Check if enemy units are on the tile
    const unitsOnTile = this.getUnitsOnTile(state, `${tile.position.x},${tile.position.y}`);
    const enemyUnits = unitsOnTile.filter(u => u.owner !== unit.owner);

    if (enemyUnits.length > 0) return false; // Cannot move onto enemy units

    // Check movement points
    const distance = Math.abs(unit.position.x - tile.position.x) +
                    Math.abs(unit.position.y - tile.position.y);
    const moveCost = distance * tile.moveCost;

    return unit.movePoints >= moveCost;
  }

  public calculateMovementPath(
    state: GameState,
    unit: Unit,
    targetX: number,
    targetY: number
  ): { x: number; y: number }[] | null {
    // Simple A* pathfinding implementation
    // For MVP, we'll use Manhattan distance
    // Full implementation would use proper pathfinding

    const path: { x: number; y: number }[] = [];
    let currentX = unit.position.x;
    let currentY = unit.position.y;

    while (currentX !== targetX || currentY !== targetY) {
      // Move towards target
      if (currentX < targetX) currentX++;
      else if (currentX > targetX) currentX--;
      else if (currentY < targetY) currentY++;
      else if (currentY > targetY) currentY--;

      const tileKey: TileKey = `${currentX},${currentY}`;
      const tile = state.tiles.get(tileKey);

      if (!tile || tile.impassable) {
        return null; // Path blocked
      }

      path.push({ x: currentX, y: currentY });
    }

    return path;
  }

  public getUnitAttackTargets(state: GameState, unit: Unit): Unit[] {
    const targets: Unit[] = [];

    // Check adjacent tiles for enemy units
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    directions.forEach(({ dx, dy }) => {
      const x = unit.position.x + dx;
      const y = unit.position.y + dy;
      const tileKey: TileKey = `${x},${y}`;

      const unitsOnTile = this.getUnitsOnTile(state, tileKey);
      const enemyUnits = unitsOnTile.filter(u => u.owner !== unit.owner);

      targets.push(...enemyUnits);
    });

    return targets;
  }

  public applyUnitAbility(state: GameState, unit: Unit, abilityId: string, target?: any): boolean {
    // Apply unit-specific abilities
    // This would be expanded based on unit types and their abilities

    switch (abilityId) {
      case 'defensive_aura': // Warden
        // Grant stability to tile
        const tileKey: TileKey = `${unit.position.x},${unit.position.y}`;
        const tile = state.tiles.get(tileKey);
        if (tile) {
          tile.stability = Math.min(10, tile.stability + 1);
          return true;
        }
        break;

      case 'influence': // Herald
        // Provides capture bonus (handled in CaptureSystem)
        return true;

      case 'blessed_touch': // Cultivator
        // Reduced sanctify cost (handled in game actions)
        return true;

      // More abilities would be implemented
    }

    return false;
  }

  public getUnitModifiers(state: GameState, unit: Unit): {
    moveBonus: number;
    perceptionBonus: number;
    other: string[];
  } {
    const modifiers = {
      moveBonus: 0,
      perceptionBonus: 0,
      other: [] as string[],
    };

    // Check player's domain for bonuses
    const player = state.players.get(unit.owner);
    if (!player) return modifiers;

    // Air domain: Explorers +1 Move
    if (player.domain === 'air' && unit.type === 'explorer') {
      modifiers.moveBonus += 1;
    }

    // Check tile-based bonuses
    const tileKey: TileKey = `${unit.position.x},${unit.position.y}`;
    const tile = state.tiles.get(tileKey);

    if (tile && tile.type === 'hills' && player.domain === 'air') {
      modifiers.perceptionBonus += 1;
    }

    // Check relic bonuses
    player.relics.forEach(relic => {
      if (relic.passive) {
        relic.passive.forEach(modifier => {
          if (modifier.type === 'move_cost' && modifier.value < 0) {
            modifiers.moveBonus += Math.abs(modifier.value);
          }
          if (modifier.type === 'perception') {
            modifiers.perceptionBonus += modifier.value;
          }
        });
      }
    });

    return modifiers;
  }
}

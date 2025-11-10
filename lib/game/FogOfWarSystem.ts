import {
  GameState,
  Unit,
  Tile,
  TileKey,
  TileVisibility,
  Owner,
  PlayerState
} from '@/types/game';

export class FogOfWarSystem {
  public updateVisibility(state: GameState): void {
    const currentPlayer = state.players.get(state.currentPlayer);
    if (!currentPlayer) return;

    // Reset all tiles to their base visibility for current player
    state.tiles.forEach((tile, key) => {
      // If tile was previously visible, mark as seen
      if (tile.visibility === TileVisibility.Visible) {
        tile.visibility = TileVisibility.Seen;
      }
    });

    // Update visibility based on units
    currentPlayer.units.forEach(unit => {
      this.revealTilesAroundUnit(state, unit);
    });

    // Update visibility based on sanctified tiles (passive vision)
    currentPlayer.sanctifiedTiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (!tile) return;

      // Sanctified tiles reveal themselves and adjacent tiles
      tile.visibility = TileVisibility.Visible;
      state.revealedTiles.add(tileKey);

      const neighbors = this.getNeighbors(tile.position.x, tile.position.y, state);
      neighbors.forEach(neighborKey => {
        const neighbor = state.tiles.get(neighborKey);
        if (neighbor) {
          if (neighbor.visibility === TileVisibility.Hidden) {
            neighbor.visibility = TileVisibility.Seen;
            state.revealedTiles.add(neighborKey);
          }
        }
      });
    });
  }

  public revealTilesAroundUnit(state: GameState, unit: Unit): void {
    const perception = this.calculateUnitPerception(unit, state);

    // Reveal tiles within perception radius
    const tilesToReveal = this.getTilesInRadius(
      unit.position.x,
      unit.position.y,
      perception,
      state
    );

    tilesToReveal.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile) {
        tile.visibility = TileVisibility.Visible;
        state.revealedTiles.add(tileKey);
      }
    });
  }

  private calculateUnitPerception(unit: Unit, state: GameState): number {
    let perception = unit.perception;

    // Check if unit is on a hill (Air domain synergy)
    const unitTileKey: TileKey = `${unit.position.x},${unit.position.y}`;
    const unitTile = state.tiles.get(unitTileKey);

    if (unitTile && unitTile.type === 'hills') {
      const player = state.players.get(unit.owner);
      if (player && player.domain === 'air') {
        perception += 1; // Air domain gets +1 perception from hills
      }
    }

    // Apply relic modifiers
    const player = state.players.get(unit.owner);
    if (player) {
      player.relics.forEach(relic => {
        if (relic.passive) {
          relic.passive.forEach(modifier => {
            if (modifier.type === 'perception') {
              perception += modifier.value;
            }
          });
        }
      });
    }

    return perception;
  }

  private getTilesInRadius(
    centerX: number,
    centerY: number,
    radius: number,
    state: GameState
  ): TileKey[] {
    const tiles: TileKey[] = [];

    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        // Manhattan distance for grid-based perception
        const distance = Math.abs(x - centerX) + Math.abs(y - centerY);

        if (distance <= radius &&
            x >= 0 && x < state.mapSize.width &&
            y >= 0 && y < state.mapSize.height) {
          tiles.push(`${x},${y}` as TileKey);
        }
      }
    }

    return tiles;
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

  public isVisibleToPlayer(state: GameState, tileKey: TileKey, player: PlayerState): boolean {
    const tile = state.tiles.get(tileKey);
    if (!tile) return false;

    // If it's the current player's turn and tile is visible, return true
    if (player.owner === state.currentPlayer) {
      return tile.visibility === TileVisibility.Visible ||
             tile.visibility === TileVisibility.Seen;
    }

    // For other players, check if they have units or sanctified tiles nearby
    // (This would be used in multiplayer)
    return false;
  }

  public revealArea(state: GameState, centerX: number, centerY: number, radius: number): void {
    const tiles = this.getTilesInRadius(centerX, centerY, radius, state);

    tiles.forEach(tileKey => {
      const tile = state.tiles.get(tileKey);
      if (tile && tile.visibility === TileVisibility.Hidden) {
        tile.visibility = TileVisibility.Seen;
        state.revealedTiles.add(tileKey);
      }
    });
  }

  public applyMist(state: GameState, centerX: number, centerY: number, radius: number, duration: number): void {
    // Water domain's Mist ability
    // This would create a temporary fog effect that blocks enemy vision
    // Implementation would require tracking active area effects
    // Placeholder for now
  }

  public removeMist(state: GameState, centerX: number, centerY: number, radius: number): void {
    // Air domain's Tempest removes mist
    // Placeholder for now
  }

  public getVisibleTiles(state: GameState, player: PlayerState): TileKey[] {
    const visible: TileKey[] = [];

    state.tiles.forEach((tile, key) => {
      if (tile.owner === player.owner) {
        visible.push(key);
      } else if (this.isTileVisibleToPlayer(state, tile, player)) {
        visible.push(key);
      }
    });

    return visible;
  }

  private isTileVisibleToPlayer(state: GameState, tile: Tile, player: PlayerState): boolean {
    // Check if any of player's units can see this tile
    for (const unit of player.units) {
      const perception = this.calculateUnitPerception(unit, state);
      const distance = Math.abs(unit.position.x - tile.position.x) +
                      Math.abs(unit.position.y - tile.position.y);

      if (distance <= perception) {
        return true;
      }
    }

    // Check if tile is adjacent to sanctified tiles
    for (const sanctifiedKey of player.sanctifiedTiles) {
      const sanctified = state.tiles.get(sanctifiedKey);
      if (!sanctified) continue;

      const distance = Math.abs(sanctified.position.x - tile.position.x) +
                      Math.abs(sanctified.position.y - tile.position.y);

      if (distance <= 1) {
        return true;
      }
    }

    return false;
  }
}

import { GameState, PlayerState, GlobalEvent, Tile } from '@/types/game';

export class EventSystem {
  private pendingEvents: GlobalEvent[] = [];

  public processEvents(state: GameState): void {
    // Process any active global events
    state.activeGlobalEvents = state.activeGlobalEvents.filter(event => {
      if (event.duration <= 0) {
        return false; // Remove expired events
      }

      // Decrement duration
      event.duration--;

      return true;
    });

    // Check for new random events
    this.checkForRandomEvents(state);
  }

  private checkForRandomEvents(state: GameState): void {
    const player = state.players.get(state.currentPlayer);
    if (!player) return;

    // Base chance for events per turn
    let eventChance = 0.15; // 15% base chance

    // Chaos domain increases event chance
    if (player.domain === 'chaos') {
      eventChance += 0.10; // +10% for positive events
      // Also 5% chance for negative events (handled separately)
    }

    if (Math.random() < eventChance) {
      // Trigger a random event
      this.triggerRandomEvent(state, player);
    }
  }

  private triggerRandomEvent(state: GameState, player: PlayerState): void {
    // In a full implementation, this would load from events.json
    // For now, we'll create some sample events

    const eventPool = [
      {
        id: 'divine_revelation',
        name: 'Divine Revelation',
        description: 'Clarity washes over you',
        effects: [
          { type: 'grant_divinity', value: 3 },
          { type: 'reveal_tiles', value: 5 }
        ]
      },
      {
        id: 'faithful_pilgrims',
        name: 'Faithful Pilgrims',
        description: 'Pilgrims seek out your shrines',
        effects: [
          { type: 'grant_faith', value: 3 }
        ]
      },
      // More events would be loaded from events.json
    ];

    const event = eventPool[Math.floor(Math.random() * eventPool.length)];

    // Apply event effects
    this.applyEventEffects(state, player, event.effects);

    // Log event (in full implementation, would show to player)
    console.log(`Event triggered: ${event.name} - ${event.description}`);
  }

  private applyEventEffects(state: GameState, player: PlayerState, effects: any[]): void {
    effects.forEach(effect => {
      switch (effect.type) {
        case 'grant_divinity':
          player.divinity = Math.min(20, player.divinity + effect.value);
          break;

        case 'grant_faith':
          player.faith += effect.value;
          break;

        case 'grant_shadow_energy':
          player.shadowEnergy = Math.min(10, player.shadowEnergy + effect.value);
          break;

        case 'reveal_tiles':
          // Reveal random hidden tiles
          this.revealRandomTiles(state, effect.value);
          break;

        case 'add_corruption':
          // Add corruption to random enemy tiles
          this.addCorruptionToRandomTiles(state, player, effect.value);
          break;

        case 'remove_corruption':
          // Remove corruption from owned tiles
          this.removeCorruptionFromTiles(state, player, effect.value);
          break;

        case 'damage_stability':
          // Reduce stability on tiles
          this.damageStability(state, player, effect);
          break;

        case 'add_stability':
          // Increase stability on tiles
          this.addStability(state, player, effect);
          break;

        // More effect types would be implemented
      }
    });
  }

  private revealRandomTiles(state: GameState, count: number): void {
    const hiddenTiles: string[] = [];

    state.tiles.forEach((tile, key) => {
      if (tile.visibility === 'hidden') {
        hiddenTiles.push(key);
      }
    });

    // Randomly select tiles to reveal
    for (let i = 0; i < Math.min(count, hiddenTiles.length); i++) {
      const randomIndex = Math.floor(Math.random() * hiddenTiles.length);
      const tileKey = hiddenTiles.splice(randomIndex, 1)[0];
      const tile = state.tiles.get(tileKey);

      if (tile) {
        tile.visibility = 'seen';
        state.revealedTiles.add(tileKey);
      }
    }
  }

  private addCorruptionToRandomTiles(state: GameState, player: PlayerState, amount: number): void {
    // Find enemy tiles
    const enemyTiles: string[] = [];

    state.tiles.forEach((tile, key) => {
      if (tile.owner !== player.owner && tile.owner !== 'neutral' && tile.owner !== 'shadow') {
        enemyTiles.push(key);
      }
    });

    // Add corruption to random enemy tiles
    for (let i = 0; i < Math.min(amount, enemyTiles.length); i++) {
      const randomIndex = Math.floor(Math.random() * enemyTiles.length);
      const tileKey = enemyTiles[randomIndex];
      const tile = state.tiles.get(tileKey);

      if (tile) {
        tile.corruption = Math.min(2, tile.corruption + 1);
      }
    }
  }

  private removeCorruptionFromTiles(state: GameState, player: PlayerState, amount: number): void {
    const corruptedTiles: string[] = [];

    player.ownedTiles.forEach(key => {
      const tile = state.tiles.get(key);
      if (tile && tile.corruption > 0) {
        corruptedTiles.push(key);
      }
    });

    // Remove corruption
    corruptedTiles.forEach(key => {
      const tile = state.tiles.get(key);
      if (tile) {
        tile.corruption = Math.max(0, tile.corruption - 1);
      }
    });
  }

  private damageStability(state: GameState, player: PlayerState, effect: any): void {
    const targetTags = effect.targetTags || [];
    const value = effect.value || 1;

    if (targetTags.includes('owned')) {
      player.ownedTiles.forEach(key => {
        const tile = state.tiles.get(key);
        if (tile) {
          tile.stability = Math.max(0, tile.stability - value);
        }
      });
    }
  }

  private addStability(state: GameState, player: PlayerState, effect: any): void {
    const targetTags = effect.targetTags || [];
    const value = effect.value || 1;

    if (targetTags.includes('owned')) {
      player.ownedTiles.forEach(key => {
        const tile = state.tiles.get(key);
        if (tile) {
          tile.stability = Math.min(10, tile.stability + value);
        }
      });
    }

    if (targetTags.includes('sanctified')) {
      player.sanctifiedTiles.forEach(key => {
        const tile = state.tiles.get(key);
        if (tile) {
          tile.stability = Math.min(10, tile.stability + value);
        }
      });
    }
  }

  public triggerTileEvent(state: GameState, player: PlayerState, tile: Tile): void {
    // Trigger events specific to tile types
    // This would load events from events.json based on tile type

    if (tile.type === 'ancient_ruins' && !tile.eventTriggered) {
      // Ruin events
      const outcomes = ['relic', 'guardian', 'curse'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

      switch (outcome) {
        case 'relic':
          // Grant a relic (would use Database to load relic)
          console.log('Found a relic in the ruins!');
          break;

        case 'guardian':
          // Grant divinity and stability
          player.divinity = Math.min(20, player.divinity + 5);
          tile.stability = Math.min(10, tile.stability + 2);
          break;

        case 'curse':
          // Add corruption but grant shadow energy
          tile.corruption = Math.min(2, tile.corruption + 1);
          player.shadowEnergy = Math.min(10, player.shadowEnergy + 2);
          player.divinity = Math.min(20, player.divinity + 3);
          break;
      }

      tile.eventTriggered = true;
    }
  }

  public addGlobalEvent(state: GameState, event: GlobalEvent): void {
    state.activeGlobalEvents.push(event);
  }

  public removeGlobalEvent(state: GameState, eventId: string): void {
    state.activeGlobalEvents = state.activeGlobalEvents.filter(e => e.id !== eventId);
  }

  public getActiveEvents(state: GameState): GlobalEvent[] {
    return state.activeGlobalEvents;
  }
}

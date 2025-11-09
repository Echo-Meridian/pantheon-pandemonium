import {
  GameState,
  GameAction,
  GameConfig,
  ActionType,
  Owner,
  PlayerState,
  GamePhase,
  VictoryCondition,
  Tile,
  Unit,
  Position,
  TileKey
} from '@/types/game';
import { MapGenerator } from './MapGenerator';
import { TurnSystem } from './TurnSystem';
import { CaptureSystem } from './CaptureSystem';
import { ShadowSystem } from './ShadowSystem';
import { CombatSystem } from './CombatSystem';
import { ResourceSystem } from './ResourceSystem';
import { FogOfWarSystem } from './FogOfWarSystem';
import { EventSystem } from './EventSystem';
import { VictorySystem } from './VictorySystem';
import { AIController } from './AIController';
import { defaultGameConfig } from '@/config/gameConfig';

export class GameEngine {
  private state: GameState;
  private config: GameConfig;

  private mapGen: MapGenerator;
  private turnSystem: TurnSystem;
  private captureSystem: CaptureSystem;
  private shadowSystem: ShadowSystem;
  private combatSystem: CombatSystem;
  private resourceSystem: ResourceSystem;
  private fogSystem: FogOfWarSystem;
  private eventSystem: EventSystem;
  private victorySystem: VictorySystem;
  private aiController: AIController;

  private actionHistory: GameAction[] = [];
  private listeners: Map<string, Set<(state: GameState) => void>> = new Map();

  constructor(config?: Partial<GameConfig>) {
    this.config = { ...defaultGameConfig, ...config };

    // Initialize systems
    this.mapGen = new MapGenerator(this.config);
    this.turnSystem = new TurnSystem(this.config);
    this.captureSystem = new CaptureSystem(this.config);
    this.shadowSystem = new ShadowSystem(this.config);
    this.combatSystem = new CombatSystem(this.config);
    this.resourceSystem = new ResourceSystem(this.config);
    this.fogSystem = new FogOfWarSystem();
    this.eventSystem = new EventSystem();
    this.victorySystem = new VictorySystem(this.config);
    this.aiController = new AIController(this.config);

    // Initialize empty state
    this.state = this.createEmptyState();
  }

  private createEmptyState(): GameState {
    return {
      id: crypto.randomUUID(),
      turn: 0,
      phase: GamePhase.Setup,
      currentPlayer: Owner.Player,
      players: new Map(),
      tiles: new Map(),
      units: new Map(),
      shadowInfluence: 0,
      shadowAlignmentMeter: new Map(),
      neutralFactionAlignment: 'neutral',
      activeGlobalEvents: [],
      victoryConditions: new Set([
        VictoryCondition.Conquest,
        VictoryCondition.Sanctifier,
        VictoryCondition.ShadowAccord
      ]),
      victoryThresholds: new Map([
        [VictoryCondition.Conquest, this.config.victoryThresholds.conquest],
        [VictoryCondition.Sanctifier, this.config.victoryThresholds.sanctifySites],
        [VictoryCondition.ShadowAccord, this.config.victoryThresholds.shadowAccord],
        [VictoryCondition.RelicAscension, this.config.victoryThresholds.relicCount],
      ]),
      mapSeed: Math.random().toString(36).substring(7),
      mapSize: { width: 40, height: 40 },
      revealedTiles: new Set(),
      difficulty: 'normal',
      shadowAggression: 'normal',
      tileRichness: 'normal',
      encircleRule: false,
      relicFrequency: 'normal',
    };
  }

  public async initializeGame(options: {
    players: Partial<PlayerState>[];
    mapSize?: { width: number; height: number };
    difficulty?: 'easy' | 'normal' | 'hard' | 'extreme';
    shadowAggression?: 'low' | 'normal' | 'high';
    victoryConditions?: VictoryCondition[];
  }): Promise<void> {
    // Reset state
    this.state = this.createEmptyState();

    // Apply options
    if (options.mapSize) this.state.mapSize = options.mapSize;
    if (options.difficulty) this.state.difficulty = options.difficulty;
    if (options.shadowAggression) this.state.shadowAggression = options.shadowAggression;
    if (options.victoryConditions) {
      this.state.victoryConditions = new Set(options.victoryConditions);
    }

    // Generate map
    const tiles = await this.mapGen.generateMap(
      this.state.mapSize.width,
      this.state.mapSize.height,
      this.state.mapSeed
    );

    // Convert tiles to map
    tiles.forEach(tile => {
      const key: TileKey = `${tile.position.x},${tile.position.y}`;
      this.state.tiles.set(key, tile);
    });

    // Initialize players
    options.players.forEach((playerData, index) => {
      const owner = index === 0 ? Owner.Player :
                   index === 1 ? Owner.AI1 :
                   index === 2 ? Owner.AI2 : Owner.AI3;

      const player: PlayerState = {
        id: crypto.randomUUID(),
        name: playerData.name || `Player ${index + 1}`,
        owner,
        domain: playerData.domain!,
        isAI: owner !== Owner.Player,
        divinity: this.config.baseDivinity,
        faith: 0,
        shadowEnergy: 0,
        aegis: 0,
        units: [],
        ownedTiles: new Set(),
        sanctifiedTiles: new Set(),
        relics: [],
        miracles: [],
        victoryProgress: new Map(),
        capturedThisTurn: 0,
        sanctifiedThisTurn: 0,
        aiPersonality: playerData.aiPersonality || 'balanced',
      };

      this.state.players.set(owner, player);
      this.state.shadowAlignmentMeter.set(owner, 0);
    });

    // Place starting positions
    this.placeStartingPositions();

    // Initialize Shadow
    this.shadowSystem.initializeShadow(this.state);

    // Set phase to playing
    this.state.phase = GamePhase.Playing;

    // Start first turn
    this.startTurn();

    // Notify listeners
    this.notifyListeners();
  }

  private placeStartingPositions(): void {
    const players = Array.from(this.state.players.values());
    const mapWidth = this.state.mapSize.width;
    const mapHeight = this.state.mapSize.height;

    // Calculate starting positions (corners for up to 4 players)
    const startPositions: Position[] = [
      { x: 5, y: 5 },
      { x: mapWidth - 6, y: mapHeight - 6 },
      { x: 5, y: mapHeight - 6 },
      { x: mapWidth - 6, y: 5 },
    ];

    players.forEach((player, index) => {
      if (index >= startPositions.length) return;

      const startPos = startPositions[index];

      // Give player starting tiles (3x3 area)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = startPos.x + dx;
          const y = startPos.y + dy;
          const key: TileKey = `${x},${y}`;
          const tile = this.state.tiles.get(key);

          if (tile && !tile.impassable) {
            tile.owner = player.owner;
            tile.stability = 3;
            player.ownedTiles.add(key);
            this.state.revealedTiles.add(key);

            // Center tile is sanctified
            if (dx === 0 && dy === 0) {
              tile.sanctified = true;
              tile.domainAttunement = player.domain;
              player.sanctifiedTiles.add(key);
            }
          }
        }
      }

      // Create starting Explorer unit
      const explorer: Unit = {
        id: crypto.randomUUID(),
        type: 'explorer',
        owner: player.owner,
        position: startPos,
        movePoints: 3,
        maxMovePoints: 3,
        perception: 1,
        abilities: [],
        cooldowns: new Map(),
        turnsAlive: 0,
      };

      player.units.push(explorer);
      this.state.units.set(explorer.id, explorer);
    });
  }

  public executeAction(action: GameAction): boolean {
    // Validate action
    if (!this.validateAction(action)) {
      action.success = false;
      action.message = 'Invalid action';
      this.actionHistory.push(action);
      return false;
    }

    // Execute based on action type
    let success = false;
    switch (action.type) {
      case ActionType.Move:
      case ActionType.Explore:
        success = this.executeMove(action);
        break;
      case ActionType.Capture:
        success = this.captureSystem.executeCapture(this.state, action);
        break;
      case ActionType.ManageFortify:
        success = this.executeFortify(action);
        break;
      case ActionType.ManagePurify:
        success = this.executePurify(action);
        break;
      case ActionType.ManageBuildShrine:
        success = this.executeBuildShrine(action);
        break;
      case ActionType.Sanctify:
        success = this.executeSanctify(action);
        break;
      case ActionType.SummonUnit:
        success = this.executeSummonUnit(action);
        break;
      case ActionType.UseAbility:
        success = this.executeAbility(action);
        break;
      case ActionType.UseMiracle:
        success = this.executeMiracle(action);
        break;
      case ActionType.EndTurn:
        success = this.endTurn();
        break;
      default:
        success = false;
    }

    action.success = success;
    this.actionHistory.push(action);

    // Update fog of war
    this.fogSystem.updateVisibility(this.state);

    // Check victory conditions
    const victory = this.victorySystem.checkVictory(this.state);
    if (victory) {
      this.state.phase = GamePhase.Victory;
    }

    // Notify listeners
    this.notifyListeners();

    return success;
  }

  private validateAction(action: GameAction): boolean {
    // Check if it's the right player's turn
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player || player.id !== action.playerId) {
      return false;
    }

    // Check if player has enough resources
    if (action.cost) {
      if (action.cost.divinity && player.divinity < action.cost.divinity) return false;
      if (action.cost.faith && player.faith < action.cost.faith) return false;
      if (action.cost.shadowEnergy && player.shadowEnergy < action.cost.shadowEnergy) return false;
    }

    return true;
  }

  private executeMove(action: GameAction): boolean {
    const unit = this.state.units.get(action.unitId!);
    if (!unit || !action.targetTile) return false;

    const targetKey: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const targetTile = this.state.tiles.get(targetKey);
    if (!targetTile || targetTile.impassable) return false;

    // Calculate move cost
    const distance = Math.abs(unit.position.x - action.targetTile.x) +
                    Math.abs(unit.position.y - action.targetTile.y);
    const moveCost = distance * targetTile.moveCost;

    if (unit.movePoints < moveCost) return false;

    // Execute move
    unit.position = action.targetTile;
    unit.movePoints -= moveCost;

    // Reveal tiles around new position
    this.fogSystem.revealTilesAroundUnit(this.state, unit);

    return true;
  }

  private executeFortify(action: GameAction): boolean {
    if (!action.targetTile) return false;
    const key: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const tile = this.state.tiles.get(key);
    const player = this.state.players.get(this.state.currentPlayer);

    if (!tile || !player || tile.owner !== player.owner) return false;
    if (tile.stability >= this.config.stabilityCap) return false;

    // Apply fortify
    tile.stability = Math.min(tile.stability + 2, this.config.stabilityCap);
    player.divinity -= action.cost?.divinity || 0;

    return true;
  }

  private executePurify(action: GameAction): boolean {
    if (!action.targetTile) return false;
    const key: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const tile = this.state.tiles.get(key);
    const player = this.state.players.get(this.state.currentPlayer);

    if (!tile || !player || tile.corruption === 0) return false;

    // Apply purify
    tile.corruption = Math.max(0, tile.corruption - 1);
    if (tile.corruption === 0 && tile.owner === Owner.Shadow) {
      tile.owner = Owner.Neutral;
    }
    tile.stability = Math.min(tile.stability + 1, this.config.stabilityCap);
    player.divinity -= action.cost?.divinity || 0;

    return true;
  }

  private executeBuildShrine(action: GameAction): boolean {
    if (!action.targetTile) return false;
    const key: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const tile = this.state.tiles.get(key);
    const player = this.state.players.get(this.state.currentPlayer);

    if (!tile || !player || tile.owner !== player.owner || tile.hasShrine) return false;

    // Build shrine
    tile.hasShrine = true;
    tile.divinityYield += 2;
    tile.faithYield += 1;
    player.divinity -= action.cost?.divinity || 0;

    return true;
  }

  private executeSanctify(action: GameAction): boolean {
    if (!action.targetTile) return false;
    const key: TileKey = `${action.targetTile.x},${action.targetTile.y}`;
    const tile = this.state.tiles.get(key);
    const player = this.state.players.get(this.state.currentPlayer);

    if (!tile || !player || tile.owner !== player.owner || tile.sanctified) return false;

    // Sanctify tile
    tile.sanctified = true;
    tile.domainAttunement = player.domain;
    tile.divinityYield += 1;
    tile.stability = Math.min(tile.stability + 1, this.config.stabilityCap);
    tile.corruption = 0; // Remove all corruption

    player.sanctifiedTiles.add(key);
    player.sanctifiedThisTurn++;
    player.divinity -= action.cost?.divinity || 0;

    return true;
  }

  private executeSummonUnit(action: GameAction): boolean {
    // Implementation for summoning units
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player || !action.targetTile) return false;

    // Create unit based on type
    // ... unit creation logic

    player.divinity -= action.cost?.divinity || 0;
    return true;
  }

  private executeAbility(action: GameAction): boolean {
    // Implementation for domain abilities
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player || !action.abilityId) return false;

    // Execute ability based on domain and ability ID
    // ... ability execution logic

    return true;
  }

  private executeMiracle(action: GameAction): boolean {
    // Implementation for miracles
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player || !action.miracleId) return false;

    const miracle = player.miracles.find(m => m.id === action.miracleId);
    if (!miracle || miracle.isUsed) return false;

    // Execute miracle effects
    // ... miracle execution logic

    miracle.isUsed = true;
    player.faith -= action.cost?.faith || 0;
    return true;
  }

  private startTurn(): void {
    this.state.turn++;
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player) return;

    // Apply turn start effects
    this.turnSystem.startTurn(this.state, player);

    // Apply global events
    this.eventSystem.processEvents(this.state);

    // Shadow spread
    if (this.state.currentPlayer === Owner.Player) {
      this.shadowSystem.spreadShadow(this.state);
    }

    // Update resources
    this.resourceSystem.updateResources(this.state, player);

    // Update fog of war
    this.fogSystem.updateVisibility(this.state);

    // Reset turn counters
    player.capturedThisTurn = 0;
    player.sanctifiedThisTurn = 0;

    // Refresh units
    player.units.forEach(unit => {
      unit.movePoints = unit.maxMovePoints;
      unit.turnsAlive++;
    });

    // Execute AI turn if needed
    if (player.isAI) {
      setTimeout(() => {
        this.aiController.executeTurn(this.state, player);
        this.endTurn();
      }, 1000);
    }
  }

  private endTurn(): boolean {
    const player = this.state.players.get(this.state.currentPlayer);
    if (!player) return false;

    // Convert remaining divinity to aegis
    player.aegis = Math.floor(player.divinity / 2);
    player.divinity = 0;

    // Apply end turn effects
    this.turnSystem.endTurn(this.state, player);

    // Check for encircle captures (if rule enabled)
    if (this.state.encircleRule) {
      this.checkEncircleCaptures();
    }

    // Move to next player
    const players = Array.from(this.state.players.keys());
    const currentIndex = players.indexOf(this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    this.state.currentPlayer = players[nextIndex];

    // Start next turn
    this.startTurn();

    return true;
  }

  private checkEncircleCaptures(): void {
    // Go-style encircle rule implementation
    // Check for closed loops around enemy tiles
    // ... encircle logic
  }

  // Event system
  public addEventListener(event: string, callback: (state: GameState) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public removeEventListener(event: string, callback: (state: GameState) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.get('stateChange')?.forEach(callback => callback(this.state));
  }

  // Getters
  public getState(): GameState {
    return this.state;
  }

  public getConfig(): GameConfig {
    return this.config;
  }

  public getActionHistory(): GameAction[] {
    return this.actionHistory;
  }

  // Save/Load
  public exportState(): string {
    return JSON.stringify({
      state: this.state,
      config: this.config,
      actionHistory: this.actionHistory,
    }, (key, value) => {
      if (value instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(value.entries()),
        };
      } else if (value instanceof Set) {
        return {
          dataType: 'Set',
          value: Array.from(value),
        };
      }
      return value;
    });
  }

  public importState(data: string): void {
    const parsed = JSON.parse(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
          return new Map(value.value);
        } else if (value.dataType === 'Set') {
          return new Set(value.value);
        }
      }
      return value;
    });

    this.state = parsed.state;
    this.config = parsed.config;
    this.actionHistory = parsed.actionHistory;

    this.notifyListeners();
  }
}
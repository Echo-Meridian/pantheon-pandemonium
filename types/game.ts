// Core game type definitions matching the design document

export enum TileVisibility {
  Hidden = 'hidden',
  Seen = 'seen',
  Visible = 'visible',
}

export enum Owner {
  Neutral = 'neutral',
  Player = 'player',
  AI1 = 'ai1',
  AI2 = 'ai2',
  AI3 = 'ai3',
  Shadow = 'shadow',
}

export enum ActionType {
  Explore = 'explore',
  Move = 'move',
  Capture = 'capture',
  ManageFortify = 'manage_fortify',
  ManagePurify = 'manage_purify',
  ManageBuildShrine = 'manage_build_shrine',
  ManageRepair = 'manage_repair',
  Sanctify = 'sanctify',
  SummonUnit = 'summon_unit',
  UseAbility = 'use_ability',
  UseMiracle = 'use_miracle',
  EndTurn = 'end_turn',
}

export enum DomainType {
  Fire = 'fire',
  Water = 'water',
  Earth = 'earth',
  Air = 'air',
  Life = 'life',
  Death = 'death',
  Order = 'order',
  Chaos = 'chaos',
}

export enum TileType {
  Plains = 'plains',
  Forest = 'forest',
  Swamp = 'swamp',
  Hills = 'hills',
  Desert = 'desert',
  Mountain = 'mountain',
  Coast = 'coast',
  Water = 'water',
  SacredWell = 'sacred_well',
  Village = 'village',
  AncientRuins = 'ancient_ruins',
  Volcano = 'volcano',
  SnowPeak = 'snow_peak',
}

export enum UnitType {
  Explorer = 'explorer',
  Warden = 'warden',
  Cultivator = 'cultivator',
  Herald = 'herald',
  Guardian = 'guardian',
  ElementalAvatar = 'elemental_avatar',
  Shadowborn = 'shadowborn',
  Wight = 'wight', // Spawned by Death domain
}

export enum GamePhase {
  Setup = 'setup',
  Playing = 'playing',
  Victory = 'victory',
  Defeat = 'defeat',
}

export enum VictoryCondition {
  Conquest = 'conquest',      // Control 75% of revealed map
  Sanctifier = 'sanctifier',   // Sanctify N holy sites
  ShadowAccord = 'shadow_accord', // Convert Shadow alignment to your side
  RelicAscension = 'relic_ascension', // Assemble 3 unique relics
}

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  position: Position;
  type: TileType;
  owner: Owner;
  stability: number; // 0-10
  corruption: number; // 0-2
  sanctified: boolean;
  domainAttunement?: DomainType;
  visibility: TileVisibility;
  hasShrine: boolean;
  hasFortification: boolean;
  eventTriggered: boolean;

  // Resource yields
  divinityYield: number;
  faithYield: number;

  // Movement
  moveCost: number;
  impassable: boolean;
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: Owner;
  position: Position;
  movePoints: number;
  maxMovePoints: number;
  perception: number;
  abilities: string[];
  cooldowns: Map<string, number>;
  turnsAlive: number;
}

export interface DomainPassive {
  id: string;
  name: string;
  description: string;
  modifiers: GameModifier[];
}

export interface DomainPower {
  id: string;
  name: string;
  description: string;
  cost: ResourceCost;
  cooldown: number;
  targetType: 'tile' | 'unit' | 'area' | 'global';
  areaSize?: number;
  effects: GameEffect[];
}

export interface Domain {
  type: DomainType;
  name: string;
  description: string;
  color: string;
  passive: DomainPassive;
  minorPower: DomainPower;
  majorRite: DomainPower;
}

export interface ResourceCost {
  divinity?: number;
  faith?: number;
  shadowEnergy?: number;
}

export interface GameModifier {
  type: 'capture_cost' | 'move_cost' | 'stability' | 'divinity_income' |
        'faith_income' | 'perception' | 'shadow_resistance' | 'sanctify_cost';
  value: number;
  condition?: string; // e.g., "on_desert", "adjacent_to_mountain"
  tags?: string[];
}

export interface GameEffect {
  type: 'damage_stability' | 'add_corruption' | 'remove_corruption' |
        'grant_divinity' | 'grant_faith' | 'spawn_unit' | 'teleport' |
        'change_terrain' | 'add_mist' | 'remove_mist' | 'prevent_movement';
  value?: number;
  duration?: number;
  targetTags?: string[];
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'mythic';
  passive?: GameModifier[];
  active?: DomainPower;
  isConsumed: boolean;
}

export interface Miracle {
  id: string;
  name: string;
  description: string;
  cost: ResourceCost;
  effects: GameEffect[];
  isUsed: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  owner: Owner;
  domain: DomainType;
  isAI: boolean;

  // Resources
  divinity: number;
  faith: number;
  shadowEnergy: number;
  aegis: number;

  // Collections
  units: Unit[];
  ownedTiles: Set<string>;
  sanctifiedTiles: Set<string>;
  relics: Relic[];
  miracles: Miracle[];

  // Progress tracking
  victoryProgress: Map<VictoryCondition, number>;
  capturedThisTurn: number;
  sanctifiedThisTurn: number;

  // AI personality (if AI)
  aiPersonality?: 'aggressive' | 'defensive' | 'balanced' | 'opportunist';
}

export interface GlobalEvent {
  id: string;
  name: string;
  description: string;
  triggerTurn?: number;
  triggerCondition?: string;
  effects: GameEffect[];
  duration: number;
  isActive: boolean;
}

export interface GameState {
  id: string;
  turn: number;
  phase: GamePhase;
  currentPlayer: Owner;
  players: Map<Owner, PlayerState>;
  tiles: Map<string, Tile>;
  units: Map<string, Unit>;

  // Global state
  shadowInfluence: number; // 0-100
  shadowAlignmentMeter: Map<Owner, number>; // Track each player's Shadow alignment
  neutralFactionAlignment: 'hostile' | 'neutral' | 'friendly';
  activeGlobalEvents: GlobalEvent[];

  // Victory conditions
  victoryConditions: Set<VictoryCondition>;
  victoryThresholds: Map<VictoryCondition, number>;

  // Map generation
  mapSeed: string;
  mapSize: { width: number; height: number };
  revealedTiles: Set<string>;

  // Settings
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  shadowAggression: 'low' | 'normal' | 'high';
  tileRichness: 'low' | 'normal' | 'high';
  encircleRule: boolean;
  relicFrequency: 'low' | 'normal' | 'high';
}

export interface GameAction {
  id: string;
  type: ActionType;
  playerId: string;
  timestamp: number;

  // Action-specific data
  targetTile?: Position;
  targetUnit?: string;
  unitId?: string;
  abilityId?: string;
  miracleId?: string;

  // Cost paid
  cost?: ResourceCost;

  // Result
  success: boolean;
  message?: string;
}

export interface GameConfig {
  baseDivinity: number;
  captureBaseCost: number;
  sanctifyBaseCost: number;
  manageCosts: {
    fortify: number;
    purify: number;
    buildShrine: number;
    repair: number;
  };
  stabilityCap: number;
  shadowSpread: {
    base: number;
    perCorruptedNeighbor: number;
    perSanctifiedNeighbor: number;
    wardenAdjacent: number;
    orderOwner: number;
    min: number;
    max: number;
  };
  victoryThresholds: {
    conquest: number; // percentage
    sanctifySites: number;
    shadowAccord: number;
    relicCount: number;
  };
}

// Utility type for tile coordinate string
export type TileKey = `${number},${number}`;
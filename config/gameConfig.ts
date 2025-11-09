import { GameConfig } from '@/types/game';

export const defaultGameConfig: GameConfig = {
  // Resources
  baseDivinity: 6,

  // Action costs
  captureBaseCost: 4,
  sanctifyBaseCost: 6,
  manageCosts: {
    fortify: 3,
    purify: 3,
    buildShrine: 5,
    repair: 3,
  },

  // Limits
  stabilityCap: 10,

  // Shadow spread mechanics
  shadowSpread: {
    base: 0.10,
    perCorruptedNeighbor: 0.05,
    perSanctifiedNeighbor: -0.03,
    wardenAdjacent: -0.05,
    orderOwner: -0.25,
    min: 0.02,
    max: 0.60,
  },

  // Victory conditions
  victoryThresholds: {
    conquest: 0.75, // 75% of map
    sanctifySites: 6, // Number of holy sites
    shadowAccord: 100, // Shadow alignment points
    relicCount: 3, // Number of unique relics
  },
};

// Difficulty presets
export const difficultyPresets = {
  easy: {
    baseDivinity: 8,
    captureBaseCost: 3,
    shadowSpread: {
      ...defaultGameConfig.shadowSpread,
      base: 0.05,
      max: 0.40,
    },
  },
  normal: defaultGameConfig,
  hard: {
    baseDivinity: 5,
    captureBaseCost: 5,
    shadowSpread: {
      ...defaultGameConfig.shadowSpread,
      base: 0.15,
      max: 0.70,
    },
  },
  extreme: {
    baseDivinity: 4,
    captureBaseCost: 6,
    shadowSpread: {
      ...defaultGameConfig.shadowSpread,
      base: 0.20,
      min: 0.05,
      max: 0.80,
    },
  },
};

// Map size presets
export const mapSizePresets = {
  small: { width: 20, height: 20 },
  medium: { width: 40, height: 40 },
  large: { width: 60, height: 60 },
  huge: { width: 80, height: 80 },
};

// AI personality presets
export const aiPersonalityPresets = {
  aggressive: {
    weights: {
      capture: 0.4,
      sanctify: 0.1,
      fortify: 0.1,
      expand: 0.3,
      defend: 0.1,
    },
  },
  defensive: {
    weights: {
      capture: 0.1,
      sanctify: 0.2,
      fortify: 0.4,
      expand: 0.1,
      defend: 0.2,
    },
  },
  balanced: {
    weights: {
      capture: 0.2,
      sanctify: 0.2,
      fortify: 0.2,
      expand: 0.2,
      defend: 0.2,
    },
  },
  opportunist: {
    weights: {
      capture: 0.3,
      sanctify: 0.3,
      fortify: 0.05,
      expand: 0.25,
      defend: 0.1,
    },
  },
};

// Balance constants
export const BALANCE = {
  // Movement
  BASE_MOVE_POINTS: 3,
  MAX_MOVE_POINTS: 5,

  // Perception
  BASE_PERCEPTION: 1,
  MAX_PERCEPTION: 3,

  // Resources
  MAX_DIVINITY_PER_TURN: 20,
  MAX_FAITH_PER_TURN: 10,
  MAX_SHADOW_ENERGY: 10,
  AEGIS_CONVERSION_RATE: 0.5,

  // Tiles
  MIN_STABILITY: 0,
  MAX_STABILITY: 10,
  MIN_CORRUPTION: 0,
  MAX_CORRUPTION: 2,

  // Combat
  BASE_UNIT_HEALTH: 3,
  BASE_UNIT_DEFENSE: 1,

  // Cooldowns
  MINOR_POWER_COOLDOWN: 0,
  MAJOR_RITE_MIN_COOLDOWN: 3,
  MAJOR_RITE_MAX_COOLDOWN: 5,

  // Economy
  SHRINE_DIVINITY_YIELD: 2,
  SHRINE_FAITH_YIELD: 1,
  SACRED_WELL_DIVINITY_YIELD: 3,
  VILLAGE_FAITH_YIELD: 1,

  // Encircle rule
  MAX_ENCIRCLE_AREA: 25, // Maximum tiles that can be captured via encircle

  // Shadow
  SHADOW_INFLUENCE_PER_TILE: 1,
  SHADOW_ALIGNMENT_PER_ACTION: 5,

  // Events
  EVENT_CHANCE_PER_TURN: 0.15,
  MAX_ACTIVE_EVENTS: 3,

  // Miracles
  MIRACLE_MIN_FAITH_COST: 3,
  MIRACLE_MAX_FAITH_COST: 10,

  // Relics
  RELIC_COMMON_WEIGHT: 70,
  RELIC_RARE_WEIGHT: 25,
  RELIC_MYTHIC_WEIGHT: 5,
};
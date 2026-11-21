// Global simulation and architectural constants for HEATWAVE: Coral Vista

export const WORLD_SEED = 19861121;

export const WORLD = {
  SIZE: 500,
  HALF_SIZE: 250,
  OCEAN_X: -160,
  BEACH_X: -110,
  AVENUE_X: -85,
  ROAD_WIDTH: 18,
  SIDEWALK_WIDTH: 4,
  BLOCK_SIZE: 64,
  SEA_LEVEL: 0,
};

export const DISTRICTS = {
  BEACH: 'Ocean Beach & Boardwalk',
  DOWNTOWN: 'Coral Vista Downtown',
  RESIDENTIAL: 'Flamingo Palms',
  PORT: 'Port of Coral Vista',
  BRIDGE: 'Vista Causeway',
};

export const COLORS = {
  SKY_ZENITH: 0x2b1046,
  SKY_HORIZON: 0xf37140,
  FOG: 0xeb6b42,
  SUN: 0xffa450,
  SUN_AMBIENT: 0x934a62,
  WATER: 0x14526b,
  SAND: 0xdfb479,
  ASPHALT: 0x282a2e,
  CONCRETE: 0x8a8885,
  CURB: 0xa8a59f,
  PALM_WOOD: 0x5a3e2a,
  PALM_LEAF: 0x2d6832,
  CONTAINER_COLORS: [0xd32f2f, 0x1976d2, 0x388e3c, 0xfbc02d, 0xe65100, 0x7b1fa2],
};

export const PHYSICS = {
  GRAVITY: 26.0,
  PLAYER_WALK_SPEED: 4.8,
  PLAYER_RUN_SPEED: 10.5,
  PLAYER_JUMP_SPEED: 8.8,
  PLAYER_ACCEL: 45.0,
  PLAYER_TURN_SPEED: 14.0,
  PLAYER_RADIUS: 0.45,
  PLAYER_HEIGHT: 1.82,
};

// Global simulation and architectural constants for HEATWAVE: Coral Vista

export const WORLD_SEED = 19861121;

export const WORLD = {
  SIZE: 500,
  HALF_SIZE: 250,
  OCEAN_X: -160,
  BEACH_X: -110,
  AVENUE_X: -85,
  ROAD_WIDTH: 18,
  SIDEWALK_WIDTH: 5,
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
  SKY_ZENITH: 0x3d91d0,
  SKY_HORIZON: 0xffb592,
  FOG: 0xffd5bf,
  SUN: 0xfff6e0,
  SUN_AMBIENT: 0xfce2cc,
  WATER: 0x009cb0,
  SAND: 0xfce4b8,
  ASPHALT: 0x36383e,
  SIDEWALK: 0xdfd9ce,
  CURB: 0xb5afa4,
  PALM_WOOD: 0x8d6e63,
  PALM_LEAF: 0x338a3e,
  ART_DECO: [
    0xf8bbd0, // Soft pastel pink
    0xc8e6c9, // Mint pastel green
    0xfff9c4, // Warm pastel cream
    0xb2ebf2, // Pool turquoise
    0xffccbc, // Coral peach
    0xf5f5f5, // Crisp deco white
    0xd1c4e9, // Lavender pastel
  ],
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

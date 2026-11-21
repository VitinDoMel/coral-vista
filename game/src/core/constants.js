// Constants and Game Configuration for HEATWAVE: Coral Vista
// Strict adherence to original names (CVPD, Seabreeze Boulevard, Rafa Sol, Nina Vega)

export const CITY_BOUNDS = {
  minX: -360,
  maxX: 360,
  minZ: -360,
  maxZ: 360,
  seaZ: 280,
  beachZ: 240,
  seabreezeZ: 200
};

export const DISTRICTS = {
  DOWNTOWN: 'Downtown',
  SEABREEZE: 'Seabreeze Boulevard & Beach',
  FLAMINGO: 'Flamingo Palms',
  PORT: 'Port of Coral Vista',
  CAUSEWAY: 'Vista Causeway Bridge'
};

export const PALETTE = {
  skyTop: 0x4aa3e0,
  skyMid: 0x9fd3f0,
  skyHorizon: 0xffd3a8,
  skyBand: 0xff9fa0,
  sun: 0xfff4d0,
  fog: 0xffd9b8,
  hemiSky: 0xbfe3ff,
  hemiGround: 0xe8c99a,
  asphalt: 0x5a5d63,
  sidewalk: 0xcfc8bb,
  curb: 0xe6e1d8,
  sand: 0xf3dfb0,
  seaShallow: 0x1fb5c9,
  seaDeep: 0x0e7fa6,
  buildings: [
    0xf4a7b9, // pastel pink art-deco
    0x9be3c9, // mint green
    0xfbe7b2, // warm cream
    0x8fd3f5, // pool blue
    0xffffff, // crisp white
    0xf7c59f  // soft apricot
  ],
  containers: [
    0x2c699a,
    0xd9534f,
    0xf0ad4e,
    0x20b2aa,
    0x5bc0de
  ],
  policeLightBlue: 0x0088ff,
  policeLightRed: 0xff2222
};

export const CAMERA = {
  foot: {
    distance: 7.0,
    height: 3.0,
    pitch: 0.12,
    fov: 65
  },
  vehicle: {
    distance: 9.5,
    height: 3.6,
    pitch: 0.15,
    fov: 70
  }
};

export const PLAYER_PHYSICS = {
  walkSpeed: 5.5,
  sprintSpeed: 11.0,
  jumpSpeed: 7.8,
  gravity: 22.0,
  radius: 0.45,
  height: 1.8
};

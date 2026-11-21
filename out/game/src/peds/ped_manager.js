// Pedestrian spawner and crowd management across Coral Vista sidewalks

import { Pedestrian } from './pedestrian.js';
import { createRNG } from '../core/math.js';
import { WORLD } from '../core/constants.js';

export class PedestrianManager {
  constructor(scene, collisions, seed = 88) {
    this.scene = scene;
    this.collisions = collisions;
    this.rng = createRNG(seed);
    this.pedestrians = [];
    this.maxPeds = 24;

    this.palettes = [
      { shirtColor: 0xe91e63, pantsColor: 0x2c3e50, skinTone: 0xd7996c, hairColor: 0x111111 }, // Coral pink
      { shirtColor: 0x00bcd4, pantsColor: 0xecf0f1, skinTone: 0x8d5524, hairColor: 0x2c1b18 }, // Turquoise
      { shirtColor: 0xffeb3b, pantsColor: 0x3f51b5, skinTone: 0xc68642, hairColor: 0x4a2c11 }, // Sunny yellow
      { shirtColor: 0x4caf50, pantsColor: 0x607d8b, skinTone: 0xe0ac69, hairColor: 0x000000 }, // Palm green
      { shirtColor: 0xff9800, pantsColor: 0x212121, skinTone: 0xf1c27d, hairColor: 0x332211 }, // Sunset orange
      { shirtColor: 0xffffff, pantsColor: 0x9c27b0, skinTone: 0x5a3825, hairColor: 0x1a1a1a }, // White linen
    ];

    // Sidewalk zones: [x, zMin, zMax, yaw]
    this.walkways = [
      { x: WORLD.AVENUE_X - 11, zMin: -200, zMax: 200, yaw: 0 },
      { x: WORLD.AVENUE_X + 11, zMin: -200, zMax: 200, yaw: Math.PI },
      { x: -98, zMin: -200, zMax: 200, yaw: 0 }, // Beach Boardwalk
      { x: -40 - 11, zMin: -180, zMax: 180, yaw: 0 },
      { x: 10 - 11,  zMin: -180, zMax: 180, yaw: Math.PI },
      { x: 60 - 11,  zMin: -180, zMax: 180, yaw: 0 },
    ];

    this.initPool();
  }

  initPool() {
    for (let i = 0; i < this.maxPeds; i++) {
      const palette = this.rng.choice(this.palettes);
      const ped = new Pedestrian(this.scene, this.collisions, palette, i);

      const walkway = this.rng.choice(this.walkways);
      const z = this.rng.range(walkway.zMin, walkway.zMax);
      const yaw = this.rng.chance(0.5) ? walkway.yaw : (walkway.yaw + Math.PI);

      ped.spawn(walkway.x + this.rng.range(-0.8, 0.8), z, yaw);
      this.pedestrians.push(ped);
    }
  }

  update(delta, playerPos) {
    for (const ped of this.pedestrians) {
      const dist = Math.hypot(ped.position.x - playerPos.x, ped.position.z - playerPos.z);

      // Despawn/wrap when distant
      if (dist > 140) {
        const walkway = this.rng.choice(this.walkways);
        const z = playerPos.z + this.rng.range(-80, 80);
        const yaw = this.rng.chance(0.5) ? walkway.yaw : (walkway.yaw + Math.PI);
        ped.spawn(walkway.x + this.rng.range(-0.8, 0.8), z, yaw);
        continue;
      }

      ped.update(delta, playerPos);

      // Wrap pedestrians reaching boundaries
      if (ped.position.z > 210) ped.position.z = -210;
      if (ped.position.z < -210) ped.position.z = 210;
    }
  }

  alertGunshot(originX, originZ, radius = 35) {
    for (const ped of this.pedestrians) {
      const d = Math.hypot(ped.position.x - originX, ped.position.z - originZ);
      if (d < radius) {
        ped.fleeFrom(originX, originZ);
      }
    }
  }
}

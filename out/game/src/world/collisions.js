// Spatial partition and AABB collision detection

import { distance2D } from '../core/math.js';

export class CollisionSystem {
  constructor() {
    this.boxes = [];
    this.cellSize = 32;
    this.grid = new Map();
  }

  getKey(cx, cz) {
    return `${cx},${cz}`;
  }

  addBox(minX, minY, minZ, maxX, maxY, maxZ, tag = 'solid') {
    const box = { minX, minY, minZ, maxX, maxY, maxZ, tag };
    this.boxes.push(box);

    const minCx = Math.floor(minX / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const minCz = Math.floor(minZ / this.cellSize);
    const maxCz = Math.floor(maxZ / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const k = this.getKey(cx, cz);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(box);
      }
    }
    return box;
  }

  getNearbyBoxes(x, z, margin = 2) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const result = [];
    const seen = new Set();

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const k = this.getKey(cx + dx, cz + dz);
        const cell = this.grid.get(k);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const b = cell[i];
            if (!seen.has(b)) {
              seen.add(b);
              result.push(b);
            }
          }
        }
      }
    }
    return result;
  }

  resolveCircle(x, z, radius, y = 1.0) {
    const boxes = this.getNearbyBoxes(x, z);
    let resolvedX = x;
    let resolvedZ = z;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (y < b.minY || y > b.maxY) continue;

      const closestX = Math.max(b.minX, Math.min(b.maxX, resolvedX));
      const closestZ = Math.max(b.minZ, Math.min(b.maxZ, resolvedZ));

      const dx = resolvedX - closestX;
      const dz = resolvedZ - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = radius - dist;
          resolvedX += (dx / dist) * push;
          resolvedZ += (dz / dist) * push;
        } else {
          resolvedX += radius;
        }
      }
    }

    return { x: resolvedX, z: resolvedZ };
  }

  getGroundHeight(x, z) {
    // West beach slope down to ocean
    if (x < -140) return -1.5;
    if (x < -110) {
      const t = (x - (-140)) / 30;
      return -1.5 + t * 1.5; // Slope to 0
    }
    // Causeway bridge ramp up
    if (z < -130 && Math.abs(x - (-20)) < 16) {
      const t = Math.min(1.0, (-130 - z) / 40);
      return t * 14.0;
    }
    return 0.0;
  }
}

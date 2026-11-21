import * as THREE from 'three';

// Spatial Hash & Bounding Box Collisions

export class CollisionSystem {
  constructor(cellSize = 32) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.colliders = [];
  }

  _hash(cx, cz) {
    return `${cx},${cz}`;
  }

  addCollider(box) {
    // box: { minX, maxX, minZ, maxZ, minY, maxY, type }
    this.colliders.push(box);
    const minCx = Math.floor(box.minX / this.cellSize);
    const maxCx = Math.floor(box.maxX / this.cellSize);
    const minCz = Math.floor(box.minZ / this.cellSize);
    const maxCz = Math.floor(box.maxZ / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = this._hash(cx, cz);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(box);
      }
    }
  }

  getNearby(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const res = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = this.grid.get(this._hash(cx + dx, cz + dz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            if (!res.includes(list[i])) res.push(list[i]);
          }
        }
      }
    }
    return res;
  }

  resolveCircle(x, z, radius) {
    const nearby = this.getNearby(x, z);
    let resolvedX = x;
    let resolvedZ = z;
    let hit = false;

    for (let i = 0; i < nearby.length; i++) {
      const b = nearby[i];
      // Nearest point on AABB to circle center
      const nx = Math.max(b.minX, Math.min(resolvedX, b.maxX));
      const nz = Math.max(b.minZ, Math.min(resolvedZ, b.maxZ));

      const dx = resolvedX - nx;
      const dz = resolvedZ - nz;
      const dSq = dx * dx + dz * dz;

      if (dSq < radius * radius && dSq > 0.00001) {
        hit = true;
        const d = Math.sqrt(dSq);
        const push = radius - d;
        resolvedX += (dx / d) * push;
        resolvedZ += (dz / d) * push;
      } else if (dSq <= 0.00001) {
        // Center is inside box - push out along closest edge
        hit = true;
        const left = resolvedX - b.minX;
        const right = b.maxX - resolvedX;
        const front = resolvedZ - b.minZ;
        const back = b.maxZ - resolvedZ;
        const minEdge = Math.min(left, right, front, back);

        if (minEdge === left) resolvedX = b.minX - radius;
        else if (minEdge === right) resolvedX = b.maxX + radius;
        else if (minEdge === front) resolvedZ = b.minZ - radius;
        else resolvedZ = b.maxZ + radius;
      }
    }

    return { x: resolvedX, z: resolvedZ, collided: hit };
  }

  raycast(ox, oz, dx, dz, maxDist) {
    // 2D raycast for camera obstruction
    let bestDist = maxDist;
    const nearby = this.getNearby(ox, oz);

    for (let i = 0; i < nearby.length; i++) {
      const b = nearby[i];
      // AABB ray slab test
      let tmin = -Infinity;
      let tmax = Infinity;

      if (Math.abs(dx) > 0.0001) {
        const t1 = (b.minX - ox) / dx;
        const t2 = (b.maxX - ox) / dx;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      } else if (ox < b.minX || ox > b.maxX) {
        continue;
      }

      if (Math.abs(dz) > 0.0001) {
        const t1 = (b.minZ - oz) / dz;
        const t2 = (b.maxZ - oz) / dz;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      } else if (oz < b.minZ || oz > b.maxZ) {
        continue;
      }

      if (tmax >= tmin && tmin >= 0 && tmin < bestDist) {
        bestDist = tmin;
      }
    }

    return bestDist;
  }
}

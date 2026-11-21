import * as THREE from 'three';

export class CollisionWorld {
  constructor() {
    this.colliders = [];
    this.elevatedSurfaces = [];
    this.worldBounds = {
      minX: -235,
      maxX: 355,
      minZ: -265,
      maxZ: 295
    };
    // Coastline water boundary (except when on bridge deck or port pier)
    this.oceanStartX = 198;
  }

  addBoxCollider(minX, maxX, minZ, maxZ, maxY = 20, tag = 'building') {
    this.colliders.push({
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      maxY,
      tag
    });
  }

  addBoxFromCenter(cx, cz, width, depth, maxY = 20, tag = 'building') {
    const hw = width * 0.5;
    const hd = depth * 0.5;
    this.addBoxCollider(cx - hw, cx + hw, cz - hd, cz + hd, maxY, tag);
  }

  addElevatedSurface(minX, maxX, minZ, maxZ, heightFn) {
    this.elevatedSurfaces.push({
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      heightFn
    });
  }

  getGroundHeightAt(x, z) {
    let groundY = 0;
    for (let i = 0; i < this.elevatedSurfaces.length; i++) {
      const s = this.elevatedSurfaces[i];
      if (x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ) {
        const h = s.heightFn(x, z);
        if (h > groundY) groundY = h;
      }
    }
    return groundY;
  }

  isOverDrySurface(x, z) {
    // Bridge corridor at z = -150 (width 18 -> z in [-159, -141], x up to 345)
    if (z >= -186 && z <= -114 && x >= 120 && x <= 345) {
      if (x <= 290) {
        return z >= -158.5 && z <= -141.5;
      }
      return true;
    }
    // Port dock pier in south (x in [-190, 60], z up to 285)
    if (x >= -190 && x <= 60 && z >= 225 && z <= 285) {
      return true;
    }
    return x < this.oceanStartX && z <= 245 && z >= -245;
  }

  resolveCircleAABB(position, radius = 0.45) {
    let x = position.x;
    let z = position.z;
    const y = position.y;

    // World boundary clamp
    x = Math.max(this.worldBounds.minX, Math.min(this.worldBounds.maxX, x));
    z = Math.max(this.worldBounds.minZ, Math.min(this.worldBounds.maxZ, z));

    // Prevent walking into deep ocean when not on bridge or island
    if (!this.isOverDrySurface(x, z)) {
      if (x >= this.oceanStartX && (z < -158.5 || z > -141.5)) {
        x = Math.min(x, this.oceanStartX - 0.1);
      }
      if (z > 245 && (x < -190 || x > 60)) {
        z = 245;
      }
      if (z < -245) {
        z = -245;
      }
    }

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.colliders.length; i++) {
        const box = this.colliders[i];
        if (y >= box.maxY) continue;

        const closestX = Math.max(box.minX, Math.min(x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          if (distSq > 1e-6) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            x += (dx / dist) * overlap;
            z += (dz / dist) * overlap;
          } else {
            // Inside box: push out along shallowest axis
            const leftPen = Math.abs(x - box.minX);
            const rightPen = Math.abs(box.maxX - x);
            const topPen = Math.abs(z - box.minZ);
            const bottomPen = Math.abs(box.maxZ - z);
            const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

            if (minPen === leftPen) x = box.minX - radius;
            else if (minPen === rightPen) x = box.maxX + radius;
            else if (minPen === topPen) z = box.minZ - radius;
            else z = box.maxZ + radius;
          }
        }
      }
    }

    position.x = x;
    position.z = z;
    return position;
  }

  clipSegment(start, end, padding = 0.3) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    if (length < 1e-4) return end.clone();

    let minT = 1.0;

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];
      if (box.tag === 'low_prop') continue;
      if (start.y > box.maxY && end.y > box.maxY) continue;

      const minX = box.minX - padding;
      const maxX = box.maxX + padding;
      const minZ = box.minZ - padding;
      const maxZ = box.maxZ + padding;
      const maxY = box.maxY + padding;

      let tmin = 0.0;
      let tmax = 1.0;

      // X slab
      if (Math.abs(dir.x) < 1e-6) {
        if (start.x < minX || start.x > maxX) continue;
      } else {
        let tx1 = (minX - start.x) / dir.x;
        let tx2 = (maxX - start.x) / dir.x;
        if (tx1 > tx2) { const tmp = tx1; tx1 = tx2; tx2 = tmp; }
        tmin = Math.max(tmin, tx1);
        tmax = Math.min(tmax, tx2);
        if (tmin > tmax) continue;
      }

      // Z slab
      if (Math.abs(dir.z) < 1e-6) {
        if (start.z < minZ || start.z > maxZ) continue;
      } else {
        let tz1 = (minZ - start.z) / dir.z;
        let tz2 = (maxZ - start.z) / dir.z;
        if (tz1 > tz2) { const tmp = tz1; tz1 = tz2; tz2 = tmp; }
        tmin = Math.max(tmin, tz1);
        tmax = Math.min(tmax, tz2);
        if (tmin > tmax) continue;
      }

      // Y check at intersection
      const hitY = start.y + dir.y * tmin;
      if (hitY <= maxY && tmin > 0.05 && tmin < minT) {
        minT = tmin;
      }
    }

    if (minT < 1.0) {
      return new THREE.Vector3().copy(start).addScaledVector(dir, Math.max(0.15, minT - 0.04));
    }
    return end.clone();
  }
}

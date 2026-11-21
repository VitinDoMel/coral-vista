import * as THREE from 'three';
import { VEHICLE_MODELS, Vehicle } from '../vehicles/vehicle.js';
import { X_ROADS, Z_ROADS, HALF_ROAD } from '../world/city.js';
import { createSeededRng } from '../engine/rng.js';

export class TrafficManager {
  constructor(scene, collisionWorld, seed = 1) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
    this.rng = createSeededRng(seed + 202);

    this.entries = [];
    this.signalTimer = 0;
    this.nsGreen = true; // Alternates intersection right-of-way every 9 seconds

    this._spawnInitialTraffic();
  }

  _spawnInitialTraffic() {
    // Right-hand lane offset from road center = +3.8m in travel direction
    // For Northbound (-Z, dirZ=-1, heading=0): right side is +X (+3.8)
    // For Southbound (+Z, dirZ=+1, heading=PI): right side is -X (-3.8)
    // For Eastbound (+X, dirX=+1, heading=-PI/2): right side is +Z (+3.8)
    // For Westbound (-X, dirX=-1, heading=+PI/2): right side is -Z (-3.8)
    const laneConfigs = [
      // Seabreeze Boulevard (x = 120) busy coastal traffic
      { axis: 'z', roadCoord: 120, dir: -1, posCoord: 62, modelIdx: 1 },
      { axis: 'z', roadCoord: 120, dir: -1, posCoord: -32, modelIdx: 0 },
      { axis: 'z', roadCoord: 120, dir: -1, posCoord: -110, modelIdx: 4 },
      { axis: 'z', roadCoord: 120, dir: 1, posCoord: -55, modelIdx: 2 },
      { axis: 'z', roadCoord: 120, dir: 1, posCoord: 20, modelIdx: 3 },
      { axis: 'z', roadCoord: 120, dir: 1, posCoord: 112, modelIdx: 1 },

      // Parallel avenue x = 45
      { axis: 'z', roadCoord: 45, dir: -1, posCoord: 35, modelIdx: 2 },
      { axis: 'z', roadCoord: 45, dir: 1, posCoord: -40, modelIdx: 4 },

      // Coral Central Ave x = -30
      { axis: 'z', roadCoord: -30, dir: -1, posCoord: -15, modelIdx: 3 },
      { axis: 'z', roadCoord: -30, dir: 1, posCoord: 55, modelIdx: 1 },

      // Cross streets (z = 0, z = -75, z = 75, z = -150)
      { axis: 'x', roadCoord: 0, dir: 1, posCoord: 65, modelIdx: 0 },
      { axis: 'x', roadCoord: 0, dir: -1, posCoord: 15, modelIdx: 2 },
      { axis: 'x', roadCoord: -75, dir: 1, posCoord: 10, modelIdx: 4 },
      { axis: 'x', roadCoord: 75, dir: -1, posCoord: 80, modelIdx: 1 }
    ];

    for (let i = 0; i < laneConfigs.length; i++) {
      const cfg = laneConfigs[i];
      const modelDef = VEHICLE_MODELS[cfg.modelIdx % VEHICLE_MODELS.length];
      const color = modelDef.colors[i % modelDef.colors.length];
      const laneOffset = 3.85;

      let x = 0;
      let z = 0;
      let heading = 0;

      if (cfg.axis === 'z') {
        x = cfg.roadCoord + (cfg.dir === -1 ? laneOffset : -laneOffset);
        z = cfg.posCoord;
        heading = cfg.dir === -1 ? 0 : Math.PI;
      } else {
        x = cfg.posCoord;
        z = cfg.roadCoord + (cfg.dir === 1 ? laneOffset : -laneOffset);
        heading = cfg.dir === 1 ? -Math.PI * 0.5 : Math.PI * 0.5;
      }

      const vehicle = new Vehicle(
        this.scene,
        modelDef,
        color,
        new THREE.Vector3(x, 0, z),
        heading
      );
      vehicle.driver = 'ai';
      vehicle.speed = 11.5;

      this.entries.push({
        vehicle,
        axis: cfg.axis,
        roadCoord: cfg.roadCoord,
        dir: cfg.dir,
        cruiseSpeed: this.rng.range(11.0, 14.5)
      });
    }
  }

  hijackTrafficVehicle(targetVehicle) {
    const idx = this.entries.findIndex((e) => e.vehicle === targetVehicle);
    if (idx !== -1) {
      this.entries.splice(idx, 1);
    }
  }

  update(dt, playerPos, activePlayerVehicle) {
    const clampedDt = Math.min(dt, 0.05);
    this.signalTimer += clampedDt;
    if (this.signalTimer >= 8.5) {
      this.signalTimer = 0;
      this.nsGreen = !this.nsGreen;
    }

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const v = entry.vehicle;
      let shouldStop = false;

      // 1. Check intersection stop lines when cross traffic has priority
      const crossRoads = entry.axis === 'z' ? Z_ROADS : X_ROADS;
      const isRedForAxis = entry.axis === 'z' ? !this.nsGreen : this.nsGreen;
      const currentCoord = entry.axis === 'z' ? v.position.z : v.position.x;

      if (isRedForAxis) {
        for (const cr of crossRoads) {
          const stopLine = cr - entry.dir * (HALF_ROAD + 3.2);
          const distToStop = (stopLine - currentCoord) * entry.dir;
          if (distToStop > 0.5 && distToStop < 9.5) {
            shouldStop = true;
            break;
          }
        }
      }

      // 2. Check distance to player or player's vehicle directly ahead in lane
      const obstaclePos = activePlayerVehicle ? activePlayerVehicle.position : playerPos;
      if (obstaclePos) {
        const dx = obstaclePos.x - v.position.x;
        const dz = obstaclePos.z - v.position.z;
        const forward = v.getForwardXZ();
        const forwardDist = dx * forward.x + dz * forward.z;
        const lateralDist = Math.abs(dx * -forward.z + dz * forward.x);
        if (forwardDist > 1.5 && forwardDist < 12.0 && lateralDist < 2.6) {
          shouldStop = true;
        }
      }

      // 3. Check distance to other traffic cars ahead in the same lane
      for (let j = 0; j < this.entries.length; j++) {
        if (i === j) continue;
        const other = this.entries[j];
        if (other.axis !== entry.axis || other.roadCoord !== entry.roadCoord || other.dir !== entry.dir) {
          continue;
        }
        const otherCoord = entry.axis === 'z' ? other.vehicle.position.z : other.vehicle.position.x;
        const gap = (otherCoord - currentCoord) * entry.dir;
        if (gap > 0 && gap < 11.0) {
          shouldStop = true;
          break;
        }
      }

      if (shouldStop) {
        v.speed = Math.max(0, v.speed - 22 * clampedDt);
        v.isBraking = true;
      } else {
        v.speed = Math.min(entry.cruiseSpeed, v.speed + 12 * clampedDt);
        v.isBraking = false;
      }

      if (entry.axis === 'z') {
        v.position.z += entry.dir * v.speed * clampedDt;
        // Loop smoothly at ends of North-South avenues
        if (v.position.z < -232) v.position.z = 230;
        if (v.position.z > 232) v.position.z = -230;
      } else {
        v.position.x += entry.dir * v.speed * clampedDt;
        if (v.position.x < -186) v.position.x = 126;
        if (v.position.x > 128) v.position.x = -184;
      }

      v._syncVisuals(clampedDt);
    }
  }
}

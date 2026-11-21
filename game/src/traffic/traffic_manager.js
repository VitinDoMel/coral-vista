import * as THREE from 'three';
import { VehicleFactory, VEHICLE_TYPES } from '../vehicles/vehicle_models.js';
import { PALETTE } from '../core/constants.js';

// AI Traffic System: Ambient NPC Vehicles Travelling Along Lanes with Collision Avoidance

export class TrafficManager {
  constructor(scene, collisions, vehicleFactory, prng) {
    this.scene = scene;
    this.collisions = collisions;
    this.factory = vehicleFactory;
    this.prng = prng;

    this.trafficCars = [];
    this.maxCars = 14;

    this._setupLanes();
    this._spawnInitialTraffic();
  }

  _setupLanes() {
    // Defined straight-line lanes for Coral Vista avenues
    this.lanes = [
      // Seabreeze Boulevard Eastbound (Z = 196, Dir = +X)
      { startX: -260, endX: 260, z: 196, dirX: 1, dirZ: 0, yaw: -Math.PI / 2 },
      // Seabreeze Boulevard Westbound (Z = 204, Dir = -X)
      { startX: 260, endX: -260, z: 204, dirX: -1, dirZ: 0, yaw: Math.PI / 2 },
      // Central Avenue Eastbound (Z = 96, Dir = +X)
      { startX: -240, endX: 240, z: 96, dirX: 1, dirZ: 0, yaw: -Math.PI / 2 },
      // Central Avenue Westbound (Z = 104, Dir = -X)
      { startX: 240, endX: -240, z: 104, dirX: -1, dirZ: 0, yaw: Math.PI / 2 },
      // Cross Street 1 Northbound (X = -96, Dir = -Z)
      { startZ: 180, endZ: -180, x: -96, dirX: 0, dirZ: -1, yaw: Math.PI },
      // Cross Street 1 Southbound (X = -104, Dir = +Z)
      { startZ: -180, endZ: 180, x: -104, dirX: 0, dirZ: 1, yaw: 0 },
      // Cross Street 2 Northbound (X = 96, Dir = -Z)
      { startZ: 180, endZ: -180, x: 96, dirX: 0, dirZ: -1, yaw: Math.PI },
      // Cross Street 2 Southbound (X = 104, Dir = +Z)
      { startZ: -180, endZ: 180, x: 104, dirX: 0, dirZ: 1, yaw: 0 }
    ];
  }

  _spawnInitialTraffic() {
    for (let i = 0; i < this.maxCars; i++) {
      const lane = this.lanes[i % this.lanes.length];
      const car = this._createTrafficCar(lane);
      this.trafficCars.push(car);
    }
  }

  _createTrafficCar(lane) {
    const types = [VEHICLE_TYPES.SEDAN, VEHICLE_TYPES.SPORTS, VEHICLE_TYPES.MUSCLE, VEHICLE_TYPES.SUV];
    const type = this.prng.choice(types);
    const color = this.prng.choice(PALETTE.buildings);

    const mesh = this.factory.createVehicle(type, color);

    // Initial position along lane
    let x, z;
    if (lane.dirX !== 0) {
      x = this.prng.range(Math.min(lane.startX, lane.endX), Math.max(lane.startX, lane.endX));
      z = lane.z;
    } else {
      x = lane.x;
      z = this.prng.range(Math.min(lane.startZ, lane.endZ), Math.max(lane.startZ, lane.endZ));
    }

    mesh.position.set(x, 0, z);
    mesh.rotation.y = lane.yaw;
    this.scene.add(mesh);

    return {
      mesh,
      lane,
      type,
      speed: this.prng.range(8.0, 13.0),
      targetSpeed: this.prng.range(10.0, 14.0),
      radius: 1.6
    };
  }

  update(dt, playerPos, playerCar) {
    for (let i = 0; i < this.trafficCars.length; i++) {
      const car = this.trafficCars[i];
      const lane = car.lane;

      // Obstacle Detection: check distance to player or other traffic cars
      let shouldBrake = false;

      // 1. Check distance to player
      const toPlayerDistSq = (car.mesh.position.x - playerPos.x) ** 2 + (car.mesh.position.z - playerPos.z) ** 2;
      if (toPlayerDistSq < 144) { // within 12 meters
        const fwdX = lane.dirX;
        const fwdZ = lane.dirZ;
        const toPlX = playerPos.x - car.mesh.position.x;
        const toPlZ = playerPos.z - car.mesh.position.z;
        const dot = fwdX * toPlX + fwdZ * toPlZ;
        if (dot > 0 && dot < 10) {
          shouldBrake = true;
        }
      }

      // 2. Check car in front in same lane
      for (let j = 0; j < this.trafficCars.length; j++) {
        if (i === j) continue;
        const other = this.trafficCars[j];
        if (other.lane === lane) {
          const toOtherX = other.mesh.position.x - car.mesh.position.x;
          const toOtherZ = other.mesh.position.z - car.mesh.position.z;
          const dot = lane.dirX * toOtherX + lane.dirZ * toOtherZ;
          if (dot > 0 && dot < 9.0) {
            shouldBrake = true;
            break;
          }
        }
      }

      // Smooth accelerate / brake
      if (shouldBrake) {
        car.speed = Math.max(0, car.speed - 20 * dt);
      } else {
        car.speed = Math.min(car.targetSpeed, car.speed + 8 * dt);
      }

      // Move along lane
      car.mesh.position.x += lane.dirX * car.speed * dt;
      car.mesh.position.z += lane.dirZ * car.speed * dt;

      // Wrap around lane ends
      if (lane.dirX > 0 && car.mesh.position.x > lane.endX) {
        car.mesh.position.x = lane.startX;
      } else if (lane.dirX < 0 && car.mesh.position.x < lane.endX) {
        car.mesh.position.x = lane.startX;
      } else if (lane.dirZ > 0 && car.mesh.position.z > lane.endZ) {
        car.mesh.position.z = lane.startZ;
      } else if (lane.dirZ < 0 && car.mesh.position.z < lane.endZ) {
        car.mesh.position.z = lane.startZ;
      }
    }
  }
}

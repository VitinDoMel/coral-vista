// AI Traffic System: path lanes, car following, collision avoidance, and pooling

import * as THREE from 'three';
import { Vehicle } from '../vehicles/vehicle.js';
import { createRNG } from '../core/math.js';
import { COLORS } from '../core/constants.js';

export class TrafficManager {
  constructor(scene, collisions, modelFactory, seed = 42) {
    this.scene = scene;
    this.collisions = collisions;
    this.modelFactory = modelFactory;
    this.rng = createRNG(seed);

    this.vehicles = [];
    this.maxActive = 18;

    // Defined lanes for Coral Vista: { x, isNorthBound, laneOffset }
    this.avenueLanes = [
      { x: -85, zMin: -210, zMax: 210 }, // Ocean Boulevard
      { x: -40, zMin: -210, zMax: 210 },
      { x: 10,  zMin: -210, zMax: 210 },
      { x: 60,  zMin: -210, zMax: 210 },
      { x: 110, zMin: -210, zMax: 210 },
      { x: 160, zMin: -210, zMax: 210 },
    ];

    this.initPool();
  }

  initPool() {
    const types = ['sports', 'muscle', 'sedan', 'taxi', 'suv'];
    const colors = [0x2980b9, 0xe74c3c, 0x27ae60, 0xf39c12, 0xecf0f1, 0x8e44ad, 0x2c3e50];

    for (let i = 0; i < this.maxActive; i++) {
      const type = this.rng.choice(types);
      const color = type === 'taxi' ? 0xf1c40f : this.rng.choice(colors);
      const model = this.modelFactory.createCarMesh(type, color);
      const car = new Vehicle(this.scene, this.collisions, model, type);

      const lane = this.rng.choice(this.avenueLanes);
      const isNorth = this.rng.chance(0.5);
      const laneX = lane.x + (isNorth ? 3.8 : -3.8);
      const z = this.rng.range(lane.zMin, lane.zMax);
      const yaw = isNorth ? 0 : Math.PI;

      car.setPosition(laneX, z, yaw);
      car.speed = this.rng.range(12.0, 18.0);
      car.isNorth = isNorth;
      car.laneX = laneX;
      car.targetSpeed = car.speed;

      this.vehicles.push(car);
    }
  }

  update(delta, playerPos) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const car = this.vehicles[i];
      if (car.isOccupiedByPlayer) {
        car.update(delta, null);
        continue;
      }

      // Despawn/wrap if too far from player
      const distToPlayer = Math.hypot(car.position.x - playerPos.x, car.position.z - playerPos.z);
      if (distToPlayer > 180) {
        this.recycleCar(car, playerPos);
        continue;
      }

      // Check for obstacles ahead in current lane
      let shouldBrake = false;
      const forwardZ = car.isNorth ? 1 : -1;

      // Check distance to other traffic cars
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (Math.abs(car.position.x - other.position.x) < 3.0) {
          const dz = (other.position.z - car.position.z) * forwardZ;
          if (dz > 0 && dz < 14.0) {
            shouldBrake = true;
            break;
          }
        }
      }

      // Check distance to player
      if (Math.abs(car.position.x - playerPos.x) < 3.2) {
        const dz = (playerPos.z - car.position.z) * forwardZ;
        if (dz > 0 && dz < 15.0) {
          shouldBrake = true;
        }
      }

      if (shouldBrake) {
        car.speed = Math.max(0, car.speed - 24.0 * delta);
      } else {
        car.speed = Math.min(car.targetSpeed, car.speed + 12.0 * delta);
      }

      // Keep lane lock
      car.position.x = car.laneX;
      car.yaw = car.isNorth ? 0 : Math.PI;

      // Move forward
      car.position.z += forwardZ * car.speed * delta;
      car.position.y = this.collisions.getGroundHeight(car.position.x, car.position.z) + 0.08;

      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.yaw;

      // Rotate wheels
      const wheelRotDelta = (car.speed / 0.38) * delta;
      for (const w of car.model.wheels) {
        w.mesh.children[0].rotation.x += wheelRotDelta;
      }

      // Wrap at city borders
      if (car.position.z > 230) car.position.z = -230;
      if (car.position.z < -230) car.position.z = 230;
    }
  }

  recycleCar(car, playerPos) {
    const lane = this.rng.choice(this.avenueLanes);
    const isNorth = this.rng.chance(0.5);
    car.laneX = lane.x + (isNorth ? 3.8 : -3.8);
    car.isNorth = isNorth;
    car.yaw = isNorth ? 0 : Math.PI;

    // Spawn 80 to 130 meters away from player
    const spawnZ = playerPos.z + (isNorth ? -1 : 1) * this.rng.range(80, 130);
    car.setPosition(car.laneX, spawnZ, car.yaw);
    car.speed = this.rng.range(12.0, 17.0);
    car.targetSpeed = car.speed;
  }

  getNearestVehicle(x, z, maxDist = 4.0) {
    let nearest = null;
    let minD = maxDist;

    for (const car of this.vehicles) {
      const d = Math.hypot(car.position.x - x, car.position.z - z);
      if (d < minD) {
        minD = d;
        nearest = car;
      }
    }
    return nearest;
  }
}

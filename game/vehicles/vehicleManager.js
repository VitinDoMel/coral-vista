import * as THREE from 'three';
import { VEHICLE_MODELS, Vehicle } from './vehicle.js';
import { createSeededRng } from '../engine/rng.js';

export class VehicleManager {
  constructor(scene, collisionWorld, seed = 1) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
    this.rng = createSeededRng(seed + 101);

    this.vehicles = [];
    this.activeVehicle = null; // Vehicle currently driven by Rafa Sol

    this._spawnInitialParkedVehicles();
  }

  _spawnInitialParkedVehicles() {
    // Spawn all 5 distinct vehicle models parked near Seabreeze Blvd & key spots
    const initialSpawns = [
      // Manta GT sports car parked right ahead of Rafa Sol on Seabreeze Blvd
      { modelIndex: 0, color: 0xee4b3e, x: 126.2, z: 16.0, heading: 0 },
      // Solaris Sedan on Seabreeze Blvd
      { modelIndex: 1, color: 0x46cfab, x: 113.8, z: -18.0, heading: Math.PI },
      // Coral Dune 4x4 near beach access & bridge approach
      { modelIndex: 2, color: 0xf27d38, x: 126.2, z: -115.0, heading: 0 },
      // Cabana V8 muscle car near downtown avenue
      { modelIndex: 3, color: 0xd93870, x: 51.2, z: -22.0, heading: 0 },
      // Vista Cab taxi on Solstice Causeway
      { modelIndex: 4, color: 0xf7c528, x: 96.0, z: -6.2, heading: Math.PI * 0.5 },
      // Extra parked cars around port and central district
      { modelIndex: 0, color: 0x1fc2d6, x: -23.8, z: -50.0, heading: 0 },
      { modelIndex: 3, color: 0x76d658, x: -98.8, z: 135.0, heading: 0 },
      { modelIndex: 2, color: 0x2c9c91, x: 310.0, z: -145.0, heading: Math.PI * 0.5 }
    ];

    for (const sp of initialSpawns) {
      const modelDef = VEHICLE_MODELS[sp.modelIndex % VEHICLE_MODELS.length];
      const v = new Vehicle(
        this.scene,
        modelDef,
        sp.color,
        new THREE.Vector3(sp.x, 0, sp.z),
        sp.heading
      );
      this.vehicles.push(v);
    }
  }

  findNearestEnterableVehicle(playerPos, trafficVehicles = [], maxDistance = 4.4) {
    let bestVehicle = null;
    let bestDistSq = maxDistance * maxDistance;

    for (const v of this.vehicles) {
      const dSq = playerPos.distanceToSquared(v.position);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestVehicle = v;
      }
    }

    for (const tv of trafficVehicles) {
      const dSq = playerPos.distanceToSquared(tv.vehicle.position);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestVehicle = tv.vehicle;
      }
    }

    return bestVehicle;
  }

  tryTogglePlayerVehicle(
    player,
    input,
    cameraController,
    trafficManager,
    pedestrianManager,
    policeManager
  ) {
    if (!input.consumeKeyPress('KeyF')) return;

    // Exit current vehicle
    if (this.activeVehicle) {
      const car = this.activeVehicle;
      const leftSide = car.getRightXZ().multiplyScalar(-1.95);
      player.position.copy(car.position).add(leftSide);
      if (this.collisionWorld) {
        this.collisionWorld.resolveCircleAABB(player.position, player.radius);
        player.position.y = this.collisionWorld.getGroundHeightAt(
          player.position.x,
          player.position.z
        );
      }
      player.heading = car.heading;
      player.mesh.position.copy(player.position);
      player.mesh.rotation.y = player.heading;
      player.mesh.visible = true;

      car.driver = null;
      this.activeVehicle = null;
      return;
    }

    // Enter or hijack nearest vehicle
    const trafficList = trafficManager ? trafficManager.entries : [];
    const targetCar = this.findNearestEnterableVehicle(player.position, trafficList, 4.5);
    if (!targetCar) return;

    // If vehicle belongs to AI traffic, pull the driver out (roubar carro)
    if (trafficManager && targetCar.driver === 'ai') {
      trafficManager.hijackTrafficVehicle(targetCar);
      if (!this.vehicles.includes(targetCar)) {
        this.vehicles.push(targetCar);
      }
      if (pedestrianManager) {
        const ejectPos = targetCar.position
          .clone()
          .add(targetCar.getRightXZ().multiplyScalar(-1.8));
        pedestrianManager.spawnEjectedDriver(ejectPos, targetCar.position);
      }
      if (policeManager) {
        policeManager.reportCrime('carjack', 1);
      }
    }

    targetCar.driver = 'player';
    this.activeVehicle = targetCar;
    player.mesh.visible = false;
    player.position.copy(targetCar.position);
    cameraController.alignBehindVehicle(targetCar);
  }

  update(
    dt,
    input,
    player,
    cameraController,
    trafficManager,
    pedestrianManager,
    policeManager
  ) {
    this.tryTogglePlayerVehicle(
      player,
      input,
      cameraController,
      trafficManager,
      pedestrianManager,
      policeManager
    );

    for (const v of this.vehicles) {
      if (v === this.activeVehicle) {
        v.updatePlayerArcadePhysics(dt, input, this.collisionWorld);
        player.position.copy(v.position);
        player.heading = v.heading;
      } else {
        v.updatePassivePhysics(dt, this.collisionWorld);
      }
    }
  }
}

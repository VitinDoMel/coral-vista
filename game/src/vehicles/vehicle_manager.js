import * as THREE from 'three';
import { VehicleFactory, VEHICLE_TYPES } from './vehicle_models.js';
import { VehicleController } from './vehicle_physics.js';
import { CAMERA } from '../core/constants.js';

// Vehicle Manager: Enter/Exit/Carjacking, Active Vehicle Tracking, Camera Follow

export class VehicleManager {
  constructor(scene, collisions, input, camera) {
    this.scene = scene;
    this.collisions = collisions;
    this.input = input;
    this.camera = camera;

    this.factory = new VehicleFactory();
    this.vehicles = [];
    this.playerVehicle = null;

    this._spawnParkedVehicles();
  }

  _spawnParkedVehicles() {
    // 1. Red Coral Sports Car parked on Seabreeze Boulevard (near Rafa for mission 1 / gameplay)
    const sports = this.createVehicle(VEHICLE_TYPES.SPORTS, 0xe63946, new THREE.Vector3(24, 0, 194), -Math.PI / 2);
    sports.userData.isMissionTarget = true;

    // 2. Muscle Car on Cross Street
    this.createVehicle(VEHICLE_TYPES.MUSCLE, 0xf77f00, new THREE.Vector3(4, 0, 150), 0);

    // 3. Executive Sedan near Downtown
    this.createVehicle(VEHICLE_TYPES.SEDAN, 0x1d3557, new THREE.Vector3(-80, 0, 100), Math.PI / 2);

    // 4. SUV on Seabreeze Beachside
    this.createVehicle(VEHICLE_TYPES.SUV, 0x2a9d8f, new THREE.Vector3(65, 0, 206), Math.PI / 2);

    // 5. CVPD Patrol Car parked near Central Plaza
    this.createVehicle(VEHICLE_TYPES.CVPD, 0x111317, new THREE.Vector3(-100, 0, 20), 0);
  }

  createVehicle(type, colorHex, pos, yaw = 0) {
    const mesh = this.factory.createVehicle(type, colorHex);
    mesh.position.copy(pos);
    mesh.rotation.y = yaw;
    this.scene.add(mesh);

    const controller = new VehicleController(mesh, this.collisions, {
      maxSpeed: (type === VEHICLE_TYPES.SPORTS) ? 34.0 : 26.0,
      accel: (type === VEHICLE_TYPES.SPORTS) ? 22.0 : 16.0
    });
    controller.position.copy(pos);
    controller.yaw = yaw;

    const vData = {
      mesh,
      controller,
      type,
      driver: null,
      userData: {}
    };

    this.vehicles.push(vData);
    return vData;
  }

  update(dt, player) {
    // Handle Enter / Exit / Carjack with key 'KeyF'
    if (this.input.wasJustPressed('KeyF')) {
      if (this.playerVehicle) {
        this.exitVehicle(player);
      } else {
        this.tryEnterNearestVehicle(player);
      }
    }

    // Drive current vehicle if inside
    if (this.playerVehicle) {
      let forward = 0;
      let steer = 0;

      if (this.input.isDown('KeyW')) forward += 1;
      if (this.input.isDown('KeyS')) forward -= 1;
      if (this.input.isDown('KeyA')) steer += 1;
      if (this.input.isDown('KeyD')) steer -= 1;

      const handbrake = this.input.isDown('Space');

      this.playerVehicle.controller.update(dt, { forward, steer, handbrake });

      // Keep player mesh synced with vehicle
      player.position.copy(this.playerVehicle.controller.position);
      player.position.y = 0.35;
      player.mesh.position.copy(player.position);

      this._updateVehicleCamera(dt);
    }
  }

  tryEnterNearestVehicle(player) {
    let nearest = null;
    let minDSq = 16.0; // Max enter distance: 4.0 meters

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const dx = v.controller.position.x - player.position.x;
      const dz = v.controller.position.z - player.position.z;
      const dSq = dx * dx + dz * dz;

      if (dSq < minDSq) {
        minDSq = dSq;
        nearest = v;
      }
    }

    if (nearest) {
      this.enterVehicle(player, nearest);
    }
  }

  enterVehicle(player, vData) {
    this.playerVehicle = vData;
    vData.driver = player;

    // Hide player standing model while seated inside vehicle
    player.mesh.visible = false;
  }

  exitVehicle(player) {
    if (!this.playerVehicle) return;

    // Place player beside driver door
    const v = this.playerVehicle;
    const sinY = Math.sin(v.controller.yaw);
    const cosY = Math.cos(v.controller.yaw);

    player.position.set(
      v.controller.position.x - cosY * 1.6,
      0.35,
      v.controller.position.z + sinY * 1.6
    );
    player.mesh.position.copy(player.position);
    player.mesh.visible = true;

    // Reset vehicle driver
    v.driver = null;
    this.playerVehicle = null;
  }

  _updateVehicleCamera(dt) {
    const v = this.playerVehicle;
    if (!v) return;

    const camCfg = CAMERA.vehicle;
    const sinY = Math.sin(v.controller.yaw);
    const cosY = Math.cos(v.controller.yaw);

    // Follow vehicle from behind along forward velocity
    const targetCamX = v.controller.position.x - sinY * camCfg.distance;
    const targetCamY = v.controller.position.y + camCfg.height;
    const targetCamZ = v.controller.position.z - cosY * camCfg.distance;

    this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 10 * dt);

    const lookTarget = new THREE.Vector3(
      v.controller.position.x + sinY * 5.0,
      v.controller.position.y + 1.2,
      v.controller.position.z + cosY * 5.0
    );
    this.camera.lookAt(lookTarget);
  }
}

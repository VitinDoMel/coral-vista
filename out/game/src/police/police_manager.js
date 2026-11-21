// Police Manager: cruiser dispatches, sirens, officers, helicopter, and pursuit AI

import * as THREE from 'three';
import { Vehicle } from '../vehicles/vehicle.js';
import { PoliceOfficer } from './police_officer.js';
import { PoliceHelicopter } from './police_helicopter.js';
import { angleDifference } from '../core/math.js';

export class PoliceManager {
  constructor(scene, collisions, vehicleModelFactory) {
    this.scene = scene;
    this.collisions = collisions;
    this.modelFactory = vehicleModelFactory;

    this.cruisers = [];
    this.officers = [];
    this.helicopter = new PoliceHelicopter(scene);

    this.sirenTimer = 0;
    this.bustedCountdown = 0;
  }

  update(delta, player, wantedSystem) {
    const stars = wantedSystem.stars;

    // Siren lights flash rhythmically
    this.sirenTimer += delta * 12.0;
    const flashToggle = Math.sin(this.sirenTimer) > 0;

    // Helicopter dispatch at ★ >= 4
    if (stars >= 4) {
      if (!this.helicopter.active) {
        this.helicopter.deploy(player.position);
      }
      this.helicopter.update(delta, player, stars);
    } else if (this.helicopter.active) {
      this.helicopter.retire();
    }

    // Adjust active cruisers based on wanted stars
    const targetCruiserCount = stars === 0 ? 0 : (stars <= 2 ? 2 : (stars === 3 ? 3 : 4));
    while (this.cruisers.length < targetCruiserCount) {
      this.spawnCruiser(player.position);
    }
    while (this.cruisers.length > targetCruiserCount) {
      const removed = this.cruisers.pop();
      this.scene.remove(removed.mesh);
    }

    // Update Cruiser AI Pursuit
    let isAnyCopNear = false;

    for (let i = 0; i < this.cruisers.length; i++) {
      const cruiser = this.cruisers[i];

      // Flash emergency lightbar
      if (cruiser.model.mesh.userData.lightbar) {
        cruiser.model.mesh.userData.lightbar.red.visible = flashToggle;
        cruiser.model.mesh.userData.lightbar.blue.visible = !flashToggle;
      }

      const dx = player.position.x - cruiser.position.x;
      const dz = player.position.z - cruiser.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 35.0) isAnyCopNear = true;

      // Pursuit steering towards player
      const targetAngle = Math.atan2(dx, dz);
      const angleDiff = angleDifference(targetAngle, cruiser.yaw);
      cruiser.steerAngle = Math.max(-0.6, Math.min(0.6, angleDiff * 1.5));

      // Ram or intercept speed
      if (dist > 5.0) {
        cruiser.speed = Math.min(cruiser.maxSpeed, cruiser.speed + 22.0 * delta);
      } else {
        // Ramming speed
        cruiser.speed = Math.min(cruiser.maxSpeed * 0.8, cruiser.speed + 15.0 * delta);
      }

      cruiser.update(delta, null);
    }

    // Police Officers on foot
    const targetOfficerCount = stars >= 3 ? 3 : 0;
    while (this.officers.length < targetOfficerCount) {
      const off = new PoliceOfficer(this.scene, this.collisions, this.officers.length);
      const spawnX = player.position.x + (Math.random() - 0.5) * 35;
      const spawnZ = player.position.z + (Math.random() - 0.5) * 35;
      off.spawn(spawnX, spawnZ);
      this.officers.push(off);
    }
    while (this.officers.length > targetOfficerCount) {
      const off = this.officers.pop();
      this.scene.remove(off.root);
    }

    for (const off of this.officers) {
      off.update(delta, player, stars);
      const d = Math.hypot(off.position.x - player.position.x, off.position.z - player.position.z);
      if (d < 30.0) isAnyCopNear = true;
    }

    // Busted Check: if player is trapped and surrounded
    if (stars > 0 && isAnyCopNear) {
      const playerSpeed = player.inVehicle && player.currentVehicle ? Math.abs(player.currentVehicle.speed) : player.velocity.length();
      if (playerSpeed < 1.2) {
        this.bustedCountdown += delta;
        if (this.bustedCountdown >= 2.8) {
          player.triggerBusted();
          wantedSystem.clear();
          this.bustedCountdown = 0;
        }
      } else {
        this.bustedCountdown = 0;
      }
    } else {
      this.bustedCountdown = 0;
    }

    // Line of sight reporting for evasion cooldown
    wantedSystem.update(delta, isAnyCopNear);
  }

  spawnCruiser(playerPos) {
    const copModel = this.modelFactory.createCarMesh('police', 0x152238);
    const cruiser = new Vehicle(this.scene, this.collisions, copModel, 'police');

    // Spawn 70m to 100m away along player axis
    const angle = Math.random() * Math.PI * 2;
    const dist = 75.0;
    const spawnX = playerPos.x + Math.sin(angle) * dist;
    const spawnZ = playerPos.z + Math.cos(angle) * dist;

    cruiser.setPosition(spawnX, spawnZ, angle + Math.PI);
    cruiser.speed = 18.0;
    cruiser.maxSpeed = 33.0;

    this.cruisers.push(cruiser);
  }
}

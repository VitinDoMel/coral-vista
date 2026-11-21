// Third-person chase camera for vehicles

import * as THREE from 'three';
import { clamp } from '../core/math.js';

export class CarCamera {
  constructor(camera) {
    this.camera = camera;
    this.followDistance = 6.8;
    this.followHeight = 2.6;
    this.lookAheadDistance = 5.0;
    this.currentYaw = 0;
  }

  update(delta, vehicle) {
    const pos = vehicle.position;
    const speedRatio = clamp(Math.abs(vehicle.speed) / vehicle.maxSpeed, 0, 1);

    // Camera pulls back slightly at higher speeds
    const targetDist = this.followDistance + speedRatio * 1.8;
    const targetHeight = this.followHeight + speedRatio * 0.5;

    // Smoothly track vehicle heading with subtle drift lag
    let yawDiff = (vehicle.yaw - this.currentYaw) % (Math.PI * 2);
    if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    if (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    this.currentYaw += yawDiff * Math.min(1.0, delta * 5.0);

    const backX = -Math.sin(this.currentYaw);
    const backZ = -Math.cos(this.currentYaw);

    const targetCamX = pos.x + backX * targetDist;
    const targetCamY = pos.y + targetHeight;
    const targetCamZ = pos.z + backZ * targetDist;

    this.camera.position.set(targetCamX, targetCamY, targetCamZ);

    // Look forward ahead of car
    const lookX = pos.x + Math.sin(this.currentYaw) * this.lookAheadDistance;
    const lookY = pos.y + 1.2;
    const lookZ = pos.z + Math.cos(this.currentYaw) * this.lookAheadDistance;

    this.camera.lookAt(lookX, lookY, lookZ);
  }
}

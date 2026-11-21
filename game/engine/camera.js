import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, collisionWorld) {
    this.camera = camera;
    this.collisionWorld = collisionWorld;

    // Default T1 spec: dist. 7, alt. 3
    this.footDistance = 7.0;
    this.footHeight = 3.0;

    // Vehicle chase camera (T2): follows smoothly behind vehicle
    this.vehicleDistance = 8.8;
    this.vehicleHeight = 3.45;
    this.vehicleOrbitOffset = 0;

    this.yaw = 0.35;
    this.pitch = 0.16;
    this.minPitch = -0.25;
    this.maxPitch = 0.72;
    this.mouseSensitivity = 0.0024;

    this.currentPosition = new THREE.Vector3(120, 4.5, 48);
    this.currentLookAt = new THREE.Vector3(120, 1.5, 40);
    this.initialized = false;
    this.overrideActive = false;
  }

  setAngles(yaw, pitch = 0.16) {
    this.yaw = yaw;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
  }

  applyMouseDelta(dx, dy) {
    if (this.overrideActive) return;
    this.yaw -= dx * this.mouseSensitivity;
    this.vehicleOrbitOffset -= dx * this.mouseSensitivity;
    this.pitch = Math.max(
      this.minPitch,
      Math.min(this.maxPitch, this.pitch + dy * this.mouseSensitivity)
    );
  }

  alignBehindVehicle(vehicle) {
    this.yaw = vehicle.heading;
    this.vehicleOrbitOffset = 0;
  }

  updateForVehicleTarget(vehicle, dt, snap = false) {
    if (this.overrideActive) return;

    // Decay manual mouse orbit offset smoothly when driving
    if (Math.abs(vehicle.speed) > 1.5) {
      this.vehicleOrbitOffset *= Math.exp(-3.2 * Math.min(dt, 0.1));
    }

    const desiredYaw = vehicle.heading + this.vehicleOrbitOffset;
    let diff = desiredYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, Math.min(dt, 0.1) * 7.5);

    const dist = this.vehicleDistance + Math.min(1.6, Math.abs(vehicle.speed) * 0.045);
    const height = this.vehicleHeight + Math.sin(this.pitch) * 1.4;

    const desiredPos = new THREE.Vector3(
      vehicle.position.x + Math.sin(this.yaw) * dist,
      vehicle.position.y + height,
      vehicle.position.z + Math.cos(this.yaw) * dist
    );

    const forward = vehicle.getForwardXZ();
    const lookTarget = new THREE.Vector3(
      vehicle.position.x + forward.x * 2.4,
      vehicle.position.y + 1.25,
      vehicle.position.z + forward.z * 2.4
    );

    if (this.collisionWorld) {
      const clipped = this.collisionWorld.clipSegment(lookTarget, desiredPos, 0.35);
      desiredPos.copy(clipped);
    }

    if (!this.initialized || snap) {
      this.currentPosition.copy(desiredPos);
      this.currentLookAt.copy(lookTarget);
      this.initialized = true;
    } else {
      const lerpFactor = 1 - Math.exp(-12 * Math.min(dt, 0.1));
      this.currentPosition.lerp(desiredPos, lerpFactor);
      this.currentLookAt.lerp(lookTarget, lerpFactor);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  updateForFootTarget(targetPosition, dt, snap = false) {
    if (this.overrideActive) return;

    const distance = this.footDistance;
    const baseHeight = this.footHeight;

    const pitchOffset = Math.sin(this.pitch) * 2.2;
    const horizDist = distance * Math.cos(this.pitch * 0.5);

    const offsetX = Math.sin(this.yaw) * horizDist;
    const offsetZ = Math.cos(this.yaw) * horizDist;

    const desiredPos = new THREE.Vector3(
      targetPosition.x + offsetX,
      targetPosition.y + baseHeight + pitchOffset,
      targetPosition.z + offsetZ
    );

    const lookTarget = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + 1.45,
      targetPosition.z
    );

    // Prevent camera from clipping inside solid building AABBs
    if (this.collisionWorld) {
      const clipped = this.collisionWorld.clipSegment(lookTarget, desiredPos, 0.35);
      desiredPos.copy(clipped);
    }

    if (desiredPos.y < 0.8) {
      desiredPos.y = 0.8;
    }

    if (!this.initialized || snap) {
      this.currentPosition.copy(desiredPos);
      this.currentLookAt.copy(lookTarget);
      this.initialized = true;
    } else {
      const lerpFactor = 1 - Math.exp(-14 * Math.min(dt, 0.1));
      this.currentPosition.lerp(desiredPos, lerpFactor);
      this.currentLookAt.lerp(lookTarget, lerpFactor);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  getForwardXZ() {
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    return forward.normalize();
  }

  getRightXZ() {
    const forward = this.getForwardXZ();
    return new THREE.Vector3(-forward.z, 0, forward.x).normalize();
  }
}

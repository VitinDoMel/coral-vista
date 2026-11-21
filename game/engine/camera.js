import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, collisionWorld) {
    this.camera = camera;
    this.collisionWorld = collisionWorld;

    // Default T1 spec: dist. 7, alt. 3
    this.footDistance = 7.0;
    this.footHeight = 3.0;

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
    this.pitch = Math.max(
      this.minPitch,
      Math.min(this.maxPitch, this.pitch + dy * this.mouseSensitivity)
    );
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

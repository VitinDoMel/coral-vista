import * as THREE from 'three';

// Arcade Vehicle Dynamics: Acceleration, Braking, Drifting, and Collision

export class VehicleController {
  constructor(mesh, collisions, options = {}) {
    this.mesh = mesh;
    this.collisions = collisions;

    this.position = new THREE.Vector3().copy(mesh.position);
    this.yaw = mesh.rotation.y || 0;
    this.speed = 0; // Forward speed (m/s)
    this.steerAngle = 0;
    this.lateralVelocity = 0;

    // Physics parameters
    this.maxSpeed = options.maxSpeed || 28.0; // ~100 km/h
    this.accel = options.accel || 18.0;
    this.brakeForce = options.brakeForce || 24.0;
    this.reverseMaxSpeed = 10.0;
    this.friction = 4.5;
    this.turnSpeed = 2.4;
    this.driftFactor = 0.85;

    this.health = 100;
    this.width = 2.0;
    this.length = 4.6;
    this.radius = 1.6;
    this.isSmoking = false;
  }

  update(dt, inputState) {
    // inputState: { forward, steer, handbrake }
    const throttle = inputState.forward || 0;
    const steer = inputState.steer || 0;
    const handbrake = !!inputState.handbrake;

    // Steering response (turns faster at moderate speeds, tightens at top speed)
    const steerLimit = 0.58;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, steer * steerLimit, 12 * dt);

    // Throttle & Braking
    if (throttle > 0) {
      if (this.speed < -0.5) {
        this.speed += this.brakeForce * dt; // Braking while reversing
      } else {
        this.speed += this.accel * dt;
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
      }
    } else if (throttle < 0) {
      if (this.speed > 0.5) {
        this.speed -= this.brakeForce * dt; // Normal forward braking
      } else {
        this.speed -= this.accel * 0.7 * dt; // Reverse
        if (this.speed < -this.reverseMaxSpeed) this.speed = -this.reverseMaxSpeed;
      }
    } else {
      // Natural rolling friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * dt);
      }
    }

    // Handbrake Drifting
    if (handbrake) {
      this.speed *= Math.max(0, 1 - 1.8 * dt);
      this.lateralVelocity += this.steerAngle * 18 * dt;
    } else {
      this.lateralVelocity *= Math.max(0, 1 - 8.0 * dt);
    }

    // Yaw rotation from steering
    if (Math.abs(this.speed) > 0.1) {
      const dirSign = this.speed >= 0 ? 1 : -1;
      this.yaw += this.steerAngle * dirSign * this.turnSpeed * (Math.abs(this.speed) / this.maxSpeed + 0.3) * dt;
    }

    // Move forward and laterally
    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    const fwdX = sinY * this.speed;
    const fwdZ = cosY * this.speed;
    const latX = cosY * this.lateralVelocity;
    const latZ = -sinY * this.lateralVelocity;

    let nextX = this.position.x + (fwdX + latX) * dt;
    let nextZ = this.position.z + (fwdZ + latZ) * dt;

    // World collision check
    const resolved = this.collisions.resolveCircle(nextX, nextZ, this.radius);
    if (resolved.collided) {
      // Impact damage & speed reduction
      const impactSpeed = Math.abs(this.speed);
      if (impactSpeed > 8.0) {
        this.health -= Math.floor(impactSpeed * 0.8);
        if (this.health < 40) this.isSmoking = true;
      }
      this.speed *= 0.35;
    }

    this.position.x = resolved.x;
    this.position.z = resolved.z;

    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.mesh.rotation.y = this.yaw;
  }
}

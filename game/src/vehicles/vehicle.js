// Arcade vehicle physics, handling, damage, and controls

import * as THREE from 'three';
import { clamp, angleDifference } from '../core/math.js';

export class Vehicle {
  constructor(scene, collisions, modelData, type = 'sports') {
    this.scene = scene;
    this.collisions = collisions;
    this.model = modelData;
    this.type = type;

    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.driftFactor = 0;

    this.maxSpeed = type === 'sports' ? 36.0 : (type === 'muscle' ? 34.0 : 28.0);
    this.acceleration = type === 'sports' ? 22.0 : 18.0;
    this.brakePower = 32.0;
    this.reverseSpeed = 12.0;
    this.turnRate = 2.4;

    this.health = 100;
    this.driver = null;
    this.isOccupiedByPlayer = false;

    this.mesh = this.model.mesh;
    this.scene.add(this.mesh);

    this.fx = null; // Set by game orchestrator
    this.sound = null; // Set by game orchestrator
    this.smokeTimer = 0;
  }

  setEffects(particles, skidmarks, sound) {
    this.fx = { particles, skidmarks };
    this.sound = sound;
  }

  getSpeedKmh() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  setPosition(x, z, yaw = 0) {
    this.position.set(x, this.collisions.getGroundHeight(x, z) + 0.1, z);
    this.yaw = yaw;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;
  }

  update(delta, input = null) {
    if (this.isOccupiedByPlayer && input) {
      this.handlePlayerInput(delta, input);
    } else {
      // Natural rolling friction when unoccupied
      this.speed *= Math.max(0, 1.0 - delta * 2.5);
      this.steerAngle *= Math.max(0, 1.0 - delta * 8.0);
    }

    // Turning based on speed and steer angle
    const speedRatio = clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1);
    const effectiveTurn = this.steerAngle * this.turnRate * delta * (0.3 + 0.7 * speedRatio);
    this.yaw += (this.speed >= 0 ? 1 : -1) * effectiveTurn;

    // Movement forward/backward along vehicle heading
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);

    this.position.x += forwardX * this.speed * delta;
    this.position.z += forwardZ * this.speed * delta;

    // Terrain height
    this.position.y = this.collisions.getGroundHeight(this.position.x, this.position.z) + 0.08;

    // Collision with city buildings and props
    const colRadius = Math.max(this.model.width, this.model.length) * 0.45;
    const resolved = this.collisions.resolveCircle(
      this.position.x,
      this.position.z,
      colRadius,
      this.position.y + 0.8
    );

    const hitDist = Math.hypot(this.position.x - resolved.x, this.position.z - resolved.z);
    if (hitDist > 0.05) {
      // Impact crash: absorb speed and take damage
      if (Math.abs(this.speed) > 6.0) {
        this.health = Math.max(0, this.health - Math.abs(this.speed) * 0.4);
        if (this.fx?.particles) {
          this.fx.particles.spawnSparks(resolved.x, this.position.y + 0.6, resolved.z, 0, 1, 0, 8);
        }
        if (this.sound) {
          this.sound.playCrash(Math.abs(this.speed) / 12.0);
        }
      }
      this.speed *= -0.25;
      this.position.x = resolved.x;
      this.position.z = resolved.z;
    }

    // Engine smoke when damaged
    if (this.health < 65 && this.fx?.particles) {
      this.smokeTimer += delta;
      if (this.smokeTimer > (this.health < 30 ? 0.08 : 0.2)) {
        this.smokeTimer = 0;
        this.fx.particles.spawnEngineSmoke(this.position, this.health < 30 ? 2 : 1);
      }
    }

    // Sync mesh transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    // Slight vehicle body roll/pitch on cornering/braking
    const roll = -this.steerAngle * (this.speed / this.maxSpeed) * 0.12;
    this.mesh.rotation.z = roll;

    // Rotate wheels
    const wheelRotDelta = (this.speed / 0.38) * delta;
    for (const w of this.model.wheels) {
      w.mesh.children[0].rotation.x += wheelRotDelta;
      if (w.isFront) {
        w.mesh.rotation.y = this.steerAngle;
      }
    }
  }

  handlePlayerInput(delta, input) {
    const isAccelerating = input.isDown('KeyW') || input.isDown('ArrowUp');
    const isBraking = input.isDown('KeyS') || input.isDown('ArrowDown');
    const isSteerLeft = input.isDown('KeyA') || input.isDown('ArrowLeft');
    const isSteerRight = input.isDown('KeyD') || input.isDown('ArrowRight');
    const isHandbrake = input.isDown('Space');

    // Steering
    const maxSteer = 0.58;
    const steerSpeed = 4.2 * delta;

    if (isSteerLeft) {
      this.steerAngle = Math.min(maxSteer, this.steerAngle + steerSpeed);
    } else if (isSteerRight) {
      this.steerAngle = Math.max(-maxSteer, this.steerAngle - steerSpeed);
    } else {
      this.steerAngle *= Math.max(0, 1.0 - delta * 9.0);
    }

    // Acceleration & Braking
    if (isAccelerating) {
      if (this.speed < 0) {
        this.speed += this.brakePower * delta;
      } else {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
      }
    } else if (isBraking) {
      if (this.speed > 0.5) {
        this.speed = Math.max(0, this.speed - this.brakePower * delta);
      } else {
        this.speed = Math.max(-this.reverseSpeed, this.speed - this.acceleration * 0.6 * delta);
      }
    } else {
      // Natural coasting
      this.speed *= Math.max(0, 1.0 - delta * 0.85);
    }

    // Handbrake drift & tire friction effects
    const isDrifting = isHandbrake || (Math.abs(this.steerAngle) > 0.35 && Math.abs(this.speed) > 14.0);
    if (isDrifting) {
      this.speed *= Math.max(0, 1.0 - delta * (isHandbrake ? 2.2 : 0.8));
      this.steerAngle *= 1.06;

      if (this.fx?.particles && Math.abs(this.speed) > 8.0) {
        this.fx.particles.spawnTireSmoke(this.position.x, this.position.y, this.position.z, 0, 0, 2);
      }
      if (this.fx?.skidmarks && Math.abs(this.speed) > 10.0) {
        this.fx.skidmarks.addSkidmark(this.position.x, this.position.y, this.position.z, this.yaw);
      }
    }

    // Dynamic engine audio
    if (this.sound) {
      this.sound.updateEngine(Math.abs(this.speed) / this.maxSpeed, isAccelerating);
    }
  }

  damage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}

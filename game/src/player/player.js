// Rafa Sol player character model, third-person camera, locomotion, damage, and vehicle interactions

import * as THREE from 'three';
import { PHYSICS } from '../core/constants.js';
import { clamp, angleDifference } from '../core/math.js';

export class Player {
  constructor(scene, collisions, camera) {
    this.scene = scene;
    this.collisions = collisions;
    this.camera = camera;

    this.position = new THREE.Vector3(-85, 0, 10);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0.2;
    this.isGrounded = true;

    this.inVehicle = false;
    this.currentVehicle = null;
    this.interactCooldown = 0;
    this.isStagedShot = false;

    this.health = 100;
    this.armor = 100;
    this.money = 350;

    this.walkCycle = 0;
    this.cameraDistance = 5.2;
    this.cameraHeight = 2.2;
    this.respawnSystem = null;

    this.buildMesh();
  }

  buildMesh() {
    this.root = new THREE.Group();
    this.root.position.copy(this.position);

    // Torso (jacket + shirt)
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.65, 0.28);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xe0564c, roughness: 0.6 }); // Coral red jacket
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    // White shirt inset
    const shirtGeo = new THREE.BoxGeometry(0.24, 0.45, 0.04);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 0.05, 0.13);
    this.torso.add(shirt);

    // Head
    const headGeo = new THREE.BoxGeometry(0.26, 0.3, 0.26);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd49b76, roughness: 0.7 });
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.62, 0);
    this.head.castShadow = true;
    this.root.add(this.head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.28, 0.12, 0.28);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.13, -0.01);
    this.head.add(hair);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.24, 0.06, 0.06);
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const glasses = new THREE.Mesh(glassesGeo, glassesMat);
    glasses.position.set(0, 0.02, 0.13);
    this.head.add(glasses);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.58, 0.14);
    armGeo.translate(0, -0.25, 0);

    this.leftArm = new THREE.Mesh(armGeo, torsoMat);
    this.leftArm.position.set(-0.35, 1.42, 0);
    this.leftArm.castShadow = true;
    this.root.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, torsoMat);
    this.rightArm.position.set(0.35, 1.42, 0);
    this.rightArm.castShadow = true;
    this.root.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
    legGeo.translate(0, -0.35, 0);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x243342, roughness: 0.8 }); // Dark denim

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.16, 0.78, 0);
    this.leftLeg.castShadow = true;
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.16, 0.78, 0);
    this.rightLeg.castShadow = true;
    this.root.add(this.rightLeg);

    this.scene.add(this.root);
  }

  setRespawnSystem(system) {
    this.respawnSystem = system;
  }

  setEffects(particles, skidmarks, sound) {
    this.fx = { particles, skidmarks };
    this.sound = sound;
  }

  takeDamage(amount) {
    if (this.health <= 0) return;

    if (this.armor > 0) {
      if (this.armor >= amount) {
        this.armor -= amount;
        return;
      } else {
        const remaining = amount - this.armor;
        this.armor = 0;
        amount = remaining;
      }
    }

    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0 && this.respawnSystem) {
      this.respawnSystem.triggerWasted();
    }
  }

  triggerBusted() {
    if (this.respawnSystem) {
      this.respawnSystem.triggerBusted();
    }
  }

  update(delta, input, trafficManager) {
    if (this.isStagedShot) return;

    if (this.interactCooldown > 0) {
      this.interactCooldown -= delta;
    }

    const wantsInteract = input.isDown('KeyF') || input.isDown('KeyE');

    if (wantsInteract && this.interactCooldown <= 0) {
      this.interactCooldown = 0.5;
      if (this.inVehicle) {
        this.exitVehicle();
      } else if (trafficManager) {
        const nearCar = trafficManager.getNearestVehicle(this.position.x, this.position.z, 3.8);
        if (nearCar) {
          this.enterVehicle(nearCar);
          return;
        }
      }
    }

    if (this.inVehicle && this.currentVehicle) {
      this.currentVehicle.update(delta, input);
      this.position.copy(this.currentVehicle.position);
      this.root.position.copy(this.position);
      return;
    }

    // Mouse camera orbit rotation
    const mouse = input.consumeMouseDelta();
    const lookSens = 0.0022;
    this.yaw -= mouse.dx * lookSens;
    this.pitch = clamp(this.pitch - mouse.dy * lookSens, -1.1, 0.7);

    // Locomotion calculation
    const move = input.getMovementVector();
    const speed = move.sprint ? PHYSICS.PLAYER_RUN_SPEED : PHYSICS.PLAYER_WALK_SPEED;

    let targetVx = 0;
    let targetVz = 0;

    if (move.forward !== 0 || move.right !== 0) {
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = -forwardZ;
      const rightZ = forwardX;

      const dirX = forwardX * move.forward + rightX * move.right;
      const dirZ = forwardZ * move.forward + rightZ * move.right;

      targetVx = dirX * speed;
      targetVz = dirZ * speed;

      const targetAngle = Math.atan2(dirX, dirZ);
      const diff = angleDifference(targetAngle, this.root.rotation.y);
      this.root.rotation.y += diff * Math.min(1.0, delta * PHYSICS.PLAYER_TURN_SPEED);

      this.walkCycle += delta * (move.sprint ? 14 : 8);
    } else {
      this.walkCycle = 0;
    }

    const accel = PHYSICS.PLAYER_ACCEL * delta;
    this.velocity.x += clamp(targetVx - this.velocity.x, -accel, accel);
    this.velocity.z += clamp(targetVz - this.velocity.z, -accel, accel);

    if (this.isGrounded && move.jump) {
      this.velocity.y = PHYSICS.PLAYER_JUMP_SPEED;
      this.isGrounded = false;
    }

    this.velocity.y -= PHYSICS.GRAVITY * delta;
    this.position.y += this.velocity.y * delta;

    const groundY = this.collisions.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    const resolved = this.collisions.resolveCircle(
      this.position.x,
      this.position.z,
      PHYSICS.PLAYER_RADIUS,
      this.position.y + 1.0
    );
    this.position.x = resolved.x;
    this.position.z = resolved.z;

    this.root.position.copy(this.position);

    const swing = Math.sin(this.walkCycle) * (move.sprint ? 0.85 : 0.5);
    this.leftArm.rotation.x = -swing;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;

    this.updateCamera(delta);
  }

  enterVehicle(vehicle) {
    this.inVehicle = true;
    this.currentVehicle = vehicle;
    vehicle.isOccupiedByPlayer = true;
    this.root.visible = false;
  }

  exitVehicle() {
    if (!this.currentVehicle) return;

    this.inVehicle = false;
    this.currentVehicle.isOccupiedByPlayer = false;

    const exitYaw = this.currentVehicle.yaw;
    const sideX = -Math.cos(exitYaw) * (this.currentVehicle.model.width * 0.5 + 0.9);
    const sideZ = Math.sin(exitYaw) * (this.currentVehicle.model.width * 0.5 + 0.9);

    this.position.set(
      this.currentVehicle.position.x + sideX,
      this.currentVehicle.position.y,
      this.currentVehicle.position.z + sideZ
    );
    this.root.position.copy(this.position);
    this.root.visible = true;

    this.currentVehicle = null;
  }

  updateCamera(delta) {
    const targetY = this.position.y + this.cameraHeight;
    const camDist = this.cameraDistance;

    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
    const offsetY = Math.sin(this.pitch) * camDist;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;

    let targetCamPos = new THREE.Vector3(
      this.position.x + offsetX,
      targetY + offsetY,
      this.position.z + offsetZ
    );

    const minCamY = this.collisions.getGroundHeight(targetCamPos.x, targetCamPos.z) + 0.6;
    if (targetCamPos.y < minCamY) {
      targetCamPos.y = minCamY;
    }

    this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * 12.0));
    this.camera.lookAt(this.position.x, targetY, this.position.z);
  }
}

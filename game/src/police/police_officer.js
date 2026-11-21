// VCPD Police Officer character model and AI tactics

import * as THREE from 'three';
import { angleDifference, clamp } from '../core/math.js';

export class PoliceOfficer {
  constructor(scene, collisions, id = 0) {
    this.scene = scene;
    this.collisions = collisions;
    this.id = id;

    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.health = 80;
    this.speed = 5.2;
    this.state = 'pursue'; // 'pursue', 'shoot', 'busted_check', 'down'
    this.shootTimer = 0;
    this.walkCycle = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.root = new THREE.Group();

    // Navy Blue Police Uniform
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.65, 0.28);
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x19273c, roughness: 0.7 });
    this.torso = new THREE.Mesh(torsoGeo, uniformMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    // Gold Police Badge
    const badgeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.03);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(-0.14, 0.12, 0.14);
    this.torso.add(badge);

    // Head
    const headGeo = new THREE.BoxGeometry(0.24, 0.28, 0.24);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a07a, roughness: 0.8 });
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.62, 0);
    this.head.castShadow = true;
    this.root.add(this.head);

    // Peaked Police Cap
    const capGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.12, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x141f30 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 0.15, 0);
    this.head.add(cap);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.13, 0.56, 0.13);
    armGeo.translate(0, -0.24, 0);
    this.leftArm = new THREE.Mesh(armGeo, uniformMat);
    this.leftArm.position.set(-0.34, 1.4, 0);
    this.root.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, uniformMat);
    this.rightArm.position.set(0.34, 1.4, 0);
    this.root.add(this.rightArm);

    // Service pistol in right hand
    const gunGeo = new THREE.BoxGeometry(0.06, 0.08, 0.2);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    this.gun = new THREE.Mesh(gunGeo, gunMat);
    this.gun.position.set(0, -0.42, 0.1);
    this.rightArm.add(this.gun);

    // Muzzle flash light
    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 6);
    this.muzzleLight.position.set(0, -0.42, 0.22);
    this.rightArm.add(this.muzzleLight);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.74, 0.18);
    legGeo.translate(0, -0.34, 0);
    this.leftLeg = new THREE.Mesh(legGeo, uniformMat);
    this.leftLeg.position.set(-0.15, 0.76, 0);
    this.leftLeg.castShadow = true;
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, uniformMat);
    this.rightLeg.position.set(0.15, 0.76, 0);
    this.rightLeg.castShadow = true;
    this.root.add(this.rightLeg);

    this.scene.add(this.root);
  }

  spawn(x, z) {
    this.position.set(x, this.collisions.getGroundHeight(x, z), z);
    this.yaw = 0;
    this.health = 80;
    this.state = 'pursue';
    this.root.position.copy(this.position);
    this.root.visible = true;
  }

  update(delta, player, wantedStars) {
    if (!this.root.visible || this.state === 'down') return;

    if (this.shootTimer > 0) {
      this.shootTimer -= delta;
      if (this.shootTimer < 0.85) {
        this.muzzleLight.intensity = 0;
      }
    }

    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    const distToPlayer = Math.hypot(dx, dz);

    // Aim and face player
    const targetAngle = Math.atan2(dx, dz);
    const diff = angleDifference(targetAngle, this.yaw);
    this.yaw += diff * Math.min(1.0, delta * 8.0);
    this.root.rotation.y = this.yaw;

    // Tactical AI decision
    if (distToPlayer > 2.8 && (distToPlayer > 18.0 || wantedStars < 3)) {
      // Run towards player
      this.state = 'pursue';
      const moveX = Math.sin(this.yaw) * this.speed * delta;
      const moveZ = Math.cos(this.yaw) * this.speed * delta;

      this.position.x += moveX;
      this.position.z += moveZ;
      this.position.y = this.collisions.getGroundHeight(this.position.x, this.position.z);

      this.walkCycle += delta * 12.0;
      const swing = Math.sin(this.walkCycle) * 0.6;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = -Math.PI * 0.35; // One hand aiming forward
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;

    } else if (wantedStars >= 3 && distToPlayer <= 28.0) {
      // Stand ground and shoot with service pistol
      this.state = 'shoot';
      this.rightArm.rotation.x = -Math.PI * 0.48;
      this.leftArm.rotation.x = -Math.PI * 0.45;

      if (this.shootTimer <= 0) {
        this.shootTimer = 1.1;
        this.muzzleLight.intensity = 2.8;

        // Apply hit damage to player
        if (Math.random() < 0.65) {
          player.takeDamage(12);
        }
      }
    }

    this.root.position.copy(this.position);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.state = 'down';
      this.root.rotation.x = Math.PI / 2;
      this.root.position.y = this.collisions.getGroundHeight(this.position.x, this.position.z) + 0.15;
    }
  }
}

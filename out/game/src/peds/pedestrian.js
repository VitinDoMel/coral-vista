// Procedural pedestrian character model and AI state

import * as THREE from 'three';
import { clamp, angleDifference } from '../core/math.js';

export class Pedestrian {
  constructor(scene, collisions, palette, id = 0) {
    this.scene = scene;
    this.collisions = collisions;
    this.id = id;

    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 2.2;
    this.state = 'walk'; // 'walk', 'flee', 'knocked'
    this.walkCycle = Math.random() * Math.PI * 2;
    this.fleeTimer = 0;

    this.buildMesh(palette);
  }

  buildMesh(palette) {
    this.root = new THREE.Group();

    // Shirt / Dress
    const shirtGeo = new THREE.BoxGeometry(0.48, 0.6, 0.26);
    const shirtMat = new THREE.MeshStandardMaterial({
      color: palette.shirtColor,
      roughness: 0.7,
    });
    this.torso = new THREE.Mesh(shirtGeo, shirtMat);
    this.torso.position.y = 1.1;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.24, 0.28, 0.24);
    const skinMat = new THREE.MeshStandardMaterial({
      color: palette.skinTone,
      roughness: 0.8,
    });
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.55, 0);
    this.head.castShadow = true;
    this.root.add(this.head);

    // Hat / Hair
    const hairGeo = new THREE.BoxGeometry(0.26, 0.12, 0.26);
    const hairMat = new THREE.MeshStandardMaterial({ color: palette.hairColor });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.12, 0);
    this.head.add(hair);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.54, 0.12);
    armGeo.translate(0, -0.22, 0);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.32, 1.35, 0);
    this.root.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.32, 1.35, 0);
    this.root.add(this.rightArm);

    // Legs / Pants
    const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.16);
    legGeo.translate(0, -0.32, 0);
    const pantsMat = new THREE.MeshStandardMaterial({
      color: palette.pantsColor,
      roughness: 0.8,
    });
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.14, 0.74, 0);
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.14, 0.74, 0);
    this.root.add(this.rightLeg);

    this.scene.add(this.root);
  }

  spawn(x, z, yaw = 0) {
    this.position.set(x, this.collisions.getGroundHeight(x, z), z);
    this.yaw = yaw;
    this.state = 'walk';
    this.speed = 1.8 + Math.random() * 0.8;
    this.root.position.copy(this.position);
    this.root.rotation.y = this.yaw;
    this.root.visible = true;
  }

  update(delta, playerPos) {
    if (!this.root.visible) return;

    if (this.state === 'flee') {
      this.fleeTimer -= delta;
      if (this.fleeTimer <= 0) {
        this.state = 'walk';
        this.speed = 2.0;
      }
    }

    // Move forward along sidewalk heading
    const moveX = Math.sin(this.yaw) * this.speed * delta;
    const moveZ = Math.cos(this.yaw) * this.speed * delta;

    this.position.x += moveX;
    this.position.z += moveZ;
    this.position.y = this.collisions.getGroundHeight(this.position.x, this.position.z);

    this.root.position.copy(this.position);
    this.root.rotation.y = this.yaw;

    // Limb animation
    this.walkCycle += delta * (this.state === 'flee' ? 14 : 7);
    const swing = Math.sin(this.walkCycle) * (this.state === 'flee' ? 0.7 : 0.4);
    this.leftArm.rotation.x = -swing;
    this.rightArm.rotation.x = swing;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
  }

  fleeFrom(dangerX, dangerZ) {
    this.state = 'flee';
    this.speed = 6.2;
    this.fleeTimer = 6.0;
    // Turn directly away from danger
    this.yaw = Math.atan2(this.position.x - dangerX, this.position.z - dangerZ);
  }
}

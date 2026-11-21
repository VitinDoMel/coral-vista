import * as THREE from 'three';
import { PALETTE } from '../core/constants.js';

// Pedestrian System: Ambient Citizens Walking on Sidewalks, Fleeing on Danger

export class PedestrianManager {
  constructor(scene, collisions, prng) {
    this.scene = scene;
    this.collisions = collisions;
    this.prng = prng;

    this.pedestrians = [];
    this.maxPeds = 24;

    this.skinColors = [0xe0a98b, 0xc68642, 0x8d5524, 0xf1c27d];
    this.clothesColors = [0xf4a7b9, 0x9be3c9, 0xfbe7b2, 0x8fd3f5, 0xffffff, 0xf7c59f, 0x5bc0de];

    this._spawnPedestrians();
  }

  _spawnPedestrians() {
    for (let i = 0; i < this.maxPeds; i++) {
      const ped = this._createPedestrian(i);
      this.pedestrians.push(ped);
    }
  }

  _createPedestrian(idx = 0) {
    const group = new THREE.Group();

    const skinCol = this.prng.choice(this.skinColors);
    const topCol = this.prng.choice(this.clothesColors);
    const botCol = this.prng.choice([0x334d66, 0xffffff, 0x4a4a50, 0x6c757d]);

    const skinMat = new THREE.MeshStandardMaterial({ color: skinCol, roughness: 0.8 });
    const topMat = new THREE.MeshStandardMaterial({ color: topCol, roughness: 0.7 });
    const botMat = new THREE.MeshStandardMaterial({ color: botCol, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221814, roughness: 0.9 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.3), topMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Head & Hair
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skinMat);
    head.position.y = 1.55;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), hairMat);
    hair.position.y = 1.68;
    group.add(hair);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), botMat);
    leftLeg.position.set(-0.14, 0.35, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), botMat);
    rightLeg.position.set(0.14, 0.35, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Spawn on Seabreeze Promenade or City Sidewalks
    const isPromenade = (idx % 2 === 0);
    let posX, posZ, dir;

    if (isPromenade) {
      posX = this.prng.range(-240, 240);
      posZ = this.prng.range(214, 222); // Promenade
      dir = (this.prng.next() > 0.5) ? 1 : -1;
    } else {
      posX = this.prng.choice([-208, -108, -8, 8, 108, 208]);
      posZ = this.prng.range(-160, 160);
      dir = (this.prng.next() > 0.5) ? 1 : -1;
    }

    group.position.set(posX, 0.28, posZ);
    this.scene.add(group);

    return {
      group,
      leftLeg,
      rightLeg,
      isPromenade,
      dir,
      speed: this.prng.range(1.2, 1.8),
      walkCycle: this.prng.range(0, Math.PI * 2),
      isFleeing: false,
      fleeTimer: 0
    };
  }

  triggerFlee(dangerPos, radius = 25) {
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      const dx = p.group.position.x - dangerPos.x;
      const dz = p.group.position.z - dangerPos.z;
      if (dx * dx + dz * dz < radius * radius) {
        p.isFleeing = true;
        p.fleeTimer = 8.0;
        // Run directly away from danger
        p.dir = Math.atan2(dx, dz);
      }
    }
  }

  update(dt, playerPos) {
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];

      if (p.isFleeing) {
        p.fleeTimer -= dt;
        if (p.fleeTimer <= 0) p.isFleeing = false;

        const fleeSpeed = 5.2;
        p.group.position.x += Math.sin(p.dir) * fleeSpeed * dt;
        p.group.position.z += Math.cos(p.dir) * fleeSpeed * dt;
        p.group.rotation.y = p.dir;

        p.walkCycle += dt * 16;
      } else {
        // Normal walk
        if (p.isPromenade) {
          p.group.position.x += p.dir * p.speed * dt;
          p.group.rotation.y = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;

          // Turn around at ends
          if (p.group.position.x > 260) p.dir = -1;
          if (p.group.position.x < -260) p.dir = 1;
        } else {
          p.group.position.z += p.dir * p.speed * dt;
          p.group.rotation.y = p.dir > 0 ? 0 : Math.PI;

          if (p.group.position.z > 180) p.dir = -1;
          if (p.group.position.z < -180) p.dir = 1;
        }

        p.walkCycle += dt * 8;
      }

      // Animate legs
      const swing = Math.sin(p.walkCycle) * 0.55;
      p.leftLeg.rotation.x = swing;
      p.rightLeg.rotation.x = -swing;
    }
  }
}

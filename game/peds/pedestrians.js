import * as THREE from 'three';
import { createSeededRng } from '../engine/rng.js';
import { X_ROADS, Z_ROADS, HALF_ROAD } from '../world/city.js';

const SHIRT_COLORS = [
  0xff7675, 0x55efc4, 0xffeaa7, 0x74b9ff, 0xa29bfe, 0xfd79a8, 0xfab1a0, 0x81ecec
];
const PANTS_COLORS = [0x2d3436, 0x3b5998, 0xdcdde1, 0x636e72, 0x574b90];
const SKIN_COLORS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];

export class PedestrianManager {
  constructor(scene, collisionWorld, seed = 1) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
    this.rng = createSeededRng(seed + 303);

    this.pedestrians = [];
    this._spawnInitialPedestrians();
  }

  _createPedestrianMesh(shirtHex, pantsHex, skinHex) {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsHex, roughness: 0.75 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221e1d, roughness: 0.85 });

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.68, 0.18), pantsMat);
    leftLeg.position.set(-0.1, 0.34, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.68, 0.18), pantsMat);
    rightLeg.position.set(0.1, 0.34, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.24), shirtMat);
    torso.position.set(0, 0.96, 0);
    torso.castShadow = true;
    group.add(torso);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.52, 0.14), skinMat);
    leftArm.position.set(-0.28, 0.96, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.52, 0.14), skinMat);
    rightArm.position.set(0.28, 0.96, 0);
    group.add(rightArm);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
    head.position.set(0, 1.44, 0);
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), hairMat);
    hair.position.set(0, 1.58, 0);
    group.add(hair);

    return { group, leftLeg, rightLeg, leftArm, rightArm };
  }

  _spawnInitialPedestrians() {
    // 1. Promenade & sidewalk pedestrians along Seabreeze Boulevard (x = 129.8 and x = 110.2)
    for (let z = -195; z <= 195; z += 15) {
      const sideX = z % 30 === 0 ? 129.6 : 133.4;
      const dir = z % 30 === 0 ? -1 : 1;
      this._addPedestrian(sideX, z, 'z', dir, -220, 220);
    }

    for (let z = -180; z <= 180; z += 24) {
      this._addPedestrian(110.4, z, 'z', z % 48 === 0 ? 1 : -1, -215, 215);
    }

    // 2. Pedestrians on downtown & cross-street sidewalks
    for (const rx of [-105, -30, 45]) {
      for (let z = -140; z <= 140; z += 45) {
        this._addPedestrian(rx + HALF_ROAD + 1.6, z, 'z', 1, -210, 210);
      }
    }
  }

  _addPedestrian(x, z, axis, dir, minCoord, maxCoord) {
    const shirt = this.rng.pick(SHIRT_COLORS);
    const pants = this.rng.pick(PANTS_COLORS);
    const skin = this.rng.pick(SKIN_COLORS);
    const parts = this._createPedestrianMesh(shirt, pants, skin);

    const y = 0.18;
    parts.group.position.set(x, y, z);
    const heading =
      axis === 'z'
        ? dir === -1
          ? 0
          : Math.PI
        : dir === 1
          ? -Math.PI * 0.5
          : Math.PI * 0.5;
    parts.group.rotation.y = heading;
    this.scene.add(parts.group);

    this.pedestrians.push({
      ...parts,
      position: new THREE.Vector3(x, y, z),
      heading,
      axis,
      dir,
      minCoord,
      maxCoord,
      walkSpeed: this.rng.range(1.6, 2.35),
      fleeSpeed: 5.8,
      state: 'walk', // 'walk' | 'flee'
      fleeTimer: 0,
      fleeDir: new THREE.Vector3(),
      cycle: this.rng.range(0, Math.PI * 2)
    });
  }

  spawnEjectedDriver(position, dangerPos) {
    const shirt = this.rng.pick(SHIRT_COLORS);
    const pants = this.rng.pick(PANTS_COLORS);
    const skin = this.rng.pick(SKIN_COLORS);
    const parts = this._createPedestrianMesh(shirt, pants, skin);

    parts.group.position.copy(position);
    this.scene.add(parts.group);

    const fleeDir = new THREE.Vector3()
      .subVectors(position, dangerPos)
      .setY(0)
      .normalize();
    if (fleeDir.lengthSq() < 0.01) fleeDir.set(1, 0, 0);

    this.pedestrians.push({
      ...parts,
      position: position.clone(),
      heading: Math.atan2(-fleeDir.x, -fleeDir.z),
      axis: 'z',
      dir: 1,
      minCoord: -220,
      maxCoord: 220,
      walkSpeed: 1.9,
      fleeSpeed: 6.2,
      state: 'flee',
      fleeTimer: 5.0,
      fleeDir,
      cycle: 0
    });
  }

  triggerPanicNear(dangerPos, radius = 38) {
    const rSq = radius * radius;
    for (const ped of this.pedestrians) {
      if (ped.position.distanceToSquared(dangerPos) < rSq) {
        ped.state = 'flee';
        ped.fleeTimer = 5.5;
        ped.fleeDir.subVectors(ped.position, dangerPos).setY(0).normalize();
        if (ped.fleeDir.lengthSq() < 0.01) {
          ped.fleeDir.set(1, 0, 0);
        }
      }
    }
  }

  update(dt) {
    const clampedDt = Math.min(dt, 0.05);

    for (const ped of this.pedestrians) {
      if (ped.state === 'flee') {
        ped.fleeTimer -= clampedDt;
        ped.position.addScaledVector(ped.fleeDir, ped.fleeSpeed * clampedDt);
        if (this.collisionWorld) {
          this.collisionWorld.resolveCircleAABB(ped.position, 0.35);
        }
        ped.heading = Math.atan2(-ped.fleeDir.x, -ped.fleeDir.z);
        ped.cycle += clampedDt * 14;
        if (ped.fleeTimer <= 0) {
          ped.state = 'walk';
        }
      } else {
        if (ped.axis === 'z') {
          ped.position.z += ped.dir * ped.walkSpeed * clampedDt;
          if (ped.position.z > ped.maxCoord) {
            ped.position.z = ped.maxCoord;
            ped.dir = -1;
          } else if (ped.position.z < ped.minCoord) {
            ped.position.z = ped.minCoord;
            ped.dir = 1;
          }
          ped.heading = ped.dir === -1 ? 0 : Math.PI;
        } else {
          ped.position.x += ped.dir * ped.walkSpeed * clampedDt;
          if (ped.position.x > ped.maxCoord) {
            ped.position.x = ped.maxCoord;
            ped.dir = -1;
          } else if (ped.position.x < ped.minCoord) {
            ped.position.x = ped.minCoord;
            ped.dir = 1;
          }
          ped.heading = ped.dir === 1 ? -Math.PI * 0.5 : Math.PI * 0.5;
        }
        ped.cycle += clampedDt * 6.5;
      }

      const swing = Math.sin(ped.cycle) * (ped.state === 'flee' ? 0.65 : 0.38);
      ped.leftLeg.rotation.x = swing;
      ped.rightLeg.rotation.x = -swing;
      if (ped.state === 'flee') {
        // Arms raised in panic while fleeing
        ped.leftArm.rotation.x = Math.PI * 0.78 + swing * 0.3;
        ped.rightArm.rotation.x = Math.PI * 0.78 - swing * 0.3;
      } else {
        ped.leftArm.rotation.x = -swing * 0.7;
        ped.rightArm.rotation.x = swing * 0.7;
      }

      ped.group.position.copy(ped.position);
      ped.group.rotation.y = ped.heading;
    }
  }
}

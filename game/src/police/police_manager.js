import * as THREE from 'three';
import { VEHICLE_TYPES } from '../vehicles/vehicle_models.js';

// CVPD Police Dispatch: Patrol Cruisers with Strobing Lightbars, Officers, Helicopter with Spotlight

export class PoliceManager {
  constructor(scene, collisions, vehicleFactory, prng) {
    this.scene = scene;
    this.collisions = collisions;
    this.factory = vehicleFactory;
    this.prng = prng;

    this.patrolCars = [];
    this.officers = [];
    this.helicopter = null;

    this.strobeTimer = 0;
    this.strobeState = false;

    this._spawnHelicopter();
    this._spawnOfficers();
    this._spawnCruisers();
  }

  _spawnCruisers() {
    // 3 CVPD Cruisers ready for high-speed intercept and wanted pursuit
    const cruiserPositions = [
      { x: -60, z: 196, yaw: -Math.PI / 2 },
      { x: -90, z: 204, yaw: -Math.PI / 2 },
      { x: 140, z: 104, yaw: Math.PI }
    ];

    for (let i = 0; i < cruiserPositions.length; i++) {
      const p = cruiserPositions[i];
      const mesh = this.factory.createVehicle(VEHICLE_TYPES.CVPD, 0x111317);
      mesh.position.set(p.x, 0, p.z);
      mesh.rotation.y = p.yaw;
      this.scene.add(mesh);

      this.patrolCars.push({
        mesh,
        x: p.x,
        z: p.z,
        yaw: p.yaw,
        speed: 0,
        targetSpeed: 24.0,
        redLight: mesh.userData.redLight,
        blueLight: mesh.userData.blueLight,
        radius: 1.8
      });
    }
  }

  _spawnOfficers() {
    // CVPD Tactical Officers on Foot (Blue uniform, cap, service holster)
    const officerPositions = [
      { x: 12, z: 211, yaw: -Math.PI * 0.4 },
      { x: 28, z: 210, yaw: -Math.PI * 0.55 },
      { x: -80, z: 92, yaw: Math.PI * 0.2 }
    ];

    const blueUniMat = new THREE.MeshStandardMaterial({ color: 0x1c3144, roughness: 0.7 });
    const darkPantsMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a07a, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x12202f, roughness: 0.6 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf5c042, metalness: 0.9, roughness: 0.2 });

    for (let p of officerPositions) {
      const group = new THREE.Group();

      // Torso with gold CVPD star badge
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.35), blueUniMat);
      torso.position.y = 1.15;
      torso.castShadow = true;
      group.add(torso);

      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), badgeMat);
      badge.position.set(-0.16, 1.35, 0.18);
      group.add(badge);

      // Head & Cap
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), skinMat);
      head.position.y = 1.66;
      group.add(head);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.42), capMat);
      cap.position.set(0, 1.82, 0.04);
      group.add(cap);

      // Legs
      const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), darkPantsMat);
      lLeg.position.set(-0.15, 0.4, 0);
      lLeg.castShadow = true;
      group.add(lLeg);

      const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), darkPantsMat);
      rLeg.position.set(0.15, 0.4, 0);
      rLeg.castShadow = true;
      group.add(rLeg);

      // Aimed Pistol
      const gunMat = new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.8 });
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.32), gunMat);
      gun.position.set(0.28, 1.25, 0.38);
      group.add(gun);

      group.position.set(p.x, 0.28, p.z);
      group.rotation.y = p.yaw;
      this.scene.add(group);

      this.officers.push({
        mesh: group,
        health: 100,
        shootCooldown: 0
      });
    }
  }

  _spawnHelicopter() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x8cd3ff, transparent: true, opacity: 0.8 });
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });

    // Fuselage
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 5.2), bodyMat);
    fuse.position.y = 0;
    fuse.castShadow = true;
    group.add(fuse);

    // White CVPD side marking
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.4, 4.0), whiteMat);
    stripe.position.set(0, 0.1, -0.2);
    group.add(stripe);

    // Cockpit Canopy
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.0), glassMat);
    glass.position.set(0, 0.2, 1.8);
    group.add(glass);

    // Tail Boom
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 4.8), bodyMat);
    tail.position.set(0, 0.4, -4.5);
    tail.castShadow = true;
    group.add(tail);

    // Main Rotor (Spinning Disc)
    const rotorGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.05, 12);
    this.mainRotor = new THREE.Mesh(rotorGeo, rotorMat);
    this.mainRotor.position.set(0, 1.2, 0);
    group.add(this.mainRotor);

    // Downward Searchlight / Spotlight (Holofote)
    const spotConeGeo = new THREE.ConeGeometry(8.5, 28, 16, 1, true);
    spotConeGeo.rotateX(Math.PI);
    const spotConeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const spotCone = new THREE.Mesh(spotConeGeo, spotConeMat);
    spotCone.position.set(0, -14, 0);
    group.add(spotCone);

    // Ground Spotlight Disc
    const discGeo = new THREE.CircleGeometry(7.0, 20);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xfffcd0,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.spotDisc = new THREE.Mesh(discGeo, discMat);
    this.spotDisc.position.y = 0.32;
    this.scene.add(this.spotDisc);

    group.position.set(20, 32, 190);
    this.scene.add(group);
    this.helicopter = group;
  }

  update(dt, playerPos, wantedStars) {
    // 1. Strobe Siren Lights (High intensity alternating flashes)
    this.strobeTimer += dt;
    if (this.strobeTimer > 0.14) {
      this.strobeTimer = 0;
      this.strobeState = !this.strobeState;

      for (let car of this.patrolCars) {
        if (car.redLight && car.blueLight) {
          if (wantedStars > 0 || this.strobeState) {
            car.redLight.material.color.setHex(this.strobeState ? 0xff1122 : 0x440000);
            car.blueLight.material.color.setHex(!this.strobeState ? 0x0088ff : 0x001144);
          }
        }
      }
    }

    // 2. Helicopter Logic (Follows player overhead, spins rotors)
    if (this.helicopter) {
      this.mainRotor.rotation.y += 24 * dt;
      if (wantedStars >= 4) {
        this.helicopter.visible = true;
        this.spotDisc.visible = true;

        // Smoothly track player position from above
        this.helicopter.position.x = THREE.MathUtils.lerp(this.helicopter.position.x, playerPos.x + 8, 2 * dt);
        this.helicopter.position.z = THREE.MathUtils.lerp(this.helicopter.position.z, playerPos.z - 12, 2 * dt);
        this.helicopter.position.y = 30 + Math.sin(Date.now() * 0.002) * 1.5;

        // Ground searchlight follows directly on player
        this.spotDisc.position.set(this.helicopter.position.x, 0.32, this.helicopter.position.z);
      } else {
        // Positioned for scenic beauty or idle patrol
        this.helicopter.position.set(40, 36, 180);
        this.spotDisc.position.set(40, 0.32, 180);
      }
    }

    // 3. Officer Aiming / Shooting at stars >= 3
    if (wantedStars >= 3) {
      for (let off of this.officers) {
        const dx = playerPos.x - off.mesh.position.x;
        const dz = playerPos.z - off.mesh.position.z;
        off.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }
}

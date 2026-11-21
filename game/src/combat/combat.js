import * as THREE from 'three';

// Weaponry, Ballistics, Raycast Shooting, and Melee Combat

export class CombatSystem {
  constructor(scene, collisions, input, camera) {
    this.scene = scene;
    this.collisions = collisions;
    this.input = input;
    this.camera = camera;

    this.weapons = {
      fists: { name: 'Fists', damage: 20, range: 2.2, ammo: Infinity },
      pistol: { name: '9mm Pistol', damage: 34, range: 65.0, ammo: 48, maxAmmo: 120 }
    };
    this.currentWeapon = 'pistol';

    this.bullets = [];
    this.flashTimer = 0;

    this._createMuzzleFlash();
  }

  _createMuzzleFlash() {
    this.flashLight = new THREE.PointLight(0xffaa33, 0, 12);
    this.scene.add(this.flashLight);

    const flashGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0 });
    this.flashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.scene.add(this.flashMesh);
  }

  update(dt, player, wantedSystem, targetPool, audio) {
    // Weapon switch with keys '1' and '2'
    if (this.input.wasJustPressed('Digit1')) this.currentWeapon = 'fists';
    if (this.input.wasJustPressed('Digit2')) this.currentWeapon = 'pistol';

    // Firing with left mouse button
    if (this.input.mouse.justDown) {
      this.attack(player, wantedSystem, targetPool, audio);
    }

    // Decay muzzle flash
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashLight.intensity = 0;
        this.flashMesh.material.opacity = 0;
      }
    }
  }

  attack(player, wantedSystem, targetPool, audio) {
    const w = this.weapons[this.currentWeapon];

    if (this.currentWeapon === 'pistol') {
      if (w.ammo <= 0) return;
      w.ammo--;

      if (audio && audio.playGunshot) {
        audio.playGunshot();
      }

      // Muzzle flash at player chest/hand
      const sinY = Math.sin(player.yaw);
      const cosY = Math.cos(player.yaw);
      const flashPos = new THREE.Vector3(
        player.position.x - sinY * 0.6 + cosY * 0.35,
        player.position.y + 1.25,
        player.position.z - cosY * 0.6 - sinY * 0.35
      );
      this.flashLight.position.copy(flashPos);
      this.flashLight.intensity = 3.5;
      this.flashMesh.position.copy(flashPos);
      this.flashMesh.material.opacity = 0.9;
      this.flashTimer = 0.08;

      // Bullet raycast along camera forward vector
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);

      this._resolveHit(player.position, camDir, w.range, w.damage, wantedSystem, targetPool);
    } else {
      // Melee Punch
      const fwd = new THREE.Vector3(-Math.sin(player.playerFacing), 0, -Math.cos(player.playerFacing));
      this._resolveHit(player.position, fwd, w.range, w.damage, wantedSystem, targetPool);
    }
  }

  _resolveHit(origin, dir, maxDist, damage, wantedSystem, targetPool) {
    if (!targetPool) return;

    // Check hit against pedestrians
    if (targetPool.pedestrians) {
      for (let i = 0; i < targetPool.pedestrians.length; i++) {
        const ped = targetPool.pedestrians[i];
        const toPed = new THREE.Vector3().subVectors(ped.group.position, origin);
        const dist = toPed.length();
        if (dist < maxDist && dist > 0.2) {
          const dot = toPed.normalize().dot(dir);
          if (dot > 0.88) { // within cone
            ped.isFleeing = true;
            ped.fleeTimer = 10.0;
            // Report crime
            wantedSystem.recordCrime('assault');
            break;
          }
        }
      }
    }

    // Check hit against police officers
    if (targetPool.policeOfficers) {
      for (let i = 0; i < targetPool.policeOfficers.length; i++) {
        const off = targetPool.policeOfficers[i];
        const toOff = new THREE.Vector3().subVectors(off.mesh.position, origin);
        const dist = toOff.length();
        if (dist < maxDist && dist > 0.2) {
          const dot = toOff.normalize().dot(dir);
          if (dot > 0.85) {
            off.health -= damage;
            wantedSystem.recordCrime('attack_police');
            break;
          }
        }
      }
    }
  }
}

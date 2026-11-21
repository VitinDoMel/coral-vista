import * as THREE from 'three';

export class CombatSystem {
  constructor(scene, player, collisionWorld) {
    this.scene = scene;
    this.player = player;
    this.collisionWorld = collisionWorld;

    this.weapons = {
      fist: { id: 'fist', name: 'Fists', damage: 22, range: 2.3, cooldown: 0.42 },
      pistol: {
        id: 'pistol',
        name: 'Coral 9mm',
        damage: 34,
        range: 95,
        cooldown: 0.26,
        clipSize: 12,
        ammoInClip: 12,
        reserveAmmo: 96
      }
    };

    this.currentWeapon = 'pistol';
    this.cooldownTimer = 0;
    this.isAiming = false;
    this.punchTimer = 0;

    this.tracers = [];
    this._attachPistolMesh();
  }

  _attachPistolMesh() {
    const gunGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x262b33,
      roughness: 0.35,
      metalness: 0.75
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x16181c,
      roughness: 0.8
    });

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.26), metalMat);
    barrel.position.set(0, -0.52, -0.12);
    gunGroup.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.08), gripMat);
    grip.position.set(0, -0.58, -0.03);
    gunGroup.add(grip);

    // Muzzle flash sprite mesh
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.92
    });
    this.muzzleFlashMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), flashMat);
    this.muzzleFlashMesh.position.set(0, -0.52, -0.28);
    this.muzzleFlashMesh.visible = false;
    gunGroup.add(this.muzzleFlashMesh);

    this.gunGroup = gunGroup;
    if (this.player && this.player.rightArmPivot) {
      this.player.rightArmPivot.add(this.gunGroup);
    }
  }

  switchWeapon(weaponId) {
    if (this.weapons[weaponId]) {
      this.currentWeapon = weaponId;
      if (this.gunGroup) {
        this.gunGroup.visible = weaponId === 'pistol';
      }
    }
  }

  reloadPistol() {
    const w = this.weapons.pistol;
    const needed = w.clipSize - w.ammoInClip;
    if (needed <= 0 || w.reserveAmmo <= 0) return;
    const transfer = Math.min(needed, w.reserveAmmo);
    w.ammoInClip += transfer;
    w.reserveAmmo -= transfer;
  }

  update(dt, input, cameraController, context) {
    const clampedDt = Math.min(dt, 0.05);
    this.cooldownTimer = Math.max(0, this.cooldownTimer - clampedDt);
    this.punchTimer = Math.max(0, this.punchTimer - clampedDt);

    this._updateTracers(clampedDt);

    // Weapon hotkeys 1 (Fists) / 2 (Coral 9mm Pistol) / R (Reload)
    if (input.consumeKeyPress('Digit1')) this.switchWeapon('fist');
    if (input.consumeKeyPress('Digit2')) this.switchWeapon('pistol');
    if (input.consumeKeyPress('KeyR')) this.reloadPistol();

    const inVehicle = Boolean(context.vehicleManager && context.vehicleManager.activeVehicle);
    if (inVehicle) {
      this.isAiming = false;
      this.muzzleFlashMesh.visible = false;
      return;
    }

    const rightMouseDown = input.mouseButtonsDown.has(2);
    const leftMouseDown = input.mouseButtonsDown.has(0);
    const leftMouseJustPressed = input.mouseButtonsJustPressed.has(0);
    const fireKeyPressed = input.consumeKeyPress('KeyE');

    this.isAiming =
      this.currentWeapon === 'pistol' && (rightMouseDown || leftMouseDown || this.cooldownTimer > 0.08);

    // Align player to camera forward direction when aiming pistol
    if (this.isAiming && cameraController) {
      const camFwd = cameraController.getForwardXZ();
      this.player.heading = Math.atan2(-camFwd.x, -camFwd.z);
      this.player.mesh.rotation.y = this.player.heading;
      this.player.rightArmPivot.rotation.x = Math.PI * 0.48;
    } else if (this.punchTimer > 0) {
      this.player.rightArmPivot.rotation.x = Math.PI * 0.55 * Math.sin((this.punchTimer / 0.25) * Math.PI);
    }

    const wantsAttack = leftMouseJustPressed || fireKeyPressed;
    if (wantsAttack && this.cooldownTimer <= 0) {
      if (this.currentWeapon === 'fist') {
        this._performMeleeAttack(context);
      } else {
        this._performPistolShot(cameraController, context);
      }
    }
  }

  _performMeleeAttack(context) {
    const w = this.weapons.fist;
    this.cooldownTimer = w.cooldown;
    this.punchTimer = 0.25;

    const forward = new THREE.Vector3(
      -Math.sin(this.player.heading),
      0,
      -Math.cos(this.player.heading)
    );
    const hitCenter = this.player.position.clone().addScaledVector(forward, 1.3);

    // Check hit on police officers
    if (context.policeManager) {
      const hitOfficer = context.policeManager.damageOfficerNear(hitCenter, 1.8, w.damage);
      if (hitOfficer) {
        context.policeManager.reportCrime('police_attack', 2);
        return;
      }
    }

    // Check hit on pedestrians
    if (context.pedestrianManager) {
      for (const ped of context.pedestrianManager.pedestrians) {
        if (ped.position.distanceTo(hitCenter) < 1.8) {
          context.pedestrianManager.triggerPanicNear(this.player.position, 28);
          if (context.policeManager) {
            context.policeManager.reportCrime('assault', 1);
          }
          break;
        }
      }
    }
  }

  _performPistolShot(cameraController, context) {
    const w = this.weapons.pistol;
    if (w.ammoInClip <= 0) {
      this.reloadPistol();
      if (w.ammoInClip <= 0) return;
    }

    w.ammoInClip--;
    this.cooldownTimer = w.cooldown;

    const muzzlePos = this.player.position
      .clone()
      .add(new THREE.Vector3(0, 1.38, 0))
      .addScaledVector(cameraController.getForwardXZ(), 0.65);

    const aimDir = new THREE.Vector3();
    cameraController.camera.getWorldDirection(aimDir);
    if (aimDir.y < -0.15) aimDir.y = -0.04;
    aimDir.normalize();

    let endPoint = muzzlePos.clone().addScaledVector(aimDir, w.range);

    // Check hit against police officers, cruisers, or vehicles
    if (context.policeManager) {
      const policeHit = context.policeManager.raycastShot(muzzlePos, aimDir, w.range, w.damage);
      if (policeHit) {
        endPoint = policeHit;
      }
      context.policeManager.reportCrime('gunshot', 1);
    }

    if (context.pedestrianManager) {
      context.pedestrianManager.triggerPanicNear(this.player.position, 44);
    }

    this._spawnShotTracer(muzzlePos, endPoint);
  }

  _spawnShotTracer(startPos, endPos) {
    this.muzzleFlashMesh.visible = true;

    const geom = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe484,
      transparent: true,
      opacity: 0.85
    });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    this.tracers.push({ line, timer: 0.075 });
  }

  _updateTracers(dt) {
    if (this.cooldownTimer < 0.18 && this.muzzleFlashMesh) {
      this.muzzleFlashMesh.visible = false;
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.timer -= dt;
      if (tr.timer <= 0) {
        this.scene.remove(tr.line);
        tr.line.geometry.dispose();
        tr.line.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}

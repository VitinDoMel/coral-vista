// Weapons and combat mechanics: fists, 9mm pistol, ammo, hitscan raycasting

import * as THREE from 'three';
import { clamp } from '../core/math.js';

export class CombatSystem {
  constructor(scene, player, camera) {
    this.scene = scene;
    this.player = player;
    this.camera = camera;

    this.weapons = {
      fist: { name: 'Fists', damage: 25, range: 2.2, fireRate: 0.45, ammo: Infinity },
      pistol: { name: '9mm Pistol', damage: 45, range: 65.0, fireRate: 0.28, ammo: 48, magSize: 12 },
    };

    this.currentWeapon = 'pistol';
    this.isAiming = false;
    this.fireTimer = 0;
    this.muzzleFlashTimer = 0;

    this.raycaster = new THREE.Raycaster();
    this.buildWeaponMeshes();
  }

  buildWeaponMeshes() {
    // 9mm Pistol low-poly model
    const gunGroup = new THREE.Group();

    const slideGeo = new THREE.BoxGeometry(0.07, 0.08, 0.24);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.2 });
    const slide = new THREE.Mesh(slideGeo, metalMat);
    slide.position.set(0, 0.05, 0.06);
    gunGroup.add(slide);

    const gripGeo = new THREE.BoxGeometry(0.06, 0.14, 0.08);
    gripGeo.rotateX(-0.25);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.04, -0.02);
    gunGroup.add(grip);

    // Muzzle flash point light and mesh
    this.muzzleLight = new THREE.PointLight(0xffa500, 0, 8);
    this.muzzleLight.position.set(0, 0.06, 0.22);
    gunGroup.add(this.muzzleLight);

    const flashGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea75 });
    this.flashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.flashMesh.position.set(0, 0.06, 0.22);
    this.flashMesh.visible = false;
    gunGroup.add(this.flashMesh);

    // Attach to player right arm
    gunGroup.position.set(0, -0.42, 0.12);
    gunGroup.rotation.x = -Math.PI / 2;
    this.player.rightArm.add(gunGroup);
    this.pistolMesh = gunGroup;
  }

  update(delta, input, wantedSystem, pedManager, policeManager, trafficManager) {
    if (this.fireTimer > 0) this.fireTimer -= delta;

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.flashMesh.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    if (this.player.inVehicle) {
      this.pistolMesh.visible = false;
      return;
    }

    // Weapon switching (keys 1 and 2)
    if (input.isDown('Digit1')) this.currentWeapon = 'fist';
    if (input.isDown('Digit2')) this.currentWeapon = 'pistol';

    this.pistolMesh.visible = (this.currentWeapon === 'pistol');

    // Aiming with right mouse button or while firing
    this.isAiming = input.mouse.rightButton || (this.currentWeapon === 'pistol' && input.mouse.leftButton);
    const crosshair = document.getElementById('crosshair');
    if (crosshair && !this.player.isStagedShot) {
      crosshair.style.display = this.isAiming ? 'block' : 'none';
    }

    // Aim stance: raise arm
    if (this.isAiming && this.currentWeapon === 'pistol') {
      this.player.rightArm.rotation.x = -Math.PI * 0.48 + this.player.pitch;
      this.player.rightArm.rotation.y = 0.15;
    }

    // Shoot / Punch with Left Click
    if (input.mouse.leftButton && this.fireTimer <= 0) {
      this.fire(wantedSystem, pedManager, policeManager, trafficManager);
    }
  }

  fire(wantedSystem, pedManager, policeManager, trafficManager) {
    const weapon = this.weapons[this.currentWeapon];
    this.fireTimer = weapon.fireRate;

    if (this.currentWeapon === 'pistol') {
      if (weapon.ammo <= 0) return;
      weapon.ammo--;

      // Muzzle flash FX
      this.flashMesh.visible = true;
      this.muzzleLight.intensity = 3.5;
      this.muzzleFlashTimer = 0.06;

      // Discharge sound notification to world
      if (wantedSystem) wantedSystem.reportCrime('gunshot', this.player.position);
      if (pedManager) pedManager.alertGunshot(this.player.position.x, this.player.position.z, 40);

      // Raycast shooting from camera center
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      const origin = this.player.position;

      // Hit test pedestrians
      if (pedManager) {
        for (const ped of pedManager.pedestrians) {
          if (!ped.root.visible) continue;
          const d = Math.hypot(ped.position.x - origin.x, ped.position.z - origin.z);
          if (d < weapon.range) {
            const ray = this.raycaster.ray;
            const targetPos = new THREE.Vector3(ped.position.x, ped.position.y + 1.1, ped.position.z);
            const distToRay = ray.distanceToPoint(targetPos);
            if (distToRay < 0.65) {
              ped.fleeFrom(origin.x, origin.z);
              if (wantedSystem) wantedSystem.reportCrime('assault', ped.position);
              break;
            }
          }
        }
      }

      // Hit test vehicles
      if (trafficManager) {
        for (const car of trafficManager.vehicles) {
          const d = Math.hypot(car.position.x - origin.x, car.position.z - origin.z);
          if (d < weapon.range) {
            const ray = this.raycaster.ray;
            const carCenter = new THREE.Vector3(car.position.x, car.position.y + 0.8, car.position.z);
            if (ray.distanceToPoint(carCenter) < 1.4) {
              car.damage(weapon.damage);
              if (wantedSystem) wantedSystem.reportCrime('vandalism', car.position);
              break;
            }
          }
        }
      }
    } else {
      // Fists punch
      if (pedManager) {
        for (const ped of pedManager.pedestrians) {
          if (!ped.root.visible) continue;
          const d = Math.hypot(ped.position.x - this.player.position.x, ped.position.z - this.player.position.z);
          if (d < weapon.range) {
            ped.fleeFrom(this.player.position.x, this.player.position.z);
            if (wantedSystem) wantedSystem.reportCrime('assault', ped.position);
            break;
          }
        }
      }
    }
  }
}

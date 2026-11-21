// Extra activities: street races, taxi fares, cash pickups, and gun/armor shop

import * as THREE from 'three';

export class ActivitiesManager {
  constructor(scene, collisions) {
    this.scene = scene;
    this.collisions = collisions;

    this.shopLocation = { x: -15, z: -45, radius: 4.5 };
    this.cashPickups = [];
    this.raceActive = false;
    this.raceCheckpoints = [
      { x: -85, z: -80 },
      { x: -85, z: 20 },
      { x: -40, z: 80 },
      { x: 10,  z: 80 },
      { x: 60,  z: -20 },
      { x: -85, z: -80 },
    ];
    this.currentCheckpoint = 0;

    this.initCashPickups();
    this.buildShopMarker();
  }

  buildShopMarker() {
    const geo = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.6 });
    this.shopMarker = new THREE.Mesh(geo, mat);
    this.shopMarker.position.set(this.shopLocation.x, 0.1, this.shopLocation.z);
    this.scene.add(this.shopMarker);
  }

  initCashPickups() {
    const spots = [
      { x: -98, z: 40 },  // Boardwalk
      { x: -115, z: -20 }, // Beach sand
      { x: 35, z: -95 },  // Downtown alley
      { x: 110, z: 120 }, // Port containers
      { x: 85, z: -45 },  // Residential garden
      { x: -65, z: 80 },  // South avenue
      { x: 145, z: 155 }, // Port crane base
      { x: -20, z: -140 }, // Bridge approach
    ];

    const dollarGeo = new THREE.BoxGeometry(0.8, 0.45, 0.12);
    const dollarMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      metalness: 0.8,
      roughness: 0.2,
    });

    for (const s of spots) {
      const mesh = new THREE.Mesh(dollarGeo, dollarMat);
      mesh.position.set(s.x, 0.8, s.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.cashPickups.push({ mesh, active: true, x: s.x, z: s.z });
    }
  }

  update(delta, player, input, hud) {
    // Spin cash pickups and check pickup collision
    for (const p of this.cashPickups) {
      if (!p.active) continue;
      p.mesh.rotation.y += delta * 2.8;

      const d = Math.hypot(player.position.x - p.x, player.position.z - p.z);
      if (d < 1.8) {
        p.active = false;
        p.mesh.visible = false;
        player.money += 150;
        if (hud) hud.showNotification('CASH PICKUP! +$150');
      }
    }

    // Check gun/armor shop proximity
    const distToShop = Math.hypot(player.position.x - this.shopLocation.x, player.position.z - this.shopLocation.z);
    if (distToShop <= this.shopLocation.radius) {
      if (hud) hud.showShopPrompt(true);

      // Buy Ammo (Key 1 or E)
      if (input.isDown('KeyE') && player.money >= 50) {
        player.money -= 50;
        hud.showNotification('PURCHASED: 9mm Ammo (+$50)');
      }
      // Buy Armor (Key 3)
      if (input.isDown('Digit3') && player.money >= 150 && player.armor < 100) {
        player.money -= 150;
        player.armor = 100;
        hud.showNotification('PURCHASED: Kevlar Body Armor');
      }
      // Repair Car (Key 4)
      if (input.isDown('Digit4') && player.inVehicle && player.currentVehicle && player.money >= 200) {
        player.money -= 200;
        player.currentVehicle.health = 100;
        hud.showNotification('PURCHASED: Full Vehicle Repair');
      }
    } else {
      if (hud) hud.showShopPrompt(false);
    }
  }
}

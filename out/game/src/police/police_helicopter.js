// CVPD Police Helicopter: 3D model, rotor animation, spotlight tracking, and aerial strafing

import * as THREE from 'three';

export class PoliceHelicopter {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 32, 0);
    this.targetAltitude = 32.0;
    this.speed = 18.0;
    this.active = false;
    this.fireTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.root = new THREE.Group();

    // Fuselage
    const bodyGeo = new THREE.BoxGeometry(2.4, 2.0, 5.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x152840, metalness: 0.6, roughness: 0.3 }); // Navy blue
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.root.add(body);

    // White stripe down fuselage
    const stripeGeo = new THREE.BoxGeometry(2.42, 0.45, 4.0);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const stripe = new THREE.Mesh(stripeGeo, whiteMat);
    stripe.position.set(0, 0, -0.2);
    this.root.add(stripe);

    // Cockpit canopy windshield
    const glassGeo = new THREE.BoxGeometry(2.2, 1.4, 2.0);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x091420, metalness: 0.9, roughness: 0.1 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.4, 2.0);
    this.root.add(glass);

    // Tail boom
    const tailGeo = new THREE.BoxGeometry(0.7, 0.8, 6.2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.3, -5.2);
    this.root.add(tail);

    // Tail fin
    const finGeo = new THREE.BoxGeometry(0.18, 1.6, 1.2);
    const fin = new THREE.Mesh(finGeo, bodyMat);
    fin.position.set(0, 0.9, -8.2);
    this.root.add(fin);

    // Top Main Rotor
    this.mainRotor = new THREE.Group();
    this.mainRotor.position.set(0, 1.25, 0.5);

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const blade1Geo = new THREE.BoxGeometry(11.0, 0.06, 0.45);
    const blade1 = new THREE.Mesh(blade1Geo, bladeMat);
    this.mainRotor.add(blade1);

    const blade2 = new THREE.Mesh(blade1Geo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    this.mainRotor.add(blade2);

    this.root.add(this.mainRotor);

    // Police Searchlight Spotlight
    this.searchlight = new THREE.SpotLight(0xfffbe6, 4.0, 90, Math.PI / 5, 0.4, 1.5);
    this.searchlight.position.set(0, -1.0, 1.8);
    this.searchlight.castShadow = true;
    this.root.add(this.searchlight);
    this.root.add(this.searchlight.target);

    // Visual Spotlight Cone Mesh
    const coneGeo = new THREE.ConeGeometry(14, 32, 16, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 16);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff6c2,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.lightCone = new THREE.Mesh(coneGeo, coneMat);
    this.lightCone.position.set(0, -1.0, 1.8);
    this.root.add(this.lightCone);

    this.root.visible = false;
    this.scene.add(this.root);
  }

  deploy(playerPos) {
    this.active = true;
    this.position.set(playerPos.x - 40, this.targetAltitude, playerPos.z - 40);
    this.root.position.copy(this.position);
    this.root.visible = true;
  }

  retire() {
    this.active = false;
    this.root.visible = false;
  }

  update(delta, player, wantedStars) {
    if (!this.active) return;

    // Spin rotor
    this.mainRotor.rotation.y += delta * 28.0;

    // Track towards player position with high-altitude hover
    const targetX = player.position.x;
    const targetZ = player.position.z;

    const dx = targetX - this.position.x;
    const dz = targetZ - this.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 8.0) {
      this.position.x += (dx / dist) * this.speed * delta;
      this.position.z += (dz / dist) * this.speed * delta;
    }

    // Maintain steady altitude
    this.position.y = this.targetAltitude;

    // Bank helicopter gently towards movement direction
    this.root.position.copy(this.position);
    const heading = Math.atan2(dx, dz);
    this.root.rotation.y = heading;
    this.root.rotation.z = -Math.sin(heading) * 0.15;
    this.root.rotation.x = 0.12;

    // Aim spotlight directly at player
    this.searchlight.target.position.copy(player.position);
    this.lightCone.lookAt(player.position);

    // Aerial gunner fire at 4+ stars
    if (wantedStars >= 4) {
      this.fireTimer -= delta;
      if (this.fireTimer <= 0) {
        this.fireTimer = 2.4;
        if (Math.random() < 0.45) {
          player.takeDamage(15);
        }
      }
    }
  }
}

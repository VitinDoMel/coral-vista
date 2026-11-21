// Coral Vista atmospheric sunset sky, lighting, and ocean environment

import * as THREE from 'three';
import { COLORS } from '../core/constants.js';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.setupLighting();
    this.setupSkyDome();
    this.setupOcean();
  }

  setupLighting() {
    this.ambientLight = new THREE.HemisphereLight(
      COLORS.SKY_HORIZON,
      COLORS.SUN_AMBIENT,
      0.95
    );
    this.scene.add(this.ambientLight);

    // Warm dramatic sunset sun at low angle from West
    this.sunLight = new THREE.DirectionalLight(COLORS.SUN, 2.2);
    this.sunLight.position.set(-180, 55, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.bias = -0.0004;

    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  setupSkyDome() {
    // Large hemisphere dome with sunset gradient canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#1c072b'); // Dark violet zenith
    grad.addColorStop(0.35, '#561a49'); // Magenta purple
    grad.addColorStop(0.65, '#e04c3c'); // Fiery rose red
    grad.addColorStop(0.85, '#ff833b'); // Warm coral orange
    grad.addColorStop(1.0, '#ffbc61'); // Bright sunset gold at horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const skyGeo = new THREE.SphereGeometry(650, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Sun disc mesh
    const sunGeo = new THREE.CircleGeometry(24, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffe6a3,
      side: THREE.DoubleSide,
    });
    this.sunDisc = new THREE.Mesh(sunGeo, sunMat);
    this.sunDisc.position.set(-520, 160, 80);
    this.sunDisc.lookAt(0, 0, 0);
    this.scene.add(this.sunDisc);
  }

  setupOcean() {
    const oceanGeo = new THREE.PlaneGeometry(500, 500, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);

    this.oceanMat = new THREE.MeshStandardMaterial({
      color: COLORS.WATER,
      roughness: 0.15,
      metalness: 0.85,
    });

    this.ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.ocean.position.set(-250, -1.0, 0);
    this.scene.add(this.ocean);
    this.oceanPositions = oceanGeo.attributes.position;
    this.initialY = new Float32Array(this.oceanPositions.count);
    for (let i = 0; i < this.oceanPositions.count; i++) {
      this.initialY[i] = this.oceanPositions.getY(i);
    }
  }

  update(delta, time) {
    if (this.oceanPositions) {
      for (let i = 0; i < this.oceanPositions.count; i++) {
        const x = this.oceanPositions.getX(i);
        const z = this.oceanPositions.getZ(i);
        const wave = Math.sin(x * 0.08 + time * 2.2) * 0.35 +
                     Math.cos(z * 0.06 + time * 1.8) * 0.25;
        this.oceanPositions.setY(i, this.initialY[i] + wave);
      }
      this.oceanPositions.needsUpdate = true;
    }
  }

  follow(targetPosition) {
    this.sunLight.position.x = targetPosition.x - 180;
    this.sunLight.position.z = targetPosition.z + 30;
    this.sunLight.target.position.copy(targetPosition);
    this.sunLight.target.updateMatrixWorld();
  }
}

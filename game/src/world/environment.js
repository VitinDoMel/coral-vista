// Coral Vista sun-soaked atmosphere: gradient sky, brilliant sun, turquoise ocean

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
    // Sun-soaked hemisphere: clear blue sky to golden beach sand
    this.ambientLight = new THREE.HemisphereLight(
      0x7ec5f8, // Vibrant tropical sky blue
      0xffe6c2, // Warm sand ambient
      1.35
    );
    this.scene.add(this.ambientLight);

    // Warm, brilliant low-angle sun
    this.sunLight = new THREE.DirectionalLight(COLORS.SUN, 2.85);
    this.sunLight.position.set(-180, 80, -30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 450;
    this.sunLight.shadow.bias = -0.0003;

    const d = 140;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  setupSkyDome() {
    // Rich sun-soaked gradient: vivid tropical blue down to peach and golden sunset
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    // Above horizon (zenith at y=0 down to equator at y=256)
    grad.addColorStop(0.0,  '#1565c0'); // Deep tropical blue at top pole
    grad.addColorStop(0.18, '#1e88e5'); // Rich clear sky blue
    grad.addColorStop(0.32, '#42a5f5'); // Bright afternoon cyan-blue
    grad.addColorStop(0.42, '#80d8ff'); // Radiant tropical azure
    grad.addColorStop(0.47, '#ffe082'); // Golden sunset warmth just above horizon
    grad.addColorStop(0.50, '#ff8a65'); // Warm peach coral right at horizon line
    // Below horizon
    grad.addColorStop(0.54, '#ff7043');
    grad.addColorStop(1.0,  '#bcaaa4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    const skyGeo = new THREE.SphereGeometry(700, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Bright sun disc
    const sunGeo = new THREE.CircleGeometry(28, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffde7,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunDisc = new THREE.Mesh(sunGeo, sunMat);
    this.sunDisc.position.set(-450, 160, -80);
    this.sunDisc.lookAt(0, 0, 0);
    this.scene.add(this.sunDisc);
  }

  setupOcean() {
    // Wide radiant tropical ocean stretching across the entire western horizon
    const oceanW = 480;
    const oceanL = 520;
    const oceanGeo = new THREE.PlaneGeometry(oceanW, oceanL, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);

    // Luminous tropical turquoise ocean with specular sheen
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x00bcd4, // Vibrant turquoise cyan
      roughness: 0.12,
      metalness: 0.75,
    });

    this.ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.ocean.position.set(-112 - oceanW * 0.5, -0.6, 0);
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
        const wave = Math.sin(x * 0.08 + time * 2.0) * 0.28 +
                     Math.cos(z * 0.06 + time * 1.6) * 0.2;
        this.oceanPositions.setY(i, this.initialY[i] + wave);
      }
      this.oceanPositions.needsUpdate = true;
    }
  }

  follow(targetPosition) {
    this.sunLight.position.x = targetPosition.x - 180;
    this.sunLight.position.z = targetPosition.z - 30;
    this.sunLight.target.position.copy(targetPosition);
    this.sunLight.target.updateMatrixWorld();
  }
}

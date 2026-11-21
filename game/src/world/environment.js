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
      0x64b5f6, // Tropical sky blue
      0xffe0b2, // Warm sand ambient
      1.25
    );
    this.scene.add(this.ambientLight);

    // Warm, brilliant low-angle sun
    this.sunLight = new THREE.DirectionalLight(COLORS.SUN, 2.8);
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
    grad.addColorStop(0.0, '#1976d2'); // Rich tropical blue at zenith
    grad.addColorStop(0.38, '#42a5f5'); // Bright afternoon blue
    grad.addColorStop(0.68, '#ff8a65'); // Warm coral peach
    grad.addColorStop(0.86, '#ffb74d'); // Sunset apricot gold
    grad.addColorStop(1.0, '#ffe082'); // Bright golden horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    const skyGeo = new THREE.SphereGeometry(700, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Bright sun disc
    const sunGeo = new THREE.CircleGeometry(28, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffde7,
      side: THREE.DoubleSide,
    });
    this.sunDisc = new THREE.Mesh(sunGeo, sunMat);
    this.sunDisc.position.set(-450, 160, -80);
    this.sunDisc.lookAt(0, 0, 0);
    this.scene.add(this.sunDisc);
  }

  setupOcean() {
    // Ocean begins right at the beach edge (x = -118) and stretches west
    const oceanW = 350;
    const oceanL = 500;
    const oceanGeo = new THREE.PlaneGeometry(oceanW, oceanL, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);

    // Vibrant tropical turquoise ocean with specular reflections
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0097a7, // Turquoise cyan
      roughness: 0.15,
      metalness: 0.7,
    });

    this.ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.ocean.position.set(-118 - oceanW * 0.5, -0.6, 0);
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

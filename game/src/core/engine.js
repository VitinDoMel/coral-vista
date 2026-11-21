// Three.js renderer and scene management engine

import * as THREE from 'three';
import { COLORS } from './constants.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.FOG);
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, 0.0032);

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.2, 800);
    this.camera.position.set(0, 10, 20);

    this.clock = new THREE.Clock();
    this.updatables = [];

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  addUpdatable(object) {
    this.updatables.push(object);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      for (let i = 0; i < this.updatables.length; i++) {
        this.updatables[i].update(delta, time);
      }

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }
}

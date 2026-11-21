import * as THREE from 'three';
import { InputController } from './input.js';
import { ThirdPersonCamera } from './camera.js';
import { CollisionWorld } from '../world/collision.js';
import { setupSkyAndLighting, buildCoralVistaCity } from '../world/city.js';
import { PlayerController } from '../player/player.js';

class CoralVistaEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.params = new URLSearchParams(window.location.search);
    this.seed = Number(this.params.get('seed') || 1) || 1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.2,
      2000
    );

    this.collisionWorld = new CollisionWorld();
    this.skyInfo = setupSkyAndLighting(this.scene);
    this.cityGroup = buildCoralVistaCity(this.scene, this.collisionWorld, this.seed);

    this.input = new InputController(this.canvas);
    this.cameraController = new ThirdPersonCamera(this.camera, this.collisionWorld);
    this.player = new PlayerController(this.scene, this.collisionWorld);

    // Orient camera initially looking north-northeast down Seabreeze Boulevard
    // showing palm trees, pastel Art Deco hotels, painted road stripes, beach & turquoise sea
    this.cameraController.setAngles(0.28, 0.14);
    this.cameraController.updateForFootTarget(this.player.position, 0.016, true);

    this.lastTime = performance.now();
    this._bindResize();
  }

  _bindResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  step(dt) {
    const mouseDelta = this.input.consumeMouseDelta();
    this.cameraController.applyMouseDelta(mouseDelta.dx, mouseDelta.dy);

    this.player.update(dt, this.input, this.cameraController);
    this.cameraController.updateForFootTarget(this.player.position, dt);

    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  start() {
    const tick = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.step(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

const engine = new CoralVistaEngine();
window.__CORAL_VISTA__ = engine;
engine.start();

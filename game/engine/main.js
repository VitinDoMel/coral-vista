import * as THREE from 'three';
import { InputController } from './input.js';
import { ThirdPersonCamera } from './camera.js';
import { CollisionWorld } from '../world/collision.js';
import { setupSkyAndLighting, buildCoralVistaCity } from '../world/city.js';
import { PlayerController } from '../player/player.js';
import { CombatSystem } from '../player/combat.js';
import { VehicleManager } from '../vehicles/vehicleManager.js';
import { TrafficManager } from '../traffic/traffic.js';
import { PedestrianManager } from '../peds/pedestrians.js';
import { PoliceManager } from '../police/police.js';

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
    this.combat = new CombatSystem(this.scene, this.player, this.collisionWorld);
    this.vehicleManager = new VehicleManager(this.scene, this.collisionWorld, this.seed);
    this.trafficManager = new TrafficManager(this.scene, this.collisionWorld, this.seed);
    this.pedestrianManager = new PedestrianManager(this.scene, this.collisionWorld, this.seed);
    this.policeManager = new PoliceManager(this.scene, this.collisionWorld);

    // Orient camera initially looking north-northeast down Seabreeze Boulevard
    // showing palm trees, pastel Art Deco hotels, painted road stripes, beach & turquoise sea
    this.cameraController.setAngles(0.28, 0.14);
    this.cameraController.updateForFootTarget(this.player.position, 0.016, true);

    if (this.params.get('test_police') === '1') {
      this._setupPolicePreview();
    }

    this.lastTime = performance.now();
    this._bindResize();
  }

  _setupPolicePreview() {
    this.policeManager.setWantedStars(4, this.player.position);
    const c0 = this.policeManager.cruisers[0];
    if (c0) {
      c0.position.set(118.2, 0, 12.5);
      c0.heading = 2.65;
      c0.sirenTimer = 0.05;
      c0.updateSirenLights(0);
      c0.mesh.position.copy(c0.position);
      c0.mesh.rotation.y = c0.heading;
    }
    const c1 = this.policeManager.cruisers[1];
    if (c1) {
      c1.position.set(123.8, 0, 8.0);
      c1.heading = -2.45;
      c1.sirenTimer = 0.30;
      c1.updateSirenLights(0);
      c1.mesh.position.copy(c1.position);
      c1.mesh.rotation.y = c1.heading;
    }
    if (this.policeManager.cruisers[2]) {
      this.policeManager.cruisers[2].position.set(119.5, 0, -2.0);
      this.policeManager.cruisers[2].heading = 3.0;
      this.policeManager.cruisers[2].mesh.position.copy(this.policeManager.cruisers[2].position);
      this.policeManager.cruisers[2].mesh.rotation.y = 3.0;
    }
    if (this.policeManager.officers[0]) {
      this.policeManager.officers[0].position.set(115.6, 0.18, 14.5);
      this.policeManager.officers[0].mesh.position.copy(this.policeManager.officers[0].position);
    }
    if (this.policeManager.officers[1]) {
      this.policeManager.officers[1].position.set(126.2, 0.18, 10.5);
      this.policeManager.officers[1].mesh.position.copy(this.policeManager.officers[1].position);
    }
    this.policeManager.helicopter.placeAndAimAt(
      new THREE.Vector3(114.5, 11.2, -8.0),
      new THREE.Vector3(120.5, 0.045, 6.0),
      2.85
    );
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

    this.vehicleManager.update(
      dt,
      this.input,
      this.player,
      this.cameraController,
      this.trafficManager,
      this.pedestrianManager,
      this.policeManager
    );

    if (this.vehicleManager.activeVehicle) {
      this.cameraController.updateForVehicleTarget(this.vehicleManager.activeVehicle, dt);
    } else {
      this.player.update(dt, this.input, this.cameraController);
      this.cameraController.updateForFootTarget(this.player.position, dt);
    }

    this.combat.update(dt, this.input, this.cameraController, {
      vehicleManager: this.vehicleManager,
      pedestrianManager: this.pedestrianManager,
      policeManager: this.policeManager
    });

    this.policeManager.update(dt, this.player, this.vehicleManager);
    if (this.params.get('test_police') === '1') {
      this._setupPolicePreview();
    }
    this.trafficManager.update(dt, this.player.position, this.vehicleManager.activeVehicle);
    this.pedestrianManager.update(dt);

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

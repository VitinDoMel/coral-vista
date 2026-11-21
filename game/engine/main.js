import * as THREE from 'three';
import { InputController } from './input.js';
import { ThirdPersonCamera } from './camera.js';
import { SaveStorage } from './storage.js';
import { applyDeterministicShot } from './shots.js';
import { CollisionWorld } from '../world/collision.js';
import { setupSkyAndLighting, buildCoralVistaCity } from '../world/city.js';
import { PlayerController } from '../player/player.js';
import { CombatSystem } from '../player/combat.js';
import { VehicleManager } from '../vehicles/vehicleManager.js';
import { TrafficManager } from '../traffic/traffic.js';
import { PedestrianManager } from '../peds/pedestrians.js';
import { PoliceManager } from '../police/police.js';
import { MissionManager } from '../missions/missions.js';
import { UIManager } from '../ui/hud.js';
import { EffectsManager } from '../fx/particles.js';
import { AudioEngine } from '../audio/audio.js';

class CoralVistaEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiRoot = document.getElementById('ui-root');
    this.params = new URLSearchParams(window.location.search);
    this.seed = Number(this.params.get('seed') || 1) || 1;
    this.shotName = this.params.get('shot') || null;

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
    this.missionManager = new MissionManager(
      this.scene,
      this.player,
      this.vehicleManager,
      this.policeManager
    );
    this.effects = new EffectsManager(this.scene, this.uiRoot);
    this.audio = new AudioEngine();

    this.uiManager = new UIManager(this.uiRoot, {
      onNewGame: () => this.startNewGame(),
      onContinueGame: () => this.loadSavedGame(),
      onSaveGame: () => this.saveCurrentGame()
    });

    this.cameraController.setAngles(0.28, 0.14);
    this.cameraController.updateForFootTarget(this.player.position, 0.016, true);

    if (this.shotName) {
      applyDeterministicShot(this, this.shotName);
    }

    this.uiManager.update(this.buildUIState());
    this.shotFrameCount = 0;
    if (this.shotName) {
      if (this.shotName !== 'map') {
        this.renderer.render(this.scene, this.camera);
      }
      this.shotFrameCount = 1;
    }
    this.lastTime = performance.now();
    this._bindResize();
  }

  startNewGame() {
    this.cameraController.overrideActive = false;
    this.player.position.set(124.5, 0.18, 28);
    this.player.health = 100;
    this.player.armor = 50;
    this.player.money = 1250;
    this.policeManager.setWantedStars(0);
    this.missionManager.startMission(0, true);
  }

  saveCurrentGame() {
    SaveStorage.saveGame({
      missionIndex: this.missionManager.currentMissionIndex,
      money: this.player.money,
      health: this.player.health,
      armor: this.player.armor,
      playerX: this.player.position.x,
      playerZ: this.player.position.z,
      completedMissions: this.missionManager.currentMissionIndex
    });
    this.missionManager.showNotification(
      'GAME SAVED',
      'Progress stored locally (localStorage)'
    );
  }

  loadSavedGame() {
    this.cameraController.overrideActive = false;
    const data = SaveStorage.loadGame();
    if (!data) {
      this.startNewGame();
      return;
    }
    this.player.position.set(data.playerX ?? 124.5, 0.18, data.playerZ ?? 28);
    this.player.money = data.money ?? 1250;
    this.player.health = data.health ?? 100;
    this.player.armor = data.armor ?? 50;
    this.missionManager.startMission(data.missionIndex ?? 0, true);
    this.missionManager.showNotification('PROGRESS LOADED', 'Saved session restored');
  }

  buildUIState() {
    const m = this.missionManager.getCurrentMission();
    const objPos = this.missionManager.getActiveObjectivePosition();
    const dist = Math.hypot(
      this.player.position.x - objPos.x,
      this.player.position.z - objPos.z
    );

    const w = this.combat.weapons[this.combat.currentWeapon];
    const weaponText =
      w.id === 'pistol'
        ? `CORAL 9MM • ${w.ammoInClip} / ${w.reserveAmmo}`
        : 'FISTS • MELEE';

    const inVehicle = Boolean(this.vehicleManager.activeVehicle);

    return {
      missionTitle: m ? `MISSION ${m.id}/5 — ${m.title.toUpperCase()}` : 'CORAL VISTA',
      objectiveText: this.missionManager.getActiveObjectiveText(),
      objectiveDistance: dist,
      objectivePos: objPos,
      currentMissionIndex: this.missionManager.currentMissionIndex,
      completedMissions:
        this.shotName === 'map' ? 2 : this.missionManager.currentMissionIndex,
      money: this.player.money,
      wantedStars: this.policeManager.wantedStars,
      weaponText,
      health: this.player.health,
      armor: this.player.armor,
      activeVehicle: this.vehicleManager.activeVehicle,
      radioOn: this.audio.radioEnabled,
      showCrosshair: !inVehicle && this.combat.currentWeapon === 'pistol',
      activeDialogue: this.missionManager.activeDialogue,
      notification: this.missionManager.notification,
      respawnNotice: this.policeManager.lastRespawnNotice,
      interactionPrompt: this.missionManager.getNearbyInteractionPrompt(),
      playerPos: this.player.position,
      cameraYaw: this.cameraController.yaw,
      trafficEntries: this.trafficManager.entries,
      policeCruisers: this.policeManager.cruisers
    };
  }

  _bindResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.shotName) {
        this.uiManager.update(this.buildUIState());
        this.renderer.render(this.scene, this.camera);
      }
    });
  }

  step(dt) {
    if (this.shotName) {
      if (this.shotFrameCount < 2) {
        applyDeterministicShot(this, this.shotName);
        this.uiManager.update(this.buildUIState());
        if (this.shotName !== 'map') {
          this.renderer.render(this.scene, this.camera);
        }
        this.shotFrameCount++;
      }
      this.input.endFrame();
      return;
    }

    // Global UI hotkeys: M (Big Map) / Escape (Pause) / B (Radio toggle)
    if (this.input.consumeKeyPress('KeyM') && this.uiManager.mode !== 'title') {
      const nextMode = this.uiManager.mode === 'map' ? 'gameplay' : 'map';
      this.uiManager.setMode(nextMode, this.buildUIState());
      this.effects.setVignetteVisible(nextMode === 'gameplay');
    }
    if (this.input.consumeKeyPress('Escape') && this.uiManager.mode !== 'title') {
      const nextMode =
        this.uiManager.mode === 'paused' || this.uiManager.mode === 'map'
          ? 'gameplay'
          : 'paused';
      this.uiManager.setMode(nextMode, this.buildUIState());
      this.effects.setVignetteVisible(nextMode === 'gameplay');
    }
    if (this.input.consumeKeyPress('KeyB') && this.vehicleManager.activeVehicle) {
      this.audio.toggleRadio();
    }

    if (this.uiManager.mode === 'gameplay') {
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

      const activeCar = this.vehicleManager.activeVehicle;
      if (activeCar) {
        this.cameraController.updateForVehicleTarget(activeCar, dt);
        if (activeCar.lastImpact) {
          this.effects.spawnSparks(activeCar.lastImpact.pos, 10);
          this.audio.playImpact(activeCar.lastImpact.intensity);
          activeCar.lastImpact = null;
        }
      } else {
        this.player.update(dt, this.input, this.cameraController);
        this.cameraController.updateForFootTarget(this.player.position, dt);
      }

      this.combat.update(dt, this.input, this.cameraController, {
        vehicleManager: this.vehicleManager,
        pedestrianManager: this.pedestrianManager,
        policeManager: this.policeManager,
        effects: this.effects,
        audio: this.audio
      });

      this.policeManager.update(dt, this.player, this.vehicleManager);
      this.missionManager.update(dt, this.input, this.combat);
      this.trafficManager.update(dt, this.player.position, activeCar);
      this.pedestrianManager.update(dt);
      this.effects.update(dt, this.vehicleManager);
      this.audio.update(dt, activeCar, this.policeManager.wantedStars);
    }

    this.uiManager.update(this.buildUIState());
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  start() {
    const tick = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.step(dt);
      if (this.shotName && this.shotFrameCount >= 2) return;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

const engine = new CoralVistaEngine();
window.__CORAL_VISTA__ = engine;
engine.start();

// HEATWAVE: Coral Vista - Main game orchestrator

import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { InputManager } from './core/input.js';
import { StorageManager } from './core/storage.js';
import { TextureFactory } from './world/textures.js';
import { CollisionSystem } from './world/collisions.js';
import { Environment } from './world/environment.js';
import { CityBuilder } from './world/city.js';
import { Player } from './player/player.js';
import { CombatSystem } from './player/combat.js';
import { RespawnSystem } from './player/respawn_system.js';
import { VehicleModelFactory } from './vehicles/vehicle_models.js';
import { Vehicle } from './vehicles/vehicle.js';
import { CarCamera } from './vehicles/car_camera.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { PedestrianManager } from './peds/ped_manager.js';
import { WantedSystem } from './police/wanted_system.js';
import { PoliceManager } from './police/police_manager.js';
import { MissionManager } from './missions/mission_manager.js';
import { ActivitiesManager } from './missions/activities.js';
import { HUD } from './ui/hud.js';
import { MenuManager } from './ui/menus.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.engine = new Engine(this.canvas);
    this.input = new InputManager(this.canvas);
    this.storage = new StorageManager();
    this.textures = new TextureFactory();
    this.collisions = new CollisionSystem();
    this.vehicleModels = new VehicleModelFactory();

    this.wanted = new WantedSystem();
    this.police = new PoliceManager(this.engine.scene, this.collisions, this.vehicleModels);

    this.initWorld();
    this.hud = new HUD();
    this.menus = new MenuManager(this, this.storage);

    this.handleShotMode();
    this.engine.start();
  }

  initWorld() {
    this.environment = new Environment(this.engine.scene);
    this.city = new CityBuilder(this.engine.scene, this.collisions, this.textures);
    this.city.build();

    this.player = new Player(this.engine.scene, this.collisions, this.engine.camera);
    this.respawn = new RespawnSystem(this.player);
    this.player.setRespawnSystem(this.respawn);

    this.combat = new CombatSystem(this.engine.scene, this.player, this.engine.camera);
    this.carCamera = new CarCamera(this.engine.camera);

    this.traffic = new TrafficManager(this.engine.scene, this.collisions, this.vehicleModels);
    this.pedestrians = new PedestrianManager(this.engine.scene, this.collisions);

    this.missions = new MissionManager(this.engine.scene, this.player, this.wanted);
    this.activities = new ActivitiesManager(this.engine.scene, this.collisions);

    this.engine.addUpdatable({
      update: (delta, time) => {
        if (this.menus.isPaused || this.menus.isMapOpen) return;

        this.environment.update(delta, time);
        this.traffic.update(delta, this.player.position);
        this.pedestrians.update(delta, this.player.position);
        this.police.update(delta, this.player, this.wanted);
        this.player.update(delta, this.input, this.traffic);
        this.combat.update(delta, this.input, this.wanted, this.pedestrians, this.police, this.traffic);
        this.missions.update(delta, this.player, this.hud);
        this.activities.update(delta, this.player, this.input, this.hud);
        this.respawn.update(delta);

        if (this.hud) {
          this.hud.update(this.player, this.wanted, this.missions, this.police, this.combat);
        }

        if (!this.player.isStagedShot && this.player.inVehicle && this.player.currentVehicle) {
          this.carCamera.update(delta, this.player.currentVehicle);
        }

        this.environment.follow(this.player.position);
      }
    });
  }

  startNewGame() {
    this.missions.startCurrentMission();
    this.hud.showNotification('HEATWAVE: CORAL VISTA STARTED');
  }

  saveGame() {
    this.storage.save({
      missionIndex: this.missions.currentMissionIndex,
      player: this.player,
      combat: this.combat,
    });
    this.hud.showNotification('GAME SAVED');
  }

  loadGame() {
    const data = this.storage.load();
    if (!data) return;

    this.missions.currentMissionIndex = data.missionIndex ?? 0;
    this.player.money = data.money ?? 350;
    this.player.health = data.health ?? 100;
    this.player.armor = data.armor ?? 100;
    if (this.combat?.weapons?.pistol) {
      this.combat.weapons.pistol.ammo = data.ammo ?? 48;
    }
    if (data.position) {
      this.player.position.set(data.position.x, data.position.y, data.position.z);
      this.player.root.position.copy(this.player.position);
    }
    this.missions.updateBeaconPosition();
    this.missions.startCurrentMission();
    this.hud.showNotification('GAME LOADED');
  }

  handleShotMode() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;

    this.player.isStagedShot = true;
    this.menus.closeTitleMenu();

    if (shot === 'chase') {
      this.wanted.setStars(3);
      this.missions.currentMissionIndex = 0;
      this.missions.state = 'active';

      const playerCarModel = this.vehicleModels.createCarMesh('sports', 0xe62e2d);
      const playerCar = new Vehicle(this.engine.scene, this.collisions, playerCarModel, 'sports');
      playerCar.setPosition(-88.5, 16, 0);
      playerCar.speed = 29.0;
      this.player.enterVehicle(playerCar);

      const policeConfigs = [
        { x: -84.0, z: 12, yaw: -0.08, speed: 28.5 },
        { x: -88.5, z: 6,  yaw: 0.0,   speed: 28.0 },
        { x: -92.5, z: 3,  yaw: 0.05,  speed: 27.5 },
      ];

      for (let i = 0; i < policeConfigs.length; i++) {
        const cfg = policeConfigs[i];
        const copModel = this.vehicleModels.createCarMesh('police', 0x152238);
        const copCar = new Vehicle(this.engine.scene, this.collisions, copModel, 'police');
        copCar.setPosition(cfg.x, cfg.z, cfg.yaw);
        copCar.speed = cfg.speed;

        if (copModel.mesh.userData.lightbar) {
          copModel.mesh.userData.lightbar.red.visible = i % 2 === 0;
          copModel.mesh.userData.lightbar.blue.visible = i % 2 !== 0;
        }
      }

      this.engine.camera.position.set(-89.5, 3.8, -3.0);
      this.engine.camera.lookAt(-87.5, 1.8, 22.0);

      this.hud.update(this.player, this.wanted, this.missions, this.police, this.combat);

    } else if (shot === 'foot') {
      this.missions.currentMissionIndex = 0;
      this.missions.activeDialogue = {
        speaker: 'Nina Vega',
        text: 'Rafa, Los Manta are demanding their cut. Find a sports coupe and bring it to their garage.',
      };

      this.player.position.set(-91.5, 0.22, 24);
      this.player.yaw = 0.22;
      this.player.pitch = 0.08;
      this.player.root.position.copy(this.player.position);
      this.player.root.rotation.y = 0.25;

      this.engine.camera.position.set(-89.2, 2.4, 15.0);
      this.engine.camera.lookAt(-91.8, 1.6, 27.0);

      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';

      this.hud.update(this.player, this.wanted, this.missions, this.police, this.combat);

    } else if (shot === 'map') {
      this.menus.mapRoot.style.display = 'flex';
      this.menus.isMapOpen = true;
      this.menus.drawLargeMap();

    } else if (shot === 'title') {
      this.menus.titleRoot.style.display = 'flex';
      this.menus.isTitleOpen = true;
      this.engine.camera.position.set(-135, 55, 85);
      this.engine.camera.lookAt(-35, 14, -25);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

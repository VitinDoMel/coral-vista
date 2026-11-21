// HEATWAVE: Coral Vista - Main game orchestrator

import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { InputManager } from './core/input.js';
import { TextureFactory } from './world/textures.js';
import { CollisionSystem } from './world/collisions.js';
import { Environment } from './world/environment.js';
import { CityBuilder } from './world/city.js';
import { Player } from './player/player.js';
import { VehicleModelFactory } from './vehicles/vehicle_models.js';
import { Vehicle } from './vehicles/vehicle.js';
import { CarCamera } from './vehicles/car_camera.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { PedestrianManager } from './peds/ped_manager.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.engine = new Engine(this.canvas);
    this.input = new InputManager(this.canvas);
    this.textures = new TextureFactory();
    this.collisions = new CollisionSystem();
    this.vehicleModels = new VehicleModelFactory();

    this.initWorld();
    this.handleShotMode();
    this.engine.start();
  }

  initWorld() {
    this.environment = new Environment(this.engine.scene);
    this.city = new CityBuilder(this.engine.scene, this.collisions, this.textures);
    this.city.build();

    this.player = new Player(this.engine.scene, this.collisions, this.engine.camera);
    this.carCamera = new CarCamera(this.engine.camera);

    this.traffic = new TrafficManager(this.engine.scene, this.collisions, this.vehicleModels);
    this.pedestrians = new PedestrianManager(this.engine.scene, this.collisions);

    this.engine.addUpdatable({
      update: (delta, time) => {
        this.environment.update(delta, time);
        this.traffic.update(delta, this.player.position);
        this.pedestrians.update(delta, this.player.position);
        this.player.update(delta, this.input, this.traffic);

        if (!this.player.isStagedShot && this.player.inVehicle && this.player.currentVehicle) {
          this.carCamera.update(delta, this.player.currentVehicle);
        }

        this.environment.follow(this.player.position);
      }
    });
  }

  handleShotMode() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;

    this.player.isStagedShot = true;

    if (shot === 'chase') {
      // Player driving cherry red sports coupe along Ocean Boulevard
      const playerCarModel = this.vehicleModels.createCarMesh('sports', 0xe62e2d);
      const playerCar = new Vehicle(this.engine.scene, this.collisions, playerCarModel, 'sports');
      playerCar.setPosition(-88.5, 16, 0);
      playerCar.speed = 29.0;
      this.player.enterVehicle(playerCar);

      // 3 Police cruisers in hot pursuit visible directly in camera frame
      const policeConfigs = [
        { x: -84.0, z: 12, yaw: -0.08, speed: 28.5 }, // Flanking left lane attempting PIT
        { x: -88.5, z: 6,  yaw: 0.0,   speed: 28.0 }, // Right behind rear bumper
        { x: -92.5, z: 3,  yaw: 0.05,  speed: 27.5 }, // Following on right side
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

      // Camera positioned high behind showing full chase action
      this.engine.camera.position.set(-89.5, 3.8, -3.0);
      this.engine.camera.lookAt(-87.5, 1.8, 22.0);

    } else if (shot === 'foot') {
      // Scenic promenade vista: Rafa on the palm-lined sidewalk, avenue with traffic, Art Déco buildings and ocean
      this.player.position.set(-91.5, 0.22, 24);
      this.player.yaw = 0.22;
      this.player.pitch = 0.08;
      this.player.root.position.copy(this.player.position);
      this.player.root.rotation.y = 0.25;

      this.engine.camera.position.set(-89.2, 2.4, 15.0);
      this.engine.camera.lookAt(-91.8, 1.6, 27.0);

      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';

    } else if (shot === 'aerial') {
      // Magnificent aerial vista of Coral Vista from over the bay
      this.engine.camera.position.set(-145, 68, 80);
      this.engine.camera.lookAt(-30, 14, -30);

    } else if (shot === 'title') {
      this.engine.camera.position.set(-125, 48, 90);
      this.engine.camera.lookAt(-45, 14, -20);

    } else if (shot === 'map') {
      this.engine.camera.position.set(0, 190, 0);
      this.engine.camera.lookAt(0, 0, 0);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

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

        if (this.player.inVehicle && this.player.currentVehicle) {
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

    if (shot === 'chase') {
      // Player driving sports car fast along Ocean Boulevard
      const playerCarModel = this.vehicleModels.createCarMesh('sports', 0xff3b30);
      const playerCar = new Vehicle(this.engine.scene, this.collisions, playerCarModel, 'sports');
      playerCar.setPosition(-88.8, 15, 0); // North-bound lane
      playerCar.speed = 28.0;
      this.player.enterVehicle(playerCar);

      // 3 Police cruisers pursuing right behind with active emergency lights
      const policeOffsets = [
        { x: -88.8, z: -14 },
        { x: -84.2, z: -22 },
        { x: -93.4, z: -24 },
      ];

      for (let i = 0; i < policeOffsets.length; i++) {
        const off = policeOffsets[i];
        const copModel = this.vehicleModels.createCarMesh('police', 0x152238);
        const copCar = new Vehicle(this.engine.scene, this.collisions, copModel, 'police');
        copCar.setPosition(off.x, off.z, 0);
        copCar.speed = 26.5;

        // Animate lightbar
        if (copModel.mesh.userData.lightbar) {
          copModel.mesh.userData.lightbar.red.visible = i % 2 === 0;
          copModel.mesh.userData.lightbar.blue.visible = i % 2 !== 0;
        }
      }

      // Camera positioned dramatic behind-left
      this.engine.camera.position.set(-91.5, 3.2, 5.5);
      this.engine.camera.lookAt(-88.8, 1.4, 28);
      this.carCamera.currentYaw = 0;

    } else if (shot === 'foot') {
      this.player.position.set(-98, 0.2, 12); // On wooden beach boardwalk
      this.player.yaw = 0.35;
      this.player.pitch = 0.08;
      this.player.root.position.copy(this.player.position);
      this.player.root.rotation.y = -2.5;

      this.engine.camera.position.set(-96.2, 1.8, 8.5);
      this.engine.camera.lookAt(-98, 1.5, 12);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';

    } else if (shot === 'title') {
      this.engine.camera.position.set(-95, 42, 110);
      this.engine.camera.lookAt(-40, 12, -30);

    } else if (shot === 'map') {
      this.engine.camera.position.set(0, 190, 0);
      this.engine.camera.lookAt(0, 0, 0);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

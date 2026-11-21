import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { InputManager } from './core/input.js';
import { PRNG } from './core/math.js';
import { TextureFactory } from './world/textures.js';
import { PropsFactory } from './world/props.js';
import { CollisionSystem } from './world/collisions.js';
import { Environment } from './world/environment.js';
import { City } from './world/city.js';
import { Player } from './player/player.js';
import { VehicleManager } from './vehicles/vehicle_manager.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { PedestrianManager } from './peds/pedestrian_manager.js';
import { VEHICLE_TYPES } from './vehicles/vehicle_models.js';

// Entry Point & Orchestrator for HEATWAVE: Coral Vista (R2)

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = parseInt(params.get('seed') || '1', 10);

  const prng = new PRNG(seed);
  const engine = new Engine(canvas);
  const input = new InputManager(canvas);

  const textures = new TextureFactory();
  const props = new PropsFactory();
  const collisions = new CollisionSystem(32);

  const environment = new Environment(engine.scene);
  const city = new City(engine.scene, collisions, textures, props, prng);
  const player = new Player(engine.scene, collisions, input, engine.camera);

  const vehicleManager = new VehicleManager(engine.scene, collisions, input, engine.camera);
  const trafficManager = new TrafficManager(engine.scene, collisions, vehicleManager.factory, prng);
  const pedestrianManager = new PedestrianManager(engine.scene, collisions, prng);

  // Screenshot configurations
  if (shot === 'foot') {
    // Stunning vista along Seabreeze Boulevard:
    // Left: Art-deco pastel boulevard & street lamps; Right: Palms, golden beach, turquoise ocean
    player.position.set(19, 0.35, 214);
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = -Math.PI * 0.48;
    player.yaw = -Math.PI * 0.5;
    player.pitch = 0.08;
    player._updateCamera();
    environment.updateFollow(player.position);

    // Place a couple pedestrians walking in the frame
    if (pedestrianManager.pedestrians.length >= 2) {
      pedestrianManager.pedestrians[0].group.position.set(32, 0.35, 215);
      pedestrianManager.pedestrians[0].dir = -1;
      pedestrianManager.pedestrians[0].group.rotation.y = Math.PI / 2;

      pedestrianManager.pedestrians[1].group.position.set(45, 0.35, 217);
      pedestrianManager.pedestrians[1].dir = -1;
      pedestrianManager.pedestrians[1].group.rotation.y = Math.PI / 2;
    }
  } else if (shot === 'chase') {
    // Player in Red Sports car speeding along Seabreeze Boulevard
    const sportsCar = vehicleManager.vehicles[0];
    if (sportsCar) {
      sportsCar.controller.position.set(50, 0, 196);
      sportsCar.controller.yaw = -Math.PI / 2;
      sportsCar.controller.speed = 26.0;
      sportsCar.controller.mesh.position.set(50, 0, 196);
      sportsCar.controller.mesh.rotation.y = -Math.PI / 2;
      vehicleManager.playerVehicle = sportsCar;
      player.mesh.visible = false;

      // Position 3/4 camera ahead of player vehicle
      engine.camera.position.set(70, 3.2, 186);
      engine.camera.lookAt(new THREE.Vector3(45, 1.2, 198));
    }
  } else {
    environment.updateFollow(player.position);
  }

  engine.addUpdatable((dt) => {
    if (!shot) {
      if (vehicleManager.playerVehicle) {
        vehicleManager.update(dt, player);
      } else {
        player.update(dt);
        vehicleManager.update(dt, player);
      }

      trafficManager.update(dt, player.position, vehicleManager.playerVehicle);
      pedestrianManager.update(dt, player.position);
      environment.updateFollow(player.position);
      input.postUpdate();
    }
  });

  engine.start();

  if (shot) {
    if (shot === 'foot') {
      player._updateCamera();
    }
    environment.updateFollow(player.position);
    engine.renderOnce();
  }
});

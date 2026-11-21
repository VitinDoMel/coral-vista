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
import { CombatSystem } from './combat/combat.js';
import { WantedSystem } from './police/wanted_system.js';
import { PoliceManager } from './police/police_manager.js';
import { RespawnSystem } from './player/respawn_system.js';
import { VEHICLE_TYPES } from './vehicles/vehicle_models.js';

// Entry Point & Orchestrator for HEATWAVE: Coral Vista (R3)

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

  const combat = new CombatSystem(engine.scene, collisions, input, engine.camera);
  const wanted = new WantedSystem();
  const police = new PoliceManager(engine.scene, collisions, vehicleManager.factory, prng);
  const respawn = new RespawnSystem(player, wanted, vehicleManager);

  // Screenshot configurations
  if (shot === 'foot') {
    // Beautiful composition on Seabreeze Promenade sidewalk
    player.position.set(21, 0.35, 215);
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = -Math.PI * 0.48;
    player.yaw = -Math.PI * 0.5;
    player.pitch = 0.08;
    player._updateCamera();
    environment.updateFollow(player.position);

    // Pedestrians walking
    if (pedestrianManager.pedestrians.length >= 2) {
      pedestrianManager.pedestrians[0].group.position.set(34, 0.35, 215);
      pedestrianManager.pedestrians[0].dir = -1;
      pedestrianManager.pedestrians[0].group.rotation.y = Math.PI / 2;

      pedestrianManager.pedestrians[1].group.position.set(48, 0.35, 217);
      pedestrianManager.pedestrians[1].dir = -1;
      pedestrianManager.pedestrians[1].group.rotation.y = Math.PI / 2;
    }

    // Officer on the promenade
    if (police.officers.length > 0) {
      police.officers[0].mesh.position.set(38, 0.35, 212);
      police.officers[0].mesh.rotation.y = Math.PI / 2;
    }
  } else if (shot === 'chase') {
    // High-Stakes 3-Star Police Pursuit Composition
    wanted.setStars(3);

    // 1. Red sports car speeding forward along Seabreeze Boulevard (+X)
    const sportsCar = vehicleManager.vehicles[0];
    if (sportsCar) {
      sportsCar.controller.position.set(48, 0, 196);
      sportsCar.controller.yaw = Math.PI / 2;
      sportsCar.controller.speed = 28.0;
      sportsCar.mesh.position.set(48, 0, 196);
      sportsCar.mesh.rotation.y = Math.PI / 2;
      vehicleManager.playerVehicle = sportsCar;
      player.mesh.visible = false;
    }

    // 2. Trailing CVPD Interceptors right behind sports car (-X) with Glowing Red/Blue Lightbars
    if (police.patrolCars.length >= 2) {
      const c1 = police.patrolCars[0];
      c1.mesh.position.set(32, 0, 194.5);
      c1.mesh.rotation.y = Math.PI / 2 - 0.06;
      c1.redLight.material.color.setHex(0xff0022);
      c1.blueLight.material.color.setHex(0x0088ff);

      const c2 = police.patrolCars[1];
      c2.mesh.position.set(16, 0, 198);
      c2.mesh.rotation.y = Math.PI / 2 + 0.08;
      c2.redLight.material.color.setHex(0xff0022);
      c2.blueLight.material.color.setHex(0x0088ff);
    }

    // 3. CVPD Searchlight Helicopter hovering above
    if (police.helicopter) {
      police.helicopter.visible = true;
      police.helicopter.position.set(36, 20, 190);
      police.spotDisc.visible = true;
      police.spotDisc.position.set(48, 0.32, 196);
    }

    // 4. Dramatic 3/4 camera ahead of player vehicle looking back at the oncoming pursuit
    engine.camera.position.set(62, 2.2, 191);
    engine.camera.lookAt(new THREE.Vector3(42, 1.1, 196));
    environment.updateFollow(new THREE.Vector3(48, 0, 196));
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

      const targetPool = {
        pedestrians: pedestrianManager.pedestrians,
        policeOfficers: police.officers
      };
      combat.update(dt, player, wanted, targetPool);
      police.update(dt, player.position, wanted.stars);
      respawn.update(dt);

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
      environment.updateFollow(player.position);
    }
    engine.renderOnce();
  }
});

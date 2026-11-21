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
import { MissionManager } from './missions/mission_manager.js';
import { HUD } from './ui/hud.js';
import { FullMapView } from './ui/map_view.js';
import { MenuManager } from './ui/menus.js';
import { FXManager } from './fx/particles.js';
import { SynthAudio } from './audio/synth_audio.js';

// Entry Point & Orchestrator for HEATWAVE: Coral Vista (R4)

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const hudCanvas = document.getElementById('hud-canvas');
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

  const fx = new FXManager(engine.scene);
  const audio = new SynthAudio();

  const missions = new MissionManager();
  const hud = new HUD(hudCanvas);
  const mapView = new FullMapView(hudCanvas);
  const menus = new MenuManager(hudCanvas);

  let isMapOpen = false;

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

    // Active Dialogue for foot screenshot
    missions.showDialogue('Nina Vega', "Rafa, Los Manta left their sports car on Seabreeze Blvd. Grab it!", 999);

    if (pedestrianManager.pedestrians.length >= 2) {
      pedestrianManager.pedestrians[0].group.position.set(34, 0.35, 215);
      pedestrianManager.pedestrians[0].dir = -1;
      pedestrianManager.pedestrians[0].group.rotation.y = Math.PI / 2;

      pedestrianManager.pedestrians[1].group.position.set(48, 0.35, 217);
      pedestrianManager.pedestrians[1].dir = -1;
      pedestrianManager.pedestrians[1].group.rotation.y = Math.PI / 2;
    }

    if (police.officers.length > 0) {
      police.officers[0].mesh.position.set(40, 0.35, 212);
      police.officers[0].mesh.rotation.y = Math.PI / 2;
    }
  } else if (shot === 'chase') {
    // High-Stakes 3-Star Police Pursuit Composition
    wanted.setStars(3);

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

    if (police.patrolCars.length >= 2) {
      const c1 = police.patrolCars[0];
      c1.mesh.position.set(32, 0, 194.5);
      c1.mesh.rotation.y = Math.PI / 2 - 0.06;
      c1.redLight.material.color.setHex(0xff0022);
      c1.blueLight.material.color.setHex(0x001133);

      const c2 = police.patrolCars[1];
      c2.mesh.position.set(16, 0, 198);
      c2.mesh.rotation.y = Math.PI / 2 + 0.08;
      c2.redLight.material.color.setHex(0x330005);
      c2.blueLight.material.color.setHex(0x0077ff);
    }

    if (police.helicopter) {
      police.helicopter.visible = true;
      police.helicopter.position.set(36, 13.5, 194);
      police.helicopter.rotation.x = 0.12;
      police.spotDisc.visible = true;
      police.spotDisc.position.set(48, 0.32, 196);
    }

    engine.camera.position.set(62, 2.2, 191);
    engine.camera.lookAt(new THREE.Vector3(42, 1.1, 196));
    environment.updateFollow(new THREE.Vector3(48, 0, 196));

    // Dynamic Tire Smoke & Skidmarks
    fx.addSkidmark(new THREE.Vector3(44, 0.1, 196), Math.PI / 2);
    fx.addSkidmark(new THREE.Vector3(38, 0.1, 196), Math.PI / 2);
    fx.emitSmoke(new THREE.Vector3(46, 0.4, 196), new THREE.Vector3(0, 0.6, 0), true);
    fx.emitSmoke(new THREE.Vector3(45, 0.4, 196.5), new THREE.Vector3(0, 0.8, 0), true);
  } else if (shot === 'title') {
    // Aerial panoramic view of the sun-soaked city
    engine.camera.position.set(-60, 52, 110);
    engine.camera.lookAt(new THREE.Vector3(30, 8, 200));
    environment.updateFollow(new THREE.Vector3(0, 0, 150));
  } else if (shot === 'map') {
    // Handled purely by 2D vector map render
  } else {
    environment.updateFollow(player.position);
  }

  engine.addUpdatable((dt) => {
    if (shot === 'map') {
      mapView.render({ x: 21, z: 215 }, 1, missions.cash);
      return;
    }

    if (shot === 'title') {
      menus.renderTitle(hudCanvas.width || 1280, hudCanvas.height || 720);
      return;
    }

    if (shot === 'foot' || shot === 'chase') {
      hud.render(player, vehicleManager, wanted, combat, missions, false);
      return;
    }

    // Normal interactive gameplay
    if (input.wasJustPressed('KeyM')) {
      isMapOpen = !isMapOpen;
    }
    if (input.wasJustPressed('Escape')) {
      menus.state = (menus.state === 'paused') ? 'playing' : 'paused';
    }

    if (menus.state === 'playing' && !isMapOpen) {
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
      combat.update(dt, player, wanted, targetPool, audio);
      police.update(dt, player.position, wanted.stars);
      respawn.update(dt);
      missions.update(dt, player, wanted);
      fx.update(dt, vehicleManager.playerVehicle);

      if (vehicleManager.playerVehicle) {
        const spdFrac = Math.min(1.0, Math.abs(vehicleManager.playerVehicle.controller.speed) / 30.0);
        audio.updateEngine(spdFrac);
      }
      audio.updateSiren(wanted.stars > 0);

      trafficManager.update(dt, player.position, vehicleManager.playerVehicle);
      pedestrianManager.update(dt, player.position);
      environment.updateFollow(player.position);
    }

    input.postUpdate();

    // UI Rendering
    if (isMapOpen) {
      mapView.render(player.position, missions.currentMissionIndex + 1, missions.cash);
    } else if (menus.state === 'paused') {
      menus.renderPause(window.innerWidth, window.innerHeight);
    } else {
      hud.render(player, vehicleManager, wanted, combat, missions, false);
    }
  });

  engine.start();
});

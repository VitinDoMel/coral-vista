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

// Entry Point & Orchestrator for HEATWAVE: Coral Vista

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

  // Position player and camera for specific screenshot requirements
  if (shot === 'foot') {
    // Stunning vista along Seabreeze Boulevard:
    // Left: Art-deco pastel boulevard & street lamps; Right: Palms, golden beach, turquoise ocean
    player.position.set(16, 0.35, 213.5);
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = -Math.PI * 0.48;
    player.yaw = -Math.PI * 0.5;
    player.pitch = 0.08;
    player._updateCamera();
    environment.updateFollow(player.position);
  } else {
    environment.updateFollow(player.position);
  }

  engine.addUpdatable((dt) => {
    if (!shot) {
      player.update(dt);
      environment.updateFollow(player.position);
      input.postUpdate();
    }
  });

  engine.start();

  // If in shot mode, render once deterministically
  if (shot) {
    player._updateCamera();
    environment.updateFollow(player.position);
    engine.renderOnce();
  }
});

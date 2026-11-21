// HEATWAVE: Coral Vista - Main game orchestrator

import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { InputManager } from './core/input.js';
import { TextureFactory } from './world/textures.js';
import { CollisionSystem } from './world/collisions.js';
import { Environment } from './world/environment.js';
import { CityBuilder } from './world/city.js';
import { Player } from './player/player.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.engine = new Engine(this.canvas);
    this.input = new InputManager(this.canvas);
    this.textures = new TextureFactory();
    this.collisions = new CollisionSystem();

    this.initWorld();
    this.handleShotMode();
    this.engine.start();
  }

  initWorld() {
    this.environment = new Environment(this.engine.scene);
    this.city = new CityBuilder(this.engine.scene, this.collisions, this.textures);
    this.city.build();

    this.player = new Player(this.engine.scene, this.collisions, this.engine.camera);

    this.engine.addUpdatable({
      update: (delta, time) => {
        this.environment.update(delta, time);
        this.player.update(delta, this.input);
        this.environment.follow(this.player.position);
      }
    });
  }

  handleShotMode() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;

    // Deterministic staging for screenshot evaluation
    if (shot === 'foot') {
      this.player.position.set(-85, 0, 15);
      this.player.yaw = 0.4;
      this.player.pitch = 0.12;
      this.player.root.position.copy(this.player.position);
      this.player.root.rotation.y = -2.6;
      this.engine.camera.position.set(-83.2, 1.8, 11.8);
      this.engine.camera.lookAt(-85, 1.5, 15);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';
    } else if (shot === 'title') {
      this.engine.camera.position.set(-85, 45, 120);
      this.engine.camera.lookAt(-40, 15, -40);
    } else if (shot === 'map') {
      this.engine.camera.position.set(0, 180, 0);
      this.engine.camera.lookAt(0, 0, 0);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

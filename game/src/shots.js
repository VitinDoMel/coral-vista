// HEATWAVE: Coral Vista - Deterministic screenshot staging for ?shot=chase|foot|map|title

import * as THREE from 'three';
import { Vehicle } from './vehicles/vehicle.js';

export function applyShot(game, shot) {
  if (!shot) return false;

  game.player.isStagedShot = true;
  game.menus.closeTitleMenu();

  const instructions = document.getElementById('instructions');
  if (instructions) instructions.style.display = 'none';

  if (shot === 'chase') {
    game.wanted.setStars(3);
    game.missions.currentMissionIndex = 0;
    game.missions.state = 'active';

    // Player sports car speeding northbound along Seabreeze Boulevard
    const playerCarModel = game.vehicleModels.createCarMesh('sports', 0xe62e2d);
    const playerCar = new Vehicle(game.engine.scene, game.collisions, playerCarModel, 'sports');
    playerCar.setEffects(game.particles, game.skidmarks, game.sound);
    playerCar.setPosition(-86.5, 24.0, 0.0);
    playerCar.speed = 32.0;
    game.player.enterVehicle(playerCar);

    // 3 CVPD Police Cruisers pursuing aggressively with illuminated red/blue emergency lightbars
    const policeConfigs = [
      { x: -83.5, z: 14.0, yaw: -0.06, speed: 31.0 },
      { x: -88.5, z: 8.5,  yaw: 0.04,  speed: 30.5 },
      { x: -84.2, z: 1.0,  yaw: 0.0,   speed: 29.5 },
    ];

    for (let i = 0; i < policeConfigs.length; i++) {
      const cfg = policeConfigs[i];
      const copModel = game.vehicleModels.createCarMesh('police', 0x152238);
      const copCar = new Vehicle(game.engine.scene, game.collisions, copModel, 'police');
      copCar.setEffects(game.particles, game.skidmarks, game.sound);
      copCar.setPosition(cfg.x, cfg.z, cfg.yaw);
      copCar.speed = cfg.speed;

      if (copModel.mesh.userData.lightbar) {
        copModel.mesh.userData.lightbar.red.visible = true;
        copModel.mesh.userData.lightbar.blue.visible = true;
      }
    }

    // Emergency red and blue ambient glow on the road
    const redGlow = new THREE.PointLight(0xff0044, 2.5, 16);
    redGlow.position.set(-84.0, 2.2, 14.0);
    game.engine.scene.add(redGlow);
    const blueGlow = new THREE.PointLight(0x00e5ff, 2.5, 16);
    blueGlow.position.set(-83.0, 2.2, 14.0);
    game.engine.scene.add(blueGlow);

    // CVPD Police helicopter hovering with spotlight on fleeing car
    if (game.police?.helicopter) {
      game.police.helicopter.deploy({ x: -86.5, z: 24.0 });
      game.police.helicopter.position.set(-87.0, 11.5, 17.5);
      game.police.helicopter.root.position.copy(game.police.helicopter.position);
      game.police.helicopter.root.rotation.set(0.12, 0.35, -0.05);
      game.police.helicopter.root.scale.set(1.35, 1.35, 1.35);
      game.police.helicopter.root.visible = true;
      game.police.helicopter.searchlight.target.position.set(-86.5, 0.5, 23.0);
      game.police.helicopter.searchlight.target.updateMatrixWorld();
    }

    // Tire smoke puffs and skid tracks on asphalt
    game.skidmarks.addSkidmark(-87.5, 0.12, 22.0, 0.0, 0.65);
    game.skidmarks.addSkidmark(-85.5, 0.12, 22.0, 0.0, 0.65);
    game.particles.spawnTireSmoke(-87.5, 0.2, 22.0, 0, 0, 10);
    game.particles.spawnTireSmoke(-85.5, 0.2, 22.0, 0, 0, 10);

    // 3/4 front-lateral camera looking back at fleeing car & pursuers
    game.engine.camera.position.set(-93.5, 3.2, 33.0);
    game.engine.camera.lookAt(-86.5, 1.4, 16.0);

    game.hud.update(game.player, game.wanted, game.missions, game.police, game.combat);
    return true;

  } else if (shot === 'foot') {
    game.missions.currentMissionIndex = 0;
    game.missions.activeDialogue = {
      speaker: 'Nina Vega',
      text: 'Rafa, Los Manta are demanding their cut. Find a sports coupe on Seabreeze Boulevard and bring it to their garage.',
    };

    game.player.position.set(-91.5, 0.22, 24);
    game.player.yaw = 0.22;
    game.player.pitch = 0.08;
    game.player.root.position.copy(game.player.position);
    game.player.root.rotation.y = 0.25;

    game.engine.camera.position.set(-89.2, 2.4, 15.0);
    game.engine.camera.lookAt(-91.8, 1.6, 27.0);

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    game.hud.update(game.player, game.wanted, game.missions, game.police, game.combat);
    return true;

  } else if (shot === 'map') {
    game.menus.mapRoot.style.display = 'flex';
    game.menus.isMapOpen = true;
    game.menus.drawLargeMap();
    return true;

  } else if (shot === 'title') {
    game.menus.titleRoot.style.display = 'flex';
    game.menus.isTitleOpen = true;
    game.hud.hide();
    game.engine.camera.position.set(-135, 55, 85);
    game.engine.camera.lookAt(-35, 14, -25);
    return true;
  }

  return false;
}

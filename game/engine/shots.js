import * as THREE from 'three';

/**
 * Deterministic screenshot composer for ?shot=chase|foot|map|title&seed=1
 */
export function applyDeterministicShot(engine, shotName) {
  if (!shotName) return false;

  const {
    player,
    camera,
    cameraController,
    vehicleManager,
    policeManager,
    missionManager,
    combat,
    uiManager,
    effects
  } = engine;

  if (shotName === 'chase') {
    // 1-chase.jpg (cover):
    // Player red Manta GT in FOREGROUND (~9m from 3/4 lateral camera), heading south (+Z)
    // along Seabreeze Boulevard at sunset, with 3 CVPD cruisers 11-16m BEHIND him
    // with lit red/blue roof lightbars, FULL CVPD helicopter above with ground spotlight circle,
    // ★★★ wanted level, circular minimap, English mission objective, tire skid marks, traffic & pedestrians.
    uiManager.setMode('gameplay');
    if (effects) effects.setVignetteVisible(true);

    player.money = 4850;
    player.health = 92;
    player.armor = 78;

    missionManager.currentMissionIndex = 4; // Mission 5: Bridge Escape
    missionManager.activeDialogue = null;
    missionManager.notification = null;

    // Seat Rafa Sol inside the coral-red Manta GT in the FOREGROUND, clear of bottom-left vitals HUD
    const playerCar = vehicleManager.vehicles[0];
    playerCar.position.set(123.4, 0, 12.2);
    playerCar.heading = Math.PI + 0.16;
    playerCar.speed = 31.0; // ~112 KM/H
    playerCar.steerAngle = -0.18;
    playerCar.isDrifting = true;
    playerCar.driver = 'player';
    playerCar._syncVisuals(0.016);

    vehicleManager.activeVehicle = playerCar;
    player.mesh.visible = false;
    player.position.copy(playerCar.position);
    player.heading = playerCar.heading;

    if (effects && !engine._chaseEffectsSeeded) {
      effects.prepopulateDriftTrack(playerCar, 11);
      engine._chaseEffectsSeeded = true;
    }

    // Set 3 Wanted Stars (★★★☆☆) and stage 3 CVPD cruisers 11-16m BEHIND the player car (to the north)
    policeManager.setWantedStars(3, player.position);

    const c0 = policeManager.cruisers[0];
    if (c0) {
      c0.position.set(118.2, 0, 0.5);
      c0.heading = Math.PI - 0.12;
      c0.sirenTimer = 0.05; // RED box active
      c0.updateSirenLights(0);
      c0.mesh.position.copy(c0.position);
      c0.mesh.rotation.y = c0.heading;
    }

    const c1 = policeManager.cruisers[1];
    if (c1) {
      c1.position.set(123.6, 0, -2.8);
      c1.heading = Math.PI + 0.08;
      c1.sirenTimer = 0.30; // BLUE box active
      c1.updateSirenLights(0);
      c1.mesh.position.copy(c1.position);
      c1.mesh.rotation.y = c1.heading;
    }

    const c2 = policeManager.cruisers[2];
    if (c2) {
      c2.position.set(115.6, 0, -5.8);
      c2.heading = Math.PI - 0.04;
      c2.sirenTimer = 0.08; // RED box active
      c2.updateSirenLights(0);
      c2.mesh.position.copy(c2.position);
      c2.mesh.rotation.y = c2.heading;
    }

    // Place FULL CVPD Helicopter in upper-center sky shining spotlight circle onto road near Manta GT
    policeManager.helicopter.placeAndAimAt(
      new THREE.Vector3(114.8, 12.2, -16.5),
      new THREE.Vector3(121.0, 0.045, 5.5),
      Math.PI - 0.25
    );

    // 3/4 lateral camera ~9.5m ahead-right of the player car looking north-northwest back along the chase
    cameraController.overrideActive = true;
    cameraController.yaw = 0.34;
    camera.position.set(129.6, 4.15, 21.8);
    camera.lookAt(120.2, 1.75, -2.5);
    return true;
  }

  if (shotName === 'foot') {
    // 2-foot.jpg: On foot on Seabreeze Blvd promenade with pedestrians, palms,
    // pistol aiming reticle, and Mission 1 dialogue box.
    uiManager.setMode('gameplay');
    if (effects) effects.setVignetteVisible(true);
    if (vehicleManager.activeVehicle) {
      vehicleManager.activeVehicle.driver = null;
      vehicleManager.activeVehicle = null;
    }
    player.mesh.visible = true;
    player.position.set(129.8, 0.2, 34.0);
    player.heading = 0.15;
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = player.heading;
    player.money = 3250;

    combat.switchWeapon('pistol');
    combat.isAiming = true;
    player.rightArmPivot.rotation.x = Math.PI * 0.48;

    policeManager.setWantedStars(0);
    missionManager.startMission(0, true);

    cameraController.overrideActive = true;
    cameraController.yaw = 0.18;
    camera.position.set(131.6, 2.55, 40.2);
    camera.lookAt(127.5, 1.85, 12.0);
    return true;
  }

  if (shotName === 'map') {
    // 3-map.jpg: Big tactical map of Coral Vista with colored districts, 5 numbered missions,
    // POIs, GPS route, Story Progress 2/5 panel, CVPD 3/5 stars matching chase HUD, and legend.
    if (effects) effects.setVignetteVisible(false);
    player.position.set(120.0, 0.18, 18.0);
    player.money = 4850;
    policeManager.setWantedStars(3);
    missionManager.currentMissionIndex = 2; // Story Progress 2/5 completed
    uiManager.setMode('map', engine.buildUIState());
    return true;
  }

  if (shotName === 'title') {
    // 4-title.jpg: Title screen overlay (no HUD, tagline, footer) over aerial sunset view of Coral Vista
    if (effects) effects.setVignetteVisible(true);
    policeManager.setWantedStars(0);
    uiManager.setMode('title');
    cameraController.overrideActive = true;
    camera.position.set(148.0, 26.0, 72.0);
    camera.lookAt(105.0, 6.0, -45.0);
    return true;
  }

  return false;
}

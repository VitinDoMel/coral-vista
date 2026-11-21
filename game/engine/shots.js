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
    uiManager
  } = engine;

  if (shotName === 'chase') {
    // 1-chase.jpg (cover):
    // Player driving Manta GT on Seabreeze Blvd at sunset,
    // 3/4 rear-lateral camera, 3 CVPD cruisers right behind with lit red/blue lightbars,
    // FULL CVPD Helicopter in frame with spotlight circle on ground,
    // ★★★ wanted level, circular minimap, mission objective on HUD, traffic & pedestrians visible.
    uiManager.setMode('gameplay');
    player.money = 4850;
    player.health = 92;
    player.armor = 78;

    missionManager.currentMissionIndex = 4; // Mission 5 chase / Seabreeze pursuit
    missionManager.activeDialogue = null;
    missionManager.notification = null;

    // Seat Rafa Sol inside the coral-red Manta GT sports coupe
    const playerCar = vehicleManager.vehicles[0];
    playerCar.position.set(121.8, 0, 6.2);
    playerCar.heading = -0.06;
    playerCar.speed = 29.5; // ~106 KM/H
    playerCar.steerAngle = -0.14;
    playerCar.driver = 'player';
    playerCar._syncVisuals(0.016);

    vehicleManager.activeVehicle = playerCar;
    player.mesh.visible = false;
    player.position.copy(playerCar.position);
    player.heading = playerCar.heading;

    // Set 3 Wanted Stars (★★★☆☆) and stage 3 CVPD cruisers right behind & flanking the player car
    // positioned clearly above the bottom-left HUD panels
    policeManager.setWantedStars(3, player.position);

    const c0 = policeManager.cruisers[0];
    if (c0) {
      c0.position.set(117.4, 0, 9.5);
      c0.heading = -0.14;
      c0.sirenTimer = 0.05; // RED box active
      c0.updateSirenLights(0);
      c0.mesh.position.copy(c0.position);
      c0.mesh.rotation.y = c0.heading;
    }

    const c1 = policeManager.cruisers[1];
    if (c1) {
      c1.position.set(123.6, 0, 11.4);
      c1.heading = 0.10;
      c1.sirenTimer = 0.30; // BLUE box active
      c1.updateSirenLights(0);
      c1.mesh.position.copy(c1.position);
      c1.mesh.rotation.y = c1.heading;
    }

    const c2 = policeManager.cruisers[2];
    if (c2) {
      c2.position.set(119.8, 0, 13.8);
      c2.heading = -0.05;
      c2.sirenTimer = 0.08; // RED box active
      c2.updateSirenLights(0);
      c2.mesh.position.copy(c2.position);
      c2.mesh.rotation.y = c2.heading;
    }

    // Place FULL CVPD Helicopter in upper-center frame with spotlight circle on the asphalt beside player car
    policeManager.helicopter.placeAndAimAt(
      new THREE.Vector3(116.5, 11.4, -11.5),
      new THREE.Vector3(119.5, 0.045, 2.2),
      2.75
    );

    // 3/4 rear-lateral camera looking forward along Seabreeze Boulevard
    cameraController.overrideActive = true;
    cameraController.yaw = 0.22;
    camera.position.set(128.2, 4.45, 23.6);
    camera.lookAt(118.8, 2.35, -6.0);
    return true;
  }

  if (shotName === 'foot') {
    // 2-foot.jpg: On foot on the coastal promenade/Seabreeze Blvd with pedestrians, palms,
    // pistol aiming reticle, and mission with dialogue box.
    uiManager.setMode('gameplay');
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
    // POIs, GPS route, Story Progress 2/5 panel, and legend (zero overlapping labels).
    player.position.set(120.0, 0.18, 18.0);
    player.money = 4850;
    policeManager.setWantedStars(1);
    missionManager.currentMissionIndex = 2; // Story Progress 2/5 completed
    uiManager.setMode('map', engine.buildUIState());
    return true;
  }

  if (shotName === 'title') {
    // 4-title.jpg: Title screen overlay (no HUD, tagline, footer) over aerial sunset view of Coral Vista
    policeManager.setWantedStars(0);
    uiManager.setMode('title');
    cameraController.overrideActive = true;
    camera.position.set(148.0, 26.0, 72.0);
    camera.lookAt(105.0, 6.0, -45.0);
    return true;
  }

  return false;
}

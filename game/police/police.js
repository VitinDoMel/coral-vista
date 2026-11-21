import * as THREE from 'three';

const cruiserBlackMat = new THREE.MeshStandardMaterial({
  color: 0x161a22,
  roughness: 0.3,
  metalness: 0.25
});

const cruiserWhiteMat = new THREE.MeshStandardMaterial({
  color: 0xf4f7fb,
  roughness: 0.32,
  metalness: 0.18
});

const cruiserGlassMat = new THREE.MeshStandardMaterial({
  color: 0x6cb8eb,
  roughness: 0.14,
  metalness: 0.28
});

const tireMat = new THREE.MeshStandardMaterial({
  color: 0x1b1e24,
  roughness: 0.85
});

const rimMat = new THREE.MeshStandardMaterial({
  color: 0xd0d8e2,
  roughness: 0.35,
  metalness: 0.65
});

/**
 * Builds a ground spotlight pool texture (warm bright circle on the asphalt)
 */
function createSpotlightCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0.0, 'rgba(255, 248, 210, 0.72)');
  grad.addColorStop(0.45, 'rgba(255, 242, 185, 0.42)');
  grad.addColorStop(0.78, 'rgba(255, 235, 165, 0.14)');
  grad.addColorStop(1.0, 'rgba(255, 235, 165, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Viatura CVPD preta/branca com barra de luz vermelho/azul bem visível
 * (caixas emissivas grandes alternando a cada 0,25 s + PointLight colorida fraca)
 */
export class PoliceCruiser {
  constructor(scene, position = new THREE.Vector3(), heading = 0) {
    this.scene = scene;
    this.position = position.clone();
    this.heading = heading;
    this.speed = 0;
    this.steerAngle = 0;
    this.health = 120;
    this.sirenTimer = Math.random() * 0.5;

    this.mesh = this._buildCruiserMesh();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    this.scene.add(this.mesh);
  }

  _buildCruiserMesh() {
    const group = new THREE.Group();
    group.name = 'CVPD_Cruiser';

    const width = 2.02;
    const length = 4.72;
    const chassisH = 0.68;
    const baseY = 0.36;

    // Front black hood section
    const frontBody = new THREE.Mesh(
      new THREE.BoxGeometry(width, chassisH, 1.52),
      cruiserBlackMat
    );
    frontBody.position.set(0, baseY + chassisH * 0.5, -1.6);
    frontBody.castShadow = true;
    frontBody.receiveShadow = true;
    group.add(frontBody);

    // Center white doors section (CVPD black & white livery)
    const centerDoors = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.01, chassisH, 1.72),
      cruiserWhiteMat
    );
    centerDoors.position.set(0, baseY + chassisH * 0.5, 0.0);
    centerDoors.castShadow = true;
    centerDoors.receiveShadow = true;
    group.add(centerDoors);

    // Rear black trunk section
    const rearBody = new THREE.Mesh(
      new THREE.BoxGeometry(width, chassisH, 1.52),
      cruiserBlackMat
    );
    rearBody.position.set(0, baseY + chassisH * 0.5, 1.6);
    rearBody.castShadow = true;
    rearBody.receiveShadow = true;
    group.add(rearBody);

    // Front steel push-bar bumper
    const pushBar = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.72, 0.46, 0.22),
      cruiserBlackMat
    );
    pushBar.position.set(0, baseY + 0.3, -length * 0.5 - 0.09);
    group.add(pushBar);

    // Cabin blue-tinted glass + white roof
    const cabinW = width * 0.86;
    const cabinL = 2.32;
    const cabinBottomY = baseY + chassisH;
    const glassH = 0.48;
    const roofH = 0.15;

    const glassBlock = new THREE.Mesh(
      new THREE.BoxGeometry(cabinW, glassH, cabinL),
      cruiserGlassMat
    );
    glassBlock.position.set(0, cabinBottomY + glassH * 0.5, 0.05);
    group.add(glassBlock);

    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(cabinW + 0.06, roofH, cabinL + 0.04),
      cruiserWhiteMat
    );
    roofSlab.position.set(0, cabinBottomY + glassH + roofH * 0.5, 0.05);
    roofSlab.castShadow = true;
    group.add(roofSlab);

    // High-visibility RED / BLUE Roof Lightbar (caixas emissivas grandes alternando a cada 0,25 s)
    const barY = cabinBottomY + glassH + roofH + 0.14;
    const mountBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.08, 0.36),
      cruiserBlackMat
    );
    mountBase.position.set(0, barY - 0.1, 0.02);
    group.add(mountBase);

    this.redLightMat = new THREE.MeshStandardMaterial({
      color: 0xff1824,
      emissive: 0xff0a18,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      toneMapped: false
    });

    this.blueLightMat = new THREE.MeshStandardMaterial({
      color: 0x163d7a,
      emissive: 0x0b2a5e,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      toneMapped: false
    });

    // Large distinct red & blue emissive lightbar boxes
    this.redLightBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.25, 0.38),
      this.redLightMat
    );
    this.redLightBox.position.set(-0.39, barY, 0.02);
    group.add(this.redLightBox);

    this.blueLightBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.25, 0.38),
      this.blueLightMat
    );
    this.blueLightBox.position.set(0.39, barY, 0.02);
    group.add(this.blueLightBox);

    // Weak colored PointLight above the siren bar
    this.sirenPointLight = new THREE.PointLight(0xff2233, 1.35, 13, 1.5);
    this.sirenPointLight.position.set(-0.35, barY + 0.35, 0.02);
    group.add(this.sirenPointLight);

    // Headlights & Taillights
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xfffce6,
      emissive: 0xffeba8,
      emissiveIntensity: 1.5
    });
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xe01b1b,
      emissiveIntensity: 1.4
    });
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), hlMat);
      hl.position.set(side * 0.68, baseY + 0.42, -length * 0.5 - 0.01);
      group.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tlMat);
      tl.position.set(side * 0.68, baseY + 0.42, length * 0.5 + 0.01);
      group.add(tl);
    }

    // 4 wheels
    const wheelR = 0.38;
    const wheelW = 0.26;
    const wx = width * 0.5 - 0.05;
    for (const [x, z] of [
      [-wx, -1.48],
      [wx, -1.48],
      [-wx, 1.44],
      [wx, 1.44]
    ]) {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 12),
        tireMat
      );
      tire.rotation.z = Math.PI * 0.5;
      tire.position.set(x, wheelR, z);
      group.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, wheelW + 0.02, 8),
        rimMat
      );
      rim.rotation.z = Math.PI * 0.5;
      rim.position.set(x, wheelR, z);
      group.add(rim);
    }

    return group;
  }

  updateSirenLights(dt) {
    this.sirenTimer += dt;
    // Alternates strictly every 0.25 s
    const phase = Math.floor(this.sirenTimer / 0.25) % 2;
    if (phase === 0) {
      this.redLightMat.color.setHex(0xff2030);
      this.redLightMat.emissive.setHex(0xff1020);
      this.redLightMat.emissiveIntensity = 2.2;
      this.blueLightMat.color.setHex(0x1f62c4);
      this.blueLightMat.emissive.setHex(0x124799);
      this.blueLightMat.emissiveIntensity = 0.65;
      this.redLightBox.scale.set(1.08, 1.1, 1.08);
      this.blueLightBox.scale.set(1.0, 1.0, 1.0);
      this.sirenPointLight.color.setHex(0xff1824);
      this.sirenPointLight.position.x = -0.38;
    } else {
      this.redLightMat.color.setHex(0xb31b26);
      this.redLightMat.emissive.setHex(0x8c101a);
      this.redLightMat.emissiveIntensity = 0.65;
      this.blueLightMat.color.setHex(0x268aff);
      this.blueLightMat.emissive.setHex(0x1874ff);
      this.blueLightMat.emissiveIntensity = 2.2;
      this.redLightBox.scale.set(1.0, 1.0, 1.0);
      this.blueLightBox.scale.set(1.08, 1.1, 1.08);
      this.sirenPointLight.color.setHex(0x1c7eff);
      this.sirenPointLight.position.x = 0.38;
    }
  }

  updatePursuit(dt, targetPos, collisionWorld) {
    const clampedDt = Math.min(dt, 0.05);
    this.updateSirenLights(clampedDt);

    const toTarget = new THREE.Vector3().subVectors(targetPos, this.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    const desiredHeading = Math.atan2(-toTarget.x, -toTarget.z);
    let diff = desiredHeading - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    this.heading += Math.max(-2.4 * clampedDt, Math.min(2.4 * clampedDt, diff * 3.2 * clampedDt));

    const targetSpeed = dist > 9 ? 23.5 : dist > 4.5 ? 12.0 : 0;
    this.speed += (targetSpeed - this.speed) * Math.min(1, clampedDt * 4.5);

    const fwdX = -Math.sin(this.heading);
    const fwdZ = -Math.cos(this.heading);
    this.position.x += fwdX * this.speed * clampedDt;
    this.position.z += fwdZ * this.speed * clampedDt;

    if (collisionWorld) {
      collisionWorld.resolveCircleAABB(this.position, 1.35);
      this.position.y = collisionWorld.getGroundHeightAt(this.position.x, this.position.z);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

/**
 * Helicóptero CVPD com holofote = círculo de luz no chão (SpotLight ângulo 0.25, penumbra 0.6)
 * + cone de volume quase invisível (opacity <= 0.08)
 */
export class PoliceHelicopter {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(120, 32, -20);
    this.heading = 0;
    this.rotorAngle = 0;
    this.sirenTimer = 0;
    this.active = false;

    this._buildHelicopterAndSpotlight();
    this.setVisible(false);
  }

  _buildHelicopterAndSpotlight() {
    this.group = new THREE.Group();
    this.group.name = 'CVPD_Helicopter';

    // Fuselage cabin (CVPD black & white)
    const cabinBottom = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.15, 4.4),
      cruiserBlackMat
    );
    cabinBottom.position.set(0, 0, 0);
    this.group.add(cabinBottom);

    const cabinTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.9, 3.6),
      cruiserWhiteMat
    );
    cabinTop.position.set(0, 0.95, 0.15);
    this.group.add(cabinTop);

    // Blue-tinted cockpit windshield nose
    const noseGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 1.1, 1.45),
      cruiserGlassMat
    );
    noseGlass.position.set(0, 0.45, -1.85);
    this.group.add(noseGlass);

    // Landing skids
    for (const side of [-0.95, 0.95]) {
      const skid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6),
        cruiserBlackMat
      );
      skid.rotation.x = Math.PI * 0.5;
      skid.position.set(side, -0.95, -0.1);
      this.group.add(skid);

      for (const sz of [-1.1, 0.9]) {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6),
          cruiserBlackMat
        );
        strut.position.set(side, -0.58, sz);
        this.group.add(strut);
      }
    }

    // Tail boom & vertical fin
    const tailBoom = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 4.8),
      cruiserBlackMat
    );
    tailBoom.position.set(0, 0.45, 4.3);
    this.group.add(tailBoom);

    const tailFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.55, 1.1),
      cruiserWhiteMat
    );
    tailFin.position.set(0, 1.15, 6.4);
    this.group.add(tailFin);

    // Main rotor mast & 4 blades
    this.mainRotor = new THREE.Group();
    this.mainRotor.position.set(0, 1.65, 0.1);
    const blade1 = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.06, 0.34),
      cruiserBlackMat
    );
    const blade2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 9.6),
      cruiserBlackMat
    );
    this.mainRotor.add(blade1, blade2);
    this.group.add(this.mainRotor);

    // Belly searchlight housing
    const lampEmitterMat = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
    const bellyLamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.32, 0.3, 12),
      lampEmitterMat
    );
    bellyLamp.position.set(0, -0.7, -1.2);
    this.group.add(bellyLamp);

    this.scene.add(this.group);

    // 1. SpotLight with exact T3 parameters: angle = 0.25, penumbra = 0.6
    this.spotLight = new THREE.SpotLight(0xfff4cf, 22, 140, 0.25, 0.6, 0.8);
    this.spotLight.castShadow = false;
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    // 2. Crisp circle of light on the ground (círculo de luz no chão)
    const circleTex = createSpotlightCircleTexture();
    this.groundLightCircle = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 32),
      new THREE.MeshBasicMaterial({
        map: circleTex,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      })
    );
    this.groundLightCircle.rotation.x = -Math.PI * 0.5;
    this.groundLightCircle.position.set(120, 0.045, 0);
    this.scene.add(this.groundLightCircle);

    // 3. Almost invisible volumetric beam cone (opacity <= 0.08)
    const coneGeom = new THREE.ConeGeometry(7.2, 1.0, 24, 1, true);
    // Shift cone geometry so apex is at (0,0,0) and base extends to (0,-1,0)
    coneGeom.translate(0, -0.5, 0);
    this.volumeConeMat = new THREE.MeshBasicMaterial({
      color: 0xfff6d6,
      transparent: true,
      opacity: 0.065, // Strictly <= 0.08 per T3 spec
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.volumeCone = new THREE.Mesh(coneGeom, this.volumeConeMat);
    this.scene.add(this.volumeCone);
  }

  setVisible(visible) {
    this.active = visible;
    this.group.visible = visible;
    this.spotLight.visible = visible;
    this.groundLightCircle.visible = visible;
    this.volumeCone.visible = visible;
  }

  placeAndAimAt(heliPos, groundTargetPos, heading = 0) {
    this.setVisible(true);
    this.position.copy(heliPos);
    this.heading = heading;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    const emitterPos = new THREE.Vector3(
      this.position.x - Math.sin(this.heading) * 1.1,
      this.position.y - 0.7,
      this.position.z - Math.cos(this.heading) * 1.1
    );

    const targetGround = new THREE.Vector3(groundTargetPos.x, 0.045, groundTargetPos.z);

    this.spotLight.position.copy(emitterPos);
    this.spotLight.target.position.copy(targetGround);
    this.groundLightCircle.position.copy(targetGround);

    // Orient & scale the faint volume cone from emitterPos to targetGround
    const beamVec = new THREE.Vector3().subVectors(targetGround, emitterPos);
    const beamLen = beamVec.length();
    this.volumeCone.position.copy(emitterPos);

    const downAxis = new THREE.Vector3(0, -1, 0);
    const beamDir = beamVec.clone().normalize();
    this.volumeCone.quaternion.setFromUnitVectors(downAxis, beamDir);
    this.volumeCone.scale.set(1, beamLen, 1);
  }

  update(dt, targetPos) {
    if (!this.active) return;
    const clampedDt = Math.min(dt, 0.05);
    this.rotorAngle += clampedDt * 24;
    this.mainRotor.rotation.y = this.rotorAngle;

    const orbitAngle = performance.now() * 0.00035;
    const desiredPos = new THREE.Vector3(
      targetPos.x + Math.cos(orbitAngle) * 16,
      26.5,
      targetPos.z + Math.sin(orbitAngle) * 18
    );
    this.position.lerp(desiredPos, 1 - Math.exp(-3.5 * clampedDt));
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.position);
    const heading = Math.atan2(-toTarget.x, -toTarget.z);

    const spotGround = new THREE.Vector3(
      targetPos.x + Math.sin(orbitAngle * 2) * 1.8,
      0.045,
      targetPos.z + Math.cos(orbitAngle * 2) * 1.8
    );
    this.placeAndAimAt(this.position, spotGround, heading);
  }
}

export class PoliceManager {
  constructor(scene, collisionWorld) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;

    this.wantedStars = 0; // 0 to 5 ★
    this.maxStars = 5;
    this.crimeHeat = 0;
    this.evadeTimer = 0;
    this.evadeDuration = 18.0;

    this.cruisers = [];
    this.officers = [];
    this.helicopter = new PoliceHelicopter(scene);

    this.lastRespawnNotice = null;
  }

  reportCrime(crimeType, minStars = 1) {
    const heatTable = {
      gunshot: 35,
      carjack: 55,
      assault: 45,
      police_attack: 110
    };
    this.crimeHeat += heatTable[crimeType] || 40;
    this.evadeTimer = 0;

    let computedStars = Math.max(minStars, this.wantedStars);
    if (this.crimeHeat >= 320) computedStars = 5;
    else if (this.crimeHeat >= 220) computedStars = 4;
    else if (this.crimeHeat >= 135) computedStars = 3;
    else if (this.crimeHeat >= 70) computedStars = 2;

    this.setWantedStars(Math.min(this.maxStars, computedStars));
  }

  setWantedStars(stars, targetPos = null) {
    this.wantedStars = Math.max(0, Math.min(this.maxStars, Math.floor(stars)));
    if (this.wantedStars === 0) {
      this.crimeHeat = 0;
      this.evadeTimer = 0;
      this.clearUnits();
      return;
    }

    this.helicopter.setVisible(this.wantedStars >= 4);
    if (targetPos) {
      this._ensureUnitsForStars(targetPos);
    }
  }

  clearUnits() {
    for (const c of this.cruisers) c.dispose();
    this.cruisers = [];
    for (const o of this.officers) this.scene.remove(o.mesh);
    this.officers = [];
    this.helicopter.setVisible(false);
  }

  _ensureUnitsForStars(playerPos) {
    const desiredCruisers = Math.min(3, this.wantedStars);
    while (this.cruisers.length < desiredCruisers) {
      const idx = this.cruisers.length;
      const offsetZ = 22 + idx * 10;
      const offsetX = (idx - 1) * 3.8;
      const spawnPos = new THREE.Vector3(
        playerPos.x + offsetX,
        0,
        playerPos.z + offsetZ
      );
      const cruiser = new PoliceCruiser(this.scene, spawnPos, 0);
      this.cruisers.push(cruiser);
    }

    // Spawn officers on foot at ★ >= 3
    const desiredOfficers = this.wantedStars >= 3 ? 2 : 0;
    while (this.officers.length < desiredOfficers) {
      const idx = this.officers.length;
      const officer = this._createFootOfficer(
        new THREE.Vector3(playerPos.x + (idx === 0 ? -5 : 5), 0.18, playerPos.z + 18)
      );
      this.officers.push(officer);
    }
  }

  _createFootOfficer(position) {
    const group = new THREE.Group();
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x172538, roughness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f5f8, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdba37a, roughness: 0.7 });

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.2), uniformMat);
    legs.position.y = 0.36;
    group.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.6, 0.26), uniformMat);
    torso.position.y = 1.02;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skinMat);
    head.position.y = 1.48;
    group.add(head);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.36), whiteMat);
    cap.position.set(0, 1.64, -0.02);
    group.add(cap);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.48), uniformMat);
    arm.position.set(0.28, 1.22, -0.22);
    group.add(arm);

    group.position.copy(position);
    this.scene.add(group);

    return {
      mesh: group,
      position: position.clone(),
      health: 60,
      shootTimer: 1.1
    };
  }

  damageOfficerNear(pos, radius, damage) {
    for (let i = this.officers.length - 1; i >= 0; i--) {
      const off = this.officers[i];
      if (off.position.distanceTo(pos) <= radius) {
        off.health -= damage;
        if (off.health <= 0) {
          this.scene.remove(off.mesh);
          this.officers.splice(i, 1);
        }
        return true;
      }
    }
    return false;
  }

  raycastShot(origin, dir, maxDist, damage) {
    let closestHit = null;
    let bestDist = maxDist;

    for (let i = this.officers.length - 1; i >= 0; i--) {
      const off = this.officers[i];
      const toOff = new THREE.Vector3().subVectors(
        off.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
        origin
      );
      const proj = toOff.dot(dir);
      if (proj > 0 && proj < bestDist) {
        const perpSq = toOff.lengthSq() - proj * proj;
        if (perpSq < 0.65) {
          bestDist = proj;
          closestHit = origin.clone().addScaledVector(dir, proj);
          off.health -= damage;
          if (off.health <= 0) {
            this.scene.remove(off.mesh);
            this.officers.splice(i, 1);
          }
        }
      }
    }

    for (const cruiser of this.cruisers) {
      const toCar = new THREE.Vector3().subVectors(
        cruiser.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
        origin
      );
      const proj = toCar.dot(dir);
      if (proj > 0 && proj < bestDist) {
        const perpSq = toCar.lengthSq() - proj * proj;
        if (perpSq < 2.2) {
          bestDist = proj;
          closestHit = origin.clone().addScaledVector(dir, proj);
          cruiser.health -= damage * 0.5;
        }
      }
    }

    return closestHit;
  }

  handlePlayerDefeated(player, vehicleManager) {
    // Hospital or CVPD Prison respawn
    if (vehicleManager && vehicleManager.activeVehicle) {
      vehicleManager.activeVehicle.driver = null;
      vehicleManager.activeVehicle = null;
      player.mesh.visible = true;
    }

    const isArrested = this.wantedStars > 0;
    if (isArrested) {
      // Respawn outside CVPD Precinct HQ (Coral Central Ave)
      player.position.set(-22.5, 0.18, -68.0);
      player.money = Math.max(0, player.money - 150);
      this.lastRespawnNotice = {
        title: 'BUSTED BY CVPD',
        subtitle: 'Released on bail at Central Precinct (-$150)',
        timer: 4.0
      };
    } else {
      // Respawn outside Coral General Hospital
      player.position.set(52.5, 0.18, 68.0);
      player.money = Math.max(0, player.money - 100);
      this.lastRespawnNotice = {
        title: 'CORAL GENERAL HOSPITAL',
        subtitle: 'Discharged after emergency treatment (-$100)',
        timer: 4.0
      };
    }

    player.health = player.maxHealth;
    player.armor = 50;
    player.mesh.position.copy(player.position);
    this.setWantedStars(0);
  }

  update(dt, player, vehicleManager) {
    const clampedDt = Math.min(dt, 0.05);

    if (this.lastRespawnNotice) {
      this.lastRespawnNotice.timer -= clampedDt;
      if (this.lastRespawnNotice.timer <= 0) {
        this.lastRespawnNotice = null;
      }
    }

    if (player.health <= 0) {
      this.handlePlayerDefeated(player, vehicleManager);
      return;
    }

    if (this.wantedStars === 0) return;

    this._ensureUnitsForStars(player.position);

    let anyUnitClose = false;
    for (const cruiser of this.cruisers) {
      cruiser.updatePursuit(clampedDt, player.position, this.collisionWorld);
      if (cruiser.position.distanceTo(player.position) < 62) {
        anyUnitClose = true;
      }
    }

    // Prevent cruisers from overlapping each other
    for (let i = 0; i < this.cruisers.length; i++) {
      for (let j = i + 1; j < this.cruisers.length; j++) {
        const a = this.cruisers[i];
        const b = this.cruisers[j];
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const distSq = dx * dx + dz * dz;
        const minSep = 4.6;
        if (distSq < minSep * minSep && distSq > 1e-4) {
          const dist = Math.sqrt(distSq);
          const push = (minSep - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          a.position.x -= nx * push;
          a.position.z -= nz * push;
          b.position.x += nx * push;
          b.position.z += nz * push;
          a.mesh.position.copy(a.position);
          b.mesh.position.copy(b.position);
        }
      }
    }

    // Foot officers pursue and shoot at ★ >= 3
    for (const off of this.officers) {
      const toPlayer = new THREE.Vector3().subVectors(player.position, off.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      if (dist < 48) anyUnitClose = true;

      if (dist > 11) {
        toPlayer.normalize();
        off.position.addScaledVector(toPlayer, 3.8 * clampedDt);
        if (this.collisionWorld) {
          this.collisionWorld.resolveCircleAABB(off.position, 0.4);
        }
      }

      off.mesh.position.copy(off.position);
      off.mesh.rotation.y = Math.atan2(-toPlayer.x, -toPlayer.z);

      if (this.wantedStars >= 3 && dist < 28) {
        off.shootTimer -= clampedDt;
        if (off.shootTimer <= 0) {
          off.shootTimer = 1.35;
          player.takeDamage(6);
        }
      }
    }

    if (this.wantedStars >= 4 || this.helicopter.active) {
      this.helicopter.update(clampedDt, player.position);
      anyUnitClose = true;
    }

    // Wanted level evasion timer when out of police line-of-sight
    if (!anyUnitClose) {
      this.evadeTimer += clampedDt;
      if (this.evadeTimer >= this.evadeDuration) {
        this.evadeTimer = 0;
        this.setWantedStars(this.wantedStars - 1, player.position);
      }
    } else {
      this.evadeTimer = Math.max(0, this.evadeTimer - clampedDt * 0.5);
    }
  }
}

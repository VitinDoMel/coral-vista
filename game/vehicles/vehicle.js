import * as THREE from 'three';

export const VEHICLE_MODELS = [
  {
    id: 'manta_gt',
    name: 'Manta GT',
    length: 4.5,
    width: 2.0,
    chassisHeight: 0.62,
    cabinLength: 2.0,
    cabinHeight: 0.56,
    cabinOffsetZ: 0.15,
    maxSpeed: 34,
    accel: 22,
    handling: 2.75,
    hasSpoiler: true,
    colors: [0xee4b3e, 0x1fc2d6, 0xf7c52b, 0xff6b8b]
  },
  {
    id: 'solaris_sedan',
    name: 'Solaris Sedan',
    length: 4.6,
    width: 1.94,
    chassisHeight: 0.68,
    cabinLength: 2.35,
    cabinHeight: 0.62,
    cabinOffsetZ: 0.05,
    maxSpeed: 27,
    accel: 16.5,
    handling: 2.4,
    hasSpoiler: false,
    colors: [0x46cfab, 0xf3ede2, 0x3b7dd8, 0xf4a261]
  },
  {
    id: 'dune_suv',
    name: 'Coral Dune 4x4',
    length: 4.75,
    width: 2.1,
    chassisHeight: 0.82,
    cabinLength: 2.95,
    cabinHeight: 0.74,
    cabinOffsetZ: 0.25,
    maxSpeed: 24.5,
    accel: 15.0,
    handling: 2.15,
    hasRoofRack: true,
    colors: [0xf27d38, 0x2c9c91, 0xdec073, 0x5c7cfa]
  },
  {
    id: 'cabana_v8',
    name: 'Cabana V8',
    length: 4.7,
    width: 2.02,
    chassisHeight: 0.66,
    cabinLength: 2.1,
    cabinHeight: 0.58,
    cabinOffsetZ: 0.28,
    maxSpeed: 31,
    accel: 19.5,
    handling: 2.55,
    hasHoodScoop: true,
    colors: [0xd93870, 0x76d658, 0x355cde, 0xf59f00]
  },
  {
    id: 'vista_cab',
    name: 'Vista Cab',
    length: 4.45,
    width: 1.92,
    chassisHeight: 0.68,
    cabinLength: 2.3,
    cabinHeight: 0.62,
    cabinOffsetZ: 0.05,
    maxSpeed: 26,
    accel: 16.0,
    handling: 2.45,
    isTaxi: true,
    colors: [0xf7c528, 0xb592f2, 0x74c0fc]
  }
];

const sharedGlassMat = new THREE.MeshStandardMaterial({
  color: 0x6cb8eb,
  roughness: 0.14,
  metalness: 0.28
});

const sharedTireMat = new THREE.MeshStandardMaterial({
  color: 0x1e2229,
  roughness: 0.85
});

const sharedRimMat = new THREE.MeshStandardMaterial({
  color: 0xdce3ec,
  roughness: 0.3,
  metalness: 0.7
});

const sharedBumperMat = new THREE.MeshStandardMaterial({
  color: 0x2c323d,
  roughness: 0.6,
  metalness: 0.3
});

const sharedHeadlightMat = new THREE.MeshStandardMaterial({
  color: 0xfffbe6,
  emissive: 0xffe9a6,
  emissiveIntensity: 1.3
});

const sharedTaillightMat = new THREE.MeshStandardMaterial({
  color: 0xff3333,
  emissive: 0xd91b1b,
  emissiveIntensity: 1.0
});

const sharedBrakeLightMat = new THREE.MeshStandardMaterial({
  color: 0xff4444,
  emissive: 0xff2222,
  emissiveIntensity: 2.4
});

export class Vehicle {
  constructor(scene, modelDef, colorHex, position = new THREE.Vector3(), heading = 0) {
    this.scene = scene;
    this.modelDef = modelDef;
    this.colorHex = colorHex ?? modelDef.colors[0];

    this.position = position.clone();
    this.heading = heading; // 0 means facing -Z
    this.speed = 0;
    this.steerAngle = 0;
    this.lateralVelocity = 0;
    this.angularVelocity = 0;
    this.isDrifting = false;
    this.isBraking = false;

    this.health = 100;
    this.maxHealth = 100;
    this.driver = null; // null | 'player' | 'ai'

    this.frontWheels = [];
    this.allWheels = [];
    this.taillightMeshes = [];

    this.mesh = this._buildMesh();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    this.scene.add(this.mesh);
  }

  _buildMesh() {
    const group = new THREE.Group();
    group.name = `Vehicle_${this.modelDef.id}`;

    const {
      length,
      width,
      chassisHeight,
      cabinLength,
      cabinHeight,
      cabinOffsetZ,
      hasSpoiler,
      hasRoofRack,
      hasHoodScoop,
      isTaxi
    } = this.modelDef;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      roughness: 0.32,
      metalness: 0.22
    });
    this.bodyMat = bodyMat;

    const baseBottomY = 0.36;

    // Lower body chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(width, chassisHeight, length),
      bodyMat
    );
    chassis.position.set(0, baseBottomY + chassisHeight * 0.5, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Front and rear bumpers
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.96, 0.22, 0.18),
      sharedBumperMat
    );
    frontBumper.position.set(0, baseBottomY + 0.16, -length * 0.5 - 0.04);
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.96, 0.24, 0.18),
      sharedBumperMat
    );
    rearBumper.position.set(0, baseBottomY + 0.16, length * 0.5 + 0.04);
    group.add(rearBumper);

    // Cabin greenhouse with blue-tinted glass (vidro azulado) and body-colored roof (teto da cor da carroceria)
    const cabinW = width * 0.86;
    const cabinBottomY = baseBottomY + chassisHeight;
    const glassH = cabinHeight * 0.78;
    const roofCapH = cabinHeight * 0.24;

    // Blue-tinted glass block
    const glassBlock = new THREE.Mesh(
      new THREE.BoxGeometry(cabinW, glassH, cabinLength),
      sharedGlassMat
    );
    glassBlock.position.set(0, cabinBottomY + glassH * 0.5, cabinOffsetZ);
    glassBlock.castShadow = true;
    group.add(glassBlock);

    // Body-colored corner pillars framing the blue glass
    const pillarGeo = new THREE.BoxGeometry(0.11, glassH, 0.12);
    const px = cabinW * 0.5 - 0.04;
    const pzFront = cabinOffsetZ - cabinLength * 0.5 + 0.05;
    const pzMid = cabinOffsetZ;
    const pzRear = cabinOffsetZ + cabinLength * 0.5 - 0.05;
    for (const side of [-1, 1]) {
      for (const pz of [pzFront, pzMid, pzRear]) {
        const pillar = new THREE.Mesh(pillarGeo, bodyMat);
        pillar.position.set(side * px, cabinBottomY + glassH * 0.5, pz);
        group.add(pillar);
      }
    }

    // Body-colored roof slab on top of the cabin (teto da cor da carroceria)
    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(cabinW + 0.06, roofCapH, cabinLength + 0.06),
      bodyMat
    );
    roofSlab.position.set(0, cabinBottomY + glassH + roofCapH * 0.5, cabinOffsetZ);
    roofSlab.castShadow = true;
    roofSlab.receiveShadow = true;
    group.add(roofSlab);

    // Optional model-specific styling details
    if (hasSpoiler) {
      const spoilerWing = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.92, 0.08, 0.32),
        bodyMat
      );
      spoilerWing.position.set(0, cabinBottomY + 0.34, length * 0.45);
      group.add(spoilerWing);

      for (const side of [-0.55, 0.55]) {
        const strut = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.3, 0.18),
          sharedBumperMat
        );
        strut.position.set(side, cabinBottomY + 0.16, length * 0.44);
        group.add(strut);
      }
    }

    if (hasRoofRack) {
      for (const side of [-cabinW * 0.42, cabinW * 0.42]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.09, cabinLength * 0.85),
          sharedBumperMat
        );
        rail.position.set(side, cabinBottomY + cabinHeight + 0.05, cabinOffsetZ);
        group.add(rail);
      }
    }

    if (hasHoodScoop) {
      const scoop = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.36, 0.14, 0.85),
        sharedBumperMat
      );
      scoop.position.set(0, cabinBottomY + 0.06, -length * 0.26);
      group.add(scoop);
    }

    if (isTaxi && this.colorHex === 0xf7c528) {
      const signMat = new THREE.MeshStandardMaterial({
        color: 0xfff8d6,
        emissive: 0xffd166,
        emissiveIntensity: 0.9
      });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.28), signMat);
      taxiSign.position.set(0, cabinBottomY + cabinHeight + 0.11, cabinOffsetZ - 0.15);
      group.add(taxiSign);
    }

    // Headlights (front is -Z)
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.16, 0.08),
        sharedHeadlightMat
      );
      hl.position.set(
        side * (width * 0.34),
        baseBottomY + chassisHeight * 0.62,
        -length * 0.5 - 0.01
      );
      group.add(hl);

      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.16, 0.08),
        sharedTaillightMat
      );
      tl.position.set(
        side * (width * 0.34),
        baseBottomY + chassisHeight * 0.62,
        length * 0.5 + 0.01
      );
      group.add(tl);
      this.taillightMeshes.push(tl);
    }

    // 4 wheels with alloy hubs
    const wheelRadius = 0.38;
    const wheelWidth = 0.26;
    const wheelX = width * 0.5 - 0.06;
    const wheelFrontZ = -length * 0.32;
    const wheelRearZ = length * 0.31;

    const wheelSpecs = [
      { x: -wheelX, z: wheelFrontZ, isFront: true },
      { x: wheelX, z: wheelFrontZ, isFront: true },
      { x: -wheelX, z: wheelRearZ, isFront: false },
      { x: wheelX, z: wheelRearZ, isFront: false }
    ];

    for (const spec of wheelSpecs) {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(spec.x, wheelRadius, spec.z);

      const spinGroup = new THREE.Group();
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 14),
        sharedTireMat
      );
      tire.rotation.z = Math.PI * 0.5;
      tire.castShadow = true;
      spinGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.58, wheelRadius * 0.58, wheelWidth + 0.02, 10),
        sharedRimMat
      );
      rim.rotation.z = Math.PI * 0.5;
      spinGroup.add(rim);

      steerPivot.add(spinGroup);
      group.add(steerPivot);

      if (spec.isFront) this.frontWheels.push(steerPivot);
      this.allWheels.push(spinGroup);
    }

    return group;
  }

  getForwardXZ() {
    return new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
  }

  getRightXZ() {
    return new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));
  }

  updatePlayerArcadePhysics(dt, input, collisionWorld) {
    const clampedDt = Math.min(dt, 0.05);

    let throttle = 0;
    if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) throttle += 1;
    if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) throttle -= 1;

    let steerInput = 0;
    if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) steerInput += 1;
    if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) steerInput -= 1;

    const handbrake = input.isKeyDown('Space');
    this.isDrifting = handbrake && Math.abs(this.speed) > 7;

    // Longitudinal acceleration / braking / reverse
    const { maxSpeed, accel, handling } = this.modelDef;
    if (throttle > 0) {
      if (this.speed < 0) {
        this.speed += accel * 2.2 * clampedDt;
        this.isBraking = true;
      } else {
        this.speed += accel * (1 - (this.speed / maxSpeed) * 0.35) * clampedDt;
        this.isBraking = false;
      }
    } else if (throttle < 0) {
      if (this.speed > 0.5) {
        this.speed -= accel * 2.4 * clampedDt;
        this.isBraking = true;
      } else {
        this.speed -= accel * 0.85 * clampedDt;
        this.isBraking = true;
      }
    } else {
      this.isBraking = handbrake;
      // Natural rolling resistance
      this.speed *= Math.exp(-1.45 * clampedDt);
      if (Math.abs(this.speed) < 0.08) this.speed = 0;
    }

    if (handbrake) {
      this.speed *= Math.exp(-2.8 * clampedDt);
    }

    this.speed = Math.max(-maxSpeed * 0.38, Math.min(maxSpeed, this.speed));

    // Steering response
    const targetSteer = steerInput * 0.52;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, clampedDt * 12);

    const speedFactor = Math.min(1, Math.abs(this.speed) / 6.5);
    const directionSign = this.speed >= -0.05 ? 1 : -1;
    const turnRate =
      this.steerAngle *
      handling *
      speedFactor *
      directionSign *
      (this.isDrifting ? 1.42 : 1.0);

    this.heading += turnRate * clampedDt;

    // Lateral drift slip impulse
    if (this.isDrifting) {
      this.lateralVelocity += -steerInput * Math.abs(this.speed) * 0.45 * clampedDt;
      this.lateralVelocity *= Math.exp(-3.2 * clampedDt);
    } else {
      this.lateralVelocity *= Math.exp(-8.5 * clampedDt);
    }

    const forward = this.getForwardXZ();
    const right = this.getRightXZ();

    const prevX = this.position.x;
    const prevZ = this.position.z;

    this.position.x += (forward.x * this.speed + right.x * this.lateralVelocity) * clampedDt;
    this.position.z += (forward.z * this.speed + right.z * this.lateralVelocity) * clampedDt;

    if (collisionWorld) {
      const checkPos = this.position.clone();
      collisionWorld.resolveCircleAABB(checkPos, 1.35);
      const correctionSq =
        (checkPos.x - this.position.x) ** 2 + (checkPos.z - this.position.z) ** 2;
      if (correctionSq > 1e-5) {
        this.position.x = checkPos.x;
        this.position.z = checkPos.z;
        if (Math.abs(this.speed) > 9) {
          this.health = Math.max(10, this.health - Math.abs(this.speed) * 0.55);
          this.lastImpact = {
            pos: this.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
            intensity: Math.min(1, Math.abs(this.speed) / 28)
          };
        }
        this.speed *= 0.55;
      }

      this.position.y = collisionWorld.getGroundHeightAt(this.position.x, this.position.z);
    }

    this._syncVisuals(clampedDt);
  }

  updatePassivePhysics(dt, collisionWorld) {
    const clampedDt = Math.min(dt, 0.05);
    if (Math.abs(this.speed) > 0.05) {
      this.speed *= Math.exp(-3.5 * clampedDt);
      const forward = this.getForwardXZ();
      this.position.x += forward.x * this.speed * clampedDt;
      this.position.z += forward.z * this.speed * clampedDt;
      if (collisionWorld) {
        collisionWorld.resolveCircleAABB(this.position, 1.3);
      }
    } else {
      this.speed = 0;
    }
    this.isBraking = false;
    this._syncVisuals(clampedDt);
  }

  _syncVisuals(dt) {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    for (const fw of this.frontWheels) {
      fw.rotation.y = this.steerAngle * 0.78;
    }

    const spinDelta = -(this.speed / 0.38) * dt;
    for (const w of this.allWheels) {
      w.rotation.x += spinDelta;
    }

    const tailMat = this.isBraking ? sharedBrakeLightMat : sharedTaillightMat;
    for (const tl of this.taillightMeshes) {
      tl.material = tailMat;
    }
  }
}

import * as THREE from 'three';
import { CAMERA, PLAYER_PHYSICS } from '../core/constants.js';

// Protagonista Rafa Sol: Stylized 3D Mesh, 3rd-Person Orbit Camera (Dist 7, Height 3), Locomotion & Collision

export class Player {
  constructor(scene, collisions, input, camera) {
    this.scene = scene;
    this.collisions = collisions;
    this.input = input;
    this.camera = camera;

    this.position = new THREE.Vector3(0, 0.3, 218); // Default on Seabreeze Promenade
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0; // Horizontal camera angle
    this.pitch = CAMERA.foot.pitch; // Vertical camera angle
    this.playerFacing = 0;

    this.isGrounded = true;
    this.isRunning = false;
    this.health = 100;
    this.armor = 50;

    this.walkCycle = 0;

    this._buildCharacterMesh();
  }

  _buildCharacterMesh() {
    this.mesh = new THREE.Group();

    // Materials
    const coralJacketMat = new THREE.MeshStandardMaterial({ color: 0xff6f59, roughness: 0.6 }); // Coral jacket
    const whiteTeeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f7, roughness: 0.8 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x334d66, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0a98b, roughness: 0.75 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221814, roughness: 0.9 });
    const shadesMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.2, metalness: 0.8 });
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x422d22, roughness: 0.8 });

    // Torso / Jacket
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.8, 0.4);
    const torso = new THREE.Mesh(torsoGeo, coralJacketMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Inner White Tee
    const teeGeo = new THREE.BoxGeometry(0.35, 0.7, 0.42);
    const tee = new THREE.Mesh(teeGeo, whiteTeeMat);
    tee.position.set(0, 1.25, 0);
    this.mesh.add(tee);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.84;
    head.castShadow = true;
    this.mesh.add(head);

    // Dark slicked hair
    const hairGeo = new THREE.BoxGeometry(0.38, 0.16, 0.38);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 2.0;
    this.mesh.add(hair);

    // Sunglasses (Cool Miami vibe)
    const shadesGeo = new THREE.BoxGeometry(0.34, 0.08, 0.1);
    const shades = new THREE.Mesh(shadesGeo, shadesMat);
    shades.position.set(0, 1.86, 0.18);
    this.mesh.add(shades);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.18, 0.72, 0.2);
    this.leftArm = new THREE.Mesh(armGeo, coralJacketMat);
    this.leftArm.position.set(-0.48, 1.22, 0);
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Mesh(armGeo, coralJacketMat);
    this.rightArm.position.set(0.48, 1.22, 0);
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.26, 0.8, 0.28);
    this.leftLeg = new THREE.Mesh(legGeo, jeansMat);
    this.leftLeg.position.set(-0.2, 0.46, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Mesh(legGeo, jeansMat);
    this.rightLeg.position.set(0.2, 0.46, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.27, 0.16, 0.34);
    const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
    leftBoot.position.set(-0.2, 0.08, 0.03);
    this.mesh.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
    rightBoot.position.set(0.2, 0.08, 0.03);
    this.mesh.add(rightBoot);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(dt) {
    this._handleLook(dt);
    this._handleMovement(dt);
    this._updateCamera();
  }

  _handleLook(dt) {
    if (this.input.mouse.dx !== 0 || this.input.mouse.dy !== 0) {
      const sens = 0.0024;
      this.yaw -= this.input.mouse.dx * sens;
      this.pitch = Math.max(-0.45, Math.min(1.15, this.pitch + this.input.mouse.dy * sens));
    }
  }

  _handleMovement(dt) {
    let forward = 0;
    let right = 0;

    if (this.input.isDown('KeyW')) forward += 1;
    if (this.input.isDown('KeyS')) forward -= 1;
    if (this.input.isDown('KeyD')) right += 1;
    if (this.input.isDown('KeyA')) right -= 1;

    this.isRunning = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');
    const speed = this.isRunning ? PLAYER_PHYSICS.sprintSpeed : PLAYER_PHYSICS.walkSpeed;

    const moveLen = Math.hypot(forward, right);
    if (moveLen > 0.001) {
      forward /= moveLen;
      right /= moveLen;

      // Move relative to camera yaw
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);

      const moveX = (right * cosY - forward * sinY) * speed;
      const moveZ = (-right * sinY - forward * cosY) * speed;

      this.velocity.x = moveX;
      this.velocity.z = moveZ;

      // Smooth rotate player mesh toward movement direction
      const targetAngle = Math.atan2(moveX, moveZ);
      this.playerFacing = targetAngle;
      this.mesh.rotation.y = targetAngle;

      // Walk cycle animation
      this.walkCycle += dt * (this.isRunning ? 14 : 8);
      const swing = Math.sin(this.walkCycle) * (this.isRunning ? 0.7 : 0.4);
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Jump
    if (this.input.wasJustPressed('Space') && this.isGrounded) {
      this.velocity.y = PLAYER_PHYSICS.jumpSpeed;
      this.isGrounded = false;
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= PLAYER_PHYSICS.gravity * dt;
    }

    // Integrate position
    let newX = this.position.x + this.velocity.x * dt;
    let newY = this.position.y + this.velocity.y * dt;
    let newZ = this.position.z + this.velocity.z * dt;

    // Ground check (promenade height is ~0.35, street ~0.1)
    const groundY = 0.28;
    if (newY <= groundY) {
      newY = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Resolve Collisions with Buildings and Props
    const resolved = this.collisions.resolveCircle(newX, newZ, PLAYER_PHYSICS.radius);
    this.position.set(resolved.x, newY, resolved.z);
    this.mesh.position.copy(this.position);
  }

  _updateCamera() {
    // 3rd Person Camera strictly compliant: Distance 7.0, Height 3.0, Looking slightly below horizon
    const camCfg = CAMERA.foot;
    const targetY = this.position.y + 1.6;

    // Calculate ideal camera position
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const idealCamDist = camCfg.distance;
    const dirX = sinYaw * cosPitch;
    const dirY = sinPitch;
    const dirZ = cosYaw * cosPitch;

    // Check collision along camera ray
    const rayDist = this.collisions.raycast(
      this.position.x,
      this.position.z,
      dirX,
      dirZ,
      idealCamDist
    );
    const actualDist = Math.max(1.8, Math.min(idealCamDist, rayDist - 0.4));

    const camX = this.position.x + dirX * actualDist;
    const camY = targetY + camCfg.height * 0.5 + dirY * actualDist;
    const camZ = this.position.z + dirZ * actualDist;

    this.camera.position.set(camX, camY, camZ);

    // Look at player's torso/head area slightly below horizon
    const lookTarget = new THREE.Vector3(
      this.position.x,
      targetY - camCfg.pitch * actualDist * 0.4,
      this.position.z
    );
    this.camera.lookAt(lookTarget);
  }
}

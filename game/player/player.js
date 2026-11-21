import * as THREE from 'three';

export class PlayerController {
  constructor(scene, collisionWorld) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;

    // Protagonist Rafa Sol starting on Seabreeze Boulevard
    this.position = new THREE.Vector3(124.5, 0.18, 28);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0.2;
    this.radius = 0.44;

    this.walkSpeed = 7.6;
    this.sprintSpeed = 12.8;
    this.jumpSpeed = 8.4;
    this.gravity = 23.0;
    this.isGrounded = true;
    this.walkCycle = 0;

    this.health = 100;
    this.maxHealth = 100;
    this.armor = 50;
    this.maxArmor = 100;
    this.money = 1250;

    this.mesh = this._buildCharacterMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  _buildCharacterMesh() {
    const root = new THREE.Group();
    root.name = 'RafaSol';

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd99b72, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf26a5b, roughness: 0.55 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf7f4eb, roughness: 0.7 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x2b4257, roughness: 0.75 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf0ece1, roughness: 0.6 });

    // Legs (pivoted at hip height 0.82m)
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.13, 0.82, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.74, 0.22), jeansMat);
    leftLeg.position.set(0, -0.37, 0);
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.3), shoeMat);
    leftShoe.position.set(0, -0.74, -0.04);
    this.leftLegPivot.add(leftShoe);
    root.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.13, 0.82, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.74, 0.22), jeansMat);
    rightLeg.position.set(0, -0.37, 0);
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.3), shoeMat);
    rightShoe.position.set(0, -0.74, -0.04);
    this.rightLegPivot.add(rightShoe);
    root.add(this.rightLegPivot);

    // Torso (coral tropical jacket over white tee)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.64, 0.28), jacketMat);
    torso.position.set(0, 1.14, 0);
    torso.castShadow = true;
    root.add(torso);

    const shirtFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.29), shirtMat);
    shirtFront.position.set(0, 1.14, -0.01);
    root.add(shirtFront);

    // Arms (pivoted at shoulders 1.4m)
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.33, 1.4, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), jacketMat);
    leftArm.position.set(0, -0.26, 0);
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);
    root.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.33, 1.4, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), jacketMat);
    rightArm.position.set(0, -0.26, 0);
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);
    root.add(this.rightArmPivot);

    // Head + hair + sunglasses
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.34), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), hairMat);
    hair.position.set(0, 0.15, 0.01);
    headGroup.add(hair);

    const shades = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.2 })
    );
    shades.position.set(0, 0.03, -0.16);
    headGroup.add(shades);

    root.add(headGroup);
    return root;
  }

  update(dt, input, cameraController) {
    const clampedDt = Math.min(dt, 0.05);

    let moveForward = 0;
    let moveRight = 0;
    if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) moveForward += 1;
    if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) moveForward -= 1;
    if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) moveRight += 1;
    if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) moveRight -= 1;

    const forwardVec = cameraController.getForwardXZ();
    const rightVec = cameraController.getRightXZ();

    const moveDir = new THREE.Vector3()
      .addScaledVector(forwardVec, moveForward)
      .addScaledVector(rightVec, moveRight);

    const isMoving = moveDir.lengthSq() > 1e-4;
    const isSprinting = input.isKeyDown('ShiftLeft') || input.isKeyDown('ShiftRight');
    const speed = isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Character faces movement direction (note model front is -Z)
      const targetHeading = Math.atan2(-moveDir.x, -moveDir.z);
      let diff = targetHeading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, clampedDt * 14);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Jump on Space
    if (input.consumeKeyPress('Space') && this.isGrounded) {
      this.velocity.y = this.jumpSpeed;
      this.isGrounded = false;
    }

    // Gravity
    this.velocity.y -= this.gravity * clampedDt;

    // Apply horizontal displacement + AABB collision resolution
    this.position.x += this.velocity.x * clampedDt;
    this.position.z += this.velocity.z * clampedDt;
    if (this.collisionWorld) {
      this.collisionWorld.resolveCircleAABB(this.position, this.radius);
    }

    // Ground height check
    const groundY = this.collisionWorld
      ? this.collisionWorld.getGroundHeightAt(this.position.x, this.position.z)
      : 0;

    this.position.y += this.velocity.y * clampedDt;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Stride limb animation
    if (isMoving && this.isGrounded) {
      const cycleRate = isSprinting ? 13 : 8.5;
      this.walkCycle += clampedDt * cycleRate;
      const swing = Math.sin(this.walkCycle) * (isSprinting ? 0.65 : 0.45);
      this.leftLegPivot.rotation.x = swing;
      this.rightLegPivot.rotation.x = -swing;
      this.leftArmPivot.rotation.x = -swing * 0.8;
      this.rightArmPivot.rotation.x = swing * 0.8;
    } else {
      this.leftLegPivot.rotation.x *= 0.82;
      this.rightLegPivot.rotation.x *= 0.82;
      this.leftArmPivot.rotation.x *= 0.82;
      this.rightArmPivot.rotation.x *= 0.82;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
  }
}

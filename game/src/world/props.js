import * as THREE from 'three';

// Realistic Curved Palm Trees, Street Lamps, and Shipping Containers

export class PropsFactory {
  constructor() {
    this.trunkMat = new THREE.MeshStandardMaterial({
      color: 0xa07850,
      roughness: 0.85
    });

    this.leafMatTop = new THREE.MeshStandardMaterial({
      color: 0x3fa34d,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    this.leafMatBot = new THREE.MeshStandardMaterial({
      color: 0x2e8b3e,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x2c3539,
      roughness: 0.4,
      metalness: 0.6
    });

    this.lampLightMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d0
    });
  }

  createPalmTree(prng) {
    const group = new THREE.Group();
    const height = prng ? prng.range(8.5, 11.5) : 10.0;
    const segments = 6;
    const segH = height / segments;

    let curY = 0;
    let curX = 0;
    let curZ = 0;
    const curveDirX = prng ? prng.range(-0.15, 0.15) : 0.08;
    const curveDirZ = prng ? prng.range(-0.15, 0.15) : 0.05;

    // Segmented curved trunk
    for (let i = 0; i < segments; i++) {
      const rTop = 0.32 * (1 - (i / segments) * 0.4);
      const rBot = 0.36 * (1 - (i / segments) * 0.4);
      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segH, 7);
      const segMesh = new THREE.Mesh(segGeo, this.trunkMat);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;

      segMesh.position.set(curX + curveDirX * i * 0.5, curY + segH * 0.5, curZ + curveDirZ * i * 0.5);
      segMesh.rotation.z = -curveDirX * 0.8;
      segMesh.rotation.x = curveDirZ * 0.8;
      group.add(segMesh);

      curY += segH;
      curX += curveDirX * i * 0.5;
      curZ += curveDirZ * i * 0.5;
    }

    // Crown: 9 leafy fan blades, radiating outward and drooping at tips (NO CONES, NO BLACK SPIKES!)
    const numLeaves = 9;
    const crown = new THREE.Group();
    crown.position.set(curX, curY - 0.2, curZ);

    for (let i = 0; i < numLeaves; i++) {
      const angle = (i / numLeaves) * Math.PI * 2 + (prng ? prng.range(-0.1, 0.1) : 0);
      const leafGroup = new THREE.Group();
      leafGroup.rotation.y = angle;

      // Leaf constructed of 3 cascading arched quads
      const leafLength = prng ? prng.range(3.8, 4.6) : 4.2;
      const leafWidth = 0.85;

      // Base section (angles upward)
      const g1 = new THREE.PlaneGeometry(leafWidth, leafLength * 0.45);
      g1.translate(0, leafLength * 0.225, 0);
      const m1 = new THREE.Mesh(g1, this.leafMatTop);
      m1.rotation.x = -Math.PI * 0.28;
      m1.castShadow = true;

      // Drooping tip section (folds downward)
      const g2 = new THREE.PlaneGeometry(leafWidth * 0.75, leafLength * 0.55);
      g2.translate(0, leafLength * 0.275, 0);
      const m2 = new THREE.Mesh(g2, this.leafMatBot);
      m2.position.set(0, Math.cos(Math.PI * 0.28) * leafLength * 0.45, Math.sin(Math.PI * 0.28) * leafLength * 0.45);
      m2.rotation.x = -Math.PI * 0.55;
      m2.castShadow = true;

      leafGroup.add(m1);
      leafGroup.add(m2);
      crown.add(leafGroup);
    }

    group.add(crown);
    return group;
  }

  createStreetLamp() {
    const group = new THREE.Group();

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.0, 8);
    const poleMesh = new THREE.Mesh(poleGeo, this.metalDarkMat);
    poleMesh.position.y = 3.0;
    poleMesh.castShadow = true;
    group.add(poleMesh);

    // Arched arm
    const armGeo = new THREE.BoxGeometry(0.08, 0.08, 1.4);
    const armMesh = new THREE.Mesh(armGeo, this.metalDarkMat);
    armMesh.position.set(0, 5.9, 0.6);
    armMesh.rotation.x = 0.15;
    group.add(armMesh);

    // Fixture / Lantern
    const fixGeo = new THREE.BoxGeometry(0.35, 0.15, 0.45);
    const fixMesh = new THREE.Mesh(fixGeo, this.lampLightMat);
    fixMesh.position.set(0, 5.85, 1.25);
    group.add(fixMesh);

    return group;
  }

  createShippingContainer(colorHex) {
    const group = new THREE.Group();
    const l = 12.0;
    const w = 4.8;
    const h = 4.8;

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.65,
      metalness: 0.25
    });

    const boxGeo = new THREE.BoxGeometry(w, h, l);
    const boxMesh = new THREE.Mesh(boxGeo, mat);
    boxMesh.position.y = h * 0.5;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    group.add(boxMesh);

    // Corner castings / edge ribs
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.7 });
    const edgeGeo = new THREE.BoxGeometry(w + 0.1, 0.2, l + 0.1);
    const topEdge = new THREE.Mesh(edgeGeo, edgeMat);
    topEdge.position.y = h;
    group.add(topEdge);

    return group;
  }
}

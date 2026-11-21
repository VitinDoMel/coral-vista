// Procedural 3D props: lush palm trees, street lamps, striped awnings, containers

import * as THREE from 'three';
import { COLORS } from '../core/constants.js';

export class PropsFactory {
  constructor(textureFactory) {
    this.textures = textureFactory;
    this.initSharedGeometries();
  }

  initSharedGeometries() {
    this.trunkMat = new THREE.MeshStandardMaterial({
      color: 0x9c7255, // Light warm palm wood
      roughness: 0.8,
    });
    this.frondMat = new THREE.MeshStandardMaterial({
      color: 0x2e8b57, // Vibrant sea-green / tropical palm frond
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    this.lampPoleMat = new THREE.MeshStandardMaterial({
      color: 0x50565e,
      metalness: 0.8,
      roughness: 0.25,
    });
    this.lampGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
    });
  }

  createPalmTree(height = 9.5) {
    const group = new THREE.Group();

    // Curved trunk with segmented wooden rings
    const segments = 6;
    const segHeight = height / segments;
    let currY = 0;
    let currX = 0;
    let angle = 0;

    for (let i = 0; i < segments; i++) {
      const rTop = 0.32 * (1.0 - (i / segments) * 0.3);
      const rBot = 0.36 * (1.0 - (i / segments) * 0.3);
      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segHeight, 7);
      const segMesh = new THREE.Mesh(segGeo, this.trunkMat);
      segMesh.castShadow = true;
      segMesh.position.set(currX, currY + segHeight * 0.5, 0);
      segMesh.rotation.z = angle;
      group.add(segMesh);

      // Ring accent at trunk joints
      const ringGeo = new THREE.TorusGeometry(rBot * 1.05, 0.04, 4, 8);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, this.trunkMat);
      ring.position.set(currX, currY, 0);
      group.add(ring);

      currY += segHeight * Math.cos(angle);
      currX += segHeight * Math.sin(angle);
      angle += 0.035;
    }

    // Lush tropical crown: 10 wide, curved green leaves radiating outward
    const frondCount = 10;
    for (let f = 0; f < frondCount; f++) {
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currX, currY, 0);

      const theta = (f / frondCount) * Math.PI * 2;
      frondGroup.rotation.y = theta;

      // Curved leaf ribbon made of 4 connected drooping quads
      const leafGeo = new THREE.PlaneGeometry(1.2, 4.6, 1, 4);
      leafGeo.rotateX(-Math.PI / 2);
      leafGeo.translate(0, 0, 2.3);

      const pos = leafGeo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const z = pos.getZ(j);
        const arch = Math.sin((z / 4.6) * Math.PI * 0.8) * 0.9;
        const droop = -Math.pow(z / 4.6, 2) * 1.6;
        pos.setY(j, arch + droop);
        const x = pos.getX(j);
        const taper = 1.0 - (z / 4.6) * 0.75;
        pos.setX(j, x * taper);
      }
      leafGeo.computeVertexNormals();

      const leafMesh = new THREE.Mesh(leafGeo, this.frondMat);
      leafMesh.castShadow = true;
      leafMesh.rotation.x = 0.22;
      frondGroup.add(leafMesh);
      group.add(frondGroup);
    }

    return group;
  }

  createAwning(width = 8.0, depth = 2.4, colorHex = 0xe91e63) {
    const group = new THREE.Group();
    // Sloped awning canopy
    const canGeo = new THREE.BoxGeometry(width, 0.12, depth);
    canGeo.rotateX(0.28);
    const canMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
    });
    const canopy = new THREE.Mesh(canGeo, canMat);
    canopy.castShadow = true;
    group.add(canopy);

    // Front decorative scalloped valence
    const valGeo = new THREE.BoxGeometry(width, 0.45, 0.08);
    const valMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const valence = new THREE.Mesh(valGeo, valMat);
    valence.position.set(0, -0.45, depth * 0.48);
    group.add(valence);

    return group;
  }

  createStreetLamp() {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.8, 8);
    const poleMesh = new THREE.Mesh(poleGeo, this.lampPoleMat);
    poleMesh.position.y = 3.4;
    poleMesh.castShadow = true;
    group.add(poleMesh);

    // Curved arm
    const armGeo = new THREE.BoxGeometry(1.8, 0.14, 0.14);
    const armMesh = new THREE.Mesh(armGeo, this.lampPoleMat);
    armMesh.position.set(0.8, 6.6, 0);
    group.add(armMesh);

    // Glowing lantern
    const lanternGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8);
    const lanternMesh = new THREE.Mesh(lanternGeo, this.lampGlowMat);
    lanternMesh.position.set(1.6, 6.3, 0);
    group.add(lanternMesh);

    return group;
  }

  createShippingContainer(colorHex) {
    const geo = new THREE.BoxGeometry(6.0, 2.6, 2.4);
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.getContainerTexture(colorHex),
      roughness: 0.5,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

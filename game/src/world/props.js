// Procedural 3D props: palm trees, street lamps, containers, benches

import * as THREE from 'three';
import { COLORS } from '../core/constants.js';

export class PropsFactory {
  constructor(textureFactory) {
    this.textures = textureFactory;
    this.palmGeo = null;
    this.lampGeo = null;
    this.initSharedGeometries();
  }

  initSharedGeometries() {
    // Palm tree trunk and fronds
    this.trunkMat = new THREE.MeshStandardMaterial({
      color: COLORS.PALM_WOOD,
      roughness: 0.9,
    });
    this.frondMat = new THREE.MeshStandardMaterial({
      color: COLORS.PALM_LEAF,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    this.lampPoleMat = new THREE.MeshStandardMaterial({
      color: 0x42464b,
      metalness: 0.8,
      roughness: 0.3,
    });
    this.lampGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffea9f,
    });
  }

  createPalmTree(height = 9.0) {
    const group = new THREE.Group();

    // Curved trunk made of segmented cylinders
    const segments = 5;
    const segHeight = height / segments;
    let currY = 0;
    let currX = 0;
    let angle = 0;

    for (let i = 0; i < segments; i++) {
      const rTop = 0.28 * (1.0 - (i / segments) * 0.35);
      const rBot = 0.32 * (1.0 - (i / segments) * 0.35);
      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segHeight, 6);
      const segMesh = new THREE.Mesh(segGeo, this.trunkMat);
      segMesh.castShadow = true;
      segMesh.position.set(currX, currY + segHeight * 0.5, 0);
      segMesh.rotation.z = angle;
      group.add(segMesh);

      currY += segHeight * Math.cos(angle);
      currX += segHeight * Math.sin(angle);
      angle += 0.04;
    }

    // Top palm fronds radiating outward and curving down
    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
      const frondGeo = new THREE.ConeGeometry(0.7, 3.8, 4);
      frondGeo.translate(0, 1.9, 0);
      const frondMesh = new THREE.Mesh(frondGeo, this.frondMat);
      frondMesh.castShadow = true;
      frondMesh.position.set(currX, currY, 0);
      const theta = (f / frondCount) * Math.PI * 2;
      frondMesh.rotation.y = theta;
      frondMesh.rotation.x = 1.15; // droop downwards
      group.add(frondMesh);
    }

    return group;
  }

  createStreetLamp() {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8);
    const poleMesh = new THREE.Mesh(poleGeo, this.lampPoleMat);
    poleMesh.position.y = 3.25;
    poleMesh.castShadow = true;
    group.add(poleMesh);

    // Curved arm
    const armGeo = new THREE.BoxGeometry(1.6, 0.12, 0.12);
    const armMesh = new THREE.Mesh(armGeo, this.lampPoleMat);
    armMesh.position.set(0.7, 6.4, 0);
    group.add(armMesh);

    // Glowing lantern fixture
    const lanternGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.45, 8);
    const lanternMesh = new THREE.Mesh(lanternGeo, this.lampGlowMat);
    lanternMesh.position.set(1.4, 6.1, 0);
    group.add(lanternMesh);

    return group;
  }

  createShippingContainer(colorHex) {
    const geo = new THREE.BoxGeometry(6.0, 2.6, 2.4);
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.getContainerTexture(colorHex),
      roughness: 0.5,
      metalness: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

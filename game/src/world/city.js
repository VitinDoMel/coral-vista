// Procedural generation of Coral Vista: Art Déco buildings, beach, port, and bridge

import * as THREE from 'three';
import { WORLD, COLORS } from '../core/constants.js';
import { createRNG } from '../core/math.js';
import { PropsFactory } from './props.js';

export class CityBuilder {
  constructor(scene, collisions, textureFactory, seed = 19861121) {
    this.scene = scene;
    this.collisions = collisions;
    this.textures = textureFactory;
    this.props = new PropsFactory(textureFactory);
    this.rng = createRNG(seed);
    this.roads = [];
  }

  build() {
    this.buildTerrainAndRoads();
    this.buildDowntown();
    this.buildResidential();
    this.buildPort();
    this.buildBridge();
    this.buildBeachAndBoardwalk();
    this.buildStreetFurniture();
  }

  buildTerrainAndRoads() {
    // City ground base from beach edge (-96) to East boundary (250)
    const groundW = 250 - (-96);
    const groundGeo = new THREE.PlaneGeometry(groundW, WORLD.SIZE);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.ASPHALT,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(-96 + groundW * 0.5, 0, 0);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Seabreeze Boulevard
    this.createRoadSegment(WORLD.AVENUE_X, 0, WORLD.ROAD_WIDTH * 1.3, WORLD.SIZE - 40, true);

    // City grid avenues
    const nsAvenues = [-40, 10, 60, 110, 160];
    for (const x of nsAvenues) {
      this.createRoadSegment(x, 0, WORLD.ROAD_WIDTH, WORLD.SIZE - 60, true);
    }

    const ewStreets = [-120, -70, -20, 30, 80, 130];
    for (const z of ewStreets) {
      this.createRoadSegment(50, z, 240, WORLD.ROAD_WIDTH, false);
      this.createCrosswalk(WORLD.AVENUE_X, z);
    }

    // Light clean concrete sidewalks along Seabreeze Boulevard
    this.createSidewalk(WORLD.AVENUE_X - 12, 0, 5.0, WORLD.SIZE - 40);
    this.createSidewalk(WORLD.AVENUE_X + 12, 0, 5.0, WORLD.SIZE - 40);
  }

  createRoadSegment(x, z, width, length, isNorthSouth) {
    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);
    if (!isNorthSouth) geo.rotateY(Math.PI / 2);

    const roadTex = this.textures.getRoadTexture().clone();
    roadTex.repeat.set(1, Math.round(length / 20));
    roadTex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.05, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createSidewalk(x, z, width, length) {
    const geo = new THREE.BoxGeometry(width, 0.25, length);
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.getSidewalkTexture(),
      roughness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.12, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Raised curb on road edge
    const curbGeo = new THREE.BoxGeometry(0.3, 0.32, length);
    const curbMat = new THREE.MeshStandardMaterial({ color: COLORS.CURB });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    const curbX = x > WORLD.AVENUE_X ? (x - width * 0.5) : (x + width * 0.5);
    curb.position.set(curbX, 0.16, z);
    curb.receiveShadow = true;
    this.scene.add(curb);
  }

  createCrosswalk(x, z) {
    const geo = new THREE.PlaneGeometry(16, 5);
    geo.rotateX(-Math.PI / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * 22 + 4, 0, 14, 32);
    }
    const mat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.08, z);
    this.scene.add(mesh);
  }

  buildDowntown() {
    const blocks = [
      { x: -65, z: -95, w: 30, d: 30 },
      { x: -65, z: -45, w: 30, d: 30 },
      { x: -65, z: 5,   w: 30, d: 30 },
      { x: -65, z: 55,  w: 30, d: 30 },
      { x: -15, z: -95, w: 34, d: 34 },
      { x: -15, z: -45, w: 34, d: 34 },
      { x: -15, z: 5,   w: 34, d: 34 },
      { x: 35,  z: -95, w: 32, d: 32 },
      { x: 35,  z: -45, w: 32, d: 32 },
      { x: 35,  z: 5,   w: 32, d: 32 },
    ];

    const decoColors = COLORS.ART_DECO;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const height = this.rng.range(36, 82);
      const palette = decoColors[i % decoColors.length];

      const bldgGeo = new THREE.BoxGeometry(b.w, height, b.d);
      bldgGeo.translate(0, height / 2, 0);

      const tex = this.textures.getArtDecoBuildingTexture(palette, i + 1);
      tex.repeat.set(Math.round(b.w / 10), Math.round(height / 14));
      tex.needsUpdate = true;

      const mat = new THREE.MeshStandardMaterial({
        color: palette, // Distinct pastel Art Déco tint
        map: tex,
        roughness: 0.45,
        metalness: 0.15,
      });

      const mesh = new THREE.Mesh(bldgGeo, mat);
      mesh.position.set(b.x, 0, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Colorful awning over ground entrance facing Seabreeze Boulevard
      if (b.x === -65) {
        const awningColor = decoColors[(i + 3) % decoColors.length];
        const awning = this.props.createAwning(12.0, 3.0, awningColor);
        awning.position.set(b.x - b.w * 0.5 - 0.2, 4.0, b.z);
        awning.rotation.y = -Math.PI / 2;
        this.scene.add(awning);
      }

      // Stepped Art Déco crown
      const crownGeo = new THREE.BoxGeometry(b.w * 0.6, 6.0, b.d * 0.6);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(b.x, height + 3.0, b.z);
      crown.castShadow = true;
      this.scene.add(crown);

      // Antenna spire
      const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 12, 6);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(b.x, height + 12.0, b.z);
      this.scene.add(spire);

      this.collisions.addBox(
        b.x - b.w / 2, 0, b.z - b.d / 2,
        b.x + b.w / 2, height, b.z + b.d / 2,
        'skyscraper'
      );
    }
  }

  buildResidential() {
    const colors = COLORS.ART_DECO;
    const xPositions = [85, 135];
    const zPositions = [-95, -45, 5, 55];

    let bIdx = 0;
    for (const x of xPositions) {
      for (const z of zPositions) {
        bIdx++;
        const w = 30;
        const d = 30;
        const height = this.rng.range(16, 28);
        const palette = colors[bIdx % colors.length];

        const geo = new THREE.BoxGeometry(w, height, d);
        geo.translate(0, height / 2, 0);

        const tex = this.textures.getArtDecoBuildingTexture(palette, bIdx + 10);
        tex.repeat.set(Math.round(w / 10), Math.round(height / 8));
        tex.needsUpdate = true;

        const mat = new THREE.MeshStandardMaterial({
          color: palette,
          map: tex,
          roughness: 0.6,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.collisions.addBox(
          x - w / 2, 0, z - d / 2,
          x + w / 2, height, z + d / 2,
          'residential'
        );
      }
    }
  }

  buildPort() {
    const portBaseGeo = new THREE.BoxGeometry(110, 0.4, 90);
    const portMat = new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.8 });
    const portBase = new THREE.Mesh(portBaseGeo, portMat);
    portBase.position.set(110, 0.2, 140);
    portBase.receiveShadow = true;
    this.scene.add(portBase);

    // Large warehouse building
    const whGeo = new THREE.BoxGeometry(60, 14, 30);
    const whMat = new THREE.MeshStandardMaterial({ color: 0x6e7885, roughness: 0.6 });
    const warehouse = new THREE.Mesh(whGeo, whMat);
    warehouse.position.set(110, 7.0, 165);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    this.scene.add(warehouse);

    this.collisions.addBox(80, 0, 150, 140, 14, 180, 'warehouse');

    // Stacks of containers
    const containerColors = COLORS.CONTAINER_COLORS;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const stackHeight = (row + col) % 3 + 1;
        const cx = 75 + col * 7.5;
        const cz = 105 + row * 6.5;

        for (let h = 0; h < stackHeight; h++) {
          const color = containerColors[(row * 3 + col + h) % containerColors.length];
          const cont = this.props.createShippingContainer(color);
          cont.position.set(cx, 1.3 + h * 2.6, cz);
          this.scene.add(cont);
        }

        this.collisions.addBox(
          cx - 3.0, 0, cz - 1.2,
          cx + 3.0, stackHeight * 2.6, cz + 1.2,
          'container_stack'
        );
      }
    }

    // Industrial harbor crane
    const craneGeo = new THREE.BoxGeometry(4, 32, 4);
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, metalness: 0.7 });
    const crane = new THREE.Mesh(craneGeo, craneMat);
    crane.position.set(155, 16, 120);
    crane.castShadow = true;
    this.scene.add(crane);

    const boomGeo = new THREE.BoxGeometry(36, 3, 3);
    const boom = new THREE.Mesh(boomGeo, craneMat);
    boom.position.set(145, 30, 120);
    boom.castShadow = true;
    this.scene.add(boom);
  }

  buildBridge() {
    const bridgeW = 18;
    const bridgeL = 120;
    const bridgeY = 14;

    const deckGeo = new THREE.BoxGeometry(bridgeW, 2.0, bridgeL);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x42464f, roughness: 0.6 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(-20, bridgeY, -190);
    deck.receiveShadow = true;
    deck.castShadow = true;
    this.scene.add(deck);

    // Bridge pylons
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
    const pylonGeo = new THREE.BoxGeometry(3, 44, 3);

    const pylon1 = new THREE.Mesh(pylonGeo, pylonMat);
    pylon1.position.set(-20 - 8, 22, -190);
    pylon1.castShadow = true;
    this.scene.add(pylon1);

    const pylon2 = new THREE.Mesh(pylonGeo, pylonMat);
    pylon2.position.set(-20 + 8, 22, -190);
    pylon2.castShadow = true;
    this.scene.add(pylon2);

    // Crossbeam
    const crossGeo = new THREE.BoxGeometry(19, 2.5, 2.5);
    const cross = new THREE.Mesh(crossGeo, pylonMat);
    cross.position.set(-20, 36, -190);
    cross.castShadow = true;
    this.scene.add(cross);

    this.collisions.addBox(-20 - bridgeW / 2, bridgeY, -190 - bridgeL / 2, -20 - bridgeW / 2 + 1, bridgeY + 3, -190 + bridgeL / 2, 'bridge_rail');
    this.collisions.addBox(-20 + bridgeW / 2 - 1, bridgeY, -190 - bridgeL / 2, -20 + bridgeW / 2, bridgeY + 3, -190 + bridgeL / 2, 'bridge_rail');
  }

  buildBeachAndBoardwalk() {
    // Wide radiant golden sand beach meeting water at x = -135
    const beachW = 44; // from -140 to -96
    const beachGeo = new THREE.PlaneGeometry(beachW, WORLD.SIZE - 40);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xf5d378, // Radiant golden Miami beach sand
      roughness: 0.88,
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(-96 - beachW * 0.5, 0.05, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Light sunlit stone pedestrian promenade / sidewalk along Ocean Blvd
    const walkGeo = new THREE.BoxGeometry(5.0, 0.28, WORLD.SIZE - 60);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cb, roughness: 0.85 });
    const walk = new THREE.Mesh(walkGeo, walkMat);
    walk.position.set(-96, 0.18, 0);
    walk.receiveShadow = true;
    this.scene.add(walk);
  }

  buildStreetFurniture() {
    // Lush palm trees placed along the street border
    for (let z = -200; z <= 200; z += 18) {
      // West side palm line (placed between boardwalk and street at x = -91)
      const palmW = this.props.createPalmTree(this.rng.range(8.5, 11));
      palmW.position.set(WORLD.AVENUE_X - 6.5, 0.25, z + this.rng.range(-0.5, 0.5));
      this.scene.add(palmW);

      // East side palm line
      const palmE = this.props.createPalmTree(this.rng.range(8.5, 11));
      palmE.position.set(WORLD.AVENUE_X + 13.5, 0.25, z + this.rng.range(-0.5, 0.5));
      this.scene.add(palmE);

      // Street lamps every 36m
      if (z % 36 === 0) {
        const lampW = this.props.createStreetLamp();
        lampW.position.set(WORLD.AVENUE_X - 11.5, 0.25, z);
        lampW.rotation.y = Math.PI / 2;
        this.scene.add(lampW);

        const lampE = this.props.createStreetLamp();
        lampE.position.set(WORLD.AVENUE_X + 11.5, 0.25, z);
        lampE.rotation.y = -Math.PI / 2;
        this.scene.add(lampE);
      }
    }
  }
}

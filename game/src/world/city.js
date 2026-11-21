// Procedural generation of Coral Vista city districts, roads, and structures

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
    // City ground base
    const groundGeo = new THREE.PlaneGeometry(WORLD.SIZE, WORLD.SIZE);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.ASPHALT,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ocean Boulevard (coastal avenue)
    this.createRoadSegment(WORLD.AVENUE_X, 0, WORLD.ROAD_WIDTH * 1.3, WORLD.SIZE - 40, true);

    // City grid roads: 4 North-South avenues and 6 East-West streets
    const nsAvenues = [-40, 10, 60, 110, 160];
    for (const x of nsAvenues) {
      this.createRoadSegment(x, 0, WORLD.ROAD_WIDTH, WORLD.SIZE - 60, true);
    }

    const ewStreets = [-120, -70, -20, 30, 80, 130];
    for (const z of ewStreets) {
      this.createRoadSegment(50, z, 240, WORLD.ROAD_WIDTH, false);
    }
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

    this.roads.push({ x, z, width, length, isNorthSouth });
  }

  buildDowntown() {
    // High-rise glass and concrete skyscrapers
    const blocks = [
      { x: -65, z: -95, w: 32, d: 32 },
      { x: -65, z: -45, w: 32, d: 32 },
      { x: -65, z: 5, w: 32, d: 32 },
      { x: -15, z: -95, w: 34, d: 34 },
      { x: -15, z: -45, w: 34, d: 34 },
      { x: -15, z: 5, w: 34, d: 34 },
      { x: 35, z: -95, w: 32, d: 32 },
      { x: 35, z: -45, w: 32, d: 32 },
      { x: 35, z: 5, w: 32, d: 32 },
    ];

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const height = this.rng.range(38, 85);
      const bldgGeo = new THREE.BoxGeometry(b.w, height, b.d);
      bldgGeo.translate(0, height / 2, 0);

      const tex = this.textures.getBuildingTexture('downtown', i + 1);
      tex.repeat.set(Math.round(b.w / 12), Math.round(height / 16));
      tex.needsUpdate = true;

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(bldgGeo, mat);
      mesh.position.set(b.x, 0, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Rooftop HVAC / antenna
      const roofBoxGeo = new THREE.BoxGeometry(b.w * 0.45, 4.0, b.d * 0.45);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45 });
      const roofBox = new THREE.Mesh(roofBoxGeo, roofMat);
      roofBox.position.set(b.x, height + 2.0, b.z);
      roofBox.castShadow = true;
      this.scene.add(roofBox);

      // Register collision box
      this.collisions.addBox(
        b.x - b.w / 2, 0, b.z - b.d / 2,
        b.x + b.w / 2, height, b.z + b.d / 2,
        'skyscraper'
      );
    }
  }

  buildResidential() {
    // Flamingo Palms: pastel colored 3-5 story buildings
    const colors = [0xf7a399, 0xf6bc66, 0x90dbf4, 0xb8f2e6, 0xfde2e4];
    const xPositions = [85, 135];
    const zPositions = [-95, -45, 5, 55];

    let bIdx = 0;
    for (const x of xPositions) {
      for (const z of zPositions) {
        bIdx++;
        const w = 30;
        const d = 30;
        const height = this.rng.range(14, 26);
        const geo = new THREE.BoxGeometry(w, height, d);
        geo.translate(0, height / 2, 0);

        const tex = this.textures.getBuildingTexture('residential', bIdx);
        tex.repeat.set(Math.round(w / 10), Math.round(height / 8));
        tex.needsUpdate = true;

        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          color: colors[bIdx % colors.length],
          roughness: 0.7,
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
    // Port of Coral Vista: warehouses and stacks of shipping containers
    const portBaseGeo = new THREE.BoxGeometry(110, 0.4, 90);
    const portMat = new THREE.MeshStandardMaterial({ color: 0x484b50, roughness: 0.8 });
    const portBase = new THREE.Mesh(portBaseGeo, portMat);
    portBase.position.set(110, 0.2, 140);
    portBase.receiveShadow = true;
    this.scene.add(portBase);

    // Large warehouse building
    const whGeo = new THREE.BoxGeometry(60, 14, 30);
    const whMat = new THREE.MeshStandardMaterial({ color: 0x616a75, roughness: 0.6 });
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
    // Vista Causeway suspension bridge to the North
    const bridgeW = 18;
    const bridgeL = 120;
    const bridgeY = 14;

    const deckGeo = new THREE.BoxGeometry(bridgeW, 2.0, bridgeL);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x3e424b, roughness: 0.6 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(-20, bridgeY, -190);
    deck.receiveShadow = true;
    deck.castShadow = true;
    this.scene.add(deck);

    // Bridge pylons
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.4 });
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

    // Bridge guardrails
    this.collisions.addBox(-20 - bridgeW / 2, bridgeY, -190 - bridgeL / 2, -20 - bridgeW / 2 + 1, bridgeY + 3, -190 + bridgeL / 2, 'bridge_rail');
    this.collisions.addBox(-20 + bridgeW / 2 - 1, bridgeY, -190 - bridgeL / 2, -20 + bridgeW / 2, bridgeY + 3, -190 + bridgeL / 2, 'bridge_rail');
  }

  buildBeachAndBoardwalk() {
    // Sandy slope on the West side
    const beachGeo = new THREE.PlaneGeometry(35, WORLD.SIZE - 40);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: COLORS.SAND,
      roughness: 0.95,
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(-115, -0.4, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Wooden pedestrian boardwalk
    const walkGeo = new THREE.BoxGeometry(6, 0.4, WORLD.SIZE - 60);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x9b7653, roughness: 0.8 });
    const walk = new THREE.Mesh(walkGeo, walkMat);
    walk.position.set(-98, 0.2, 0);
    walk.receiveShadow = true;
    this.scene.add(walk);
  }

  buildStreetFurniture() {
    // Palms along Ocean Boulevard
    for (let z = -200; z <= 200; z += 18) {
      // West sidewalk
      const palmW = this.props.createPalmTree(this.rng.range(8, 11));
      palmW.position.set(WORLD.AVENUE_X - 12, 0, z + this.rng.range(-1, 1));
      this.scene.add(palmW);

      // East sidewalk
      const palmE = this.props.createPalmTree(this.rng.range(8, 11));
      palmE.position.set(WORLD.AVENUE_X + 12, 0, z + this.rng.range(-1, 1));
      this.scene.add(palmE);

      // Street lamps every 36m
      if (z % 36 === 0) {
        const lampW = this.props.createStreetLamp();
        lampW.position.set(WORLD.AVENUE_X - 11, 0, z);
        lampW.rotation.y = Math.PI / 2;
        this.scene.add(lampW);

        const lampE = this.props.createStreetLamp();
        lampE.position.set(WORLD.AVENUE_X + 11, 0, z);
        lampE.rotation.y = -Math.PI / 2;
        this.scene.add(lampE);
      }
    }
  }
}

import * as THREE from 'three';
import { PALETTE, DISTRICTS, CITY_BOUNDS } from '../core/constants.js';

// Procedural Art-Deco City: Seabreeze Boulevard, Downtown Skyscrapers, Flamingo Palms, Port, Causeway Bridge

export class City {
  constructor(scene, collisions, textureFactory, propsFactory, prng) {
    this.scene = scene;
    this.collisions = collisions;
    this.textures = textureFactory;
    this.props = propsFactory;
    this.prng = prng;

    this.roads = [];
    this.buildings = [];
    this.nodes = []; // For traffic and navigation

    this._buildRoadNetwork();
    this._buildDistricts();
    this._buildSeabreezePromenade();
    this._buildCausewayBridge();
    this._buildCargoPort();
  }

  _buildRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.getRoadTexture(),
      roughness: 0.8
    });
    const zebraMat = new THREE.MeshStandardMaterial({
      map: this.textures.getZebraTexture(),
      roughness: 0.75
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: PALETTE.curb,
      roughness: 0.7
    });

    const setupRoadUV = (geo, lenMeters, isAlongX) => {
      const uv = geo.attributes.uv;
      const repeats = lenMeters / 12;
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        if (isAlongX) {
          uv.setXY(i, v, u * repeats);
        } else {
          uv.setXY(i, u, v * repeats);
        }
      }
      uv.needsUpdate = true;
    };

    // 1. Seabreeze Boulevard (East-West coastal thoroughfare at Z = 200)
    const sbGeo = new THREE.PlaneGeometry(640, 22);
    setupRoadUV(sbGeo, 640, true);
    const sbMesh = new THREE.Mesh(sbGeo, roadMat);
    sbMesh.rotation.x = -Math.PI / 2;
    sbMesh.position.set(0, 0.08, 200);
    sbMesh.receiveShadow = true;
    this.scene.add(sbMesh);
    this.roads.push({ minX: -320, maxX: 320, minZ: 189, maxZ: 211, isCoastal: true });

    // 2. Main E-W Avenues
    const zAvenues = [100, 0, -100, -200];
    for (let z of zAvenues) {
      const geo = new THREE.PlaneGeometry(560, 18);
      setupRoadUV(geo, 560, true);
      const m = new THREE.Mesh(geo, roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.08, z);
      m.receiveShadow = true;
      this.scene.add(m);
      this.roads.push({ minX: -280, maxX: 280, minZ: z - 9, maxZ: z + 9 });
    }

    // 3. Cross Streets N-S
    const xStreets = [-200, -100, 0, 100, 200];
    for (let x of xStreets) {
      const geo = new THREE.PlaneGeometry(16, 420);
      setupRoadUV(geo, 420, false);
      const m = new THREE.Mesh(geo, roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.082, 0);
      m.receiveShadow = true;
      this.scene.add(m);
      this.roads.push({ minX: x - 8, maxX: x + 8, minZ: -210, maxZ: 210 });

      // Crosswalks at intersections
      for (let z of [...zAvenues, 200]) {
        const zw = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), zebraMat);
        zw.rotation.x = -Math.PI / 2;
        zw.position.set(x, 0.085, z + 11);
        this.scene.add(zw);

        const ze = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), zebraMat);
        ze.rotation.x = -Math.PI / 2;
        ze.position.set(x, 0.085, z - 11);
        this.scene.add(ze);
      }
    }
  }

  _buildDistricts() {
    const swMat = new THREE.MeshStandardMaterial({
      map: this.textures.getSidewalkTexture(),
      roughness: 0.85
    });

    // Generate City Blocks between roads
    const xCoords = [-280, -200, -100, 0, 100, 200, 280];
    const zCoords = [-200, -100, 0, 100, 200];

    for (let i = 0; i < xCoords.length - 1; i++) {
      for (let j = 0; j < zCoords.length - 1; j++) {
        const x1 = xCoords[i] + 9;
        const x2 = xCoords[i + 1] - 9;
        const z1 = zCoords[j] + 9;
        const z2 = zCoords[j + 1] - 9;

        const bw = x2 - x1;
        const bd = z2 - z1;
        const cx = (x1 + x2) * 0.5;
        const cz = (z1 + z2) * 0.5;

        // Skip Port area (South-West corner)
        if (cx < -120 && cz < -120) continue;

        // Sidewalk Base for block (#cfc8bb)
        const swGeo = new THREE.BoxGeometry(bw, 0.28, bd);
        const swMesh = new THREE.Mesh(swGeo, swMat);
        swMesh.position.set(cx, 0.14, cz);
        swMesh.receiveShadow = true;
        this.scene.add(swMesh);

        // Determine District style & building height
        const isDowntown = Math.abs(cx) <= 120 && Math.abs(cz) <= 60;
        const isCoastalRow = (cz > 120);

        this._populateBlock(x1, x2, z1, z2, isDowntown, isCoastalRow);
      }
    }
  }

  _populateBlock(x1, x2, z1, z2, isDowntown, isCoastalRow) {
    const bw = x2 - x1;
    const bd = z2 - z1;

    // Subdivide block into 2 to 4 buildings
    const splitX = bw > 60;
    const splitZ = bd > 60;

    const subBlocks = [];
    if (splitX && splitZ) {
      const midX = (x1 + x2) * 0.5;
      const midZ = (z1 + z2) * 0.5;
      subBlocks.push({ x1: x1 + 3, x2: midX - 2, z1: z1 + 3, z2: midZ - 2 });
      subBlocks.push({ x1: midX + 2, x2: x2 - 3, z1: z1 + 3, z2: midZ - 2 });
      subBlocks.push({ x1: x1 + 3, x2: midX - 2, z1: midZ + 2, z2: z2 - 3 });
      subBlocks.push({ x1: midX + 2, x2: x2 - 3, z1: midZ + 2, z2: z2 - 3 });
    } else {
      subBlocks.push({ x1: x1 + 4, x2: x2 - 4, z1: z1 + 4, z2: z2 - 4 });
    }

    for (let sb of subBlocks) {
      const w = sb.x2 - sb.x1;
      const d = sb.z2 - sb.z1;
      const posX = (sb.x1 + sb.x2) * 0.5;
      const posZ = (sb.z1 + sb.z2) * 0.5;

      let height;
      if (isDowntown) {
        height = this.prng.range(55, 120);
      } else if (isCoastalRow) {
        height = this.prng.range(18, 38); // Art Deco beachfront hotels
      } else {
        height = this.prng.range(14, 28); // Flamingo Palms apartments
      }

      const colorHex = this.prng.choice(PALETTE.buildings);
      const tex = this.textures.getBuildingFacade(colorHex, this.prng.rangeInt(1, 999));

      const bldGeo = new THREE.BoxGeometry(w, height, d);
      const bldMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        map: tex,
        roughness: 0.65,
        metalness: 0.15
      });

      const bldMesh = new THREE.Mesh(bldGeo, bldMat);
      bldMesh.position.set(posX, height * 0.5 + 0.28, posZ);
      bldMesh.castShadow = true;
      bldMesh.receiveShadow = true;
      this.scene.add(bldMesh);

      // Register collision box
      this.collisions.addCollider({
        minX: sb.x1,
        maxX: sb.x2,
        minZ: sb.z1,
        maxZ: sb.z2,
        minY: 0,
        maxY: height,
        type: 'building'
      });

      this.buildings.push({
        x: posX,
        z: posZ,
        width: w,
        depth: d,
        height,
        colorHex
      });

      // Rooftop decorative tier (Art Deco crown)
      if (height > 30) {
        const capW = w * 0.7;
        const capD = d * 0.7;
        const capH = 6;
        const capGeo = new THREE.BoxGeometry(capW, capH, capD);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(posX, height + capH * 0.5 + 0.28, posZ);
        capMesh.castShadow = true;
        this.scene.add(capMesh);
      }
    }
  }

  _buildSeabreezePromenade() {
    const swMat = new THREE.MeshStandardMaterial({
      map: this.textures.getSidewalkTexture(),
      roughness: 0.85
    });

    // Wide Seaside Boardwalk Promenade (between Seabreeze Blvd and Sand Beach)
    const promGeo = new THREE.BoxGeometry(640, 0.35, 14);
    const promMesh = new THREE.Mesh(promGeo, swMat);
    promMesh.position.set(0, 0.175, 218);
    promMesh.receiveShadow = true;
    this.scene.add(promMesh);

    // Row of Curved Palm Trees along Seabreeze Boardwalk (spaced every 22 meters)
    for (let x = -280; x <= 280; x += 22) {
      const palm = this.props.createPalmTree(this.prng);
      palm.position.set(x + this.prng.range(-1, 1), 0.35, 218 + this.prng.range(-1, 1));
      this.scene.add(palm);

      // Colliders for palm trunks
      this.collisions.addCollider({
        minX: x - 0.5,
        maxX: x + 0.5,
        minZ: 217.5,
        maxZ: 218.5,
        minY: 0,
        maxY: 12,
        type: 'palm'
      });
    }

    // Modern Street Lamps along the coastal avenue
    for (let x = -270; x <= 270; x += 36) {
      const lamp = this.props.createStreetLamp();
      lamp.position.set(x, 0.3, 211.5);
      lamp.rotation.y = -Math.PI / 2;
      this.scene.add(lamp);
    }
  }

  _buildCausewayBridge() {
    // Vista Causeway Bridge: stretches East over water from X=200 to X=420 at Z=-200
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.getRoadTexture(),
      roughness: 0.8
    });
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xe8e6e1,
      roughness: 0.7
    });

    const bridgeLen = 220;
    const bridgeW = 18;
    const startX = 200;
    const centerBridgeX = startX + bridgeLen * 0.5;

    // Road deck
    const deckGeo = new THREE.BoxGeometry(bridgeLen, 1.2, bridgeW);
    const deckMesh = new THREE.Mesh(deckGeo, roadMat);
    deckMesh.position.set(centerBridgeX, 3.5, -200);
    deckMesh.receiveShadow = true;
    this.scene.add(deckMesh);

    // Bridge Pylons
    for (let x = startX + 30; x < startX + bridgeLen; x += 55) {
      const pylonGeo = new THREE.CylinderGeometry(1.6, 2.2, 8, 8);
      const pylon = new THREE.Mesh(pylonGeo, concreteMat);
      pylon.position.set(x, 0, -200);
      pylon.castShadow = true;
      this.scene.add(pylon);
    }

    // Safety railings
    const railGeo = new THREE.BoxGeometry(bridgeLen, 1.2, 0.4);
    const railNorth = new THREE.Mesh(railGeo, concreteMat);
    railNorth.position.set(centerBridgeX, 4.4, -200 - bridgeW * 0.5);
    this.scene.add(railNorth);

    const railSouth = new THREE.Mesh(railGeo, concreteMat);
    railSouth.position.set(centerBridgeX, 4.4, -200 + bridgeW * 0.5);
    this.scene.add(railSouth);

    this.collisions.addCollider({
      minX: startX,
      maxX: startX + bridgeLen,
      minZ: -200 - bridgeW * 0.5 - 0.4,
      maxZ: -200 - bridgeW * 0.5 + 0.4,
      minY: 0,
      maxY: 8,
      type: 'rail'
    });
    this.collisions.addCollider({
      minX: startX,
      maxX: startX + bridgeLen,
      minZ: -200 + bridgeW * 0.5 - 0.4,
      maxZ: -200 + bridgeW * 0.5 + 0.4,
      minY: 0,
      maxY: 8,
      type: 'rail'
    });
  }

  _buildCargoPort() {
    // Port of Coral Vista (Industrial southwest: X: -320 to -160, Z: -320 to -160)
    const pierMat = new THREE.MeshStandardMaterial({
      color: 0x828489,
      roughness: 0.9
    });

    const pierGeo = new THREE.BoxGeometry(160, 1.2, 160);
    const pierMesh = new THREE.Mesh(pierGeo, pierMat);
    pierMesh.position.set(-230, 0.6, -230);
    pierMesh.receiveShadow = true;
    this.scene.add(pierMesh);

    // Los Manta Smuggling Warehouse
    const whW = 55;
    const whD = 40;
    const whH = 14;
    const whGeo = new THREE.BoxGeometry(whW, whH, whD);
    const whMat = new THREE.MeshStandardMaterial({
      color: 0x4a525a,
      roughness: 0.6,
      metalness: 0.4
    });
    const whMesh = new THREE.Mesh(whGeo, whMat);
    whMesh.position.set(-250, whH * 0.5 + 1.2, -220);
    whMesh.castShadow = true;
    whMesh.receiveShadow = true;
    this.scene.add(whMesh);

    this.collisions.addCollider({
      minX: -250 - whW * 0.5,
      maxX: -250 + whW * 0.5,
      minZ: -220 - whD * 0.5,
      maxZ: -220 + whD * 0.5,
      minY: 0,
      maxY: whH + 2,
      type: 'warehouse'
    });

    // Stacks of Shipping Containers
    const containerColors = PALETTE.containers;
    for (let c = 0; c < 18; c++) {
      const col = containerColors[c % containerColors.length];
      const cont = this.props.createShippingContainer(col);
      const row = Math.floor(c / 6);
      const colIdx = c % 6;
      const stackLevel = (c % 2);

      const cx = -180 + row * 16;
      const cz = -260 + colIdx * 14;
      const cy = 1.2 + stackLevel * 4.8;

      cont.position.set(cx, cy, cz);
      this.scene.add(cont);

      this.collisions.addCollider({
        minX: cx - 2.4,
        maxX: cx + 2.4,
        minZ: cz - 6.0,
        maxZ: cz + 6.0,
        minY: 0,
        maxY: cy + 4.8,
        type: 'container'
      });
    }
  }
}

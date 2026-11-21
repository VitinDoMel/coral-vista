import * as THREE from 'three';
import { createSeededRng } from '../engine/rng.js';
import {
  createSkyGradientTexture,
  createWindowFacadeTexture,
  createContainerTexture
} from './textures.js';
import {
  createPalmTree,
  createStreetLamp,
  createHarborCrane,
  createBeachUmbrella
} from './props.js';

export const X_ROADS = [-180, -105, -30, 45, 120];
export const Z_ROADS = [-225, -150, -75, 0, 75, 150, 225];
export const ROAD_WIDTH = 16;
export const HALF_ROAD = ROAD_WIDTH * 0.5;

const PASTEL_PALETTES = [
  { base: '#f7b2a6', trim: '#fff6ee', tint: '#335d7a', artDeco: true },
  { base: '#a6e5d0', trim: '#f6fffa', tint: '#2d5868', artDeco: true },
  { base: '#fce29c', trim: '#fffaf0', tint: '#3a5772', artDeco: true },
  { base: '#d9c2f0', trim: '#fbf7ff', tint: '#384e73', artDeco: true },
  { base: '#a8d5f7', trim: '#f5fbff', tint: '#2b4f6e', artDeco: false },
  { base: '#f9cbb1', trim: '#fff7f2', tint: '#37556e', artDeco: false },
  { base: '#c4e8c2', trim: '#f7fff7', tint: '#2d575e', artDeco: false },
  { base: '#f2bac9', trim: '#fff5f8', tint: '#3e4d6b', artDeco: true }
];

export function setupSkyAndLighting(scene) {
  // Sky dome with blue zenith -> warm peach horizon gradient
  const skyTex = createSkyGradientTexture();
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(1450, 40, 28),
    new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  scene.add(skyDome);

  // Glowing golden-peach Sun disc and soft halo near the horizon
  const sunGroup = new THREE.Group();
  const sunDir = new THREE.Vector3(0.28, 0.095, -0.955).normalize();
  sunGroup.position.copy(sunDir).multiplyScalar(1180);
  sunGroup.lookAt(0, 0, 0);

  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(34, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfff7de,
      fog: false,
      depthWrite: false
    })
  );
  sunGroup.add(sunDisc);

  const sunHalo = new THREE.Mesh(
    new THREE.CircleGeometry(82, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffa368,
      transparent: true,
      opacity: 0.44,
      fog: false,
      depthWrite: false
    })
  );
  sunHalo.position.z = -2;
  sunGroup.add(sunHalo);
  scene.add(sunGroup);

  // Warm peach atmospheric distance fog
  scene.fog = new THREE.Fog(0xffc79e, 260, 1050);

  // Clear sun-drenched lighting (paired with ACESFilmicToneMapping)
  const hemiLight = new THREE.HemisphereLight(0x9bd3f5, 0xf2cfa8, 1.25);
  hemiLight.position.set(0, 120, 0);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffe9d6, 0.55);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff1d8, 2.45);
  sunLight.position.set(185, 165, -240);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 680;
  const d = 220;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  return { skyDome, sunGroup, sunLight };
}

export function buildCoralVistaCity(scene, collisionWorld, seed = 1) {
  const rng = createSeededRng(seed);
  const cityGroup = new THREE.Group();
  cityGroup.name = 'CoralVistaCity';

  _buildLandBeachAndOcean(cityGroup);
  _buildRoadsAndPaintedMarkings(cityGroup);
  _buildCityBlocksAndPastelBuildings(cityGroup, collisionWorld, rng);
  _buildCoastalPromenadeAndPalms(cityGroup, collisionWorld, rng);
  _buildCoralBayBridge(cityGroup, collisionWorld);
  _buildSouthHarborPort(cityGroup, collisionWorld, rng);

  scene.add(cityGroup);
  return cityGroup;
}

function _buildLandBeachAndOcean(cityGroup) {
  // Base urban ground slab under the city grid
  const landMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c7,
    roughness: 0.92
  });
  const landMesh = new THREE.Mesh(new THREE.PlaneGeometry(430, 520), landMat);
  landMesh.rotation.x = -Math.PI / 2;
  landMesh.position.set(-40, -0.04, 0);
  landMesh.receiveShadow = true;
  cityGroup.add(landMesh);

  // Broad golden sandy beach along east coast (x = 140..202)
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xf6de9c,
    roughness: 0.86
  });
  const beachMesh = new THREE.Mesh(new THREE.PlaneGeometry(66, 540), sandMat);
  beachMesh.rotation.x = -Math.PI / 2;
  beachMesh.position.set(171, -0.02, 0);
  beachMesh.receiveShadow = true;
  cityGroup.add(beachMesh);

  // Wet sand / shoreline foam strip (x = 196..204)
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xc2f5f2,
    roughness: 0.35
  });
  const foamStrip = new THREE.Mesh(new THREE.PlaneGeometry(7, 540), foamMat);
  foamStrip.rotation.x = -Math.PI / 2;
  foamStrip.position.set(199.5, -0.015, 0);
  cityGroup.add(foamStrip);

  // Shallow tropical aqua water band (x = 200..235)
  const shallowWaterMat = new THREE.MeshStandardMaterial({
    color: 0x38dce0,
    roughness: 0.18,
    metalness: 0.12
  });
  const shallowMesh = new THREE.Mesh(new THREE.PlaneGeometry(42, 1600), shallowWaterMat);
  shallowMesh.rotation.x = -Math.PI / 2;
  shallowMesh.position.set(218, -0.08, 0);
  shallowMesh.receiveShadow = true;
  cityGroup.add(shallowMesh);

  // Wide turquoise ocean (mar turquesa largo) extending far to the east and south harbor
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x12b5c4,
    roughness: 0.2,
    metalness: 0.16
  });
  const eastOcean = new THREE.Mesh(new THREE.PlaneGeometry(1400, 2200), oceanMat);
  eastOcean.rotation.x = -Math.PI / 2;
  eastOcean.position.set(890, -0.1, 0);
  eastOcean.receiveShadow = true;
  cityGroup.add(eastOcean);

  // South harbor water basin beyond z = 240
  const southHarborWater = new THREE.Mesh(new THREE.PlaneGeometry(900, 750), oceanMat);
  southHarborWater.rotation.x = -Math.PI / 2;
  southHarborWater.position.set(-50, -0.1, 615);
  cityGroup.add(southHarborWater);

  // North bay water basin beyond z = -242
  const northBayWater = new THREE.Mesh(new THREE.PlaneGeometry(900, 750), oceanMat);
  northBayWater.rotation.x = -Math.PI / 2;
  northBayWater.position.set(-50, -0.1, -617);
  cityGroup.add(northBayWater);
}

function _buildRoadsAndPaintedMarkings(cityGroup) {
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x2d313a,
    roughness: 0.85
  });
  const yellowPaintMat = new THREE.MeshBasicMaterial({ color: 0xf7c531 });
  const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xf5f7fa });

  const minX = X_ROADS[0] - HALF_ROAD;
  const maxX = X_ROADS[X_ROADS.length - 1] + HALF_ROAD;
  const minZ = Z_ROADS[0] - HALF_ROAD;
  const maxZ = Z_ROADS[Z_ROADS.length - 1] + HALF_ROAD;
  const totalW = maxX - minX;
  const totalD = maxZ - minZ;
  const centerX = (minX + maxX) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;

  // North-South road asphalt strips
  for (const rx of X_ROADS) {
    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, totalD),
      asphaltMat
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(rx, 0.01, centerZ);
    roadMesh.receiveShadow = true;
    cityGroup.add(roadMesh);

    // Side white edge lines along each block span
    for (let zi = 0; zi < Z_ROADS.length - 1; zi++) {
      const zStart = Z_ROADS[zi] + HALF_ROAD + 2.2;
      const zEnd = Z_ROADS[zi + 1] - HALF_ROAD - 2.2;
      const segLen = zEnd - zStart;
      const segMidZ = (zStart + zEnd) * 0.5;

      // Double yellow center line (amarelo duplo nas avenidas & ruas)
      for (const offset of [-0.18, 0.18]) {
        const yLine = new THREE.Mesh(
          new THREE.PlaneGeometry(0.14, segLen),
          yellowPaintMat
        );
        yLine.rotation.x = -Math.PI / 2;
        yLine.position.set(rx + offset, 0.022, segMidZ);
        cityGroup.add(yLine);
      }

      // Outer white curb lines
      for (const edgeOffset of [-HALF_ROAD + 0.45, HALF_ROAD - 0.45]) {
        const edgeLine = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, segLen),
          whitePaintMat
        );
        edgeLine.rotation.x = -Math.PI / 2;
        edgeLine.position.set(rx + edgeOffset, 0.022, segMidZ);
        cityGroup.add(edgeLine);
      }

      // Dashed white lane dividers (tracejado branco) on both sides of the double yellow line
      for (const laneOffset of [-3.9, 3.9]) {
        for (let dz = zStart + 2.5; dz < zEnd - 2.0; dz += 5.5) {
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 2.6),
            whitePaintMat
          );
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(rx + laneOffset, 0.023, dz);
          cityGroup.add(dash);
        }
      }
    }
  }

  // East-West road asphalt strips
  for (const rz of Z_ROADS) {
    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(totalW, ROAD_WIDTH),
      asphaltMat
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(centerX, 0.012, rz);
    roadMesh.receiveShadow = true;
    cityGroup.add(roadMesh);

    for (let xi = 0; xi < X_ROADS.length - 1; xi++) {
      const xStart = X_ROADS[xi] + HALF_ROAD + 2.2;
      const xEnd = X_ROADS[xi + 1] - HALF_ROAD - 2.2;
      const segLen = xEnd - xStart;
      const segMidX = (xStart + xEnd) * 0.5;

      // Double yellow center line
      for (const offset of [-0.18, 0.18]) {
        const yLine = new THREE.Mesh(
          new THREE.PlaneGeometry(segLen, 0.14),
          yellowPaintMat
        );
        yLine.rotation.x = -Math.PI / 2;
        yLine.position.set(segMidX, 0.024, rz + offset);
        cityGroup.add(yLine);
      }

      // White dashed lane dividers (tracejado branco)
      for (const laneOffset of [-3.9, 3.9]) {
        for (let dx = xStart + 2.5; dx < xEnd - 2.0; dx += 5.5) {
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(2.6, 0.14),
            whitePaintMat
          );
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(dx, 0.025, rz + laneOffset);
          cityGroup.add(dash);
        }
      }
    }
  }

  // Zebra pedestrian crosswalks at every intersection (faixas de pedestre nos cruzamentos)
  for (const rx of X_ROADS) {
    for (const rz of Z_ROADS) {
      // North & South approaches across N-S road
      for (const zDir of [-1, 1]) {
        const crossZ = rz + zDir * (HALF_ROAD + 1.15);
        for (let s = -6.0; s <= 6.0; s += 1.5) {
          const bar = new THREE.Mesh(
            new THREE.PlaneGeometry(0.65, 2.0),
            whitePaintMat
          );
          bar.rotation.x = -Math.PI / 2;
          bar.position.set(rx + s, 0.026, crossZ);
          cityGroup.add(bar);
        }
      }

      // East & West approaches across E-W road
      for (const xDir of [-1, 1]) {
        const crossX = rx + xDir * (HALF_ROAD + 1.15);
        for (let s = -6.0; s <= 6.0; s += 1.5) {
          const bar = new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 0.65),
            whitePaintMat
          );
          bar.rotation.x = -Math.PI / 2;
          bar.position.set(crossX, 0.026, rz + s);
          cityGroup.add(bar);
        }
      }
    }
  }
}

function _buildCityBlocksAndPastelBuildings(cityGroup, collisionWorld, rng) {
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xe9e2d6,
    roughness: 0.78
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc2,
    roughness: 0.85
  });

  // Pre-build a cache of pastel window facade materials
  const facadeMaterials = [];
  for (let i = 0; i < 16; i++) {
    const pal = PASTEL_PALETTES[i % PASTEL_PALETTES.length];
    const tex = createWindowFacadeTexture({
      baseColor: pal.base,
      trimColor: pal.trim,
      windowTint: pal.tint,
      artDeco: pal.artDeco,
      cols: 5 + (i % 3),
      rows: 7 + (i % 5) * 2,
      seed: i + 11
    });
    facadeMaterials.push(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.55,
        metalness: 0.08
      })
    );
  }

  let blockIndex = 0;
  for (let xi = 0; xi < X_ROADS.length - 1; xi++) {
    for (let zi = 0; zi < Z_ROADS.length - 1; zi++) {
      blockIndex++;
      const x0 = X_ROADS[xi] + HALF_ROAD;
      const x1 = X_ROADS[xi + 1] - HALF_ROAD;
      const z0 = Z_ROADS[zi] + HALF_ROAD;
      const z1 = Z_ROADS[zi + 1] - HALF_ROAD;

      const blockW = x1 - x0;
      const blockD = z1 - z0;
      const cx = (x0 + x1) * 0.5;
      const cz = (z0 + z1) * 0.5;

      // Light-colored raised sidewalk slab (calçadas claras)
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(blockW, 0.18, blockD),
        sidewalkMat
      );
      sidewalk.position.set(cx, 0.09, cz);
      sidewalk.receiveShadow = true;
      cityGroup.add(sidewalk);

      // Street lamps and palm trees around block sidewalk perimeter
      const lampNorth = createStreetLamp(Math.PI * 0.5);
      lampNorth.position.set(cx, 0.18, z0 + 1.1);
      cityGroup.add(lampNorth);

      const lampSouth = createStreetLamp(-Math.PI * 0.5);
      lampSouth.position.set(cx, 0.18, z1 - 1.1);
      cityGroup.add(lampSouth);

      const lampEast = createStreetLamp(0);
      lampEast.position.set(x1 - 1.1, 0.18, cz);
      cityGroup.add(lampEast);

      // Corner palms on coastal & mid-city blocks
      if (xi >= 1) {
        const cornerPalm = createPalmTree(rng);
        cornerPalm.position.set(x1 - 2.2, 0.18, z0 + 2.2);
        cityGroup.add(cornerPalm);
      }

      // Reserve southern waterfront blocks (zi === 5, xi <= 1) for Port logistics yard
      const isPortBlock = zi === Z_ROADS.length - 2 && xi <= 1;
      if (isPortBlock) {
        _populatePortYardBlock(cityGroup, collisionWorld, cx, cz, blockW, blockD, rng);
        continue;
      }

      // Subdivide block into 2x2 building plots for varied pastel skyline
      const isCoastalStrip = xi === X_ROADS.length - 2;
      const isDowntown = xi === 1 || xi === 2;

      const subPlots = [
        { px: cx - 12.5, pz: cz - 12.5, maxW: 21, maxD: 21 },
        { px: cx + 12.5, pz: cz - 12.5, maxW: 21, maxD: 21 },
        { px: cx - 12.5, pz: cz + 12.5, maxW: 21, maxD: 21 },
        { px: cx + 12.5, pz: cz + 12.5, maxW: 21, maxD: 21 }
      ];

      for (let s = 0; s < subPlots.length; s++) {
        const plot = subPlots[s];
        const bw = rng.range(15.5, plot.maxW);
        const bd = rng.range(15.5, plot.maxD);

        let bh;
        if (isCoastalStrip) {
          bh = rng.range(14, 27); // Art Deco resort hotels facing Seabreeze Blvd
        } else if (isDowntown && zi >= 1 && zi <= 4) {
          bh = rng.range(24, 52); // Tall downtown pastel towers
        } else {
          bh = rng.range(9, 19); // Residential & mid-rise pastel blocks
        }

        const matIndex = (blockIndex * 3 + s) % facadeMaterials.length;
        const facadeMat = facadeMaterials[matIndex];

        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(bw, bh, bd),
          [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat]
        );
        bldg.position.set(plot.px, 0.18 + bh * 0.5, plot.pz);
        bldg.castShadow = true;
        bldg.receiveShadow = true;
        cityGroup.add(bldg);

        // Stepped Art Deco or tower crown on taller buildings
        if (bh > 15) {
          const crownH = rng.range(2.4, 4.8);
          const crown = new THREE.Mesh(
            new THREE.BoxGeometry(bw * 0.72, crownH, bd * 0.72),
            [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat]
          );
          crown.position.set(plot.px, 0.18 + bh + crownH * 0.5, plot.pz);
          crown.castShadow = true;
          cityGroup.add(crown);
        }

        collisionWorld.addBoxFromCenter(plot.px, plot.pz, bw + 0.4, bd + 0.4, bh + 4, 'building');
      }
    }
  }
}

function _buildCoastalPromenadeAndPalms(cityGroup, collisionWorld, rng) {
  // Light boardwalk promenade along the east side of Seabreeze Boulevard (x = 128..142)
  const promenadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0e9dc,
    roughness: 0.75
  });
  const promenade = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.2, 476),
    promenadeMat
  );
  promenade.position.set(135, 0.1, 0);
  promenade.receiveShadow = true;
  cityGroup.add(promenade);

  // Low pastel coral sea-wall balustrade along beach edge (with gaps for beach access)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf7b9a8,
    roughness: 0.65
  });
  for (let z = -220; z <= 210; z += 30) {
    if (Math.abs(z - -150) < 18) continue; // Keep bridge entry open
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 18), wallMat);
    wall.position.set(141.6, 0.48, z);
    wall.castShadow = true;
    cityGroup.add(wall);
  }

  // Row of iconic tropical palm trees (9 drooping fronds, ~5m canopy) & thin lamps along Seabreeze Blvd
  for (let z = -225; z <= 225; z += 18) {
    if (Math.abs(z - -150) < 12) continue;

    const eastPalm = createPalmTree(rng);
    eastPalm.position.set(131.5, 0.2, z);
    cityGroup.add(eastPalm);
    collisionWorld.addBoxFromCenter(131.5, z, 0.75, 0.75, 7, 'low_prop');

    const beachPalm = createPalmTree(rng);
    beachPalm.position.set(145.5 + rng.range(-1.5, 2.5), 0.0, z + 8);
    cityGroup.add(beachPalm);
    collisionWorld.addBoxFromCenter(beachPalm.position.x, beachPalm.position.z, 0.75, 0.75, 7, 'low_prop');

    if (z % 36 === 0) {
      const lamp = createStreetLamp(Math.PI);
      lamp.position.set(129.2, 0.2, z + 6);
      cityGroup.add(lamp);
    }
  }

  // West side of Seabreeze Blvd palm avenue row
  for (let z = -215; z <= 215; z += 25) {
    const isNearIntersection = Z_ROADS.some((rz) => Math.abs(z - rz) < 11);
    if (isNearIntersection) continue;
    const westPalm = createPalmTree(rng);
    westPalm.position.set(110.2, 0.18, z);
    cityGroup.add(westPalm);
    collisionWorld.addBoxFromCenter(110.2, z, 0.75, 0.75, 7, 'low_prop');
  }

  // Beach umbrellas along the golden sand
  const umbrellaColors = [0xff6f61, 0x4ecdc4, 0xffd166, 0xf78fb3];
  for (let z = -190; z <= 190; z += 26) {
    if (Math.abs(z - -150) < 22) continue;
    const u1 = createBeachUmbrella(umbrellaColors[Math.abs(z) % umbrellaColors.length]);
    u1.position.set(164 + (z % 7), 0, z);
    cityGroup.add(u1);
  }
}

function _buildCoralBayBridge(cityGroup, collisionWorld) {
  // Coral Bay Bridge spans east from Seabreeze Blvd at z = -150 (x = 128 to 292) to Starlight Key island (x = 292..345)
  const bridgeZ = -150;
  const startX = 128;
  const endX = 292;
  const spanLen = endX - startX;
  const midX = (startX + endX) * 0.5;

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x333842,
    roughness: 0.82
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xefe9df,
    roughness: 0.65
  });
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0xf7cfc4,
    roughness: 0.5
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xdbe4ee,
    metalness: 0.6,
    roughness: 0.35
  });
  const yellowPaintMat = new THREE.MeshBasicMaterial({ color: 0xf7c531 });
  const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xf5f7fa });

  // Road deck across the turquoise sea
  const deck = new THREE.Mesh(new THREE.BoxGeometry(spanLen, 0.8, 16), deckMat);
  deck.position.set(midX, 0.4, bridgeZ);
  deck.receiveShadow = true;
  deck.castShadow = true;
  cityGroup.add(deck);

  // Double yellow centerline & dashed white lane markings on bridge deck
  for (const offset of [-0.18, 0.18]) {
    const yLine = new THREE.Mesh(new THREE.PlaneGeometry(spanLen - 4, 0.14), yellowPaintMat);
    yLine.rotation.x = -Math.PI / 2;
    yLine.position.set(midX, 0.82, bridgeZ + offset);
    cityGroup.add(yLine);
  }
  for (const laneOffset of [-3.8, 3.8]) {
    for (let bx = startX + 4; bx < endX - 4; bx += 6) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.14), whitePaintMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(bx, 0.82, bridgeZ + laneOffset);
      cityGroup.add(dash);
    }
  }

  // Side concrete guardrails + colliders
  for (const side of [-1, 1]) {
    const railZ = bridgeZ + side * 7.65;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(spanLen, 1.3, 0.7), concreteMat);
    rail.position.set(midX, 1.35, railZ);
    rail.castShadow = true;
    cityGroup.add(rail);
    collisionWorld.addBoxCollider(startX + 1, endX - 1, railZ - 0.4, railZ + 0.4, 3.0, 'bridge_rail');
  }

  // Support piers in the water
  for (let px = 155; px <= 275; px += 30) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 6, 15.5), concreteMat);
    pier.position.set(px, -2.2, bridgeZ);
    cityGroup.add(pier);
  }

  // Twin suspension towers at x = 182 and x = 242
  for (const tx of [182, 242]) {
    for (const side of [-1, 1]) {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.6, 36, 2.6), towerMat);
      pylon.position.set(tx, 18, bridgeZ + side * 8.4);
      pylon.castShadow = true;
      cityGroup.add(pylon);

      // Diagonal stay cables radiating from tower top to bridge deck
      for (const cableOffset of [-34, -22, -11, 11, 22, 34]) {
        const dx = cableOffset;
        const dy = 29.5;
        const len = Math.hypot(dx, dy);
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, len, 5),
          cableMat
        );
        cable.position.set(tx + dx * 0.5, 1.5 + dy * 0.5, bridgeZ + side * 8.1);
        cable.rotation.z = Math.atan2(dx, dy);
        cityGroup.add(cable);
      }
    }

    // Horizontal cross-beams connecting the twin tower legs
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 19.2), towerMat);
    topBeam.position.set(tx, 31, bridgeZ);
    cityGroup.add(topBeam);

    const midBeam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 19.0), towerMat);
    midBeam.position.set(tx, 19, bridgeZ);
    cityGroup.add(midBeam);
  }

  // Starlight Key turnaround island plaza at the eastern end of the bridge (x = 292..345)
  const islandPlaza = new THREE.Mesh(new THREE.BoxGeometry(54, 1.0, 68), concreteMat);
  islandPlaza.position.set(318, 0.3, bridgeZ);
  islandPlaza.receiveShadow = true;
  cityGroup.add(islandPlaza);

  const islandAsphalt = new THREE.Mesh(new THREE.PlaneGeometry(44, 56), deckMat);
  islandAsphalt.rotation.x = -Math.PI / 2;
  islandAsphalt.position.set(316, 0.82, bridgeZ);
  cityGroup.add(islandAsphalt);
}

function _populatePortYardBlock(cityGroup, collisionWorld, cx, cz, blockW, blockD, rng) {
  const containerColors = ['#e05a47', '#2b8cbe', '#f0b429', '#2b5876', '#41ab5d'];
  const containerMaterials = containerColors.map(
    (c) => new THREE.MeshStandardMaterial({ map: createContainerTexture(c), roughness: 0.65 })
  );

  // Port warehouse on north side of block
  const whW = 26;
  const whD = 14;
  const whH = 8.5;
  const whMat = new THREE.MeshStandardMaterial({ color: 0xc5ced6, roughness: 0.7 });
  const warehouse = new THREE.Mesh(new THREE.BoxGeometry(whW, whH, whD), whMat);
  warehouse.position.set(cx - 10, 0.18 + whH * 0.5, cz - 14);
  warehouse.castShadow = true;
  warehouse.receiveShadow = true;
  cityGroup.add(warehouse);
  collisionWorld.addBoxFromCenter(cx - 10, cz - 14, whW, whD, whH + 1, 'building');

  // Stacked shipping containers
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const px = cx + 6 + col * 10;
      const pz = cz - 12 + row * 12;
      const levels = rng.intRange(1, 3);
      for (let lv = 0; lv < levels; lv++) {
        const cMat = containerMaterials[(row + col + lv) % containerMaterials.length];
        const box = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 8.2), cMat);
        box.position.set(px, 0.18 + 1.4 + lv * 2.8, pz);
        box.castShadow = true;
        box.receiveShadow = true;
        cityGroup.add(box);
      }
      collisionWorld.addBoxFromCenter(px, pz, 3.4, 8.4, levels * 2.8 + 1, 'container');
    }
  }
}

function _buildSouthHarborPort(cityGroup, collisionWorld, rng) {
  // South Harbor concrete dock pier extending south of z = 233 (x = -188..52, z = 233..282)
  const dockMat = new THREE.MeshStandardMaterial({
    color: 0x9aa2ad,
    roughness: 0.85
  });
  const dock = new THREE.Mesh(new THREE.BoxGeometry(240, 1.2, 50), dockMat);
  dock.position.set(-68, -0.35, 258);
  dock.receiveShadow = true;
  cityGroup.add(dock);

  // Two large orange harbor gantry cranes along the south quay edge
  for (const craneX of [-135, -35]) {
    const crane = createHarborCrane();
    crane.position.set(craneX, 0.25, 270);
    cityGroup.add(crane);
    collisionWorld.addBoxFromCenter(craneX, 270, 10, 10, 22, 'crane');
  }

  // Container stacks along the pier deck
  const pierColors = ['#d9534f', '#2874a6', '#e6a100', '#2e8b57'];
  const pierMats = pierColors.map(
    (c) => new THREE.MeshStandardMaterial({ map: createContainerTexture(c), roughness: 0.65 })
  );

  for (let i = 0; i < 8; i++) {
    const cx = -165 + i * 26;
    if (Math.abs(cx - -135) < 10 || Math.abs(cx - -35) < 10) continue;
    const levels = (i % 2) + 1;
    for (let lv = 0; lv < levels; lv++) {
      const cMesh = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 2.8, 3.2),
        pierMats[(i + lv) % pierMats.length]
      );
      cMesh.position.set(cx, 0.25 + 1.4 + lv * 2.8, 250);
      cMesh.castShadow = true;
      cityGroup.add(cMesh);
    }
    collisionWorld.addBoxFromCenter(cx, 250, 8.4, 3.4, levels * 2.8 + 1, 'container');
  }
}

import * as THREE from 'three';

const sharedTrunkMat = new THREE.MeshStandardMaterial({
  color: 0x866042,
  roughness: 0.88,
  metalness: 0.05
});

const sharedTrunkRingMat = new THREE.MeshStandardMaterial({
  color: 0x6b4a30,
  roughness: 0.92,
  metalness: 0.04
});

const sharedCoconutMat = new THREE.MeshStandardMaterial({
  color: 0x4d331e,
  roughness: 0.8
});

const sharedFrondMats = [
  new THREE.MeshStandardMaterial({
    color: 0x2f9e56,
    roughness: 0.62,
    metalness: 0.04,
    side: THREE.DoubleSide
  }),
  new THREE.MeshStandardMaterial({
    color: 0x3db564,
    roughness: 0.6,
    metalness: 0.04,
    side: THREE.DoubleSide
  }),
  new THREE.MeshStandardMaterial({
    color: 0x268647,
    roughness: 0.65,
    metalness: 0.04,
    side: THREE.DoubleSide
  })
];

/**
 * Builds one long drooping palm frond (~2.6m reach => ~5.2m full canopy diameter)
 * with an arched spine and wide drooping leaflet pairs.
 */
function buildDroopingFrondGeometry(reachLength = 2.6, droopDrop = 1.15) {
  const segments = 7;
  const positions = [];
  const indices = [];

  // Spine curve: rises +0.42m near crown, then arches outward and droops -1.15m at tip
  const spinePoints = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * reachLength;
    const arch = Math.sin(t * Math.PI * 0.75) * 0.48;
    const droop = t * t * droopDrop;
    const y = arch - droop;
    // Width tapers from base to middle (widest ~0.58m each side) to pointed tip
    const widthProfile = Math.sin(Math.pow(t, 0.75) * Math.PI) * 0.56 + (1 - t) * 0.12;
    spinePoints.push({ z, y, w: Math.max(0.03, widthProfile), t });
  }

  // Build V-folded ribbon + drooping side leaflet tips along the frond
  for (let i = 0; i <= segments; i++) {
    const pt = spinePoints[i];
    const sideDroop = pt.w * 0.42;
    // Left edge vertex (0), Center spine vertex (1), Right edge vertex (2)
    positions.push(-pt.w, pt.y - sideDroop, pt.z);
    positions.push(0, pt.y + 0.07, pt.z);
    positions.push(pt.w, pt.y - sideDroop, pt.z);
  }

  for (let i = 0; i < segments; i++) {
    const rowA = i * 3;
    const rowB = (i + 1) * 3;

    // Left blade quad
    indices.push(rowA + 0, rowA + 1, rowB + 1);
    indices.push(rowA + 0, rowB + 1, rowB + 0);

    // Right blade quad
    indices.push(rowA + 1, rowA + 2, rowB + 2);
    indices.push(rowA + 1, rowB + 2, rowB + 1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

const cachedFrondGeometries = [
  buildDroopingFrondGeometry(2.62, 1.12),
  buildDroopingFrondGeometry(2.48, 1.28),
  buildDroopingFrondGeometry(2.70, 0.98)
];

/**
 * Palmeira com 9 folhas longas caídas (copa ~5 m)
 */
export function createPalmTree(rng) {
  const group = new THREE.Group();

  const trunkSegments = 7;
  const totalHeight = rng ? rng.range(6.4, 7.8) : 7.0;
  const segH = totalHeight / trunkSegments;
  const leanAngle = rng ? rng.range(0, Math.PI * 2) : 0.6;
  const leanAmount = rng ? rng.range(0.45, 0.9) : 0.65;

  let topX = 0;
  let topY = 0;
  let topZ = 0;

  for (let s = 0; s < trunkSegments; s++) {
    const t0 = s / trunkSegments;
    const t1 = (s + 1) / trunkSegments;
    const tMid = (t0 + t1) * 0.5;

    const rBottom = 0.25 * (1 - t0 * 0.46);
    const rTop = 0.25 * (1 - t1 * 0.46);

    const curve0 = Math.pow(t0, 1.55) * leanAmount;
    const curve1 = Math.pow(t1, 1.55) * leanAmount;
    const curveMid = (curve0 + curve1) * 0.5;

    const sx = Math.cos(leanAngle) * curveMid;
    const sz = Math.sin(leanAngle) * curveMid;
    const sy = s * segH + segH * 0.5;

    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, segH * 1.06, 8),
      s % 2 === 0 ? sharedTrunkMat : sharedTrunkRingMat
    );
    cyl.position.set(sx, sy, sz);

    const dx = Math.cos(leanAngle) * (curve1 - curve0);
    const dz = Math.sin(leanAngle) * (curve1 - curve0);
    cyl.rotation.z = -dx * 0.85;
    cyl.rotation.x = dz * 0.85;
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    group.add(cyl);

    if (s === trunkSegments - 1) {
      topX = Math.cos(leanAngle) * curve1;
      topY = totalHeight;
      topZ = Math.sin(leanAngle) * curve1;
    }
  }

  const crownGroup = new THREE.Group();
  crownGroup.position.set(topX, topY - 0.1, topZ);

  // Coconut cluster at crown base
  for (let c = 0; c < 4; c++) {
    const ca = (c / 4) * Math.PI * 2;
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 6), sharedCoconutMat);
    coco.position.set(Math.cos(ca) * 0.18, -0.12, Math.sin(ca) * 0.18);
    crownGroup.add(coco);
  }

  // Exactly 9 long drooping fronds (9 folhas longas caídas, copa ~5 m)
  const frondCount = 9;
  const baseYawOffset = rng ? rng.range(0, Math.PI * 2) : 0;

  for (let i = 0; i < frondCount; i++) {
    const yaw = baseYawOffset + (i / frondCount) * Math.PI * 2;
    const geom = cachedFrondGeometries[i % cachedFrondGeometries.length];
    const mat = sharedFrondMats[i % sharedFrondMats.length];

    const frondMesh = new THREE.Mesh(geom, mat);
    frondMesh.rotation.order = 'YXZ';
    frondMesh.rotation.y = yaw;
    // Slight alternation in pitch and roll for natural layered ~5m canopy
    frondMesh.rotation.x = (i % 2 === 0 ? 0.08 : 0.22);
    frondMesh.rotation.z = ((i % 3) - 1) * 0.08;
    frondMesh.castShadow = true;
    crownGroup.add(frondMesh);
  }

  group.add(crownGroup);
  return group;
}

const poleMat = new THREE.MeshStandardMaterial({
  color: 0x454f5e,
  roughness: 0.4,
  metalness: 0.7
});

const bulbMat = new THREE.MeshStandardMaterial({
  color: 0xfff5d6,
  emissive: 0xffd28a,
  emissiveIntensity: 1.4,
  roughness: 0.2
});

/**
 * Poste fino de iluminação urbana
 */
export function createStreetLamp(armAngleY = 0) {
  const group = new THREE.Group();

  // Slim base pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.45, 8),
    poleMat
  );
  base.position.y = 0.225;
  group.add(base);

  // Thin vertical pole (poste fino: radius 0.055m, height 5.6m)
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.065, 5.6, 8),
    poleMat
  );
  pole.position.y = 2.8;
  pole.castShadow = true;
  group.add(pole);

  // Overhanging arm assembly
  const armPivot = new THREE.Group();
  armPivot.position.y = 5.55;
  armPivot.rotation.y = armAngleY;

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 1.55, 6),
    poleMat
  );
  arm.rotation.z = -Math.PI * 0.42;
  arm.position.set(0.74, 0.18, 0);
  armPivot.add(arm);

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.2),
    poleMat
  );
  housing.position.set(1.45, 0.34, 0);
  armPivot.add(housing);

  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.04, 0.14),
    bulbMat
  );
  bulb.position.set(1.45, 0.3, 0);
  armPivot.add(bulb);

  group.add(armPivot);
  return group;
}

export function createHarborCrane() {
  const group = new THREE.Group();
  const craneMat = new THREE.MeshStandardMaterial({
    color: 0xf27d32,
    roughness: 0.55,
    metalness: 0.45
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0xe8edf2,
    roughness: 0.3
  });

  // 4 portal legs
  const legOffsets = [
    [-4.5, -4.5],
    [4.5, -4.5],
    [-4.5, 4.5],
    [4.5, 4.5]
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.75, 18, 0.75), craneMat);
    leg.position.set(lx, 9, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // Cross braces
  const upperFrame = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.2, 10.5), craneMat);
  upperFrame.position.set(0, 18, 0);
  group.add(upperFrame);

  // Horizontal boom extending over harbor dock
  const boom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 28), craneMat);
  boom.position.set(0, 19.2, 5);
  boom.castShadow = true;
  group.add(boom);

  // Top A-frame mast
  const mast = new THREE.Mesh(new THREE.BoxGeometry(2.6, 7.5, 2.2), craneMat);
  mast.position.set(0, 23.2, -1);
  group.add(mast);

  // Operator cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.8), cabinMat);
  cabin.position.set(0, 16.4, 3.5);
  group.add(cabin);

  return group;
}

export function createBeachUmbrella(colorHex = 0xff6f61) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6),
    new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.5 })
  );
  pole.position.y = 1.15;
  group.add(pole);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.75, 0.65, 10),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 })
  );
  canopy.position.y = 2.25;
  canopy.castShadow = true;
  group.add(canopy);

  return group;
}

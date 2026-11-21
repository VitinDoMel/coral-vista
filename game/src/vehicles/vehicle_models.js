import * as THREE from 'three';

// 5 Distinct Vehicle Models: Roofs matching body color, cyan-tinted glass, alloy rims

export const VEHICLE_TYPES = {
  SPORTS: 'sports',
  SEDAN: 'sedan',
  MUSCLE: 'muscle',
  SUV: 'suv',
  CVPD: 'cvpd'
};

export class VehicleFactory {
  constructor() {
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.9 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.3, metalness: 0.8 });
    this.windowMat = new THREE.MeshStandardMaterial({
      color: 0x98d4ed,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });
    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0xef233c });
    this.chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.2 });
  }

  createVehicle(type = VEHICLE_TYPES.SPORTS, colorHex = 0xe63946) {
    const group = new THREE.Group();
    group.userData.type = type;

    let bodyColor = colorHex;
    if (type === VEHICLE_TYPES.CVPD) {
      bodyColor = 0x111317; // Black & white CVPD cruiser
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.4
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.4
    });

    switch (type) {
      case VEHICLE_TYPES.SPORTS:
        this._buildSportsCar(group, bodyMat);
        break;
      case VEHICLE_TYPES.SEDAN:
        this._buildSedan(group, bodyMat);
        break;
      case VEHICLE_TYPES.MUSCLE:
        this._buildMuscleCar(group, bodyMat);
        break;
      case VEHICLE_TYPES.SUV:
        this._buildSUV(group, bodyMat);
        break;
      case VEHICLE_TYPES.CVPD:
        this._buildCVPD(group, bodyMat, whiteMat);
        break;
      default:
        this._buildSedan(group, bodyMat);
    }

    // Attach 4 detailed wheels
    const wheelY = 0.36;
    const halfW = (type === VEHICLE_TYPES.SUV) ? 1.05 : 0.95;
    const wheelBaseFront = (type === VEHICLE_TYPES.SPORTS) ? 1.45 : 1.35;
    const wheelBaseRear = (type === VEHICLE_TYPES.SPORTS) ? -1.35 : -1.3;

    const wRadius = (type === VEHICLE_TYPES.SUV) ? 0.42 : 0.36;
    const wWidth = (type === VEHICLE_TYPES.SPORTS || type === VEHICLE_TYPES.MUSCLE) ? 0.32 : 0.26;

    this._addWheel(group, halfW, wheelY, wheelBaseFront, wRadius, wWidth);
    this._addWheel(group, -halfW, wheelY, wheelBaseFront, wRadius, wWidth);
    this._addWheel(group, halfW, wheelY, wheelBaseRear, wRadius, wWidth);
    this._addWheel(group, -halfW, wheelY, wheelBaseRear, wRadius, wWidth);

    return group;
  }

  _addWheel(parent, x, y, z, radius, width) {
    const wGroup = new THREE.Group();
    wGroup.position.set(x, y, z);

    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, this.tireMat);
    tire.castShadow = true;
    wGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, this.rimMat);
    wGroup.add(rim);

    parent.add(wGroup);
  }

  _buildSportsCar(root, bodyMat) {
    // Sleek low-slung body
    const lowerGeo = new THREE.BoxGeometry(1.9, 0.44, 4.4);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.46;
    lower.castShadow = true;
    root.add(lower);

    // Aerodynamic hood taper
    const hoodGeo = new THREE.BoxGeometry(1.8, 0.36, 1.4);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.52, 1.3);
    hood.rotation.x = -0.06;
    root.add(hood);

    // Cabin: Roof matches body color! Cyan-tinted glass
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.48, 1.9);
    const cabin = new THREE.Mesh(cabinGeo, this.windowMat);
    cabin.position.set(0, 0.88, -0.2);
    root.add(cabin);

    // Body-colored roof cap
    const roofGeo = new THREE.BoxGeometry(1.48, 0.08, 1.5);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.14, -0.25);
    roof.castShadow = true;
    root.add(roof);

    // Rear sports spoiler
    const wingGeo = new THREE.BoxGeometry(1.8, 0.06, 0.4);
    const wing = new THREE.Mesh(wingGeo, bodyMat);
    wing.position.set(0, 0.92, -2.0);
    wing.castShadow = true;
    root.add(wing);

    this._addLights(root, 1.9, 0.54, 4.4);
  }

  _buildSedan(root, bodyMat) {
    const lowerGeo = new THREE.BoxGeometry(1.85, 0.54, 4.5);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.52;
    lower.castShadow = true;
    root.add(lower);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.58, 0.58, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, this.windowMat);
    cabin.position.set(0, 1.04, -0.15);
    root.add(cabin);

    // Roof matching body color
    const roofGeo = new THREE.BoxGeometry(1.56, 0.08, 1.95);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.35, -0.15);
    roof.castShadow = true;
    root.add(roof);

    this._addLights(root, 1.85, 0.58, 4.5);
  }

  _buildMuscleCar(root, bodyMat) {
    const lowerGeo = new THREE.BoxGeometry(1.92, 0.56, 4.6);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.54;
    lower.castShadow = true;
    root.add(lower);

    // Aggressive hood scoop
    const scoopGeo = new THREE.BoxGeometry(0.65, 0.16, 0.9);
    const scoop = new THREE.Mesh(scoopGeo, bodyMat);
    scoop.position.set(0, 0.88, 1.1);
    root.add(scoop);

    // Fastback cabin
    const cabinGeo = new THREE.BoxGeometry(1.58, 0.54, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, this.windowMat);
    cabin.position.set(0, 1.04, -0.25);
    root.add(cabin);

    // Roof matching body color
    const roofGeo = new THREE.BoxGeometry(1.56, 0.08, 1.6);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.32, -0.32);
    roof.castShadow = true;
    root.add(roof);

    this._addLights(root, 1.92, 0.62, 4.6);
  }

  _buildSUV(root, bodyMat) {
    const lowerGeo = new THREE.BoxGeometry(2.0, 0.72, 4.8);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.68;
    lower.castShadow = true;
    root.add(lower);

    // Large passenger cabin
    const cabinGeo = new THREE.BoxGeometry(1.78, 0.68, 3.1);
    const cabin = new THREE.Mesh(cabinGeo, this.windowMat);
    cabin.position.set(0, 1.32, -0.2);
    root.add(cabin);

    // Roof matching body color
    const roofGeo = new THREE.BoxGeometry(1.76, 0.1, 2.9);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.68, -0.2);
    roof.castShadow = true;
    root.add(roof);

    // Roof rack rails
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, 2.4);
    const railL = new THREE.Mesh(railGeo, this.chromeMat);
    railL.position.set(-0.76, 1.76, -0.2);
    root.add(railL);
    const railR = new THREE.Mesh(railGeo, this.chromeMat);
    railR.position.set(0.76, 1.76, -0.2);
    root.add(railR);

    this._addLights(root, 2.0, 0.75, 4.8);
  }

  _buildCVPD(root, bodyMat, whiteMat) {
    // Black base body
    const lowerGeo = new THREE.BoxGeometry(1.88, 0.54, 4.6);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.52;
    lower.castShadow = true;
    root.add(lower);

    // White door & side panel accent (Classic Patrol Interceptor)
    const doorGeo = new THREE.BoxGeometry(1.9, 0.48, 1.8);
    const door = new THREE.Mesh(doorGeo, whiteMat);
    door.position.set(0, 0.54, -0.15);
    root.add(door);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.58, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, this.windowMat);
    cabin.position.set(0, 1.04, -0.15);
    root.add(cabin);

    // White roof cap
    const roofGeo = new THREE.BoxGeometry(1.58, 0.08, 1.9);
    const roof = new THREE.Mesh(roofGeo, whiteMat);
    roof.position.set(0, 1.35, -0.15);
    roof.castShadow = true;
    root.add(roof);

    // High-Intensity CVPD Lightbar (Red Left, Blue Right, Chrome Center)
    const barBaseGeo = new THREE.BoxGeometry(1.4, 0.1, 0.38);
    const barBase = new THREE.Mesh(barBaseGeo, this.chromeMat);
    barBase.position.set(0, 1.42, -0.15);
    root.add(barBase);

    const redLightGeo = new THREE.BoxGeometry(0.65, 0.22, 0.35);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const redLight = new THREE.Mesh(redLightGeo, redLightMat);
    redLight.position.set(-0.38, 1.50, -0.15);
    root.add(redLight);
    root.userData.redLight = redLight;

    const blueLightGeo = new THREE.BoxGeometry(0.65, 0.22, 0.35);
    const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x0077ff });
    const blueLight = new THREE.Mesh(blueLightGeo, blueLightMat);
    blueLight.position.set(0.38, 1.50, -0.15);
    root.add(blueLight);
    root.userData.blueLight = blueLight;

    // Push bar / Bullbar on front bumper
    const bullGeo = new THREE.BoxGeometry(1.3, 0.45, 0.15);
    const bull = new THREE.Mesh(bullGeo, bodyMat);
    bull.position.set(0, 0.52, 2.36);
    root.add(bull);

    this._addLights(root, 1.88, 0.56, 4.6);
  }

  _addLights(root, width, y, length) {
    const halfW = width * 0.38;
    const halfL = length * 0.5;

    // Front Headlights
    const hlGeo = new THREE.BoxGeometry(0.28, 0.14, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.headlightMat);
    hlL.position.set(-halfW, y, halfL + 0.01);
    root.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, this.headlightMat);
    hlR.position.set(halfW, y, halfL + 0.01);
    root.add(hlR);

    // Rear Taillights
    const tlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    const tlL = new THREE.Mesh(tlGeo, this.taillightMat);
    tlL.position.set(-halfW, y, -halfL - 0.01);
    root.add(tlL);

    const tlR = new THREE.Mesh(tlGeo, this.taillightMat);
    tlR.position.set(halfW, y, -halfL - 0.01);
    root.add(tlR);
  }
}

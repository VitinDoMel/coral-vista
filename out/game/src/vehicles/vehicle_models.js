// 3D low-poly vehicle models: Sports Coupe, Muscle, Sedan/Taxi, Police Cruiser, SUV

import * as THREE from 'three';

export class VehicleModelFactory {
  constructor() {
    this.wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12);
    this.wheelGeo.rotateZ(Math.PI / 2);
    this.wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.8, roughness: 0.2 });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x3d708e, // Azure sky tinted reflective glass
      metalness: 0.85,
      roughness: 0.15,
    });
    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  }

  createWheels(trackWidth, wheelbase) {
    const wheels = [];
    const positions = [
      { x: -trackWidth / 2, z: wheelbase / 2, isFront: true },
      { x: trackWidth / 2, z: wheelbase / 2, isFront: true },
      { x: -trackWidth / 2, z: -wheelbase / 2, isFront: false },
      { x: trackWidth / 2, z: -wheelbase / 2, isFront: false },
    ];

    for (const p of positions) {
      const group = new THREE.Group();
      group.position.set(p.x, 0.38, p.z);

      const tire = new THREE.Mesh(this.wheelGeo, this.wheelMat);
      tire.castShadow = true;
      group.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, this.rimMat);
      group.add(rim);

      wheels.push({ mesh: group, isFront: p.isFront });
    }
    return wheels;
  }

  createCarMesh(type = 'sports', colorHex = 0xff5722) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.6,
      roughness: 0.35,
    });

    let trackW = 1.9;
    let wheelbase = 2.6;
    let length = 4.4;
    let width = 1.95;

    if (type === 'sports') {
      // Sleek low-slung GT coupe
      const lowerGeo = new THREE.BoxGeometry(width, 0.55, length);
      lowerGeo.translate(0, 0.55, 0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.castShadow = true;
      group.add(lower);

      const cabinGeo = new THREE.BoxGeometry(width * 0.82, 0.45, length * 0.48);
      cabinGeo.translate(0, 0.95, -0.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      cabin.castShadow = true;
      group.add(cabin);

      // Body-colored roof cap
      const roofGeo = new THREE.BoxGeometry(width * 0.78, 0.08, length * 0.36);
      roofGeo.translate(0, 1.2, -0.2);
      const roof = new THREE.Mesh(roofGeo, bodyMat);
      roof.castShadow = true;
      group.add(roof);

      // Rear spoiler
      const wingGeo = new THREE.BoxGeometry(width * 0.9, 0.08, 0.35);
      const wing = new THREE.Mesh(wingGeo, bodyMat);
      wing.position.set(0, 1.05, -1.9);
      group.add(wing);

    } else if (type === 'muscle') {
      // Classic Coral Vista muscle car with long hood
      wheelbase = 2.8;
      length = 4.7;
      const lowerGeo = new THREE.BoxGeometry(width, 0.62, length);
      lowerGeo.translate(0, 0.6, 0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.castShadow = true;
      group.add(lower);

      const cabinGeo = new THREE.BoxGeometry(width * 0.85, 0.5, length * 0.42);
      cabinGeo.translate(0, 1.05, -0.4);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      group.add(cabin);

      // Body-colored roof cap
      const roofGeo = new THREE.BoxGeometry(width * 0.80, 0.08, length * 0.32);
      roofGeo.translate(0, 1.32, -0.4);
      const roof = new THREE.Mesh(roofGeo, bodyMat);
      roof.castShadow = true;
      group.add(roof);

      // Hood scoop
      const scoopGeo = new THREE.BoxGeometry(0.6, 0.12, 0.9);
      const scoop = new THREE.Mesh(scoopGeo, bodyMat);
      scoop.position.set(0, 0.96, 1.1);
      group.add(scoop);

    } else if (type === 'police') {
      // CVPD Patrol Interceptor
      wheelbase = 2.8;
      length = 4.8;
      const lowerGeo = new THREE.BoxGeometry(width, 0.68, length);
      lowerGeo.translate(0, 0.62, 0);
      const policeMat = new THREE.MeshStandardMaterial({ color: 0x152238, roughness: 0.4 });
      const lower = new THREE.Mesh(lowerGeo, policeMat);
      lower.castShadow = true;
      group.add(lower);

      // White door panels
      const doorGeo = new THREE.BoxGeometry(width + 0.02, 0.62, 1.6);
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
      const door = new THREE.Mesh(doorGeo, whiteMat);
      door.position.set(0, 0.62, 0);
      group.add(door);

      const cabinGeo = new THREE.BoxGeometry(width * 0.85, 0.52, length * 0.46);
      cabinGeo.translate(0, 1.1, -0.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      group.add(cabin);

      // White roof cap
      const roofGeo = new THREE.BoxGeometry(width * 0.80, 0.08, length * 0.36);
      roofGeo.translate(0, 1.38, -0.2);
      const roof = new THREE.Mesh(roofGeo, whiteMat);
      roof.castShadow = true;
      group.add(roof);

      // Police emergency lightbar
      const barGeo = new THREE.BoxGeometry(1.2, 0.16, 0.3);
      barGeo.translate(0, 1.48, -0.2);
      const barMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const bar = new THREE.Mesh(barGeo, barMat);
      group.add(bar);

      const redLightGeo = new THREE.BoxGeometry(0.48, 0.14, 0.28);
      const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
      const redLight = new THREE.Mesh(redLightGeo, redLightMat);
      redLight.position.set(-0.32, 1.48, -0.2);
      group.add(redLight);

      const blueLightGeo = new THREE.BoxGeometry(0.48, 0.14, 0.28);
      const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const blueLight = new THREE.Mesh(blueLightGeo, blueLightMat);
      blueLight.position.set(0.32, 1.48, -0.2);
      group.add(blueLight);

      group.userData.lightbar = { red: redLight, blue: blueLight };

    } else if (type === 'taxi') {
      // Coral Vista Yellow Cab
      wheelbase = 2.7;
      length = 4.6;
      const taxiMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 });
      const lowerGeo = new THREE.BoxGeometry(width, 0.65, length);
      lowerGeo.translate(0, 0.6, 0);
      const lower = new THREE.Mesh(lowerGeo, taxiMat);
      lower.castShadow = true;
      group.add(lower);

      const cabinGeo = new THREE.BoxGeometry(width * 0.85, 0.52, length * 0.46);
      cabinGeo.translate(0, 1.08, -0.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      group.add(cabin);

      // Yellow taxi roof cap
      const roofGeo = new THREE.BoxGeometry(width * 0.80, 0.08, length * 0.36);
      roofGeo.translate(0, 1.36, -0.2);
      const roof = new THREE.Mesh(roofGeo, taxiMat);
      roof.castShadow = true;
      group.add(roof);

      // Taxi roof light
      const signGeo = new THREE.BoxGeometry(0.7, 0.18, 0.3);
      signGeo.translate(0, 1.48, -0.2);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
      const sign = new THREE.Mesh(signGeo, signMat);
      group.add(sign);

    } else {
      // SUV / Tormenta 4x4
      trackW = 2.1;
      wheelbase = 2.9;
      length = 4.8;
      width = 2.15;
      const lowerGeo = new THREE.BoxGeometry(width, 0.85, length);
      lowerGeo.translate(0, 0.8, 0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.castShadow = true;
      group.add(lower);

      const cabinGeo = new THREE.BoxGeometry(width * 0.86, 0.62, length * 0.52);
      cabinGeo.translate(0, 1.45, -0.3);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      group.add(cabin);

      const roofGeo = new THREE.BoxGeometry(width * 0.82, 0.08, length * 0.44);
      roofGeo.translate(0, 1.78, -0.3);
      const roof = new THREE.Mesh(roofGeo, bodyMat);
      roof.castShadow = true;
      group.add(roof);
    }

    // Headlights (front: +Z)
    const hlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.05);
    const hlLeft = new THREE.Mesh(hlGeo, this.headlightMat);
    hlLeft.position.set(-width * 0.38, 0.6, length * 0.5 + 0.02);
    const hlRight = new THREE.Mesh(hlGeo, this.headlightMat);
    hlRight.position.set(width * 0.38, 0.6, length * 0.5 + 0.02);
    group.add(hlLeft);
    group.add(hlRight);

    // Taillights (rear: -Z)
    const tlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.05);
    const tlLeft = new THREE.Mesh(tlGeo, this.taillightMat);
    tlLeft.position.set(-width * 0.38, 0.62, -length * 0.5 - 0.02);
    const tlRight = new THREE.Mesh(tlGeo, this.taillightMat);
    tlRight.position.set(width * 0.38, 0.62, -length * 0.5 - 0.02);
    group.add(tlLeft);
    group.add(tlRight);

    // Attach animated wheels
    const wheels = this.createWheels(trackW, wheelbase);
    for (const w of wheels) {
      group.add(w.mesh);
    }

    return {
      mesh: group,
      wheels,
      width,
      length,
      wheelbase,
    };
  }
}

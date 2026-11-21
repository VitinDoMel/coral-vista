import * as THREE from 'three';

// Particle Effects: Engine Smoke, Tire Drift Smoke, Sparks, and Skidmarks

export class FXManager {
  constructor(scene) {
    this.scene = scene;

    this.particles = [];
    this.maxParticles = 60;

    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffcc33,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x1f1f22,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    this.geoSmoke = new THREE.SphereGeometry(0.35, 6, 6);
    this.geoSpark = new THREE.SphereGeometry(0.08, 4, 4);

    this.skidmarks = [];
  }

  emitSmoke(pos, vel, isDrift = false) {
    if (this.particles.length >= this.maxParticles) {
      const oldest = this.particles.shift();
      this.scene.remove(oldest.mesh);
    }

    const mesh = new THREE.Mesh(this.geoSmoke, this.smokeMat.clone());
    mesh.position.copy(pos);
    mesh.scale.setScalar(isDrift ? 0.6 : 0.9);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      vel: vel.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4)),
      life: 1.0,
      decay: isDrift ? 1.6 : 1.0,
      isSmoke: true
    });
  }

  emitSparks(pos, count = 4) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        const oldest = this.particles.shift();
        this.scene.remove(oldest.mesh);
      }

      const mesh = new THREE.Mesh(this.geoSpark, this.sparkMat.clone());
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        Math.random() * 3.0 + 1.0,
        (Math.random() - 0.5) * 4.0
      );

      this.particles.push({
        mesh,
        vel,
        life: 0.6,
        decay: 2.2,
        isSmoke: false
      });
    }
  }

  addSkidmark(pos, angle) {
    if (this.skidmarks.length > 30) {
      const old = this.skidmarks.shift();
      this.scene.remove(old);
    }

    const markGeo = new THREE.PlaneGeometry(0.35, 1.4);
    markGeo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(markGeo, this.skidMat);
    mesh.position.set(pos.x, 0.084, pos.z);
    mesh.rotation.y = angle;
    this.scene.add(mesh);
    this.skidmarks.push(mesh);
  }

  update(dt, activeVehicle) {
    // 1. Vehicle smoke / skid marks when damaged or drifting
    if (activeVehicle) {
      const v = activeVehicle.controller;
      if (v.isSmoking) {
        // Emit black engine smoke from hood
        const sinY = Math.sin(v.yaw);
        const cosY = Math.cos(v.yaw);
        const hoodPos = new THREE.Vector3(
          v.position.x + sinY * 1.5,
          0.8,
          v.position.z + cosY * 1.5
        );
        this.emitSmoke(hoodPos, new THREE.Vector3(0, 0.5, 0), false);
      }

      if (Math.abs(v.lateralVelocity) > 4.0) {
        // Emit tire smoke and leave skidmark
        const rearPos = new THREE.Vector3(
          v.position.x - Math.sin(v.yaw) * 1.2,
          0.15,
          v.position.z - Math.cos(v.yaw) * 1.2
        );
        this.emitSmoke(rearPos, new THREE.Vector3(0, 0.2, 0), true);
        this.addSkidmark(rearPos, v.yaw);
      }
    }

    // 2. Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = p.life * (p.isSmoke ? 0.5 : 0.9);
      if (p.isSmoke) {
        p.mesh.scale.multiplyScalar(1.0 + 1.2 * dt);
      }
    }
  }
}

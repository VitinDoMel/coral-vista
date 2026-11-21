import * as THREE from 'three';

export class EffectsManager {
  constructor(scene, uiRoot) {
    this.scene = scene;
    this.uiRoot = uiRoot;

    this.particles = [];
    this.skidMarks = [];
    this.maxSkidMarks = 160;
    this.skidIndex = 0;

    this.smokeCooldown = 0;
    this.skidCooldown = 0;

    this._sharedParticleGeo = new THREE.SphereGeometry(0.22, 6, 5);
    this._sharedSparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this._sharedSkidGeo = new THREE.PlaneGeometry(0.28, 0.85);
    this._sharedSkidMat = new THREE.MeshBasicMaterial({
      color: 0x111318,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    });

    if (this.uiRoot) {
      this._createWarmVignetteOverlay();
    }
  }

  _createWarmVignetteOverlay() {
    this.vignetteEl = document.createElement('div');
    this.vignetteEl.id = 'warm-sunset-vignette';
    this.vignetteEl.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 8;
      background: radial-gradient(
        ellipse at 50% 48%,
        rgba(255, 195, 130, 0.0) 56%,
        rgba(255, 136, 78, 0.09) 80%,
        rgba(28, 16, 18, 0.28) 100%
      );
    `;
    this.uiRoot.appendChild(this.vignetteEl);
  }

  setVignetteVisible(visible) {
    if (this.vignetteEl) {
      this.vignetteEl.style.display = visible ? 'block' : 'none';
    }
  }

  _spawnParticle(pos, vel, colorHex, scaleStart, scaleEnd, life, gravity = 0, isSpark = false) {
    if (this.particles.length > 90) {
      const oldest = this.particles.shift();
      this.scene.remove(oldest.mesh);
      oldest.mesh.material.dispose();
    }

    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: isSpark ? 0.95 : 0.65,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(
      isSpark ? this._sharedSparkGeo : this._sharedParticleGeo,
      mat
    );
    mesh.position.copy(pos);
    mesh.scale.setScalar(scaleStart);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      vel: vel.clone(),
      scaleStart,
      scaleEnd,
      life,
      maxLife: life,
      gravity
    });
  }

  spawnSparks(origin, count = 8) {
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        2.5 + Math.random() * 5,
        (Math.random() - 0.5) * 9
      );
      const color = i % 2 === 0 ? 0xffd166 : 0xff7b36;
      this._spawnParticle(origin, vel, color, 1.0, 0.15, 0.38, -14, true);
    }
  }

  spawnGunSmoke(muzzlePos) {
    for (let i = 0; i < 4; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        0.9 + Math.random() * 0.9,
        (Math.random() - 0.5) * 1.4
      );
      this._spawnParticle(muzzlePos, vel, 0xd8dee6, 0.45, 1.45, 0.42, 0.5, false);
    }
  }

  spawnEngineSmoke(vehicle, heavy = false) {
    const forward = vehicle.getForwardXZ();
    const hoodPos = vehicle.position
      .clone()
      .addScaledVector(forward, vehicle.modelDef.length * 0.34)
      .add(new THREE.Vector3(0, 1.05, 0));

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.2 - forward.x * 2.2,
      1.8 + Math.random() * 1.2,
      (Math.random() - 0.5) * 1.2 - forward.z * 2.2
    );
    const color = heavy ? 0x2b303a : 0x767f8f;
    this._spawnParticle(hoodPos, vel, color, 0.75, 2.35, 0.85, 0.8, false);
  }

  spawnSkidPair(vehicle) {
    const right = vehicle.getRightXZ();
    const forward = vehicle.getForwardXZ();
    const rearCenter = vehicle.position
      .clone()
      .addScaledVector(forward, -vehicle.modelDef.length * 0.31);
    const trackHalf = vehicle.modelDef.width * 0.44;

    for (const side of [-1, 1]) {
      const pos = rearCenter.clone().addScaledVector(right, side * trackHalf);
      pos.y = 0.032;

      let quad;
      if (this.skidMarks.length < this.maxSkidMarks) {
        quad = new THREE.Mesh(this._sharedSkidGeo, this._sharedSkidMat);
        this.scene.add(quad);
        this.skidMarks.push(quad);
      } else {
        quad = this.skidMarks[this.skidIndex % this.maxSkidMarks];
        this.skidIndex++;
      }

      quad.position.copy(pos);
      quad.rotation.set(-Math.PI * 0.5, 0, vehicle.heading, 'YXZ');
    }
  }

  prepopulateDriftTrack(vehicle, steps = 12) {
    const forward = vehicle.getForwardXZ();
    const savedPos = vehicle.position.clone();
    for (let i = 1; i <= steps; i++) {
      vehicle.position.copy(savedPos).addScaledVector(forward, -i * 0.78);
      this.spawnSkidPair(vehicle);
    }
    vehicle.position.copy(savedPos);
  }

  update(dt, vehicleManager) {
    const clampedDt = Math.min(dt, 0.05);
    this.smokeCooldown -= clampedDt;
    this.skidCooldown -= clampedDt;

    if (vehicleManager) {
      for (const v of vehicleManager.vehicles) {
        // Emit engine damage smoke when health < 70
        if (v.health < 70 && this.smokeCooldown <= 0) {
          this.spawnEngineSmoke(v, v.health < 35);
        }
      }

      const active = vehicleManager.activeVehicle;
      if (active) {
        const shouldSkid =
          active.isDrifting ||
          (active.isBraking && Math.abs(active.speed) > 10) ||
          (Math.abs(active.steerAngle) > 0.34 && Math.abs(active.speed) > 16);
        if (shouldSkid && this.skidCooldown <= 0) {
          this.spawnSkidPair(active);
          this.skidCooldown = 0.035;
        }
      }
    }

    if (this.smokeCooldown <= 0) {
      this.smokeCooldown = 0.14;
    }

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= clampedDt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.vel.y += p.gravity * clampedDt;
      p.mesh.position.addScaledVector(p.vel, clampedDt);

      const t = 1 - p.life / p.maxLife;
      const scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * t;
      p.mesh.scale.setScalar(scale);
      p.mesh.material.opacity = (1 - t) * 0.65;
    }
  }
}

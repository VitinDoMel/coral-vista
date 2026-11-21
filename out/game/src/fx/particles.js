// Visual particle effects: tire smoke, skid smoke, sparks, muzzle flashes, and vehicle damage smoke

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 180;

    // Shared reusable geometries and materials
    this.smokeGeo = new THREE.SphereGeometry(0.35, 6, 6);
    this.sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.16);

    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    this.darkSmokeMat = new THREE.MeshBasicMaterial({
      color: 0x2b2b2b,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    });

    this.fireMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
  }

  spawnTireSmoke(x, y, z, vx = 0, vz = 0, count = 2) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const mesh = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y + 0.15 + Math.random() * 0.1,
        z + (Math.random() - 0.5) * 0.4
      );
      mesh.scale.setScalar(0.4 + Math.random() * 0.3);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          vx * 0.2 + (Math.random() - 0.5) * 0.8,
          0.8 + Math.random() * 1.2,
          vz * 0.2 + (Math.random() - 0.5) * 0.8
        ),
        growth: 1.8 + Math.random() * 1.5,
        fadeSpeed: 1.4 + Math.random() * 0.8,
        life: 1.0,
      });
    }
  }

  spawnSparks(x, y, z, nx = 0, ny = 1, nz = 0, count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const speed = 4.0 + Math.random() * 8.0;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          nx * 2.0 + (Math.random() - 0.5) * speed,
          ny * 2.0 + Math.random() * speed,
          nz * 2.0 + (Math.random() - 0.5) * speed
        ),
        growth: -0.4,
        fadeSpeed: 3.5,
        life: 1.0,
        gravity: 12.0,
      });
    }
  }

  spawnMuzzleFlash(pos, dir) {
    if (this.particles.length >= this.maxParticles) return;

    const flashGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const mesh = new THREE.Mesh(flashGeo, flashMat);
    mesh.position.copy(pos).addScaledVector(dir, 0.4);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(),
      growth: 2.0,
      fadeSpeed: 16.0,
      life: 0.2,
    });
  }

  spawnEngineSmoke(pos, severity = 1) {
    if (this.particles.length >= this.maxParticles) return;

    const isFire = severity >= 2 && Math.random() < 0.35;
    const mat = isFire ? this.fireMat : (severity >= 2 ? this.darkSmokeMat : this.smokeMat);

    const mesh = new THREE.Mesh(this.smokeGeo, mat.clone());
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.5,
      pos.y + 0.8,
      pos.z + (Math.random() - 0.5) * 0.5
    );
    mesh.scale.setScalar(0.3 + Math.random() * 0.25);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        1.6 + Math.random() * 1.8,
        (Math.random() - 0.5) * 0.6
      ),
      growth: 2.2,
      fadeSpeed: 1.2,
      life: 1.0,
    });
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.fadeSpeed * delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material && p.mesh.material !== this.sparkMat) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      if (p.gravity) {
        p.velocity.y -= p.gravity * delta;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      const scaleDelta = p.growth * delta;
      const newScale = Math.max(0.01, p.mesh.scale.x + scaleDelta);
      p.mesh.scale.setScalar(newScale);

      if (p.mesh.material.transparent) {
        p.mesh.material.opacity = p.life * 0.7;
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}

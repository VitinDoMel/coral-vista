// Skidmarks system: procedural tire tracks on road during hard turns, drifts, and braking

import * as THREE from 'three';

export class SkidmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.marks = [];
    this.maxMarks = 80;

    this.markGeo = new THREE.PlaneGeometry(0.35, 1.4);
    this.markGeo.rotateX(-Math.PI / 2);

    this.markMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
  }

  addSkidmark(x, y, z, yaw, opacity = 0.55) {
    if (this.marks.length >= this.maxMarks) {
      const oldest = this.marks.shift();
      this.scene.remove(oldest.mesh);
    }

    const mat = this.markMat.clone();
    mat.opacity = opacity;
    const mesh = new THREE.Mesh(this.markGeo, mat);
    mesh.position.set(x, y + 0.03, z);
    mesh.rotation.y = yaw;
    this.scene.add(mesh);

    this.marks.push({ mesh, mat, life: 18.0 });
  }

  update(delta) {
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      m.life -= delta;
      if (m.life < 4.0) {
        m.mat.opacity = (m.life / 4.0) * 0.55;
      }
      if (m.life <= 0) {
        this.scene.remove(m.mesh);
        m.mat.dispose();
        this.marks.splice(i, 1);
      }
    }
  }

  clear() {
    for (const m of this.marks) {
      this.scene.remove(m.mesh);
      m.mat.dispose();
    }
    this.marks = [];
  }
}

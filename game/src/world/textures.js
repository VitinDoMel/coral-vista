// Procedural canvas textures for Coral Vista surfaces

import * as THREE from 'three';

export class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  getBuildingTexture(theme = 'downtown', seed = 1) {
    const key = `bldg_${theme}_${seed}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseColor = theme === 'downtown' ? '#1c242c' : '#c88c78';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 512);

    const cols = 8;
    const rows = 24;
    const padX = 6;
    const padY = 6;
    const winW = (256 - padX * (cols + 1)) / cols;
    const winH = (512 - padY * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);

        const isLit = (Math.sin(r * 12.3 + c * 33.7 + seed * 9.1) > 0.15);
        if (isLit) {
          const warmGlow = Math.sin(r + c + seed) > 0 ? '#ffe082' : '#ffab91';
          ctx.fillStyle = warmGlow;
        } else {
          ctx.fillStyle = '#0f141a';
        }
        ctx.fillRect(x, y, winW, winH);

        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, winW, winH);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  getRoadTexture() {
    const key = 'road_asphalt';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222327';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle asphalt grain
    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const g = Math.floor(Math.random() * 40 + 25);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Yellow center divider line
    ctx.fillStyle = '#e6a122';
    ctx.fillRect(253, 0, 6, 512);

    // Dashed white lane dividers
    ctx.fillStyle = '#f0f0f0';
    ctx.setLineDash([32, 24]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(128, 0); ctx.lineTo(128, 512);
    ctx.moveTo(384, 0); ctx.lineTo(384, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  getSidewalkTexture() {
    const key = 'sidewalk_paver';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9e9992';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(40,35,30,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 60, 60);
    ctx.strokeRect(66, 2, 60, 60);
    ctx.strokeRect(2, 66, 60, 60);
    ctx.strokeRect(66, 66, 60, 60);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  getContainerTexture(colorHex) {
    const key = `container_${colorHex}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 256, 128);

    // Corrugated steel ridges
    for (let x = 0; x < 256; x += 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x, 0, 3, 128);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(x + 3, 0, 2, 128);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('LOS MANTA LOGISTICS', 18, 70);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}

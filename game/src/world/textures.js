// Procedural canvas textures for Art Déco facades, sidewalks, roads, and crosswalks

import * as THREE from 'three';
import { COLORS } from '../core/constants.js';

export class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  getArtDecoBuildingTexture(paletteHex, seed = 1) {
    const key = `deco_${paletteHex}_${seed}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base pastel facade
    const colStr = '#' + paletteHex.toString(16).padStart(6, '0');
    ctx.fillStyle = colStr;
    ctx.fillRect(0, 0, 256, 512);

    // Art Déco vertical fluting / pilasters
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let x = 12; x < 256; x += 32) {
      ctx.fillRect(x, 0, 10, 512);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let x = 22; x < 256; x += 32) {
      ctx.fillRect(x, 0, 4, 512);
    }

    // Window grid with warm sun reflections
    const cols = 6;
    const rows = 18;
    const padX = 10;
    const padY = 8;
    const winW = (256 - padX * (cols + 1)) / cols;
    const winH = (512 - padY * (rows + 1) - 60) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = 20 + padY + r * (winH + padY);

        // Window glass tinted with sky and sunset reflection
        const isLit = (Math.sin(r * 9.7 + c * 14.3 + seed * 7.1) > 0.1);
        ctx.fillStyle = isLit ? '#ffeaa7' : '#2b5168';
        ctx.fillRect(x, y, winW, winH);

        // Crisp white window moulding
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, winW, winH);
      }
    }

    // Ground floor storefront marquee & neon strip
    ctx.fillStyle = '#1a1f26';
    ctx.fillRect(0, 440, 256, 72);

    // Neon accent glow line
    const neonColors = ['#00e5ff', '#ff007f', '#ffe600', '#00ff88'];
    ctx.fillStyle = neonColors[seed % neonColors.length];
    ctx.fillRect(10, 442, 236, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  getRoadTexture() {
    const key = 'road_asphalt_v2';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#32343a';
    ctx.fillRect(0, 0, 512, 512);

    // Yellow double center line
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(250, 0, 5, 512);
    ctx.fillRect(258, 0, 5, 512);

    // Dashed white lane dividers
    ctx.fillStyle = '#ffffff';
    ctx.setLineDash([36, 24]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(125, 0); ctx.lineTo(125, 512);
    ctx.moveTo(387, 0); ctx.lineTo(387, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  getSidewalkTexture() {
    const key = 'sidewalk_light';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Light clean sunlit concrete pavers
    ctx.fillStyle = '#e4dfd5';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(120, 115, 105, 0.35)';
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

    for (let x = 0; x < 256; x += 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x, 0, 3, 128);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(x + 3, 0, 2, 128);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('LOS MANTA LOGISTICS', 20, 70);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}

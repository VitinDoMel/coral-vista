import * as THREE from 'three';

// Procedural Canvas Textures for Coral Vista Art-Deco Architecture and Streets

export class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  getBuildingFacade(colorHex, seed = 1) {
    const key = `bld_${colorHex}_${seed}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 256, 512);

    // Subtle horizontal banding (Art Deco fluting)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = 0; y < 512; y += 16) {
      ctx.fillRect(0, y, 256, 2);
    }

    // Windows grid
    const cols = 6;
    const rows = 14;
    const winW = 24;
    const winH = 20;
    const gapX = (256 - cols * winW) / (cols + 1);
    const startY = 48;
    const endY = 460;
    const gapY = (endY - startY - rows * winH) / (rows - 1);

    for (let r = 0; r < rows; r++) {
      const y = startY + r * (winH + gapY);
      for (let c = 0; c < cols; c++) {
        const x = gapX + c * (winW + gapX);

        // Window frame
        ctx.fillStyle = 'rgba(40, 50, 60, 0.7)';
        ctx.fillRect(x - 1, y - 1, winW + 2, winH + 2);

        // Sky reflection with subtle warm sunset interior
        const isLit = ((r * 7 + c * 13 + seed) % 5 === 0);
        if (isLit) {
          ctx.fillStyle = '#ffe9b5';
        } else {
          const grad = ctx.createLinearGradient(x, y, x, y + winH);
          grad.addColorStop(0, '#8ec8e8');
          grad.addColorStop(0.6, '#5a96bd');
          grad.addColorStop(1, '#ffc7a0');
          ctx.fillStyle = grad;
        }
        ctx.fillRect(x, y, winW, winH);

        // Window mullion
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x + winW / 2 - 0.5, y, 1, winH);
      }
    }

    // Ground floor storefront / awning
    ctx.fillStyle = 'rgba(20, 20, 25, 0.85)';
    ctx.fillRect(0, 465, 256, 47);
    ctx.fillStyle = '#ffeed0';
    ctx.fillRect(16, 475, 96, 32);
    ctx.fillRect(144, 475, 96, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  getRoadTexture() {
    if (this.cache.has('road')) return this.cache.get('road');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Asphalt #5a5d63
    ctx.fillStyle = '#5a5d63';
    ctx.fillRect(0, 0, 256, 256);

    // Grain
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect((i * 37) % 256, (i * 91) % 256, 2, 2);
    }

    // Yellow double center divider
    ctx.fillStyle = '#f5c042';
    ctx.fillRect(124, 0, 3, 256);
    ctx.fillRect(129, 0, 3, 256);

    // White dashed lane markers
    ctx.fillStyle = '#ffffff';
    for (let y = 10; y < 256; y += 48) {
      ctx.fillRect(60, y, 3, 24);
      ctx.fillRect(193, y, 3, 24);
    }

    // Road shoulder edge lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 0, 3, 256);
    ctx.fillRect(249, 0, 3, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('road', tex);
    return tex;
  }

  getSidewalkTexture() {
    if (this.cache.has('sidewalk')) return this.cache.get('sidewalk');

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Light gray sidewalk #cfc8bb
    ctx.fillStyle = '#cfc8bb';
    ctx.fillRect(0, 0, 128, 128);

    // Paver joints
    ctx.strokeStyle = '#b8b1a3';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, 64, 64);
    ctx.strokeRect(64, 0, 64, 64);
    ctx.strokeRect(0, 64, 64, 64);
    ctx.strokeRect(64, 64, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('sidewalk', tex);
    return tex;
  }

  getZebraTexture() {
    if (this.cache.has('zebra')) return this.cache.get('zebra');

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5a5d63';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#ffffff';
    for (let x = 8; x < 128; x += 24) {
      ctx.fillRect(x, 0, 14, 128);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('zebra', tex);
    return tex;
  }
}

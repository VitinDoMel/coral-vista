import * as THREE from 'three';

export function createSkyGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Visible sky on screen spans y=0.37 (top of frame) to y=0.50 (horizon)
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0.0, '#1653a3');
  grad.addColorStop(0.36, '#2e7dd1');
  grad.addColorStop(0.41, '#5ca8e2');
  grad.addColorStop(0.45, '#9ed0ec');
  grad.addColorStop(0.475, '#ffd4ad');
  grad.addColorStop(0.495, '#ffa673');
  grad.addColorStop(0.51, '#ff915e');
  grad.addColorStop(0.65, '#eb8456');
  grad.addColorStop(1.0, '#d9754c');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createWindowFacadeTexture(options = {}) {
  const {
    baseColor = '#f7b7a3',
    trimColor = '#fff3e6',
    windowTint = '#355c7d',
    litColor = '#ffe4a0',
    cols = 6,
    rows = 10,
    artDeco = false,
    seed = 1
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base pastel plaster/concrete
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle vertical pilasters & horizontal cornice bands
  ctx.fillStyle = trimColor;
  ctx.fillRect(0, 0, canvas.width, 14);
  ctx.fillRect(0, canvas.height - 22, canvas.width, 22);

  if (artDeco) {
    ctx.fillStyle = trimColor;
    ctx.fillRect(10, 0, 10, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 10, canvas.height);
    // Tropical neon/pastel horizontal frieze lines
    ctx.fillStyle = '#7de2d1';
    ctx.fillRect(0, 26, canvas.width, 6);
    ctx.fillRect(0, canvas.height - 56, canvas.width, 5);
  }

  const padX = 24;
  const padTop = 42;
  const padBottom = 58;
  const usableW = canvas.width - padX * 2;
  const usableH = canvas.height - padTop - padBottom;
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  let hash = (seed * 9301 + 49297) >>> 0;

  for (let r = 0; r < rows; r++) {
    // Horizontal floor ledge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fillRect(14, padTop + r * cellH - 3, canvas.width - 28, 3);

    for (let c = 0; c < cols; c++) {
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const isWarmLit = (hash % 100) < 28;

      const wx = padX + c * cellW + cellW * 0.16;
      const wy = padTop + r * cellH + cellH * 0.15;
      const ww = cellW * 0.68;
      const wh = cellH * 0.68;

      // Window frame
      ctx.fillStyle = trimColor;
      ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

      // Glass pane with sky reflection
      const paneGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
      if (isWarmLit) {
        paneGrad.addColorStop(0, litColor);
        paneGrad.addColorStop(1, '#e6a56c');
      } else {
        paneGrad.addColorStop(0, '#6aa4c8');
        paneGrad.addColorStop(0.55, windowTint);
        paneGrad.addColorStop(1, '#243e56');
      }
      ctx.fillStyle = paneGrad;
      ctx.fillRect(wx, wy, ww, wh);
    }
  }

  // Ground floor storefront band
  ctx.fillStyle = 'rgba(35, 45, 62, 0.78)';
  ctx.fillRect(20, canvas.height - 48, canvas.width - 40, 34);
  ctx.fillStyle = trimColor;
  ctx.fillRect(16, canvas.height - 52, canvas.width - 32, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createContainerTexture(baseHex = '#e05a47') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Corrugated steel vertical ribs
  for (let x = 8; x < canvas.width - 8; x += 12) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x, 8, 4, canvas.height - 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(x + 4, 8, 3, canvas.height - 16);
  }

  // Border frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  // Stencil stripe
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillRect(22, 24, 54, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

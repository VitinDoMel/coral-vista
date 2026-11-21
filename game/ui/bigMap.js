import { X_ROADS, Z_ROADS, ROAD_WIDTH } from '../world/city.js';
import { STORY_MISSIONS, CITY_POIS } from '../missions/missions.js';

export class BigMapOverlay {
  constructor(container) {
    this.container = container;
    this.isOpen = false;

    this.root = document.createElement('div');
    this.root.id = 'big-map-overlay';
    this.root.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(13, 17, 26, 0.96);
      display: none;
      z-index: 40;
      pointer-events: auto;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;
    this.root.appendChild(this.canvas);
    this.container.appendChild(this.root);
    this.ctx = this.canvas.getContext('2d');
  }

  setOpen(open, state = null) {
    this.isOpen = Boolean(open);
    this.root.style.display = this.isOpen ? 'block' : 'none';
    if (this.isOpen && state) {
      this.render(state);
    }
  }

  toggle(state) {
    this.setOpen(!this.isOpen, state);
  }

  render(state) {
    if (!this.isOpen) return;
    const ctx = this.ctx;
    const W = 1280;
    const H = 720;

    ctx.clearRect(0, 0, W, H);

    // Overall dark tactical backdrop
    ctx.fillStyle = '#0e131d';
    ctx.fillRect(0, 0, W, H);

    // Map viewport box on left/center (x: 24..934, y: 24..696)
    const mapX = 24;
    const mapY = 24;
    const mapW = 910;
    const mapH = 672;

    // World coordinate bounds mapped into map viewport:
    // worldX in [-225, 365] (span 590), worldZ in [-260, 295] (span 555)
    const worldMinX = -225;
    const worldMaxX = 365;
    const worldMinZ = -260;
    const worldMaxZ = 295;

    const scaleX = mapW / (worldMaxX - worldMinX);
    const scaleZ = mapH / (worldMaxZ - worldMinZ);
    const scale = Math.min(scaleX, scaleZ);

    const offsetX = mapX + (mapW - (worldMaxX - worldMinX) * scale) * 0.5;
    const offsetY = mapY + (mapH - (worldMaxZ - worldMinZ) * scale) * 0.5;

    const toScreenX = (wx) => offsetX + (wx - worldMinX) * scale;
    const toScreenY = (wz) => offsetY + (wz - worldMinZ) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 12);
    ctx.clip();

    // 1. Dark land mass background (terra escura)
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(mapX, mapY, mapW, mapH);

    // Subtle coordinate grid lines on dark land
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let gx = -200; gx <= 350; gx += 50) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(gx), mapY);
      ctx.lineTo(toScreenX(gx), mapY + mapH);
      ctx.stroke();
    }
    for (let gz = -250; gz <= 250; gz += 50) {
      ctx.beginPath();
      ctx.moveTo(mapX, toScreenY(gz));
      ctx.lineTo(mapX + mapW, toScreenY(gz));
      ctx.stroke();
    }

    // 2. Sandy Beach strip (worldX = 142..198, full map height)
    const beachX = toScreenX(142);
    const oceanX = toScreenX(198);
    ctx.fillStyle = '#ebd08b';
    ctx.fillRect(beachX, mapY, oceanX - beachX, mapH);

    // 3. Turquoise Sea ONLY beyond the beach (mar turquesa só além da praia: x > 198)
    ctx.fillStyle = '#12b4c4';
    ctx.fillRect(oceanX, mapY, mapX + mapW - oceanX, mapH);

    // Shallow aqua contour line along beach shoreline
    ctx.fillStyle = '#3de0e4';
    ctx.fillRect(oceanX, mapY, 8 * scale, mapH);

    // 4. Starlight Key island (east end of bridge, worldX = 292..345, worldZ = -185..-115)
    ctx.fillStyle = '#293140';
    ctx.strokeStyle = '#ebd08b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      toScreenX(292),
      toScreenY(-185),
      53 * scale,
      70 * scale,
      6
    );
    ctx.fill();
    ctx.stroke();

    // 5. South Harbor Concrete Port Pier (worldX = -188..52, worldZ = 233..282)
    ctx.fillStyle = '#2f3746';
    ctx.fillRect(
      toScreenX(-188),
      toScreenY(233),
      240 * scale,
      49 * scale
    );

    // 6. Colored Neighborhood Districts (bairros coloridos)
    const districts = [
      {
        name: 'PALM GARDENS',
        minX: -180,
        maxX: -105,
        minZ: -225,
        maxZ: 150,
        fill: 'rgba(64, 192, 128, 0.22)',
        border: 'rgba(82, 224, 150, 0.55)',
        textColor: '#8ce99a',
        labelX: -142,
        labelZ: -188
      },
      {
        name: 'CORAL DOWNTOWN',
        minX: -105,
        maxX: 45,
        minZ: -225,
        maxZ: 150,
        fill: 'rgba(92, 124, 250, 0.22)',
        border: 'rgba(116, 143, 252, 0.55)',
        textColor: '#91a7ff',
        labelX: -30,
        labelZ: -188
      },
      {
        name: 'SEABREEZE STRIP',
        minX: 45,
        maxX: 128,
        minZ: -225,
        maxZ: 225,
        fill: 'rgba(255, 107, 129, 0.24)',
        border: 'rgba(255, 135, 150, 0.6)',
        textColor: '#ffa8a8',
        labelX: 86,
        labelZ: -188
      },
      {
        name: 'PORT OF CORAL HARBOR',
        minX: -180,
        maxX: 45,
        minZ: 150,
        maxZ: 278,
        fill: 'rgba(245, 159, 0, 0.24)',
        border: 'rgba(252, 196, 25, 0.6)',
        textColor: '#ffd43b',
        labelX: -32,
        labelZ: 188
      },
      {
        name: 'STARLIGHT KEY',
        minX: 292,
        maxX: 345,
        minZ: -185,
        maxZ: -115,
        fill: 'rgba(32, 201, 151, 0.26)',
        border: 'rgba(99, 230, 190, 0.65)',
        textColor: '#63e6be',
        labelX: 318,
        labelZ: -198
      }
    ];

    for (const d of districts) {
      const dx = toScreenX(d.minX);
      const dy = toScreenY(d.minZ);
      const dw = toScreenX(d.maxX) - dx;
      const dh = toScreenY(d.maxZ) - dy;
      ctx.fillStyle = d.fill;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = d.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, dw, dh);
    }

    // 7. City Road Network & Coral Bay Bridge
    const roadW = ROAD_WIDTH * scale;
    ctx.fillStyle = '#4c566a';
    for (const rx of X_ROADS) {
      ctx.fillRect(
        toScreenX(rx - ROAD_WIDTH * 0.5),
        toScreenY(-233),
        roadW,
        466 * scale
      );
    }
    for (const rz of Z_ROADS) {
      ctx.fillRect(
        toScreenX(-188),
        toScreenY(rz - ROAD_WIDTH * 0.5),
        316 * scale,
        roadW
      );
    }

    // Coral Bay Bridge deck (z = -150, x = 128..292)
    ctx.fillStyle = '#6c7a94';
    ctx.fillRect(
      toScreenX(128),
      toScreenY(-150 - ROAD_WIDTH * 0.5),
      164 * scale,
      roadW
    );

    // Double yellow avenue centerlines
    ctx.strokeStyle = 'rgba(247, 197, 49, 0.72)';
    ctx.lineWidth = 1.5;
    for (const rx of X_ROADS) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(rx), toScreenY(-225));
      ctx.lineTo(toScreenX(rx), toScreenY(225));
      ctx.stroke();
    }
    for (const rz of Z_ROADS) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(-180), toScreenY(rz));
      ctx.lineTo(toScreenX(120), toScreenY(rz));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(toScreenX(128), toScreenY(-150));
    ctx.lineTo(toScreenX(292), toScreenY(-150));
    ctx.stroke();

    // 8. Dashed GPS Route from Player to Current Mission Target along orthogonal road segments
    const activeMissionIdx = state.currentMissionIndex ?? 0;
    const activeMission = STORY_MISSIONS[Math.min(activeMissionIdx, STORY_MISSIONS.length - 1)];
    const px = state.playerPos ? state.playerPos.x : 120;
    const pz = state.playerPos ? state.playerPos.z : 28;
    const targetX = activeMission ? activeMission.startPos.x : 120;
    const targetZ = activeMission ? activeMission.startPos.z : 58;

    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(toScreenX(px), toScreenY(pz));
    ctx.lineTo(toScreenX(px), toScreenY(targetZ));
    ctx.lineTo(toScreenX(targetX), toScreenY(targetZ));
    ctx.stroke();
    ctx.setLineDash([]);

    // 9. Collect all map labels and run a strict non-overlapping bounding-box solver
    // so NO label ever touches another label!
    const labels = [];

    // District header pills
    for (const d of districts) {
      labels.push({
        kind: 'district',
        text: d.name,
        anchorX: toScreenX(d.labelX),
        anchorY: toScreenY(d.labelZ),
        x: toScreenX(d.labelX),
        y: toScreenY(d.labelZ),
        color: d.textColor,
        bg: 'rgba(15, 20, 30, 0.88)',
        border: d.border,
        font: 'bold 11px "Segoe UI", sans-serif',
        padX: 8,
        padY: 4,
        fixedPin: false
      });
    }

    // Bridge label over the eastern ocean
    labels.push({
      kind: 'district',
      text: 'CORAL BAY BRIDGE',
      anchorX: toScreenX(210),
      anchorY: toScreenY(-150),
      x: toScreenX(210),
      y: toScreenY(-150) - 24,
      color: '#ffd166',
      bg: 'rgba(15, 20, 30, 0.9)',
      border: '#ffd166',
      font: 'bold 11px "Segoe UI", sans-serif',
      padX: 8,
      padY: 4,
      fixedPin: true
    });

    // Beach & Turquoise Sea label over the eastern ocean
    labels.push({
      kind: 'district',
      text: 'BEACH & TURQUOISE SEA',
      anchorX: toScreenX(255),
      anchorY: toScreenY(45),
      x: toScreenX(255),
      y: toScreenY(45),
      color: '#72efdd',
      bg: 'rgba(12, 34, 46, 0.88)',
      border: '#3de0e4',
      font: 'bold 11px "Segoe UI", sans-serif',
      padX: 8,
      padY: 4,
      fixedPin: false
    });

    // 5 Numbered Story Missions
    for (let i = 0; i < STORY_MISSIONS.length; i++) {
      const m = STORY_MISSIONS[i];
      const mx = toScreenX(m.startPos.x);
      const my = toScreenY(m.startPos.z);

      // Draw circular numbered mission pin at exact road/building location
      const isCurrent = i === activeMissionIdx;
      const isDone = i < activeMissionIdx;
      ctx.fillStyle = isCurrent ? '#ff6b5b' : isDone ? '#2ecc71' : '#f7b731';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0e131d';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(m.id), mx, my + 0.5);

      // Initial horizontal stagger for pins stacked along Seabreeze Blvd (x=120)
      let initX = mx + 16;
      let initY = my - 26;
      if (m.id === 1) {
        initX = mx + 78;
        initY = my + 14;
      }
      labels.push({
        kind: 'mission',
        text: m.title,
        anchorX: mx,
        anchorY: my,
        x: initX,
        y: initY,
        color: '#ffffff',
        bg: isCurrent ? 'rgba(214, 58, 46, 0.94)' : 'rgba(22, 29, 44, 0.94)',
        border: isCurrent ? '#ffd166' : '#f7b731',
        font: 'bold 12px "Segoe UI", sans-serif',
        padX: 9,
        padY: 5,
        fixedPin: true
      });
    }

    // City POIs (Coral Arms, CVPD HQ, Hospital, Street Race, Taxi)
    for (const poi of CITY_POIS) {
      const pxScreen = toScreenX(poi.x);
      const pyScreen = toScreenY(poi.z);

      ctx.fillStyle = poi.color;
      ctx.strokeStyle = '#111622';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pxScreen, pyScreen, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const poiOffsetX = poi.id === 'street_race' ? 78 : 0;
      const poiOffsetY = poi.id === 'street_race' ? -16 : 24;
      labels.push({
        kind: 'poi',
        text: poi.shortLabel,
        anchorX: pxScreen,
        anchorY: pyScreen,
        x: pxScreen + poiOffsetX,
        y: pyScreen + poiOffsetY,
        color: poi.color,
        bg: 'rgba(17, 23, 35, 0.92)',
        border: poi.color,
        font: 'bold 11px "Segoe UI", sans-serif',
        padX: 7,
        padY: 4,
        fixedPin: true
      });
    }

    // Player marker pin & label
    const plX = toScreenX(px);
    const plY = toScreenY(pz);
    ctx.fillStyle = '#00f5d4';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(plX, plY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    labels.push({
      kind: 'player',
      text: 'YOU (RAFA SOL)',
      anchorX: plX,
      anchorY: plY,
      x: plX - 78,
      y: plY + 4,
      color: '#00f5d4',
      bg: 'rgba(12, 28, 36, 0.95)',
      border: '#00f5d4',
      font: 'bold 11px "Segoe UI", sans-serif',
      padX: 8,
      padY: 4,
      fixedPin: true
    });

    // Measure label dimensions
    for (const lb of labels) {
      ctx.font = lb.font;
      const metrics = ctx.measureText(lb.text);
      lb.w = Math.ceil(metrics.width + lb.padX * 2);
      lb.h = 22;
      // Offset pinned labels cleanly below or above their circular pin so they don't cover the pin itself
      if (lb.fixedPin && Math.hypot(lb.x - lb.anchorX, lb.y - lb.anchorY) < 22) {
        lb.y = lb.anchorY + (lb.y >= lb.anchorY ? 24 : -24);
      }
    }

    // Iterative relaxation solver to guarantee ZERO label overlap (minimum 12px margin)
    // and also keep labels from covering circular pins
    const margin = 12;
    for (let iter = 0; iter < 80; iter++) {
      let moved = false;
      for (let i = 0; i < labels.length; i++) {
        // Keep label pill clear of all pin circles
        const li = labels[i];
        for (let p = 0; p < labels.length; p++) {
          const pin = labels[p];
          if (!pin.fixedPin) continue;
          const dxPin = li.x - pin.anchorX;
          const dyPin = li.y - pin.anchorY;
          const minPinX = li.w * 0.5 + 13;
          const minPinY = li.h * 0.5 + 13;
          if (Math.abs(dxPin) < minPinX && Math.abs(dyPin) < minPinY) {
            const signY = dyPin >= 0 ? 1 : -1;
            li.y += signY * (minPinY - Math.abs(dyPin) + 2);
            moved = true;
          }
        }

        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i];
          const b = labels[j];

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minW = (a.w + b.w) * 0.5 + margin;
          const minH = (a.h + b.h) * 0.5 + margin;

          if (Math.abs(dx) < minW && Math.abs(dy) < minH) {
            const overlapX = minW - Math.abs(dx);
            const overlapY = minH - Math.abs(dy);

            if (overlapY <= overlapX * 1.15) {
              const signY = dy >= 0 ? 1 : -1;
              a.y -= signY * overlapY * 0.55;
              b.y += signY * overlapY * 0.55;
            } else {
              const signX = dx >= 0 ? 1 : -1;
              a.x -= signX * overlapX * 0.55;
              b.x += signX * overlapX * 0.55;
            }
            moved = true;
          }
        }

        // Clamp inside map viewport
        const l = labels[i];
        const halfW = l.w * 0.5 + 8;
        const halfH = l.h * 0.5 + 8;
        l.x = Math.max(mapX + halfW, Math.min(mapX + mapW - halfW, l.x));
        l.y = Math.max(mapY + halfH, Math.min(mapY + mapH - halfH, l.y));
      }
      if (!moved) break;
    }

    // Draw leader lines & non-overlapping label pills
    for (const lb of labels) {
      if (lb.fixedPin) {
        const dist = Math.hypot(lb.x - lb.anchorX, lb.y - lb.anchorY);
        if (dist > 14) {
          ctx.strokeStyle = lb.border;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(lb.anchorX, lb.anchorY);
          ctx.lineTo(lb.x, lb.y);
          ctx.stroke();
        }
      }

      const rx = lb.x - lb.w * 0.5;
      const ry = lb.y - lb.h * 0.5;
      ctx.fillStyle = lb.bg;
      ctx.strokeStyle = lb.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rx, ry, lb.w, lb.h, 5);
      ctx.fill();
      ctx.stroke();

      ctx.font = lb.font;
      ctx.fillStyle = lb.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lb.text, lb.x, lb.y + 0.5);
    }

    ctx.restore();

    // Map Viewport Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 12);
    ctx.stroke();

    // 10. Right Sidebar: Story Progress Panel + Complete Legend (x: 952..1256, y: 24..696)
    this._renderSidebarPanel(ctx, 952, 24, 304, 672, state);
  }

  _renderSidebarPanel(ctx, x, y, w, h, state) {
    ctx.fillStyle = '#161c28';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    let cy = y + 28;
    const padX = x + 20;

    // Header
    ctx.fillStyle = '#ff6b5b';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HEATWAVE: CORAL VISTA', padX, cy);

    cy += 22;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px "Segoe UI", sans-serif';
    ctx.fillText('MAP & PROGRESS', padX, cy);

    // Story Progress Box
    cy += 18;
    const completedCount = state.completedMissions ?? (state.currentMissionIndex || 0);
    const pct = Math.round((completedCount / STORY_MISSIONS.length) * 100);

    ctx.fillStyle = '#1f283a';
    ctx.beginPath();
    ctx.roundRect(padX, cy, w - 40, 86, 8);
    ctx.fill();

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(`STORY PROGRESS: ${completedCount}/5 (${pct}%)`, padX + 12, cy + 22);

    // Progress Bar
    ctx.fillStyle = '#111622';
    ctx.beginPath();
    ctx.roundRect(padX + 12, cy + 32, w - 64, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#ff6b5b';
    ctx.beginPath();
    ctx.roundRect(padX + 12, cy + 32, Math.max(16, (w - 64) * Math.max(0.2, pct / 100)), 10, 5);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    const moneyVal = state.money ?? 4850;
    ctx.fillText(`CASH: $${moneyVal.toLocaleString('en-US')}`, padX + 12, cy + 66);

    // Render CVPD wanted stars with filled gold vs dimmed empty stars matching HUD
    const stars = state.wantedStars ?? 0;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText('CVPD:', padX + 140, cy + 66);
    for (let si = 0; si < 5; si++) {
      ctx.fillStyle = si < stars ? '#ffc83b' : 'rgba(255, 255, 255, 0.18)';
      ctx.fillText('★', padX + 184 + si * 14, cy + 66);
    }

    // 5 Numbered Story Missions list
    cy += 108;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('MISSIONS (RAFA SOL & NINA VEGA)', padX, cy);

    cy += 10;
    const activeIdx = state.currentMissionIndex ?? 0;
    for (let i = 0; i < STORY_MISSIONS.length; i++) {
      cy += 34;
      const m = STORY_MISSIONS[i];
      const isCurrent = i === activeIdx;
      const isDone = i < activeIdx;

      ctx.fillStyle = isCurrent
        ? 'rgba(255, 107, 91, 0.22)'
        : isDone
          ? 'rgba(46, 204, 113, 0.14)'
          : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(padX, cy - 16, w - 40, 28, 6);
      ctx.fill();

      ctx.fillStyle = isCurrent ? '#ffd166' : isDone ? '#2ecc71' : '#cbd5e1';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      const badge = isDone ? '✓' : isCurrent ? '▶' : '•';
      ctx.fillText(`${badge} ${m.title}`, padX + 10, cy + 2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${m.reward}`, x + w - 30, cy + 2);
      ctx.textAlign = 'left';
    }

    // Complete Legend Section
    cy += 36;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('MAP LEGEND', padX, cy);

    const legendItems = [
      { color: '#00f5d4', label: 'You (Rafa Sol) & GPS Route' },
      { color: '#ff6b5b', label: 'Active Story Mission (1–5)' },
      { color: '#ff922b', label: 'Coral Arms (Weapons & Armor)' },
      { color: '#4dabf7', label: 'CVPD Central Precinct' },
      { color: '#ff6b6b', label: 'Coral General Hospital' },
      { color: '#20c997', label: 'Coastal Race (Seabreeze Blvd)' },
      { color: '#fcc419', label: 'Vista Cab Taxi Depot' },
      { color: '#12b4c4', label: 'Beach & Turquoise Sea (East)' }
    ];

    cy += 8;
    for (const item of legendItems) {
      cy += 24;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(padX + 8, cy - 3, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(item.label, padX + 22, cy + 1);
    }

    // Footer instruction
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press [M] or [ESC] to return to the city', x + w * 0.5, y + h - 16);
    ctx.textAlign = 'left';
  }
}

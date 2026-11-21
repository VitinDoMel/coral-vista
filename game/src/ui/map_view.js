import { MISSIONS } from '../missions/mission_manager.js';

// Full City Map View (1280x720): District Color Zones, POIs, 5 Story Missions, Non-Overlapping Labels, GPS Route, Sidebar

export class FullMapView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(playerPos, currentMissionId, cash = 4850) {
    const ctx = this.ctx;
    const w = this.canvas.width = window.innerWidth || 1280;
    const h = this.canvas.height = window.innerHeight || 720;
    ctx.clearRect(0, 0, w, h);

    // Dark solid map container background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    // Map Projection helper (World: -360..360 -> Screen Map: 320..1220, 40..680)
    const mapLeft = 320;
    const mapTop = 30;
    const mapW = 930;
    const mapH = 660;

    const toScreenX = (wx) => mapLeft + ((wx + 340) / 680) * mapW;
    const toScreenY = (wz) => mapTop + ((wz + 340) / 680) * mapH;

    // 1. Land Base Background (Dark charcoal city ground, NOT all turquoise)
    ctx.fillStyle = '#1a202c'; // Dark slate charcoal terra
    ctx.fillRect(mapLeft, mapTop, mapW, mapH);

    // Ocean and Bay Water only in South/East coastal waters (Z > 220)
    const seaScreenY = toScreenY(225);
    ctx.fillStyle = '#143642'; // Deep water
    ctx.fillRect(mapLeft, seaScreenY, mapW, mapTop + mapH - seaScreenY);
    ctx.fillStyle = '#1fb5c9'; // Turquoise coastal surf
    ctx.fillRect(mapLeft, seaScreenY, mapW, 20);

    // 2. Distinctly Colored District Zones
    const districts = [
      { name: 'DOWNTOWN', color: '#2d3748', x1: -160, x2: 160, z1: -80, z2: 80 },
      { name: 'FLAMINGO PALMS', color: '#4a3b42', x1: -220, x2: -20, z1: 80, z2: 180 },
      { name: 'SEABREEZE BLVD & BEACH', color: '#3d5a6c', x1: -320, x2: 320, z1: 180, z2: 240 },
      { name: 'PORT OF CORAL VISTA', color: '#2f3e46', x1: -320, x2: -140, z1: -320, z2: -140 },
      { name: 'VISTA CAUSEWAY BRIDGE', color: '#39464e', x1: 180, x2: 340, z1: -220, z2: -180 }
    ];

    for (let d of districts) {
      const sx1 = toScreenX(d.x1);
      const sz1 = toScreenY(d.z1);
      const sx2 = toScreenX(d.x2);
      const sz2 = toScreenY(d.z2);

      ctx.fillStyle = d.color;
      ctx.fillRect(sx1, sz1, sx2 - sx1, sz2 - sz1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx1, sz1, sx2 - sx1, sz2 - sz1);
    }

    // Sand Beach Strip along Seabreeze Blvd
    const beachSx = toScreenX(-320);
    const beachSy = toScreenY(225);
    ctx.fillStyle = '#d4af37'; // Golden sand
    ctx.fillRect(beachSx, beachSy, toScreenX(320) - beachSx, 16);

    // 3. Road Network Grid
    ctx.strokeStyle = '#718096';
    ctx.lineWidth = 4;

    // East-West Roads
    [-200, -100, 0, 100, 200].forEach(z => {
      ctx.beginPath();
      ctx.moveTo(toScreenX(-300), toScreenY(z));
      ctx.lineTo(toScreenX(300), toScreenY(z));
      ctx.stroke();
    });

    // North-South Streets
    [-200, -100, 0, 100, 200].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), toScreenY(-210));
      ctx.lineTo(toScreenX(x), toScreenY(210));
      ctx.stroke();
    });

    // Causeway Bridge Road
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(toScreenX(180), toScreenY(-200));
    ctx.lineTo(toScreenX(340), toScreenY(-200));
    ctx.stroke();

    // 4. Trace GPS Route from Player to Current Mission
    const curM = MISSIONS[currentMissionId - 1] || MISSIONS[0];
    if (curM && curM.targetPos) {
      const plSx = toScreenX(playerPos.x || 20);
      const plSy = toScreenY(playerPos.z || 214);
      const tgtSx = toScreenX(curM.targetPos.x);
      const tgtSy = toScreenY(curM.targetPos.z);

      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#f1c40f'; // Glowing GPS Gold
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(plSx, plSy);
      ctx.lineTo(tgtSx, plSy);
      ctx.lineTo(tgtSx, tgtSy);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 5 Numbered Story Missions [1] to [5] with Non-Overlapping Pill Backgrounds
    const missionPills = [
      { id: 1, name: '1. Repossession', x: 24, z: 194, pillOffX: 18, pillOffY: -14 },
      { id: 2, name: '2. Heat Courier', x: 0, z: 40, pillOffX: 18, pillOffY: -14 },
      { id: 3, name: '3. Takedown', x: 240, z: -170, pillOffX: -130, pillOffY: 28 },
      { id: 4, name: '4. Port Ambush', x: -250, z: -220, pillOffX: 18, pillOffY: 16 },
      { id: 5, name: '5. Final Escape', x: 310, z: -230, pillOffX: -130, pillOffY: -28 }
    ];

    for (let mp of missionPills) {
      const sx = toScreenX(mp.x);
      const sy = toScreenY(mp.z);

      // Gold marker circle
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fillStyle = (mp.id === currentMissionId) ? '#e74c3c' : '#f39c12';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label Pill
      const px = sx + mp.pillOffX;
      const py = sy + mp.pillOffY;
      ctx.fillStyle = 'rgba(20, 24, 33, 0.9)';
      ctx.beginPath();
      ctx.roundRect(px, py - 12, 120, 20, 4);
      ctx.fill();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(mp.name, px + 6, py + 2);
    }

    // 6. POI Markers (Pill icons placed with zero street overlap)
    const pois = [
      { name: '+ Mercy Hosp', color: '#27ae60', x: -100, z: 65, offX: -95, offY: -8 },
      { name: '★ CVPD Precinct', color: '#2980b9', x: 100, z: 0, offX: 16, offY: -8 },
      { name: '$ Chop Shop', color: '#e67e22', x: -80, z: 80, offX: 16, offY: -8 },
      { name: 'T Coral Taxi', color: '#f1c40f', x: 80, z: 120, offX: 16, offY: -8 },
      { name: 'A Coral Arms', color: '#9b59b6', x: -40, z: -60, offX: 16, offY: -8 },
      { name: 'C Street Race', color: '#e74c3c', x: -140, z: 195, offX: -95, offY: -8 }
    ];

    for (let poi of pois) {
      const sx = toScreenX(poi.x);
      const sy = toScreenY(poi.z);

      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = poi.color;
      ctx.fill();

      // Label
      const lx = sx + poi.offX;
      const ly = sy + poi.offY;
      ctx.fillStyle = 'rgba(15, 18, 24, 0.85)';
      ctx.beginPath();
      ctx.roundRect(lx, ly - 10, 88, 18, 4);
      ctx.fill();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.textAlign = 'left';
      ctx.fillText(poi.name, lx + 6, ly + 3);
    }

    // Player GPS Marker
    const plx = toScreenX(playerPos.x || 20);
    const ply = toScreenY(playerPos.z || 214);
    ctx.beginPath();
    ctx.arc(plx, ply, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 7. Left Sidebar Panel (GPS Interface & Statistics)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, mapLeft, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, mapLeft, h);

    // Sidebar Title
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.fillText('CORAL VISTA GPS', 26, 48);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Autonomous Satellite Navigation v2.0', 26, 68);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26, 84);
    ctx.lineTo(mapLeft - 26, 84);
    ctx.stroke();

    // Story Progress Block
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STORY PROGRESS: 2 / 5', 26, 116);

    // Progress bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(26, 128, mapLeft - 52, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(26, 128, (mapLeft - 52) * 0.4, 10);

    // Statistics
    const statsY = 168;
    const stats = [
      ['Cash Available:', `$${cash.toLocaleString()}`],
      ['Current Zone:', 'Seabreeze Blvd'],
      ['Vehicles Stolen:', '4'],
      ['Wanted Level:', 'Clean (0★)'],
      ['Chop Shop Deliveries:', '1'],
      ['City Explored:', '68%']
    ];

    stats.forEach(([k, v], idx) => {
      const y = statsY + idx * 26;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(k, 26, y);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText(v, mapLeft - 26, y);
      ctx.textAlign = 'left';
    });

    // Complete Legend Box
    const legY = 345;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(22, legY, mapLeft - 44, 340, 8);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('MAP LEGEND & POIs', 36, legY + 26);

    const legendItems = [
      { col: '#00f0ff', label: 'Player Position (Rafa Sol)' },
      { col: '#f39c12', label: 'Story Mission [1 to 5]' },
      { col: '#f1c40f', label: '--- Dashed GPS Route' },
      { col: '#27ae60', label: '+ Mercy General Hospital' },
      { col: '#2980b9', label: '★ CVPD Central Precinct' },
      { col: '#e67e22', label: '$ Los Manta Chop Shop' },
      { col: '#f1c40f', label: 'T Coral Taxi Cab Depot' },
      { col: '#e74c3c', label: 'C Street Checkpoint Race' },
      { col: '#9b59b6', label: 'A Coral Arms Gun Store' },
      { col: '#3d5a6c', label: '■ Seabreeze Beach & Bay' }
    ];

    legendItems.forEach((item, idx) => {
      const y = legY + 54 + idx * 26;
      ctx.fillStyle = item.col;
      ctx.beginPath();
      ctx.arc(46, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(item.label, 62, y);
    });

    // Outer map frame
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(mapLeft, mapTop, mapW, mapH);
  }
}

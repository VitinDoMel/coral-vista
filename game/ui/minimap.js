import { X_ROADS, Z_ROADS, ROAD_WIDTH } from '../world/city.js';
import { CITY_POIS } from '../missions/missions.js';

export class MinimapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = 176;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.scale = 0.72; // pixels per world meter
  }

  render(state) {
    const ctx = this.ctx;
    const size = this.size;
    const half = size * 0.5;
    const scale = this.scale;

    const px = state.playerPos.x;
    const pz = state.playerPos.z;
    const yaw = state.cameraYaw || 0;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Circular clip
    ctx.beginPath();
    ctx.arc(half, half, half - 3, 0, Math.PI * 2);
    ctx.clip();

    // Base dark land fill
    ctx.fillStyle = '#1d2330';
    ctx.fillRect(0, 0, size, size);

    // Transform world coordinates relative to player and rotate with camera yaw
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(yaw);

    const toLocalX = (wx) => (wx - px) * scale;
    const toLocalY = (wz) => (wz - pz) * scale;

    // 1. Turquoise Sea only east of the beach (x > 198) and harbor basins (|z| > 245)
    ctx.fillStyle = '#12b3c2';
    ctx.fillRect(toLocalX(198), toLocalY(-700), 900 * scale, 1400 * scale);
    ctx.fillRect(toLocalX(-400), toLocalY(245), 900 * scale, 500 * scale);
    ctx.fillRect(toLocalX(-400), toLocalY(-745), 900 * scale, 500 * scale);

    // 2. Sandy Beach strip (x = 140..198)
    ctx.fillStyle = '#ecd18b';
    ctx.fillRect(toLocalX(140), toLocalY(-245), 58 * scale, 490 * scale);

    // 3. Starlight Key island & South Harbor pier
    ctx.fillStyle = '#2c3444';
    ctx.fillRect(toLocalX(290), toLocalY(-185), 55 * scale, 70 * scale);
    ctx.fillRect(toLocalX(-188), toLocalY(233), 240 * scale, 50 * scale);

    // 4. City road grid
    const roadPxW = ROAD_WIDTH * scale;
    ctx.fillStyle = '#566073';
    for (const rx of X_ROADS) {
      ctx.fillRect(
        toLocalX(rx - ROAD_WIDTH * 0.5),
        toLocalY(-233),
        roadPxW,
        466 * scale
      );
    }
    for (const rz of Z_ROADS) {
      ctx.fillRect(
        toLocalX(-188),
        toLocalY(rz - ROAD_WIDTH * 0.5),
        316 * scale,
        roadPxW
      );
    }

    // Coral Bay Bridge span (z = -150, x = 128..292)
    ctx.fillStyle = '#707b8f';
    ctx.fillRect(
      toLocalX(128),
      toLocalY(-150 - ROAD_WIDTH * 0.5),
      164 * scale,
      roadPxW
    );

    // Subtle yellow road centerlines on minimap
    ctx.strokeStyle = 'rgba(247, 197, 49, 0.55)';
    ctx.lineWidth = 1.1;
    for (const rx of X_ROADS) {
      ctx.beginPath();
      ctx.moveTo(toLocalX(rx), toLocalY(-230));
      ctx.lineTo(toLocalX(rx), toLocalY(230));
      ctx.stroke();
    }
    for (const rz of Z_ROADS) {
      ctx.beginPath();
      ctx.moveTo(toLocalX(-185), toLocalY(rz));
      ctx.lineTo(toLocalX(125), toLocalY(rz));
      ctx.stroke();
    }

    // 5. GPS dashed route to active mission objective
    if (state.objectivePos) {
      ctx.strokeStyle = '#ff9f43';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(toLocalX(state.objectivePos.x), toLocalY(state.objectivePos.z));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. POI blips (Coral Arms, Hospital, CVPD)
    for (const poi of CITY_POIS) {
      const bx = toLocalX(poi.x);
      const by = toLocalY(poi.z);
      if (bx * bx + by * by > (half - 12) ** 2) continue;
      ctx.fillStyle = poi.color;
      ctx.beginPath();
      ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Traffic blips
    if (state.trafficEntries) {
      ctx.fillStyle = 'rgba(215, 225, 240, 0.65)';
      for (const entry of state.trafficEntries) {
        const bx = toLocalX(entry.vehicle.position.x);
        const by = toLocalY(entry.vehicle.position.z);
        if (bx * bx + by * by > (half - 10) ** 2) continue;
        ctx.fillRect(bx - 1.8, by - 1.8, 3.6, 3.6);
      }
    }

    // 8. Police cruiser blips (flashing red/blue)
    if (state.policeCruisers) {
      const isRedPhase = Math.floor(performance.now() / 250) % 2 === 0;
      for (const cruiser of state.policeCruisers) {
        const bx = toLocalX(cruiser.position.x);
        const by = toLocalY(cruiser.position.z);
        ctx.fillStyle = isRedPhase ? '#ff2a38' : '#2684ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx, by, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 9. Mission target blip (clamped to radar edge if far)
    if (state.objectivePos) {
      let tx = toLocalX(state.objectivePos.x);
      let ty = toLocalY(state.objectivePos.z);
      const dist = Math.hypot(tx, ty);
      const maxR = half - 13;
      if (dist > maxR) {
        tx = (tx / dist) * maxR;
        ty = (ty / dist) * maxR;
      }
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#11161f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // 10. Player directional triangle in center
    ctx.save();
    ctx.translate(half, half);
    ctx.fillStyle = '#ff6b5b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(5.8, 6.2);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-5.8, 6.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Outer circular ring & North badge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(half, half, half - 3, 0, Math.PI * 2);
    ctx.stroke();

    // North 'N' indicator orbiting ring
    const northAngle = -Math.PI * 0.5 + yaw;
    const nx = half + Math.cos(northAngle) * (half - 12);
    const ny = half + Math.sin(northAngle) * (half - 12);
    ctx.fillStyle = '#111622';
    ctx.beginPath();
    ctx.arc(nx, ny, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny + 0.5);
  }
}

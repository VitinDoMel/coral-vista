// In-Game 2D HUD: Circular Minimap, Health/Armor bars >= 10px, Speedometer, Cash, Stars, Weapon

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth || 1280;
    this.canvas.height = window.innerHeight || 720;
  }

  render(player, vehicle, wanted, combat, missions, isTitle = false) {
    if (isTitle) return; // Spec requirement: Hide HUD on title screen!

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Top-Right: Cash, Wanted Stars, Weapon & Ammo
    this._drawTopRight(ctx, w, missions.cash, wanted.stars, wanted.isFlashing, combat);

    // 2. Bottom-Left: Circular Minimap, Compass, and Status Bars (≥ 10px height)
    this._drawMinimapAndBars(ctx, h, player, vehicle, missions);

    // 3. Top-Center / Left: Current Mission Objective Banner
    this._drawMissionBanner(ctx, w, missions);

    // 4. Center-Bottom: Active Dialogue Subtitles
    if (missions.activeDialogue) {
      this._drawDialogue(ctx, w, h, missions.activeDialogue);
    }

    // 5. Sun-Soaked Warm Vignette Post-Processing
    this._drawWarmVignette(ctx, w, h);
  }

  _drawWarmVignette(ctx, w, h) {
    ctx.save();
    const rx = w * 0.5;
    const ry = h * 0.5;
    const grad = ctx.createRadialGradient(rx, ry, Math.min(rx, ry) * 0.65, rx, ry, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(255, 160, 90, 0.05)');
    grad.addColorStop(1, 'rgba(15, 8, 4, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  _drawTopRight(ctx, w, cash, stars, isFlashing, combat) {
    ctx.save();

    // Cash Display: Glowing Emerald Green
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(`$${cash.toLocaleString()}`, w - 34, 40);
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`$${cash.toLocaleString()}`, w - 36, 38);

    // 5 Wanted Stars: Dedicated line 32px below cash (y = 70)
    const starY = 70;
    for (let i = 0; i < 5; i++) {
      const starX = w - 162 + i * 26;
      const isLit = (i < stars);
      const flashHide = isFlashing && Math.floor(Date.now() / 250) % 2 === 0;

      ctx.font = '22px Arial, sans-serif';
      if (isLit && !flashHide) {
        ctx.fillStyle = '#f1c40f'; // Gold star
        ctx.fillText('★', starX, starY);
      } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.45)'; // Dim hollow star
        ctx.fillText('☆', starX, starY);
      }
    }

    // Current Weapon and Ammo: 32px below stars (y = 102)
    const wpn = combat.weapons[combat.currentWeapon];
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    const ammoStr = (wpn.ammo === Infinity) ? '∞' : `${wpn.ammo}`;
    ctx.fillText(`${wpn.name.toUpperCase()}  [ ${ammoStr} ]`, w - 36, 102);

    ctx.restore();
  }

  _drawMinimapAndBars(ctx, h, player, vehicle, missions) {
    ctx.save();

    const mmX = 96;
    const mmY = h - 96;
    const mmR = 64;

    // Minimap Circular Clip & Border
    ctx.save();
    ctx.beginPath();
    ctx.arc(mmX, mmY, mmR, 0, Math.PI * 2);
    ctx.fillStyle = '#111722';
    ctx.fill();
    ctx.clip();

    // Local Map Drawing (North-Up GPS view)
    const px = player.position ? player.position.x : 0;
    const pz = player.position ? player.position.z : 0;
    const scale = 1.1; // 1.1 pixels per meter

    // 1. Sea & Beach if visible in minimap radius
    // Beach starts at z = 215, Sea at z = 225
    const beachSy = mmY + (215 - pz) * scale;
    const seaSy = mmY + (225 - pz) * scale;
    if (beachSy < mmY + mmR) {
      ctx.fillStyle = '#d4af37'; // Golden sand beach
      ctx.fillRect(mmX - mmR, Math.max(mmY - mmR, beachSy), mmR * 2, mmR * 2);
    }
    if (seaSy < mmY + mmR) {
      ctx.fillStyle = '#1fb5c9'; // Turquoise sea
      ctx.fillRect(mmX - mmR, Math.max(mmY - mmR, seaSy), mmR * 2, mmR * 2);
    }

    // 2. City Road Grid Lines
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 7;
    // Seabreeze Blvd and EW avenues
    [-200, -100, 0, 100, 200].forEach(z => {
      const ry = mmY + (z - pz) * scale;
      if (ry >= mmY - mmR - 10 && ry <= mmY + mmR + 10) {
        ctx.beginPath();
        ctx.moveTo(mmX - mmR, ry);
        ctx.lineTo(mmX + mmR, ry);
        ctx.stroke();
      }
    });
    // N-S Streets
    [-200, -100, 0, 100, 200].forEach(x => {
      const rx = mmX + (x - px) * scale;
      if (rx >= mmX - mmR - 10 && rx <= mmX + mmR + 10) {
        ctx.beginPath();
        ctx.moveTo(rx, mmY - mmR);
        ctx.lineTo(rx, mmY + mmR);
        ctx.stroke();
      }
    });

    // 3. Mission target blip on radar
    const m = missions.getCurrentMission();
    if (m && m.targetPos) {
      const relX = (m.targetPos.x - px) * scale;
      const relZ = (m.targetPos.z - pz) * scale;
      const dist = Math.hypot(relX, relZ);
      const clampR = Math.min(dist, mmR - 8);
      const blipX = mmX + (relX / (dist || 1)) * clampR;
      const blipY = mmY + (relZ / (dist || 1)) * clampR;

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(blipX, blipY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Player Direction Arrow (Centered, rotating with player yaw)
    ctx.save();
    ctx.translate(mmX, mmY);
    ctx.rotate(player.yaw);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end clip

    // Minimap Outer Ring
    ctx.beginPath();
    ctx.arc(mmX, mmY, mmR, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();

    // Compass 'N'
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'center';
    ctx.fillText('N', mmX, mmY - mmR - 6);

    // Health & Armor Bars (Height: 12px >= 10px requirement!)
    const barX = mmX + mmR + 18;
    const barW = 140;
    const barH = 12;

    // Health Bar (Red/Green)
    const hpY = mmY - 14;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, hpY, barW, barH);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(barX, hpY, barW * (player.health / 100), barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, hpY, barW, barH);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`+ HP ${player.health}`, barX + 6, hpY + 10);

    // Armor Bar (Cyan/Blue)
    const armY = mmY + 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, armY, barW, barH);
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(barX, armY, barW * (player.armor / 100), barH);
    ctx.strokeRect(barX, armY, barW, barH);

    ctx.fillText(`🛡 ARMOR ${player.armor}`, barX + 6, armY + 10);

    // Speedometer (When inside vehicle)
    if (vehicle.playerVehicle) {
      const spdKmh = Math.floor(Math.abs(vehicle.playerVehicle.controller.speed) * 3.6);
      const spdY = armY + 24;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.fillText(`⚡ ${spdKmh} KM/H`, barX + 6, spdY);
    }

    ctx.restore();
  }

  _drawMissionBanner(ctx, w, missions) {
    const m = missions.getCurrentMission();
    if (!m) return;

    ctx.save();
    const bannerW = 440;
    const bannerH = 46;
    const bannerX = 24;
    const bannerY = 24;

    ctx.fillStyle = 'rgba(15, 20, 28, 0.82)';
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.fillText(`MISSION ${m.id}: ${m.title.toUpperCase()}`, bannerX + 14, bannerY + 18);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText(m.desc, bannerX + 14, bannerY + 36);

    ctx.restore();
  }

  _drawDialogue(ctx, w, h, dialogue) {
    ctx.save();
    const boxW = Math.min(680, w - 80);
    const boxH = 58;
    const boxX = (w - boxW) * 0.5;
    const boxY = h - 140;

    ctx.fillStyle = 'rgba(10, 14, 20, 0.88)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'left';
    ctx.fillText(dialogue.speaker.toUpperCase(), boxX + 16, boxY + 20);

    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dialogue.text, boxX + 16, boxY + 42);

    ctx.restore();
  }
}

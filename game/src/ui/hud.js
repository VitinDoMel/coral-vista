// Game HUD: circular minimap, health/armor bars, speedometer, wanted stars, cash, ammo, objective card, dialogues

export class HUD {
  constructor() {
    this.container = document.getElementById('ui-root');
    this.createElements();
  }

  show() { this.container.style.display = 'block'; }
  hide() { this.container.style.display = 'none'; }

  createElements() {
    // Top Right: Wanted Stars, Cash, Ammo
    this.topRight = document.createElement('div');
    this.topRight.style.cssText = 'position:fixed;top:18px;right:22px;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-family:monospace,sans-serif;pointer-events:none;z-index:50;';
    this.container.appendChild(this.topRight);

    this.starsEl = document.createElement('div');
    this.starsEl.style.cssText = 'font-size:26px;letter-spacing:3px;color:#ffd700;text-shadow:0 0 8px rgba(0,0,0,0.9);';
    this.topRight.appendChild(this.starsEl);

    this.cashEl = document.createElement('div');
    this.cashEl.style.cssText = 'font-size:28px;font-weight:900;color:#2ecc71;text-shadow:0 0 6px #000;letter-spacing:1px;';
    this.topRight.appendChild(this.cashEl);

    this.weaponEl = document.createElement('div');
    this.weaponEl.style.cssText = 'font-size:16px;font-weight:bold;color:#ffffff;background:rgba(20,25,35,0.7);padding:4px 10px;border-radius:4px;border-left:3px solid #ff5722;';
    this.topRight.appendChild(this.weaponEl);

    // Bottom Left: Minimap, Health/Armor Bars, Speedometer
    this.bottomLeft = document.createElement('div');
    this.bottomLeft.style.cssText = 'position:fixed;bottom:20px;left:20px;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;z-index:50;';
    this.container.appendChild(this.bottomLeft);

    // Canvas Minimap
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 160;
    this.minimapCanvas.height = 160;
    this.minimapCanvas.style.cssText = 'width:160px;height:160px;border-radius:50%;border:3px solid rgba(255,255,255,0.85);background:#182028;box-shadow:0 4px 14px rgba(0,0,0,0.65);';
    this.bottomLeft.appendChild(this.minimapCanvas);
    this.ctx = this.minimapCanvas.getContext('2d');

    // Health and Armor Bar Container with Icons
    const barsContainer = document.createElement('div');
    barsContainer.style.cssText = 'width:160px;display:flex;flex-direction:column;gap:4px;';
    this.bottomLeft.appendChild(barsContainer);

    // Health Bar (with ❤️ icon)
    const hpRow = document.createElement('div');
    hpRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const hpIcon = document.createElement('span');
    hpIcon.textContent = '❤️';
    hpIcon.style.cssText = 'font-size:11px;line-height:1;';
    this.healthBarBg = document.createElement('div');
    this.healthBarBg.style.cssText = 'flex:1;height:11px;background:rgba(0,0,0,0.7);border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.25);';
    this.healthBar = document.createElement('div');
    this.healthBar.style.cssText = 'width:100%;height:100%;background:#2ecc71;transition:width 0.15s ease;';
    this.healthBarBg.appendChild(this.healthBar);
    hpRow.appendChild(hpIcon);
    hpRow.appendChild(this.healthBarBg);
    barsContainer.appendChild(hpRow);

    // Armor Bar (with 🛡️ icon)
    const armorRow = document.createElement('div');
    armorRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const armorIcon = document.createElement('span');
    armorIcon.textContent = '🛡️';
    armorIcon.style.cssText = 'font-size:11px;line-height:1;';
    this.armorBarBg = document.createElement('div');
    this.armorBarBg.style.cssText = 'flex:1;height:11px;background:rgba(0,0,0,0.7);border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.25);';
    this.armorBar = document.createElement('div');
    this.armorBar.style.cssText = 'width:100%;height:100%;background:#00bcd4;transition:width 0.15s ease;';
    this.armorBarBg.appendChild(this.armorBar);
    armorRow.appendChild(armorIcon);
    armorRow.appendChild(this.armorBarBg);
    barsContainer.appendChild(armorRow);

    // Vehicle Speedometer
    this.speedoRow = document.createElement('div');
    this.speedoRow.style.cssText = 'width:160px;display:none;justify-content:space-between;align-items:center;background:rgba(18,22,30,0.85);padding:3px 8px;border-radius:4px;box-sizing:border-box;border:1px solid rgba(255,215,0,0.4);';
    this.speedoLabel = document.createElement('span');
    this.speedoLabel.textContent = 'SPEED';
    this.speedoLabel.style.cssText = 'font-size:11px;font-weight:bold;color:#ff9800;';
    this.speedoVal = document.createElement('span');
    this.speedoVal.style.cssText = 'font-size:13px;font-weight:900;color:#ffd700;font-family:monospace;';
    this.speedoRow.appendChild(this.speedoLabel);
    this.speedoRow.appendChild(this.speedoVal);
    this.bottomLeft.appendChild(this.speedoRow);

    // Mission Objective Card (Top Left)
    this.objectiveCard = document.createElement('div');
    this.objectiveCard.style.cssText = 'position:fixed;top:18px;left:20px;background:rgba(18,22,30,0.85);border-left:4px solid #ffd700;padding:10px 16px;border-radius:0 6px 6px 0;color:#ffffff;font-size:14px;max-width:380px;box-shadow:0 2px 10px rgba(0,0,0,0.5);z-index:50;pointer-events:none;';
    this.objectiveTitle = document.createElement('div');
    this.objectiveTitle.style.cssText = 'font-weight:bold;color:#ffd700;font-size:15px;margin-bottom:2px;text-transform:uppercase;';
    this.objectiveDesc = document.createElement('div');
    this.objectiveDesc.style.cssText = 'color:#e0e0e0;font-size:13px;line-height:1.35;';
    this.objectiveCard.appendChild(this.objectiveTitle);
    this.objectiveCard.appendChild(this.objectiveDesc);
    this.container.appendChild(this.objectiveCard);

    // Story Dialogue Subtitle Box (Bottom Center)
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(12,14,20,0.92);border:1px solid rgba(255,120,80,0.55);border-radius:8px;padding:12px 20px;max-width:620px;width:90%;color:#ffffff;font-size:14.5px;box-shadow:0 4px 18px rgba(0,0,0,0.8);z-index:55;display:none;pointer-events:none;';
    this.dialogueSpeaker = document.createElement('div');
    this.dialogueSpeaker.style.cssText = 'font-weight:900;color:#ff7043;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;';
    this.dialogueText = document.createElement('div');
    this.dialogueText.style.cssText = 'color:#f5f5f5;line-height:1.4;';
    this.dialogueBox.appendChild(this.dialogueSpeaker);
    this.dialogueBox.appendChild(this.dialogueText);
    this.container.appendChild(this.dialogueBox);

    // Notification Ticker
    this.notifyBox = document.createElement('div');
    this.notifyBox.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:rgba(220,50,40,0.9);color:#ffffff;font-weight:bold;font-size:14px;letter-spacing:1px;padding:6px 18px;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,0.6);opacity:0;transition:opacity 0.3s ease;z-index:60;pointer-events:none;';
    this.container.appendChild(this.notifyBox);

    // Shop prompt hint
    this.shopPrompt = document.createElement('div');
    this.shopPrompt.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(0,150,80,0.9);color:#ffffff;padding:8px 16px;border-radius:6px;font-size:13px;display:none;z-index:55;pointer-events:none;';
    this.shopPrompt.innerHTML = 'CORAL PLAZA SHOP: [E] Ammo $50 | [3] Armor $150 | [4] Repair $200';
    this.container.appendChild(this.shopPrompt);
  }

  showNotification(text) {
    this.notifyBox.textContent = text;
    this.notifyBox.style.opacity = '1';
    clearTimeout(this.notifyTimer);
    this.notifyTimer = setTimeout(() => { this.notifyBox.style.opacity = '0'; }, 2800);
  }

  showShopPrompt(show) { this.shopPrompt.style.display = show ? 'block' : 'none'; }

  update(player, wantedSystem, missionManager, policeManager, combat) {
    this.healthBar.style.width = `${Math.max(0, player.health)}%`;
    this.armorBar.style.width = `${Math.max(0, player.armor)}%`;

    // Speedometer
    if (player.inVehicle && player.currentVehicle) {
      this.speedoRow.style.display = 'flex';
      const kmh = player.currentVehicle.getSpeedKmh ? player.currentVehicle.getSpeedKmh() : Math.round(Math.abs(player.currentVehicle.speed) * 3.6);
      this.speedoVal.textContent = `${kmh} KM/H`;
    } else {
      this.speedoRow.style.display = 'none';
    }

    // Cash
    const cashStr = '$' + player.money.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false });
    this.cashEl.textContent = cashStr;

    // Wanted Stars
    const stars = wantedSystem.stars;
    const isBlinking = wantedSystem.isEvading && (Math.floor(Date.now() / 250) % 2 === 0);
    let starStr = '';
    for (let i = 0; i < 5; i++) {
      starStr += (i < stars) ? (isBlinking ? '☆' : '★') : ' ';
    }
    this.starsEl.textContent = starStr.trim() ? starStr : '';

    // Weapon & Ammo
    if (combat && combat.currentWeapon === 'pistol') {
      const weapon = combat.weapons.pistol;
      this.weaponEl.textContent = `9mm PISTOL [ ${weapon.ammo} ]`;
    } else {
      this.weaponEl.textContent = 'FISTS';
    }

    // Objective Card
    const curMission = missionManager.getCurrentMission();
    if (curMission && missionManager.state === 'active') {
      this.objectiveCard.style.display = 'block';
      this.objectiveTitle.textContent = curMission.title;
      let text = curMission.instruction;
      if (curMission.timeLimit) {
        text += ` [ ${Math.ceil(missionManager.timer)}s ]`;
      }
      this.objectiveDesc.textContent = text;
    } else {
      this.objectiveCard.style.display = 'none';
    }

    // Dialogue Subtitles
    if (missionManager.activeDialogue) {
      this.dialogueBox.style.display = 'block';
      this.dialogueSpeaker.textContent = missionManager.activeDialogue.speaker;
      this.dialogueText.textContent = `"${missionManager.activeDialogue.text}"`;
    } else {
      this.dialogueBox.style.display = 'none';
    }

    this.renderMinimap(player, missionManager, policeManager);
  }

  renderMinimap(player, missionManager, policeManager) {
    const ctx = this.ctx;
    const w = 160;
    const h = 160;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.55;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 76, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#161d24';
    ctx.fillRect(0, 0, w, h);
    ctx.translate(cx, cy);

    const px = player.position.x;
    const pz = player.position.z;

    // Ocean coast on the West
    const oceanMapX = (-135 - px) * scale;
    ctx.fillStyle = '#00acc1';
    ctx.fillRect(oceanMapX - 200, -200, 200, 400);

    // Beach strip
    const beachMapX = (-96 - px) * scale;
    ctx.fillStyle = '#f4d06f';
    ctx.fillRect(oceanMapX, -200, beachMapX - oceanMapX, 400);

    // Roads (Ocean Blvd and grid)
    ctx.strokeStyle = '#42464f';
    ctx.lineWidth = 10 * scale;

    const nsAvenues = [-85, -40, 10, 60, 110, 160];
    for (const ax of nsAvenues) {
      const rx = (ax - px) * scale;
      ctx.beginPath();
      ctx.moveTo(rx, -200);
      ctx.lineTo(rx, 200);
      ctx.stroke();
    }

    const ewStreets = [-120, -70, -20, 30, 80, 130];
    for (const sz of ewStreets) {
      const rz = (sz - pz) * scale;
      ctx.beginPath();
      ctx.moveTo(-200, rz);
      ctx.lineTo(200, rz);
      ctx.stroke();
    }

    // Mission Waypoint
    const mission = missionManager.getCurrentMission();
    if (mission && mission.target && missionManager.state === 'active') {
      const tx = (mission.target.x - px) * scale;
      const tz = (mission.target.z - pz) * scale;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(tx, tz, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police Blips
    if (policeManager) {
      for (const cop of policeManager.cruisers) {
        const cxp = (cop.position.x - px) * scale;
        const czp = (cop.position.z - pz) * scale;
        ctx.fillStyle = Math.sin(Date.now() * 0.01) > 0 ? '#ff1744' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(cxp, czp, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Center Player Arrow
    ctx.save();
    ctx.translate(cx, cy);
    const arrowYaw = player.inVehicle && player.currentVehicle ? player.currentVehicle.yaw : player.yaw;
    ctx.rotate(-arrowYaw + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

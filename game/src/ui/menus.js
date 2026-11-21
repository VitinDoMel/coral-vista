// Game menus: Title Screen, Pause Menu, Full-Screen City Map, Controls modal

export class MenuManager {
  constructor(game, storage) {
    this.game = game;
    this.storage = storage;

    this.isPaused = false;
    this.isMapOpen = false;
    this.isTitleOpen = true;

    this.createTitleMenu();
    this.createPauseMenu();
    this.createLargeMap();
    this.bindEvents();
  }

  createTitleMenu() {
    this.titleRoot = document.createElement('div');
    this.titleRoot.id = 'title-screen';
    this.titleRoot.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 40%, rgba(20, 10, 30, 0.45) 0%, rgba(10, 5, 20, 0.88) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 150;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    this.titleRoot.innerHTML = `
      <div style="text-align: center; margin-bottom: 34px;">
        <h1 style="font-size: 72px; font-weight: 900; letter-spacing: 6px; margin: 0; background: linear-gradient(135deg, #ff8a65 0%, #ffd54f 60%, #ff4081 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8));">HEATWAVE</h1>
        <div style="font-size: 22px; font-weight: 700; letter-spacing: 8px; color: #00e5ff; text-transform: uppercase; margin-top: 6px; text-shadow: 0 0 10px rgba(0,229,255,0.7);">CORAL VISTA</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px; width: 280px;">
        <button id="btn-start" style="padding: 14px 24px; font-size: 16px; font-weight: bold; letter-spacing: 1.5px; background: #e04c3c; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 14px rgba(224,76,60,0.5); transition: transform 0.15s ease;">NEW GAME</button>
        <button id="btn-continue" style="padding: 14px 24px; font-size: 16px; font-weight: bold; letter-spacing: 1.5px; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.4); border-radius: 6px; cursor: pointer; transition: background 0.2s ease;">CONTINUE</button>
        <button id="btn-controls" style="padding: 12px 24px; font-size: 14px; font-weight: bold; letter-spacing: 1.5px; background: transparent; color: #ddd; border: 1px solid rgba(255,255,255,0.25); border-radius: 6px; cursor: pointer;">CONTROLS</button>
      </div>
    `;

    document.body.appendChild(this.titleRoot);

    document.getElementById('btn-start').onclick = () => {
      this.closeTitleMenu();
      this.game.startNewGame();
    };

    document.getElementById('btn-continue').onclick = () => {
      this.closeTitleMenu();
      this.game.loadGame();
    };

    document.getElementById('btn-controls').onclick = () => {
      alert('CONTROLS:\nWASD - Move / Drive\nSHIFT - Sprint\nSPACE - Jump / Handbrake\nF / E - Enter/Exit Vehicle & Interact\nRIGHT CLICK - Aim Pistol\nLEFT CLICK - Punch / Shoot\nM - Full City Map\nESC - Pause Menu\n1 / 2 - Switch Weapons');
    };
  }

  closeTitleMenu() {
    this.isTitleOpen = false;
    this.titleRoot.style.display = 'none';
  }

  createPauseMenu() {
    this.pauseRoot = document.createElement('div');
    this.pauseRoot.id = 'pause-menu';
    this.pauseRoot.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 12, 18, 0.85);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 140;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    this.pauseRoot.innerHTML = `
      <div style="font-size: 48px; font-weight: 900; letter-spacing: 4px; color: #ffd700; margin-bottom: 30px; text-shadow: 0 0 12px rgba(0,0,0,0.8);">GAME PAUSED</div>
      <div style="display: flex; flex-direction: column; gap: 12px; width: 260px;">
        <button id="pause-resume" style="padding: 12px; font-size: 15px; font-weight: bold; background: #e04c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">RESUME</button>
        <button id="pause-save" style="padding: 12px; font-size: 15px; font-weight: bold; background: rgba(255,255,255,0.18); color: white; border: none; border-radius: 4px; cursor: pointer;">SAVE GAME</button>
        <button id="pause-load" style="padding: 12px; font-size: 15px; font-weight: bold; background: rgba(255,255,255,0.18); color: white; border: none; border-radius: 4px; cursor: pointer;">LOAD GAME</button>
        <button id="pause-title" style="padding: 12px; font-size: 15px; font-weight: bold; background: transparent; color: #bbb; border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; cursor: pointer;">MAIN MENU</button>
      </div>
    `;

    document.body.appendChild(this.pauseRoot);

    document.getElementById('pause-resume').onclick = () => this.togglePause();
    document.getElementById('pause-save').onclick = () => {
      this.game.saveGame();
      alert('Game Saved Successfully to localStorage!');
    };
    document.getElementById('pause-load').onclick = () => {
      this.game.loadGame();
      this.togglePause();
    };
    document.getElementById('pause-title').onclick = () => {
      this.togglePause();
      this.titleRoot.style.display = 'flex';
      this.isTitleOpen = true;
    };
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseRoot.style.display = this.isPaused ? 'flex' : 'none';
  }

  createLargeMap() {
    this.mapRoot = document.createElement('div');
    this.mapRoot.id = 'large-map-view';
    this.mapRoot.style.cssText = `
      position: fixed;
      inset: 0;
      background: #141a22;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 130;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
    `;

    this.mapRoot.innerHTML = `
      <div style="font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #00e5ff; margin-bottom: 12px; text-transform: uppercase;">CORAL VISTA CITY MAP</div>
      <canvas id="large-map-canvas" width="700" height="500" style="background: #19222c; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.8);"></canvas>
      <div style="display: flex; gap: 24px; margin-top: 14px; font-size: 13px; color: #ffffff;">
        <div><span style="color: #ffd700; font-weight: bold;">◆</span> Mission Objective</div>
        <div><span style="color: #00e676; font-weight: bold;">✚</span> Gun / Armor Shop</div>
        <div><span style="color: #00bcd4; font-weight: bold;">■</span> Ocean & Beach</div>
        <div><span style="color: #ff5722; font-weight: bold;">▲</span> Player (Rafa Sol)</div>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #889;">PRESS [M] OR [ESC] TO CLOSE MAP</div>
    `;

    document.body.appendChild(this.mapRoot);
  }

  toggleMap() {
    this.isMapOpen = !this.isMapOpen;
    this.mapRoot.style.display = this.isMapOpen ? 'flex' : 'none';
    if (this.isMapOpen) {
      this.drawLargeMap();
    }
  }

  drawLargeMap() {
    const canvas = document.getElementById('large-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e2832';
    ctx.fillRect(0, 0, w, h);

    // Coordinate mapping: world is roughly [-200 to 200] in X and Z
    const toMapX = (x) => ((x + 220) / 440) * w;
    const toMapY = (z) => ((z + 220) / 440) * h;

    // Ocean on West
    const oceanBorderX = toMapX(-118);
    ctx.fillStyle = '#00acc1';
    ctx.fillRect(0, 0, oceanBorderX, h);

    // Beach sand
    const beachBorderX = toMapX(-96);
    ctx.fillStyle = '#f4d06f';
    ctx.fillRect(oceanBorderX, 0, beachBorderX - oceanBorderX, h);

    // District Labels
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('OCEAN DRIVE & BEACH', toMapX(-112), toMapY(80));
    ctx.fillText('DOWNTOWN CORAL VISTA', toMapX(-30), toMapY(-40));
    ctx.fillText('FLAMINGO PALMS', toMapX(75), toMapY(-30));
    ctx.fillText('PORT OF CORAL VISTA', toMapX(85), toMapY(120));
    ctx.fillText('VISTA CAUSEWAY BRIDGE', toMapX(-60), toMapY(-175));

    // Roads (North-South avenues)
    ctx.strokeStyle = '#5a626d';
    ctx.lineWidth = 4;
    const nsAvenues = [-85, -40, 10, 60, 110, 160];
    for (const ax of nsAvenues) {
      ctx.beginPath();
      ctx.moveTo(toMapX(ax), toMapY(-200));
      ctx.lineTo(toMapX(ax), toMapY(200));
      ctx.stroke();
    }

    // East-West streets
    const ewStreets = [-120, -70, -20, 30, 80, 130];
    for (const sz of ewStreets) {
      ctx.beginPath();
      ctx.moveTo(toMapX(-85), toMapY(sz));
      ctx.lineTo(toMapX(160), toMapY(sz));
      ctx.stroke();
    }

    // Shop marker
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(toMapX(-15), toMapY(-45), 7, 0, Math.PI * 2);
    ctx.fill();

    // Mission target diamond
    const mission = this.game.missions?.getCurrentMission();
    if (mission && mission.target) {
      const tx = toMapX(mission.target.x);
      const ty = toMapY(mission.target.z);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 9);
      ctx.lineTo(tx + 7, ty);
      ctx.lineTo(tx, ty + 9);
      ctx.lineTo(tx - 7, ty);
      ctx.closePath();
      ctx.fill();
    }

    // Player position arrow
    const px = toMapX(this.game.player.position.x);
    const py = toMapY(this.game.player.position.z);
    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.isMapOpen) {
          this.toggleMap();
        } else if (!this.isTitleOpen) {
          this.togglePause();
        }
      }
      if (e.code === 'KeyM' && !this.isTitleOpen && !this.isPaused) {
        this.toggleMap();
      }
    });
  }
}

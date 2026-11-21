// Game menus: Title Screen, Pause Menu, Full-Screen City Map with District Zones & GPS Route

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
    this.titleRoot.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at 50% 40%, rgba(20,10,30,0.35) 0%, rgba(10,5,20,0.85) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:150;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    this.titleRoot.innerHTML = `
      <div style="text-align:center;margin-bottom:28px;">
        <h1 style="font-size:74px;font-weight:900;letter-spacing:6px;margin:0;background:linear-gradient(135deg, #ff8a65 0%, #ffd54f 60%, #ff4081 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.85));">HEATWAVE</h1>
        <div style="font-size:22px;font-weight:700;letter-spacing:8px;color:#00e5ff;text-transform:uppercase;margin-top:6px;text-shadow:0 0 10px rgba(0,229,255,0.7);">CORAL VISTA</div>
        <div style="font-size:13px;font-weight:600;letter-spacing:3px;color:#ffcc80;text-transform:uppercase;margin-top:8px;">A Coral Vista Crime Story</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;width:280px;">
        <button id="btn-start" style="padding:14px 24px;font-size:16px;font-weight:bold;letter-spacing:1.5px;background:#e04c3c;color:white;border:none;border-radius:6px;cursor:pointer;box-shadow:0 4px 14px rgba(224,76,60,0.5);">NEW GAME</button>
        <button id="btn-continue" style="padding:14px 24px;font-size:16px;font-weight:bold;letter-spacing:1.5px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:6px;cursor:pointer;">CONTINUE</button>
        <button id="btn-controls" style="padding:12px 24px;font-size:14px;font-weight:bold;letter-spacing:1.5px;background:transparent;color:#ddd;border:1px solid rgba(255,255,255,0.25);border-radius:6px;cursor:pointer;">CONTROLS</button>
      </div>
      <div style="position:absolute;bottom:24px;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:1px;">v1.0.0 • PRODUCED FOR MAKE.FUN COMPETITION • NO NETWORK REQUIRED</div>
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
      alert('CONTROLS:\nWASD - Move / Drive\nSHIFT - Sprint\nSPACE - Jump / Handbrake\nF / E - Enter/Exit Vehicle & Interact\nRIGHT CLICK - Aim Pistol\nLEFT CLICK - Punch / Shoot\nR - Toggle Radio Station\nM - Full City Map\nESC - Pause Menu\n1 / 2 - Switch Weapons');
    };
  }

  closeTitleMenu() {
    this.isTitleOpen = false;
    this.titleRoot.style.display = 'none';
    if (this.game.hud) this.game.hud.show();
  }

  createPauseMenu() {
    this.pauseRoot = document.createElement('div');
    this.pauseRoot.id = 'pause-menu';
    this.pauseRoot.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,18,0.85);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:140;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    this.pauseRoot.innerHTML = `
      <div style="font-size:46px;font-weight:900;letter-spacing:4px;color:#ffd700;margin-bottom:28px;text-shadow:0 0 12px rgba(0,0,0,0.8);">GAME PAUSED</div>
      <div style="display:flex;flex-direction:column;gap:12px;width:260px;">
        <button id="pause-resume" style="padding:12px;font-size:15px;font-weight:bold;background:#e04c3c;color:white;border:none;border-radius:4px;cursor:pointer;">RESUME</button>
        <button id="pause-save" style="padding:12px;font-size:15px;font-weight:bold;background:rgba(255,255,255,0.18);color:white;border:none;border-radius:4px;cursor:pointer;">SAVE GAME</button>
        <button id="pause-load" style="padding:12px;font-size:15px;font-weight:bold;background:rgba(255,255,255,0.18);color:white;border:none;border-radius:4px;cursor:pointer;">LOAD GAME</button>
        <button id="pause-title" style="padding:12px;font-size:15px;font-weight:bold;background:transparent;color:#bbb;border:1px solid rgba(255,255,255,0.25);border-radius:4px;cursor:pointer;">MAIN MENU</button>
      </div>
    `;

    document.body.appendChild(this.pauseRoot);
    document.getElementById('pause-resume').onclick = () => this.togglePause();
    document.getElementById('pause-save').onclick = () => { this.game.saveGame(); alert('Game Saved to localStorage!'); };
    document.getElementById('pause-load').onclick = () => { this.game.loadGame(); this.togglePause(); };
    document.getElementById('pause-title').onclick = () => { this.togglePause(); this.titleRoot.style.display = 'flex'; this.isTitleOpen = true; if (this.game.hud) this.game.hud.hide(); };
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseRoot.style.display = this.isPaused ? 'flex' : 'none';
  }

  createLargeMap() {
    this.mapRoot = document.createElement('div');
    this.mapRoot.id = 'large-map-view';
    this.mapRoot.style.cssText = 'position:fixed;inset:0;background:#0d1117;display:none;align-items:center;justify-content:center;z-index:130;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px;box-sizing:border-box;';

    this.mapRoot.innerHTML = `
      <div style="display:flex;gap:24px;background:#151b23;padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 32px rgba(0,0,0,0.85);max-width:1160px;width:100%;">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#00e5ff;margin-bottom:10px;text-transform:uppercase;">CORAL VISTA CITY MAP</div>
          <canvas id="large-map-canvas" width="680" height="500" style="background:#131820;border:2px solid rgba(0,229,255,0.3);border-radius:8px;"></canvas>
          <div style="margin-top:10px;font-size:12px;color:#789;">PRESS [M] OR [ESC] TO CLOSE MAP</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;color:#eee;font-size:13px;border-left:1px solid rgba(255,255,255,0.1);padding-left:20px;">
          <div style="border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:10px;">
            <div style="font-size:18px;font-weight:bold;color:#ffd700;">HEATWAVE: CORAL VISTA</div>
            <div style="font-size:12px;color:#ff9800;letter-spacing:1px;">STORY PROGRESS: <span id="map-prog">2 / 5</span> COMPLETED</div>
          </div>
          <div>
            <div style="font-weight:bold;color:#00e5ff;margin-bottom:4px;">ACTIVE OBJECTIVE</div>
            <div id="map-obj" style="background:rgba(0,0,0,0.4);padding:8px 12px;border-radius:6px;border-left:3px solid #ffd700;line-height:1.4;">Deliver sports car to Downtown Garage</div>
          </div>
          <div>
            <div style="font-weight:bold;color:#aaa;margin-bottom:6px;text-transform:uppercase;font-size:11px;letter-spacing:1px;">DISTRICTS & STORY MISSIONS</div>
            <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;">
              <div><span style="color:#ffd700;font-weight:bold;">[1]</span> Hot Wheels (Downtown Garage)</div>
              <div><span style="color:#ffd700;font-weight:bold;">[2]</span> Night Run (Ocean Boulevard)</div>
              <div><span style="color:#ffd700;font-weight:bold;">[3]</span> Turf Takedown (Marina/Beach)</div>
              <div><span style="color:#ffd700;font-weight:bold;">[4]</span> Causeway Courier (Bridge)</div>
              <div><span style="color:#ffd700;font-weight:bold;">[5]</span> Kingpin Heat (Flamingo Palms)</div>
            </div>
          </div>
          <div>
            <div style="font-weight:bold;color:#aaa;margin-bottom:6px;text-transform:uppercase;font-size:11px;letter-spacing:1px;">POINTS OF INTEREST</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
              <div><span style="color:#00e676;font-weight:bold;">✚</span> Gun / Armor Shop</div>
              <div><span style="color:#ff5252;font-weight:bold;">🏥</span> Mercy Hospital</div>
              <div><span style="color:#448aff;font-weight:bold;">🛡️</span> VCPD Headquarters</div>
              <div><span style="color:#ffd700;font-weight:bold;">🏁</span> Street Race Checkpoint</div>
              <div><span style="color:#ffeb3b;font-weight:bold;">🚕</span> Downtown Taxi Rank</div>
              <div><span style="color:#ff3d00;font-weight:bold;">▲</span> Player (Rafa Sol)</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.mapRoot);
  }

  toggleMap() {
    this.isMapOpen = !this.isMapOpen;
    this.mapRoot.style.display = this.isMapOpen ? 'flex' : 'none';
    if (this.isMapOpen) this.drawLargeMap();
  }

  drawPill(ctx, text, x, y, bg = 'rgba(15,20,30,0.85)', textColor = '#ffffff') {
    ctx.font = 'bold 11px sans-serif';
    const textW = ctx.measureText(text).width;
    const padX = 8;
    const h = 20;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - padX, y - 14, textW + padX * 2, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
  }

  drawLargeMap() {
    const canvas = document.getElementById('large-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const toMapX = (x) => ((x + 220) / 440) * w;
    const toMapY = (z) => ((z + 220) / 440) * h;

    // Distinct colored district base zones
    // Ocean Drive zone (Warm coastal tint)
    ctx.fillStyle = '#17282c';
    ctx.fillRect(toMapX(-96), 0, toMapX(-40) - toMapX(-96), h);

    // Downtown district (Deep navy)
    ctx.fillStyle = '#141e2e';
    ctx.fillRect(toMapX(-40), toMapY(-120), toMapX(60) - toMapX(-40), toMapY(30) - toMapY(-120));

    // Flamingo Palms district (Subtle palm emerald)
    ctx.fillStyle = '#16281e';
    ctx.fillRect(toMapX(60), toMapY(-120), toMapX(160) - toMapX(60), toMapY(50) - toMapY(-120));

    // Port of Coral Vista (Industrial slate)
    ctx.fillStyle = '#22252a';
    ctx.fillRect(toMapX(50), toMapY(50), toMapX(160) - toMapX(50), toMapY(200) - toMapY(50));

    // Ocean on West (Vibrant Turquoise)
    const oceanX = toMapX(-115);
    ctx.fillStyle = '#00acc1';
    ctx.fillRect(0, 0, oceanX, h);

    // Radiant Beach Sand
    const beachX = toMapX(-96);
    ctx.fillStyle = '#f4d06f';
    ctx.fillRect(oceanX, 0, beachX - oceanX, h);

    // Causeway Bridge on North
    ctx.fillStyle = '#2c3340';
    ctx.fillRect(toMapX(-40), toMapY(-210), toMapX(0) - toMapX(-40), toMapY(-160) - toMapY(-210));

    // Roads (North-South avenues)
    ctx.strokeStyle = '#4e5663';
    ctx.lineWidth = 5;
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

    // District Labels in clean pill badges
    this.drawPill(ctx, 'OCEAN DRIVE & BEACH', toMapX(-110), toMapY(75), '#0f2428', '#80deea');
    this.drawPill(ctx, 'DOWNTOWN CORAL VISTA', toMapX(-25), toMapY(-40), '#0d1d33', '#90caf9');
    this.drawPill(ctx, 'FLAMINGO PALMS', toMapX(75), toMapY(-35), '#0e2619', '#a5d6a7');
    this.drawPill(ctx, 'PORT OF CORAL VISTA', toMapX(75), toMapY(120), '#1a1d22', '#b0bec5');
    this.drawPill(ctx, 'VISTA CAUSEWAY BRIDGE', toMapX(-50), toMapY(-175), '#142338', '#81d4fa');

    // Numbered 5 Mission Markers
    const missions = [
      { id: 1, name: '1', x: -65, z: 5,   title: 'Hot Wheels' },
      { id: 2, name: '2', x: -85, z: 80,  title: 'Night Run' },
      { id: 3, name: '3', x: -85, z: -70, title: 'Turf Takedown' },
      { id: 4, name: '4', x: -20, z: -180, title: 'Causeway Courier' },
      { id: 5, name: '5', x: 110, z: -60, title: 'Kingpin Heat' },
    ];

    for (const m of missions) {
      const mx = toMapX(m.x);
      const my = toMapY(m.z);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(m.name, mx - 3, my + 3.5);
    }

    // Points of interest: Shop, Hospital, Police, Race
    this.drawPill(ctx, '✚ GUN SHOP', toMapX(-15), toMapY(-45), '#093318', '#00e676');
    this.drawPill(ctx, '🏥 MERCY HOSP.', toMapX(35), toMapY(-45), '#3a1114', '#ff5252');
    this.drawPill(ctx, '🛡️ VCPD CENTRAL', toMapX(10), toMapY(30), '#10223e', '#448aff');
    this.drawPill(ctx, '🏁 STREET RACE', toMapX(-85), toMapY(130), '#382f09', '#ffd700');

    // Dashed GPS route line between player and active mission
    const px = toMapX(this.game.player.position.x);
    const py = toMapY(this.game.player.position.z);
    const activeTarget = this.game.missions?.getCurrentMission()?.target;

    if (activeTarget) {
      const tx = toMapX(activeTarget.x);
      const ty = toMapY(activeTarget.z);
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tx, py);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }

    // Player position icon
    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.isMapOpen) this.toggleMap();
        else if (!this.isTitleOpen) this.togglePause();
      }
      if (e.code === 'KeyM' && !this.isTitleOpen && !this.isPaused) {
        this.toggleMap();
      }
    });
  }
}

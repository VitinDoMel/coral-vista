import { MinimapRenderer } from './minimap.js';
import { BigMapOverlay } from './bigMap.js';
import { SaveStorage } from '../engine/storage.js';

export class UIManager {
  constructor(uiRoot, callbacks = {}) {
    this.uiRoot = uiRoot;
    this.callbacks = callbacks;

    this.mode = 'gameplay'; // 'title' | 'gameplay' | 'paused' | 'map'

    this._buildGameplayHUD();
    this._buildTitleScreen();
    this._buildPauseMenu();
    this.bigMap = new BigMapOverlay(this.uiRoot);
  }

  _buildGameplayHUD() {
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'gameplay-hud';
    this.hudContainer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 15;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    // 1. Top-Left Mission Objective Panel (missão topo esq.)
    this.missionBox = document.createElement('div');
    this.missionBox.style.cssText = `
      position: absolute;
      top: 18px;
      left: 20px;
      max-width: 410px;
      background: rgba(14, 19, 30, 0.86);
      border-left: 4px solid #ff6b5b;
      border-radius: 8px;
      padding: 10px 15px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    `;
    this.missionTitleEl = document.createElement('div');
    this.missionTitleEl.style.cssText = `
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #ff877a;
      text-transform: uppercase;
      margin-bottom: 4px;
    `;
    this.missionObjEl = document.createElement('div');
    this.missionObjEl.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.35;
    `;
    this.missionBox.append(this.missionTitleEl, this.missionObjEl);
    this.hudContainer.appendChild(this.missionBox);

    // 2. Top-Right Status Cluster: Money -> Wanted Stars on line below -> Weapon
    this.topRightBox = document.createElement('div');
    this.topRightBox.style.cssText = `
      position: absolute;
      top: 16px;
      right: 22px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    `;

    // Money line (dinheiro topo dir.)
    this.moneyEl = document.createElement('div');
    this.moneyEl.style.cssText = `
      font-size: 28px;
      font-weight: 900;
      color: #38d979;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
      letter-spacing: 0.5px;
      line-height: 1.1;
    `;

    // Wanted stars on their own line below money (estrelas numa linha abaixo do dinheiro, vazias bem apagadas)
    this.starsRowEl = document.createElement('div');
    this.starsRowEl.style.cssText = `
      display: flex;
      gap: 4px;
      font-size: 25px;
      line-height: 1.05;
      padding: 2px 6px;
      background: rgba(14, 19, 30, 0.65);
      border-radius: 6px;
    `;
    this.starSpans = [];
    for (let i = 0; i < 5; i++) {
      const sp = document.createElement('span');
      sp.textContent = '★';
      this.starsRowEl.appendChild(sp);
      this.starSpans.push(sp);
    }

    // Weapon & Ammo card below stars
    this.weaponEl = document.createElement('div');
    this.weaponEl.style.cssText = `
      margin-top: 2px;
      background: rgba(14, 19, 30, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 7px;
      padding: 5px 12px;
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    `;

    this.topRightBox.append(this.moneyEl, this.starsRowEl, this.weaponEl);
    this.hudContainer.appendChild(this.topRightBox);

    // 3. Bottom-Left Cluster: Circular Minimap + Health & Armor Bars (>= 10px with icons)
    this.bottomLeftBox = document.createElement('div');
    this.bottomLeftBox.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: flex;
      align-items: flex-end;
      gap: 14px;
    `;

    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.style.cssText = `
      width: 176px;
      height: 176px;
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    `;
    this.minimapRenderer = new MinimapRenderer(this.minimapCanvas);

    // Health & Armor bars >= 10px height with icons
    this.vitalsBox = document.createElement('div');
    this.vitalsBox.style.cssText = `
      width: 175px;
      background: rgba(14, 19, 30, 0.86);
      border-radius: 9px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    `;

    this.healthBarFill = this._createVitalRow(this.vitalsBox, '♥ VIDA', '#ff5252', '100%');
    this.armorBarFill = this._createVitalRow(this.vitalsBox, '🛡 COLETE', '#38bdf8', '50%');

    this.bottomLeftBox.append(this.minimapCanvas, this.vitalsBox);
    this.hudContainer.appendChild(this.bottomLeftBox);

    // 4. Bottom-Right Speedometer (velocímetro when in vehicle)
    this.speedBox = document.createElement('div');
    this.speedBox.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 22px;
      width: 190px;
      background: rgba(14, 19, 30, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      padding: 10px 14px;
      display: none;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    `;
    this.vehicleNameEl = document.createElement('div');
    this.vehicleNameEl.style.cssText = `
      font-size: 11px;
      font-weight: 800;
      color: #ffd166;
      letter-spacing: 1px;
      text-transform: uppercase;
    `;
    this.speedValueEl = document.createElement('div');
    this.speedValueEl.style.cssText = `
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
      margin: 2px 0 6px 0;
    `;
    const speedTrack = document.createElement('div');
    speedTrack.style.cssText = `
      width: 100%;
      height: 11px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
    `;
    this.speedFillEl = document.createElement('div');
    this.speedFillEl.style.cssText = `
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, #20c997, #ffd166, #ff6b5b);
      border-radius: 6px;
    `;
    speedTrack.appendChild(this.speedFillEl);
    this.speedBox.append(this.vehicleNameEl, this.speedValueEl, speedTrack);
    this.hudContainer.appendChild(this.speedBox);

    // 5. Center Pistol Crosshair (mira da pistola)
    this.crosshairEl = document.createElement('div');
    this.crosshairEl.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 28px;
      height: 28px;
      transform: translate(-50%, -50%);
      display: none;
    `;
    this.crosshairEl.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="9" stroke="rgba(255,255,255,0.85)" stroke-width="1.6" fill="none" />
        <line x1="14" y1="1" x2="14" y2="7" stroke="#ff6b5b" stroke-width="2" />
        <line x1="14" y1="21" x2="14" y2="27" stroke="#ff6b5b" stroke-width="2" />
        <line x1="1" y1="14" x2="7" y2="14" stroke="#ff6b5b" stroke-width="2" />
        <line x1="21" y1="14" x2="27" y2="14" stroke="#ff6b5b" stroke-width="2" />
        <circle cx="14" cy="14" r="2" fill="#ffd166" />
      </svg>
    `;
    this.hudContainer.appendChild(this.crosshairEl);

    // 6. Bottom-Center Story Dialogue Box (caixa de diálogo — positioned clear of left vitals panel)
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.style.cssText = `
      position: absolute;
      bottom: 22px;
      left: 675px;
      transform: translateX(-50%);
      width: 510px;
      background: rgba(13, 18, 28, 0.92);
      border: 1.5px solid rgba(255, 209, 102, 0.55);
      border-radius: 10px;
      padding: 12px 18px;
      display: none;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65);
    `;
    this.dialogueSpeakerEl = document.createElement('div');
    this.dialogueSpeakerEl.style.cssText = `
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #2fd6c8;
      margin-bottom: 4px;
      text-transform: uppercase;
    `;
    this.dialogueTextEl = document.createElement('div');
    this.dialogueTextEl.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      line-height: 1.4;
    `;
    this.dialogueBox.append(this.dialogueSpeakerEl, this.dialogueTextEl);
    this.hudContainer.appendChild(this.dialogueBox);

    // 7. Top-Center Notification & Shop Interaction Prompt
    this.noticeBox = document.createElement('div');
    this.noticeBox.style.cssText = `
      position: absolute;
      top: 86px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 22, 34, 0.92);
      border: 1.5px solid #ffd166;
      border-radius: 8px;
      padding: 8px 18px;
      text-align: center;
      display: none;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    `;
    this.hudContainer.appendChild(this.noticeBox);

    this.uiRoot.appendChild(this.hudContainer);
  }

  _createVitalRow(parent, label, color, initText) {
    const wrapper = document.createElement('div');
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 800;
      color: #e2e8f0;
      margin-bottom: 3px;
    `;
    const titleSp = document.createElement('span');
    titleSp.textContent = label;
    const valSp = document.createElement('span');
    valSp.textContent = initText;
    header.append(titleSp, valSp);

    // Bar track height 13px (>= 10px per T4 spec)
    const track = document.createElement('div');
    track.style.cssText = `
      width: 100%;
      height: 13px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.14);
    `;
    const fill = document.createElement('div');
    fill.style.cssText = `
      width: 100%;
      height: 100%;
      background: ${color};
      border-radius: 5px;
    `;
    track.appendChild(fill);
    wrapper.append(header, track);
    parent.appendChild(wrapper);
    return { fill, valSp };
  }

  _buildTitleScreen() {
    this.titleOverlay = document.createElement('div');
    this.titleOverlay.id = 'title-screen-overlay';
    this.titleOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: none;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 46px 32px 26px 32px;
      background: radial-gradient(circle at center, rgba(15,20,32,0.18) 0%, rgba(10,14,24,0.68) 100%);
      pointer-events: auto;
      z-index: 35;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      margin-top: 28px;
      background: rgba(14, 19, 32, 0.86);
      border: 2px solid rgba(255, 159, 67, 0.65);
      border-radius: 16px;
      padding: 32px 44px;
      text-align: center;
      max-width: 620px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    `;

    card.innerHTML = `
      <div style="font-size:13px;font-weight:800;letter-spacing:3px;color:#2fd6c8;text-transform:uppercase;margin-bottom:6px;">
        CORAL VISTA OPEN-WORLD ACTION
      </div>
      <h1 style="font-size:48px;font-weight:900;letter-spacing:1.5px;color:#ffffff;text-shadow:0 4px 18px rgba(255,107,91,0.65);margin-bottom:8px;">
        HEATWAVE: CORAL VISTA
      </h1>
      <div style="font-size:16px;font-weight:600;color:#ffd166;margin-bottom:24px;">
        A Coral Vista crime story — Sol quente, dívidas frias e asfalto em chamas
      </div>
      <div style="display:flex;justify-content:center;gap:14px;margin-bottom:18px;">
        <button id="btn-new-game" style="padding:12px 26px;font-size:15px;font-weight:800;color:#0e131d;background:linear-gradient(135deg,#ff877a,#ff6b5b);border:none;border-radius:8px;cursor:pointer;">
          NOVO JOGO
        </button>
        <button id="btn-continue-game" style="padding:12px 24px;font-size:15px;font-weight:800;color:#ffffff;background:rgba(47,214,200,0.22);border:1.5px solid #2fd6c8;border-radius:8px;cursor:pointer;">
          CONTINUAR
        </button>
      </div>
      <div style="font-size:12px;color:#cbd5e1;line-height:1.6;background:rgba(255,255,255,0.05);padding:10px 14px;border-radius:8px;">
        <strong>CONTROLES:</strong> WASD Mover/Dirigir • SHIFT Correr • ESPAÇO Pular/Freio de Mão • F Entrar/Roubar Carro •
        MOUSE Mira/Tiro (1/2 Armas, R Recarregar) • G Loja Coral Arms • M Mapa Tático • ESC Pausa
      </div>
    `;

    const footer = document.createElement('div');
    footer.style.cssText = `
      font-size: 12px;
      font-weight: 700;
      color: rgba(241, 245, 249, 0.88);
      background: rgba(12, 16, 26, 0.78);
      padding: 7px 18px;
      border-radius: 20px;
      letter-spacing: 0.6px;
    `;
    footer.textContent =
      'HEATWAVE: Coral Vista v1.0 • Cidade, História e Personagens Originais (Rafa Sol & Nina Vega) • Three.js Engine';

    this.titleOverlay.append(card, footer);
    this.uiRoot.appendChild(this.titleOverlay);

    this.titleOverlay.querySelector('#btn-new-game').addEventListener('click', () => {
      this.setMode('gameplay');
      if (this.callbacks.onNewGame) this.callbacks.onNewGame();
    });
    this.titleOverlay.querySelector('#btn-continue-game').addEventListener('click', () => {
      this.setMode('gameplay');
      if (this.callbacks.onContinueGame) this.callbacks.onContinueGame();
    });
  }

  _buildPauseMenu() {
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-menu-overlay';
    this.pauseOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: none;
      justify-content: center;
      align-items: center;
      background: rgba(10, 14, 24, 0.82);
      pointer-events: auto;
      z-index: 30;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
      background: #151c2c;
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      padding: 28px 36px;
      width: 360px;
      text-align: center;
    `;
    box.innerHTML = `
      <h2 style="font-size:24px;font-weight:900;color:#ffffff;margin-bottom:18px;">JOGO PAUSADO</h2>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button id="btn-resume" style="padding:10px;font-weight:800;background:#ff6b5b;color:#0e131d;border:none;border-radius:7px;cursor:pointer;">CONTINUAR</button>
        <button id="btn-open-map" style="padding:10px;font-weight:800;background:#2fd6c8;color:#0e131d;border:none;border-radius:7px;cursor:pointer;">MAPA DE CORAL VISTA (M)</button>
        <button id="btn-save" style="padding:10px;font-weight:800;background:#334155;color:#ffffff;border:none;border-radius:7px;cursor:pointer;">SALVAR PROGRESSO</button>
        <button id="btn-title" style="padding:10px;font-weight:800;background:#1e293b;color:#cbd5e1;border:none;border-radius:7px;cursor:pointer;">TELA DE TÍTULO</button>
      </div>
    `;
    this.pauseOverlay.appendChild(box);
    this.uiRoot.appendChild(this.pauseOverlay);

    box.querySelector('#btn-resume').addEventListener('click', () => this.setMode('gameplay'));
    box.querySelector('#btn-open-map').addEventListener('click', () => this.setMode('map'));
    box.querySelector('#btn-save').addEventListener('click', () => {
      if (this.callbacks.onSaveGame) this.callbacks.onSaveGame();
      this.setMode('gameplay');
    });
    box.querySelector('#btn-title').addEventListener('click', () => this.setMode('title'));
  }

  setMode(newMode, state = null) {
    this.mode = newMode;
    // Title screen hides HUD completely (Título sem HUD)
    this.hudContainer.style.display = newMode === 'gameplay' ? 'block' : 'none';
    this.titleOverlay.style.display = newMode === 'title' ? 'flex' : 'none';
    this.pauseOverlay.style.display = newMode === 'paused' ? 'flex' : 'none';
    this.bigMap.setOpen(newMode === 'map', state);
  }

  update(state) {
    if (this.mode === 'title') return;
    if (this.mode === 'map') {
      this.bigMap.render(state);
      return;
    }

    // 1. Mission header & objective
    this.missionTitleEl.textContent = state.missionTitle || 'MISSÃO ATIVA';
    const distSuffix =
      state.objectiveDistance != null ? ` (${Math.round(state.objectiveDistance)}m)` : '';
    this.missionObjEl.textContent = (state.objectiveText || '') + distSuffix;

    // 2. Money
    const money = state.money ?? 1250;
    this.moneyEl.textContent = `$${money.toLocaleString('en-US')}`;

    // 3. Wanted stars on line below money (empty stars very dim!)
    const stars = state.wantedStars ?? 0;
    for (let i = 0; i < 5; i++) {
      const sp = this.starSpans[i];
      if (i < stars) {
        sp.style.color = '#ffc83b';
        sp.style.textShadow = '0 0 10px rgba(255, 195, 45, 0.85)';
      } else {
        sp.style.color = 'rgba(255, 255, 255, 0.13)';
        sp.style.textShadow = 'none';
      }
    }

    // 4. Weapon & ammo
    this.weaponEl.textContent = state.weaponText || 'CORAL 9MM • 12 / 96';

    // 5. Health & Armor bars (>= 10px with icons)
    const hp = Math.max(0, Math.min(100, Math.round(state.health ?? 100)));
    const ar = Math.max(0, Math.min(100, Math.round(state.armor ?? 50)));
    this.healthBarFill.fill.style.width = `${hp}%`;
    this.healthBarFill.valSp.textContent = `${hp}%`;
    this.armorBarFill.fill.style.width = `${ar}%`;
    this.armorBarFill.valSp.textContent = `${ar}%`;

    // 6. Speedometer when in vehicle
    if (state.activeVehicle) {
      this.speedBox.style.display = 'block';
      const kmh = Math.round(Math.abs(state.activeVehicle.speed) * 3.6);
      this.vehicleNameEl.textContent = state.activeVehicle.modelDef.name;
      this.speedValueEl.textContent = `${kmh} KM/H`;
      const pct = Math.min(100, Math.round((kmh / 130) * 100));
      this.speedFillEl.style.width = `${pct}%`;
    } else {
      this.speedBox.style.display = 'none';
    }

    // 7. Pistol crosshair when on foot with pistol
    this.crosshairEl.style.display = state.showCrosshair ? 'block' : 'none';

    // 8. Dialogue box
    if (state.activeDialogue) {
      this.dialogueBox.style.display = 'block';
      this.dialogueSpeakerEl.style.color = state.activeDialogue.accent || '#2fd6c8';
      this.dialogueSpeakerEl.textContent = `${state.activeDialogue.speakerName} — ${state.activeDialogue.speakerRole}`;
      this.dialogueTextEl.textContent = `"${state.activeDialogue.text}"`;
    } else {
      this.dialogueBox.style.display = 'none';
    }

    // 9. Notification or POI interaction prompt
    const notice = state.respawnNotice || state.notification;
    if (notice) {
      this.noticeBox.style.display = 'block';
      this.noticeBox.innerHTML = `<div style="font-size:13px;font-weight:800;color:#ffd166;">${notice.title}</div><div style="font-size:12px;color:#f1f5f9;">${notice.subtitle}</div>`;
    } else if (state.interactionPrompt) {
      this.noticeBox.style.display = 'block';
      this.noticeBox.innerHTML = `<div style="font-size:13px;font-weight:700;color:#2fd6c8;">${state.interactionPrompt}</div>`;
    } else {
      this.noticeBox.style.display = 'none';
    }

    // 10. Circular minimap
    this.minimapRenderer.render(state);
  }
}

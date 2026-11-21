// Player health, armor, Wasted, Busted, and hospital/station respawn

export class RespawnSystem {
  constructor(player) {
    this.player = player;

    // Key respawn landmarks in Coral Vista
    this.hospitalPos = { x: 35, z: -45, yaw: 0 }; // Downtown Mercy Hospital
    this.policeStationPos = { x: -15, z: 5, yaw: Math.PI / 2 }; // CVPD Headquarters

    this.isRespawning = false;
    this.respawnTimer = 0;
    this.respawnType = null; // 'wasted' or 'busted'

    this.createOverlayUI();
  }

  createOverlayUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'respawn-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 54px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
      z-index: 100;
      text-shadow: 0 0 12px rgba(0,0,0,0.9);
    `;
    document.body.appendChild(this.overlay);
  }

  triggerWasted() {
    if (this.isRespawning) return;
    this.isRespawning = true;
    this.respawnType = 'wasted';
    this.respawnTimer = 3.2;

    this.overlay.textContent = 'WASTED';
    this.overlay.style.color = '#ff1744';
    this.overlay.style.background = 'rgba(180, 0, 0, 0.45)';
    this.overlay.style.opacity = '1';
  }

  triggerBusted() {
    if (this.isRespawning) return;
    this.isRespawning = true;
    this.respawnType = 'busted';
    this.respawnTimer = 3.2;

    this.overlay.textContent = 'BUSTED';
    this.overlay.style.color = '#00e5ff';
    this.overlay.style.background = 'rgba(0, 40, 100, 0.55)';
    this.overlay.style.opacity = '1';
  }

  update(delta) {
    if (!this.isRespawning) return;

    this.respawnTimer -= delta;
    if (this.respawnTimer <= 0) {
      this.respawn();
    }
  }

  respawn() {
    this.isRespawning = false;
    this.overlay.style.opacity = '0';

    if (this.player.inVehicle) {
      this.player.exitVehicle();
    }

    if (this.respawnType === 'wasted') {
      // Respawn at Mercy Hospital
      this.player.position.set(this.hospitalPos.x, 0.2, this.hospitalPos.z);
      this.player.yaw = this.hospitalPos.yaw;
      this.player.money = Math.max(0, this.player.money - 100);
    } else {
      // Respawn at CVPD Police Station
      this.player.position.set(this.policeStationPos.x, 0.2, this.policeStationPos.z);
      this.player.yaw = this.policeStationPos.yaw;
      this.player.money = Math.max(0, this.player.money - 100);
    }

    this.player.health = 100;
    this.player.armor = 50;
    this.player.root.position.copy(this.player.position);
    this.player.root.rotation.y = this.player.yaw;
    this.player.velocity.set(0, 0, 0);
  }
}

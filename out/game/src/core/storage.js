// Game persistence: save and load progress via localStorage

export class StorageManager {
  constructor(storageKey = 'heatwave_coral_vista_save') {
    this.storageKey = storageKey;
  }

  save(gameState) {
    try {
      const data = {
        version: 1,
        timestamp: Date.now(),
        missionIndex: gameState.missionIndex ?? 0,
        money: gameState.player?.money ?? 350,
        health: gameState.player?.health ?? 100,
        armor: gameState.player?.armor ?? 100,
        ammo: gameState.combat?.weapons?.pistol?.ammo ?? 48,
        position: {
          x: gameState.player?.position?.x ?? -85,
          y: gameState.player?.position?.y ?? 0,
          z: gameState.player?.position?.z ?? 10,
        },
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  }

  hasSave() {
    return !!localStorage.getItem(this.storageKey);
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {}
  }
}

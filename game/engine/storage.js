const STORAGE_KEY = 'heatwave_coral_vista_save_v1';

export class SaveStorage {
  static hasSave() {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch (_e) {
      return false;
    }
  }

  static saveGame(state) {
    try {
      const payload = {
        version: 1,
        timestamp: Date.now(),
        missionIndex: state.missionIndex ?? 0,
        money: state.money ?? 1250,
        health: state.health ?? 100,
        armor: state.armor ?? 50,
        playerX: state.playerX ?? 124.5,
        playerZ: state.playerZ ?? 28.0,
        completedMissions: state.completedMissions ?? 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (_e) {
      return false;
    }
  }

  static loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }
}

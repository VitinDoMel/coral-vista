import { DIALOGUES } from './dialogues.js';

// 5 Story Missions, Side Activities (Taxi, Street Race), and LocalStorage Persistence

export const MISSIONS = [
  {
    id: 1,
    title: 'Repossession',
    location: 'Seabreeze Boulevard',
    district: 'Seabreeze Boulevard & Beach',
    targetPos: { x: 24, z: 194 },
    dropoffPos: { x: -80, z: 80 }, // Chop Shop
    reward: 800,
    desc: 'Steal the red sports car on Seabreeze Blvd and deliver it to the garage.'
  },
  {
    id: 2,
    title: 'Heat Courier',
    location: 'Downtown Plaza',
    district: 'Downtown',
    targetPos: { x: 0, z: 40 },
    reward: 1200,
    timeLimit: 60,
    desc: 'Deliver encrypted drive to the syndicate contact in Downtown.'
  },
  {
    id: 3,
    title: 'Takedown',
    location: 'Vista Causeway',
    district: 'Vista Causeway Bridge',
    targetPos: { x: 260, z: -200 },
    reward: 1600,
    desc: 'Intercept and disable the Los Manta defector before he talks.'
  },
  {
    id: 4,
    title: 'Port Ambush',
    location: 'Cargo Warehouse',
    district: 'Port of Coral Vista',
    targetPos: { x: -250, z: -220 },
    reward: 2000,
    desc: 'Defend the smuggling stash from Los Manta hitmen.'
  },
  {
    id: 5,
    title: 'Final Escape',
    location: 'Causeway Roadblock',
    district: 'Vista Causeway Bridge',
    targetPos: { x: 380, z: -200 },
    reward: 3500,
    desc: 'Evade CVPD with 4 wanted stars and reach the state border bridge.'
  }
];

export class MissionManager {
  constructor() {
    this.currentMissionIndex = 0; // 0 to 4
    this.cash = 4850;
    this.activeDialogue = null;
    this.dialogueTimer = 0;
    this.missionState = 'idle'; // 'idle' | 'active' | 'completed'
    this.timer = 0;

    this.stats = {
      carsStolen: 4,
      crimesCommitted: 12,
      racesWon: 1,
      taxiFares: 3
    };

    this.load();
  }

  getCurrentMission() {
    return MISSIONS[this.currentMissionIndex] || MISSIONS[MISSIONS.length - 1];
  }

  showDialogue(speaker, text, duration = 4.5) {
    this.activeDialogue = { speaker, text };
    this.dialogueTimer = duration;
  }

  update(dt, player, wanted) {
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= dt;
      if (this.dialogueTimer <= 0) {
        this.activeDialogue = null;
      }
    }

    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
      }
    }
  }

  save() {
    try {
      const data = {
        missionIndex: this.currentMissionIndex,
        cash: this.cash,
        stats: this.stats
      };
      localStorage.setItem('coral_vista_save', JSON.stringify(data));
    } catch (_) {}
  }

  load() {
    try {
      const raw = localStorage.getItem('coral_vista_save');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.missionIndex === 'number') this.currentMissionIndex = data.missionIndex;
        if (typeof data.cash === 'number') this.cash = data.cash;
        if (data.stats) Object.assign(this.stats, data.stats);
      }
    } catch (_) {}
  }
}

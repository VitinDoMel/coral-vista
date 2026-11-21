import * as THREE from 'three';
import { STORY_CHARACTERS, MISSION_DIALOGUES } from '../story/dialogues.js';
import { VEHICLE_MODELS, Vehicle } from '../vehicles/vehicle.js';

export const STORY_MISSIONS = [
  {
    id: 1,
    code: 'mission_1',
    title: '1. Breeze Heist',
    district: 'Seabreeze Strip',
    startPos: { x: 120, z: 58 },
    targetPos: { x: -30, z: 12 },
    reward: 1500,
    wantedOnStart: 1,
    objectiveStart: 'Steal the Manta GT sports car on Seabreeze Boulevard (Press F)',
    objectiveDrive: 'Deliver the Manta GT to Nina Vega garage in Coral Downtown',
    dialogueKey: 'mission_1_start'
  },
  {
    id: 2,
    code: 'mission_2',
    title: '2. Flash Delivery',
    district: 'Coral Downtown',
    startPos: { x: -30, z: -135 },
    targetPos: { x: 45, z: -150 },
    checkpoints: [
      { x: -30, z: -75 },
      { x: 45, z: -75 },
      { x: 45, z: -150 }
    ],
    timeLimit: 65,
    reward: 2000,
    wantedOnStart: 1,
    objectiveStart: 'Hit all 3 crypto checkpoints before the countdown expires',
    objectiveDrive: 'Race to the next Nina Vega relay checkpoint',
    dialogueKey: 'mission_2_start'
  },
  {
    id: 3,
    code: 'mission_3',
    title: '3. Manta Takedown',
    district: 'Palm Gardens',
    startPos: { x: -180, z: -38 },
    targetPos: { x: -180, z: -115 },
    reward: 2500,
    wantedOnStart: 2,
    objectiveStart: 'Track and ram the Los Manta lieutenant sedan in Palm Gardens',
    objectiveDrive: 'Ram the Los Manta target car until its armor breaks',
    dialogueKey: 'mission_3_start'
  },
  {
    id: 4,
    code: 'mission_4',
    title: '4. Harbor Siege',
    district: 'Coral Harbor Port',
    startPos: { x: -105, z: 215 },
    targetPos: { x: -105, z: 248 },
    reward: 3500,
    wantedOnStart: 3,
    objectiveStart: 'Clear the armed Los Manta guards at South Harbor Port',
    objectiveDrive: 'Neutralize the Los Manta crew between the harbor containers',
    dialogueKey: 'mission_4_start'
  },
  {
    id: 5,
    code: 'mission_5',
    title: '5. Bridge Escape',
    district: 'Coral Bay Bridge',
    startPos: { x: 120, z: -115 },
    targetPos: { x: 305, z: -150 },
    reward: 6000,
    wantedOnStart: 4,
    objectiveStart: 'Outrun CVPD pursuit and cross Coral Bay Bridge to Starlight Key',
    objectiveDrive: 'Final Escape: Cross Coral Bay Bridge to Starlight Key safehouse',
    dialogueKey: 'mission_5_start'
  }
];

export const CITY_POIS = [
  {
    id: 'coral_arms',
    name: 'Coral Arms Shop',
    shortLabel: 'CORAL ARMS',
    type: 'shop',
    x: 45,
    z: -15,
    color: '#ff922b'
  },
  {
    id: 'cvpd_hq',
    name: 'CVPD Precinct',
    shortLabel: 'CVPD PRECINCT',
    type: 'police',
    x: -105,
    z: -112,
    color: '#4dabf7'
  },
  {
    id: 'coral_hospital',
    name: 'Coral General Hospital',
    shortLabel: 'CORAL HOSPITAL',
    type: 'hospital',
    x: 45,
    z: 118,
    color: '#ff6b6b'
  },
  {
    id: 'street_race',
    name: 'Coastal Sprint Race',
    shortLabel: 'COASTAL RACE',
    type: 'race',
    x: 120,
    z: -38,
    color: '#20c997'
  },
  {
    id: 'taxi_depot',
    name: 'Vista Cab Taxi Depot',
    shortLabel: 'TAXI DEPOT',
    type: 'taxi',
    x: -180,
    z: 112,
    color: '#fcc419'
  }
];

export class MissionManager {
  constructor(scene, player, vehicleManager, policeManager) {
    this.scene = scene;
    this.player = player;
    this.vehicleManager = vehicleManager;
    this.policeManager = policeManager;

    this.currentMissionIndex = 0; // 0..4
    this.missionStage = 'active'; // 'idle' | 'active' | 'completed_all'
    this.checkpointIndex = 0;
    this.missionTimer = 0;

    // Active dialogue banner
    this.activeDialogue = null;
    this.dialogueQueue = [];
    this.dialogueTimer = 0;

    // Notification toast
    this.notification = null;

    // Target rival vehicle for Mission 3
    this.rivalVehicle = null;
    this.rivalHealth = 100;

    // Collectible cash pickups in world
    this.cashPickups = [];

    this._buildWorldBeacon();
    this._spawnCashPickups();
    this.startMission(0, true);
  }

  _buildWorldBeacon() {
    this.beaconGroup = new THREE.Group();

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff9f43,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.beaconCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 5.5, 24, 1, true),
      ringMat
    );
    this.beaconCylinder.position.y = 2.75;
    this.beaconGroup.add(this.beaconCylinder);

    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.7, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    baseRing.rotation.x = -Math.PI * 0.5;
    baseRing.position.y = 0.06;
    this.beaconGroup.add(baseRing);

    this.scene.add(this.beaconGroup);

    // Coral Arms shop marker ring
    const shopRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.1, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff922b,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    shopRing.rotation.x = -Math.PI * 0.5;
    shopRing.position.set(45, 0.06, -15);
    this.scene.add(shopRing);
  }

  _spawnCashPickups() {
    const cashCoords = [
      { x: 132, z: -5, amount: 350 },
      { x: 132, z: -85, amount: 400 },
      { x: -24, z: -20, amount: 500 },
      { x: -100, z: 185, amount: 600 },
      { x: 312, z: -150, amount: 1000 }
    ];
    const cashMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x1b9e52,
      emissiveIntensity: 0.7,
      roughness: 0.3
    });

    for (const c of cashCoords) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.25), cashMat);
      mesh.position.set(c.x, 0.9, c.z);
      this.scene.add(mesh);
      this.cashPickups.push({ mesh, x: c.x, z: c.z, amount: c.amount, collected: false });
    }
  }

  getCurrentMission() {
    return STORY_MISSIONS[Math.min(this.currentMissionIndex, STORY_MISSIONS.length - 1)];
  }

  getActiveObjectivePosition() {
    const m = this.getCurrentMission();
    if (!m) return new THREE.Vector3(120, 0, 0);

    if (m.id === 1 && (!this.vehicleManager || !this.vehicleManager.activeVehicle)) {
      return new THREE.Vector3(126.2, 0, 16.0);
    }
    if (m.id === 2 && m.checkpoints) {
      const cp = m.checkpoints[Math.min(this.checkpointIndex, m.checkpoints.length - 1)];
      return new THREE.Vector3(cp.x, 0, cp.z);
    }
    if (m.id === 3 && this.rivalVehicle) {
      return this.rivalVehicle.position.clone();
    }
    return new THREE.Vector3(m.targetPos.x, 0, m.targetPos.z);
  }

  getActiveObjectiveText() {
    if (this.missionStage === 'completed_all') {
      return 'Story complete! Explore Coral Vista, enter street races or visit Coral Arms';
    }
    const m = this.getCurrentMission();
    const inCar = Boolean(this.vehicleManager && this.vehicleManager.activeVehicle);

    if (m.id === 2 && this.missionTimer > 0) {
      return `${m.objectiveDrive} (${Math.ceil(this.missionTimer)}s left)`;
    }
    if (m.id === 3 && this.rivalVehicle) {
      return `${m.objectiveDrive} (Los Manta Armor: ${Math.max(0, Math.ceil(this.rivalHealth))}%)`;
    }
    return inCar ? m.objectiveDrive : m.objectiveStart;
  }

  startMission(index, triggerDialogue = true) {
    this.currentMissionIndex = Math.max(0, Math.min(STORY_MISSIONS.length - 1, index));
    this.missionStage = 'active';
    this.checkpointIndex = 0;

    const m = this.getCurrentMission();
    this.missionTimer = m.timeLimit || 0;

    if (this.rivalVehicle) {
      this.scene.remove(this.rivalVehicle.mesh);
      this.rivalVehicle = null;
    }

    if (m.id === 3) {
      const sedanDef = VEHICLE_MODELS[1];
      this.rivalVehicle = new Vehicle(
        this.scene,
        sedanDef,
        0x22262e,
        new THREE.Vector3(m.targetPos.x, 0, m.targetPos.z),
        0
      );
      this.rivalHealth = 100;
    }

    if (triggerDialogue && MISSION_DIALOGUES[m.dialogueKey]) {
      this.queueDialogues(MISSION_DIALOGUES[m.dialogueKey]);
    }
  }

  queueDialogues(lines) {
    this.dialogueQueue = [...lines];
    this._advanceDialogue();
  }

  _advanceDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.activeDialogue = null;
      return;
    }
    const next = this.dialogueQueue.shift();
    const charInfo = STORY_CHARACTERS[next.speaker] || STORY_CHARACTERS.nina;
    this.activeDialogue = {
      speakerName: charInfo.name,
      speakerRole: charInfo.role,
      accent: charInfo.accent,
      text: next.text
    };
    this.dialogueTimer = 6.5;
  }

  showNotification(title, subtitle, duration = 3.5) {
    this.notification = { title, subtitle, timer: duration };
  }

  tryInteractWithPois(input, combat) {
    if (!input.consumeKeyPress('KeyG')) return;

    const p = this.player.position;
    // Coral Arms shop interaction (x = 45, z = -15)
    const distToShop = Math.hypot(p.x - 45, p.z - -15);
    if (distToShop < 9.5) {
      if (this.player.money >= 150) {
        this.player.money -= 150;
        this.player.armor = this.player.maxArmor;
        this.player.health = this.player.maxHealth;
        if (combat && combat.weapons.pistol) {
          combat.weapons.pistol.ammoInClip = 12;
          combat.weapons.pistol.reserveAmmo = 120;
        }
        if (this.vehicleManager && this.vehicleManager.activeVehicle) {
          this.vehicleManager.activeVehicle.health = 100;
        }
        this.showNotification(
          'CORAL ARMS SHOP',
          'Full Armor, 9mm Ammo restock & Vehicle repair (-$150)'
        );
      } else {
        this.showNotification('CORAL ARMS SHOP', 'Insufficient cash ($150 required)');
      }
      return;
    }

    // Coastal street race checkpoint activity (x = 120, z = -38)
    const distToRace = Math.hypot(p.x - 120, p.z - -38);
    if (distToRace < 10.0) {
      this.player.money += 800;
      this.showNotification(
        'COASTAL SPRINT WON',
        'New Seabreeze Boulevard lap record! Prize: +$800'
      );
      return;
    }

    // Vista Cab taxi dispatch activity
    if (
      this.vehicleManager &&
      this.vehicleManager.activeVehicle &&
      this.vehicleManager.activeVehicle.modelDef.id === 'vista_cab'
    ) {
      this.player.money += 450;
      this.showNotification('VISTA CAB FARE', 'Passenger dropped off on time! Fare: +$450');
    }
  }

  getNearbyInteractionPrompt() {
    const p = this.player.position;
    if (Math.hypot(p.x - 45, p.z - -15) < 9.5) {
      return '[G] CORAL ARMS — Buy Armor, 9mm Ammo & Vehicle Repair ($150)';
    }
    if (Math.hypot(p.x - 120, p.z - -38) < 10.0) {
      return '[G] COASTAL RACE — Enter Checkpoint Sprint (+$800)';
    }
    if (
      this.vehicleManager &&
      this.vehicleManager.activeVehicle &&
      this.vehicleManager.activeVehicle.modelDef.id === 'vista_cab'
    ) {
      return '[G] VISTA CAB DISPATCH — Complete Taxi Fare (+$450)';
    }
    return null;
  }

  update(dt, input, combat) {
    const clampedDt = Math.min(dt, 0.05);

    this.tryInteractWithPois(input, combat);

    // Dialogue timer
    if (this.activeDialogue) {
      this.dialogueTimer -= clampedDt;
      if (this.dialogueTimer <= 0) {
        this._advanceDialogue();
      }
    }

    if (this.notification) {
      this.notification.timer -= clampedDt;
      if (this.notification.timer <= 0) {
        this.notification = null;
      }
    }

    // Collectible cash briefcases
    for (const c of this.cashPickups) {
      if (c.collected) continue;
      c.mesh.rotation.y += clampedDt * 2.2;
      if (Math.hypot(this.player.position.x - c.x, this.player.position.z - c.z) < 2.2) {
        c.collected = true;
        c.mesh.visible = false;
        this.player.money += c.amount;
        this.showNotification('CASH COLLECTED', `Briefcase recovered in Coral Vista (+$${c.amount})`);
      }
    }

    if (this.missionStage === 'completed_all') {
      this.beaconGroup.visible = false;
      return;
    }

    const m = this.getCurrentMission();
    const targetPos = this.getActiveObjectivePosition();

    this.beaconGroup.visible = true;
    this.beaconGroup.position.set(targetPos.x, 0, targetPos.z);
    this.beaconCylinder.rotation.y += clampedDt * 1.5;

    // Mission 2 countdown
    if (m.id === 2 && this.missionTimer > 0) {
      this.missionTimer -= clampedDt;
      if (this.missionTimer <= 0) {
        this.missionTimer = m.timeLimit;
        this.checkpointIndex = 0;
        this.showNotification('TIME EXPIRED', 'Resetting Nina relay checkpoint run');
      }
    }

    // Mission 3 rival car movement & ramming check
    if (m.id === 3 && this.rivalVehicle) {
      this.rivalVehicle.position.z -= 7.5 * clampedDt;
      if (this.rivalVehicle.position.z < -215) {
        this.rivalVehicle.position.z = 140;
      }
      this.rivalVehicle._syncVisuals(clampedDt);

      const distToRival = this.player.position.distanceTo(this.rivalVehicle.position);
      if (distToRival < 4.5) {
        this.rivalHealth -= 45 * clampedDt * 12;
        if (this.rivalHealth <= 0) {
          this._completeCurrentMission();
          return;
        }
      }
    }

    // Check proximity to objective beacon
    const distToTarget = Math.hypot(
      this.player.position.x - targetPos.x,
      this.player.position.z - targetPos.z
    );

    if (distToTarget < 4.8) {
      if (m.id === 1 && (!this.vehicleManager || !this.vehicleManager.activeVehicle)) {
        return;
      }
      if (m.id === 2 && m.checkpoints) {
        this.checkpointIndex++;
        if (this.checkpointIndex >= m.checkpoints.length) {
          this._completeCurrentMission();
        } else {
          this.showNotification(
            `CHECKPOINT ${this.checkpointIndex}/${m.checkpoints.length}`,
            'Signal synced! Push to the next relay.'
          );
        }
        return;
      }
      if (m.id !== 3) {
        this._completeCurrentMission();
      }
    }
  }

  _completeCurrentMission() {
    const m = this.getCurrentMission();
    this.player.money += m.reward;
    this.showNotification(
      `MISSION COMPLETE: ${m.title.toUpperCase()}`,
      `Reward paid: +$${m.reward.toLocaleString('en-US')}`,
      4.5
    );

    if (this.currentMissionIndex + 1 < STORY_MISSIONS.length) {
      const nextIdx = this.currentMissionIndex + 1;
      const nextMission = STORY_MISSIONS[nextIdx];
      this.startMission(nextIdx, true);
      if (this.policeManager && nextMission.wantedOnStart >= 3) {
        this.policeManager.setWantedStars(nextMission.wantedOnStart, this.player.position);
      }
    } else {
      this.missionStage = 'completed_all';
      if (this.policeManager) {
        this.policeManager.setWantedStars(0);
      }
    }
  }
}

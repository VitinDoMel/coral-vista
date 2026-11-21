// Story missions state machine, 3D waypoint beacon, and objective tracker

import * as THREE from 'three';
import { STORY_DIALOGUES } from './dialogues.js';

export class MissionManager {
  constructor(scene, player, wantedSystem) {
    this.scene = scene;
    this.player = player;
    this.wanted = wantedSystem;

    this.currentMissionIndex = 0; // 0 to 4
    this.state = 'idle'; // 'idle', 'dialogue', 'active', 'failed', 'complete'
    this.timer = 0;
    this.targetObject = null;
    this.activeDialogue = null;
    this.dialogueQueue = [];

    this.missions = [
      {
        id: 'm1_hot_wheels',
        title: 'Mission 1: Hot Wheels',
        instruction: 'Steal a sports car and deliver it to the Downtown Garage',
        target: { x: -65, z: -45, radius: 6.0 },
        reward: 600,
        requiresCar: true,
      },
      {
        id: 'm2_data_drop',
        title: 'Mission 2: Data Drop',
        instruction: 'Deliver Nina’s drive to Flamingo Palms before time runs out',
        target: { x: 85, z: 5, radius: 5.5 },
        timeLimit: 65,
        reward: 900,
      },
      {
        id: 'm3_takedown',
        title: 'Mission 3: Takedown',
        instruction: 'Intercept and ram the traitor’s vehicle until stopped',
        target: { x: 10, z: -60, radius: 5.0 },
        reward: 1200,
      },
      {
        id: 'm4_port_ambush',
        title: 'Mission 4: Port Ambush',
        instruction: 'Head to the Port of Coral Vista and neutralize the cartel ambusher',
        target: { x: 110, z: 140, radius: 7.0 },
        reward: 1500,
      },
      {
        id: 'm5_causeway_escape',
        title: 'Mission 5: Causeway Escape',
        instruction: '4 Stars! Evade the VCPD blockade and escape across the Causeway Bridge',
        target: { x: -20, z: -190, radius: 10.0 },
        wantedStars: 4,
        reward: 2500,
      },
    ];

    this.buildBeaconMesh();
  }

  buildBeaconMesh() {
    this.beaconGroup = new THREE.Group();

    // Glowing vertical light beam
    const beamGeo = new THREE.CylinderGeometry(0.8, 1.2, 45, 12, 1, true);
    beamGeo.translate(0, 22.5, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    this.beaconGroup.add(beam);

    // Pulsing ground target ring
    const ringGeo = new THREE.RingGeometry(2.4, 3.2, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.position.y = 0.15;
    this.beaconGroup.add(this.ring);

    this.scene.add(this.beaconGroup);
    this.updateBeaconPosition();
  }

  updateBeaconPosition() {
    const cur = this.getCurrentMission();
    if (cur && cur.target) {
      this.beaconGroup.position.set(cur.target.x, 0, cur.target.z);
      this.beaconGroup.visible = true;
    } else {
      this.beaconGroup.visible = false;
    }
  }

  getCurrentMission() {
    return this.missions[this.currentMissionIndex] ?? null;
  }

  startCurrentMission() {
    const m = this.getCurrentMission();
    if (!m) return;

    this.state = 'active';
    this.timer = m.timeLimit ?? 0;

    if (m.wantedStars) {
      this.wanted.setStars(m.wantedStars);
    }

    const startKey = `m${this.currentMissionIndex + 1}_start`;
    if (STORY_DIALOGUES[startKey]) {
      this.playDialogueSequence(STORY_DIALOGUES[startKey]);
    }
  }

  playDialogueSequence(dialogueList) {
    this.dialogueQueue = [...dialogueList];
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length > 0) {
      this.activeDialogue = this.dialogueQueue.shift();
      this.activeDialogue.timer = 5.0; // 5 seconds per line
    } else {
      this.activeDialogue = null;
    }
  }

  update(delta, player, hud) {
    // Pulse beacon ring
    if (this.ring) {
      const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.18;
      this.ring.scale.set(scale, scale, scale);
    }

    // Active dialogue countdown
    if (this.activeDialogue) {
      this.activeDialogue.timer -= delta;
      if (this.activeDialogue.timer <= 0) {
        this.advanceDialogue();
      }
    }

    const mission = this.getCurrentMission();
    if (!mission || this.state !== 'active') return;

    // Mission timer countdown
    if (mission.timeLimit) {
      this.timer -= delta;
      if (this.timer <= 0) {
        this.state = 'failed';
        if (hud) hud.showNotification('MISSION FAILED: Time Expired!');
        setTimeout(() => this.startCurrentMission(), 3500);
        return;
      }
    }

    // Check distance to mission waypoint
    const dx = player.position.x - mission.target.x;
    const dz = player.position.z - mission.target.z;
    const dist = Math.hypot(dx, dz);

    if (dist <= mission.target.radius) {
      if (mission.requiresCar && !player.inVehicle) {
        if (hud) hud.showNotification('You must be inside a vehicle!');
        return;
      }

      this.completeCurrentMission(player, hud);
    }
  }

  completeCurrentMission(player, hud) {
    const m = this.getCurrentMission();
    this.state = 'complete';

    player.money += m.reward;
    if (hud) {
      hud.showNotification(`MISSION PASSED! +$${m.reward}`);
    }

    const completeKey = `m${this.currentMissionIndex + 1}_complete`;
    if (STORY_DIALOGUES[completeKey]) {
      this.playDialogueSequence(STORY_DIALOGUES[completeKey]);
    }

    this.currentMissionIndex++;
    if (this.currentMissionIndex < this.missions.length) {
      setTimeout(() => {
        this.updateBeaconPosition();
        this.startCurrentMission();
      }, 4000);
    } else {
      this.beaconGroup.visible = false;
      if (hud) hud.showNotification('ALL MISSIONS COMPLETED! CORAL VISTA IS YOURS!');
    }
  }
}

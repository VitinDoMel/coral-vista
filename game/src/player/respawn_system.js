import * as THREE from 'three';

// Respawn System: Hospital (Mercy General Downtown) & Police Precinct (CVPD Central)

export class RespawnSystem {
  constructor(player, wantedSystem, vehicleManager) {
    this.player = player;
    this.wanted = wantedSystem;
    this.vehicles = vehicleManager;

    this.isRespawning = false;
    this.respawnTimer = 0;
    this.respawnType = null; // 'wasted' | 'busted'

    // Canonical Respawn Locations
    this.hospitalPos = new THREE.Vector3(-100, 0.35, 50); // Mercy General Hospital, Downtown
    this.precinctPos = new THREE.Vector3(100, 0.35, 0);   // CVPD Central Precinct
  }

  update(dt) {
    if (this.isRespawning) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.completeRespawn();
      }
      return;
    }

    // 1. Health check (Death / Wasted)
    if (this.player.health <= 0) {
      this.triggerRespawn('wasted');
    }
  }

  triggerRespawn(type) {
    this.isRespawning = true;
    this.respawnType = type;
    this.respawnTimer = 2.4; // 2.4s screen delay

    // Eject from car if inside
    if (this.vehicles.playerVehicle) {
      this.vehicles.exitVehicle(this.player);
    }
  }

  completeRespawn() {
    this.isRespawning = false;
    this.player.health = 100;
    this.player.armor = 50;
    this.wanted.clear();

    if (this.respawnType === 'wasted') {
      this.player.position.copy(this.hospitalPos);
    } else {
      this.player.position.copy(this.precinctPos);
    }

    this.player.mesh.position.copy(this.player.position);
    this.player.velocity.set(0, 0, 0);
    this.player._updateCamera();
  }
}

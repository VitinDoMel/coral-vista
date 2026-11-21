// Wanted Level System: 0–5 Stars, Crime Triggers, and Sight-Based Cooldown

export class WantedSystem {
  constructor() {
    this.stars = 0; // 0 to 5
    this.evasionTimer = 0;
    this.maxEvasionTime = 16.0; // Seconds out of sight to clear wanted
    this.isFlashing = false;
    this.totalCrimes = 0;
  }

  recordCrime(type) {
    this.totalCrimes++;

    switch (type) {
      case 'carjack':
      case 'reckless_drive':
        this.stars = Math.max(this.stars, 1);
        break;
      case 'assault':
        this.stars = Math.max(this.stars, 2);
        break;
      case 'attack_police':
        this.stars = Math.max(this.stars, 3);
        break;
      case 'mayhem':
        this.stars = Math.max(this.stars, 4);
        break;
      case 'extreme_hostility':
        this.stars = 5;
        break;
      default:
        this.stars = Math.max(this.stars, 1);
    }

    // Reset evasion timer on new crime
    this.evasionTimer = 0;
    this.isFlashing = false;
  }

  setStars(stars) {
    this.stars = Math.max(0, Math.min(5, stars));
    this.evasionTimer = 0;
  }

  update(dt, playerHasPoliceInSight) {
    if (this.stars <= 0) return;

    if (!playerHasPoliceInSight) {
      this.evasionTimer += dt;
      this.isFlashing = true;

      // Lose 1 star every 14s of clean evasion
      if (this.evasionTimer >= this.maxEvasionTime) {
        this.stars--;
        this.evasionTimer = 0;
        if (this.stars <= 0) {
          this.isFlashing = false;
        }
      }
    } else {
      // In active sight - reset evasion clock
      this.evasionTimer = 0;
      this.isFlashing = false;
    }
  }

  clear() {
    this.stars = 0;
    this.evasionTimer = 0;
    this.isFlashing = false;
  }
}

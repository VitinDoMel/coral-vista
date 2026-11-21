// Police Wanted Level Manager: 0 to 5 stars, crimes, cooldown, and evasion

import { clamp } from '../core/math.js';

export class WantedSystem {
  constructor() {
    this.stars = 0; // 0 to 5
    this.crimeScore = 0;
    this.evadeTimer = 0;
    this.isEvading = false;
    this.timeSinceLastCrime = 0;
  }

  reportCrime(crimeType, location) {
    this.timeSinceLastCrime = 0;
    this.isEvading = false;

    let points = 20;
    if (crimeType === 'carjack') points = 35;
    if (crimeType === 'assault') points = 30;
    if (crimeType === 'gunshot') points = 25;
    if (crimeType === 'cop_kill') points = 70;
    if (crimeType === 'vehicular_manslaughter') points = 55;

    this.crimeScore += points;
    this.updateStarsFromScore();
  }

  setStars(stars) {
    this.stars = clamp(stars, 0, 5);
    this.crimeScore = this.stars * 35;
    this.isEvading = false;
    this.evadeTimer = 0;
  }

  updateStarsFromScore() {
    if (this.crimeScore >= 180) {
      this.stars = 5;
    } else if (this.crimeScore >= 120) {
      this.stars = 4;
    } else if (this.crimeScore >= 70) {
      this.stars = 3;
    } else if (this.crimeScore >= 35) {
      this.stars = 2;
    } else if (this.crimeScore >= 15) {
      this.stars = 1;
    } else {
      this.stars = 0;
    }
  }

  update(delta, hasLineOfSightToPolice) {
    this.timeSinceLastCrime += delta;

    if (this.stars > 0) {
      if (!hasLineOfSightToPolice) {
        // Line of sight broken: start evasion timer
        this.isEvading = true;
        this.evadeTimer += delta;

        // Evade cooldown duration based on star rating
        const requiredTime = 8.0 + this.stars * 4.0;
        if (this.evadeTimer >= requiredTime) {
          this.stars--;
          this.crimeScore = this.stars * 35;
          this.evadeTimer = 0;
          if (this.stars === 0) {
            this.isEvading = false;
          }
        }
      } else {
        // Police spotted player: cancel evasion
        this.isEvading = false;
        this.evadeTimer = 0;
      }
    } else {
      this.isEvading = false;
      this.evadeTimer = 0;
    }
  }

  clear() {
    this.stars = 0;
    this.crimeScore = 0;
    this.isEvading = false;
    this.evadeTimer = 0;
  }
}

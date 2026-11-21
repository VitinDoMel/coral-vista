// Seedable PRNG and Mathematical Helpers

export class PRNG {
  constructor(seed = 1) {
    this.s = (seed >>> 0) || 123456789;
  }

  // Mulberry32 deterministic generator
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  choice(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function damp(a, b, lambda, dt) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export function distSq2D(x1, z1, x2, z2) {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return dx * dx + dz * dz;
}

export function boxIntersect(ax, az, aw, ad, bx, bz, bw, bd) {
  return (
    Math.abs(ax - bx) * 2 < (aw + bw) &&
    Math.abs(az - bz) * 2 < (ad + bd)
  );
}

export function createSeededRng(seedValue = 1) {
  let state = (Number(seedValue) || 1) >>> 0;
  if (state === 0) state = 0x6d2b79f5;

  function nextFloat() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + nextFloat() * (max - min);
  }

  function intRange(min, maxInclusive) {
    return Math.floor(range(min, maxInclusive + 1));
  }

  function pick(array) {
    return array[Math.floor(nextFloat() * array.length)];
  }

  return {
    nextFloat,
    range,
    intRange,
    pick
  };
}

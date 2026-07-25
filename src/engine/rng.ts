/** Mulberry32 — fast seedable PRNG. */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Roll a die with `sides` faces (result in 1..sides). */
export function rollDieN(rng: Rng, sides: number): number {
  return 1 + Math.floor(rng() * sides)
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]!
  }
  return (Math.random() * 0x100000000) >>> 0
}

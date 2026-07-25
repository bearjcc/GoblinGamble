export function sumDice(dice: number[]): number {
  let s = 0
  for (const d of dice) s += d
  return s
}

import type { RaceId } from './game/races.ts'

const KEY = 'goblin-gamble-bests-v1'

export type BestScores = {
  allTime: number
  byRace: Partial<Record<RaceId, number>>
}

function empty(): BestScores {
  return { allTime: 0, byRace: {} }
}

export function loadBests(): BestScores {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as BestScores
    return {
      allTime: typeof parsed.allTime === 'number' ? parsed.allTime : 0,
      byRace: parsed.byRace ?? {},
    }
  } catch {
    return empty()
  }
}

export function recordScore(race: RaceId, total: number): BestScores {
  const bests = loadBests()
  if (total > bests.allTime) bests.allTime = total
  const prev = bests.byRace[race] ?? 0
  if (total > prev) bests.byRace[race] = total
  localStorage.setItem(KEY, JSON.stringify(bests))
  return bests
}

import type { Category } from './types.ts'

export const RACE_IDS = ['human', 'halfling', 'elf', 'dwarf', 'goblin', 'wizard'] as const
export type RaceId = (typeof RACE_IDS)[number]

export type RaceDef = {
  id: RaceId
  name: string
  tagline: string
  boon: string
  /** Upper total needed for Inspiration (+35). */
  inspirationThreshold: number
  /** Added when the category scores above 0 (Bag of Holding always). */
  categoryBonus: Partial<Record<Category, number>>
  /** Replace fixed pattern scores when the pattern hits. */
  scoreOverride: Partial<Record<Category, number>>
  /** Halfling: free single-die rerolls granted each turn. */
  luckyRerollsPerTurn: number
}

export const RACES: Record<RaceId, RaceDef> = {
  human: {
    id: 'human',
    name: 'Human',
    tagline: 'Reliable. Slightly boring. Still wins tavern bets.',
    boon: 'Inspiration at 70 upper (instead of 80)',
    inspirationThreshold: 70,
    categoryBonus: {},
    scoreOverride: {},
    luckyRerollsPerTurn: 0,
  },
  halfling: {
    id: 'halfling',
    name: 'Halfling',
    tagline: 'Small feet. Huge luck. Second breakfast optional.',
    boon: '1 free single-die reroll each turn',
    inspirationThreshold: 80,
    categoryBonus: {},
    scoreOverride: {},
    luckyRerollsPerTurn: 1,
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    tagline: 'Sees the straight from a mile away. Smug about it.',
    boon: 'Initiative & Dungeon Crawl +10 when scored',
    inspirationThreshold: 80,
    categoryBonus: {
      initiative: 10,
      dungeonCrawl: 10,
    },
    scoreOverride: {},
    luckyRerollsPerTurn: 0,
  },
  dwarf: {
    id: 'dwarf',
    name: 'Dwarf',
    tagline: 'If it fits in the bag, it fits in the score.',
    boon: 'Bag of Holding +10 when scored',
    inspirationThreshold: 80,
    categoryBonus: {
      bagOfHolding: 10,
    },
    scoreOverride: {},
    luckyRerollsPerTurn: 0,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    tagline: 'Chaos gremlin. Crits or cries. No middle ground.',
    boon: 'Critical Failure 300 / Critical Success 120',
    inspirationThreshold: 80,
    categoryBonus: {},
    scoreOverride: {
      criticalFailure: 300,
      criticalSuccess: 120,
    },
    luckyRerollsPerTurn: 0,
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    tagline: 'Knows one neat trick. Uses it forever.',
    boon: 'Polymorph & Twinned Spell +15 when scored',
    inspirationThreshold: 80,
    categoryBonus: {
      polymorph: 15,
      twinnedSpell: 15,
    },
    scoreOverride: {},
    luckyRerollsPerTurn: 0,
  },
}

export function raceDef(id: RaceId): RaceDef {
  return RACES[id]
}

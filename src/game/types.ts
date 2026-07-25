import { raceDef, type RaceId } from './races.ts'

/** Fixed polyhedral set: 2 each of d4, d6, d8, d10, d12, d20. */
export const DIE_SIDES = [4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 20, 20] as const
export const DICE_COUNT = DIE_SIDES.length
export const ROLLS_PER_TURN = 3

export const CATEGORIES = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'sevens',
  'eights',
  'nines',
  'tens',
  'magicMissile',
  'partyOfFour',
  'fireball',
  'balancedParty',
  'initiative',
  'dungeonCrawl',
  'polymorph',
  'minMax',
  'success',
  'criticalSuccess',
  'failure',
  'criticalFailure',
  'twinnedSpell',
  'bagOfHolding',
] as const

export type Category = (typeof CATEGORIES)[number]

export const UPPER_SECTION = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'sevens',
  'eights',
  'nines',
  'tens',
] as const satisfies readonly Category[]

export const LOWER_SECTION = [
  'magicMissile',
  'partyOfFour',
  'fireball',
  'balancedParty',
  'initiative',
  'dungeonCrawl',
  'polymorph',
  'minMax',
  'success',
  'criticalSuccess',
  'failure',
  'criticalFailure',
  'twinnedSpell',
  'bagOfHolding',
] as const satisfies readonly Category[]

export type UpperCategory = (typeof UPPER_SECTION)[number]

export const UPPER_FACE: Record<UpperCategory, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
  sevens: 7,
  eights: 8,
  nines: 9,
  tens: 10,
}

export const INSPIRATION_THRESHOLD = 80
export const INSPIRATION_POINTS = 35

export const POLYMORPH_SCORE = 50
export const CRITICAL_FAILURE_SCORE = 250
export const CRITICAL_SUCCESS_SCORE = 100
export const MIN_MAX_SCORE = 50
export const SUCCESS_SCORE = 40
export const FAILURE_SCORE = 35
export const TWINNED_SPELL_SCORE = 45
export const BALANCED_PARTY_SCORE = 30
export const INITIATIVE_SCORE = 30
export const DUNGEON_CRAWL_SCORE = 45

export const UPPER_LABELS: Record<(typeof UPPER_SECTION)[number], string> = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  sevens: 'Sevens',
  eights: 'Eights',
  nines: 'Nines',
  tens: 'Tens',
}

export const LOWER_LABELS: Record<(typeof LOWER_SECTION)[number], string> = {
  magicMissile: 'Magic Missile',
  partyOfFour: 'Party of Four',
  fireball: 'Fireball',
  balancedParty: 'Balanced Party',
  initiative: 'Initiative',
  dungeonCrawl: 'Dungeon Crawl',
  polymorph: 'Polymorph',
  minMax: 'Min-Max',
  success: 'Success',
  criticalSuccess: 'Critical Success',
  failure: 'Failure',
  criticalFailure: 'Critical Failure',
  twinnedSpell: 'Twinned Spell',
  bagOfHolding: 'Bag of Holding',
}

export type Scorecard = Record<Category, number | null>

export interface GameState {
  dice: number[]
  held: boolean[]
  rollsRemaining: number
  scorecard: Scorecard
  turn: number
  gameOver: boolean
  /** True after at least one roll this turn. */
  hasRolled: boolean
  race: RaceId
  luckyRerollsLeft: number
}

export function emptyScorecard(): Scorecard {
  const card = {} as Scorecard
  for (const c of CATEGORIES) card[c] = null
  return card
}

export function newGame(race: RaceId = 'human'): GameState {
  const def = raceDef(race)
  return {
    dice: Array.from({ length: DICE_COUNT }, () => 1),
    held: Array.from({ length: DICE_COUNT }, () => false),
    rollsRemaining: ROLLS_PER_TURN,
    scorecard: emptyScorecard(),
    turn: 1,
    gameOver: false,
    hasRolled: false,
    race,
    luckyRerollsLeft: def.luckyRerollsPerTurn,
  }
}

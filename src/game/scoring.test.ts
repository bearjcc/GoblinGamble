import { describe, expect, it } from 'vitest'
import {
  categoryMaxScore,
  inspirationBonus,
  isCriticalFailure,
  isCriticalSuccess,
  isFailure,
  isMinMax,
  isPolymorph,
  isSuccess,
  isTwinnedSpell,
  rawCategoryScore,
  totalScore,
  upperTotal,
} from './scoring.ts'
import {
  CRITICAL_FAILURE_SCORE,
  CRITICAL_SUCCESS_SCORE,
  DIE_SIDES,
  INSPIRATION_POINTS,
  INSPIRATION_THRESHOLD,
  MIN_MAX_SCORE,
  POLYMORPH_SCORE,
  emptyScorecard,
  type GameState,
} from './types.ts'

function stateWith(
  dice: number[],
  partial: Partial<GameState['scorecard']> = {},
  race: GameState['race'] = 'human',
): GameState {
  const scorecard = emptyScorecard()
  for (const [k, v] of Object.entries(partial)) {
    scorecard[k as keyof typeof scorecard] = v
  }
  return {
    dice,
    held: dice.map(() => false),
    rollsRemaining: 0,
    scorecard,
    turn: 1,
    gameOver: false,
    hasRolled: true,
    race,
    luckyRerollsLeft: 0,
  }
}

describe('goblin upper faces', () => {
  it('scores face sum for ones-tens', () => {
    const dice = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(rawCategoryScore(dice, 'ones')).toBe(3)
    expect(rawCategoryScore(dice, 'tens')).toBe(10)
    expect(rawCategoryScore(dice, 'fives')).toBe(5)
  })

  it('ignores faces above 10 in upper boxes', () => {
    const dice = [4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 20, 20]
    expect(rawCategoryScore(dice, 'tens')).toBe(20)
    expect(rawCategoryScore([11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16], 'tens')).toBe(0)
  })
})

describe('goblin of-a-kind and straights', () => {
  it('scores magic missile / party / fireball on kind thresholds', () => {
    const three = [2, 2, 2, 1, 3, 4, 5, 6, 7, 8, 9, 10]
    const sum3 = three.reduce((a, b) => a + b, 0)
    expect(rawCategoryScore(three, 'magicMissile')).toBe(sum3)
    expect(rawCategoryScore(three, 'partyOfFour')).toBe(0)

    const five = [3, 3, 3, 3, 3, 1, 2, 4, 5, 6, 7, 8]
    const sum5 = five.reduce((a, b) => a + b, 0)
    expect(rawCategoryScore(five, 'fireball')).toBe(sum5)
    expect(rawCategoryScore(five, 'partyOfFour')).toBe(sum5)
  })

  it('scores balanced party with triple + pair', () => {
    const dice = [5, 5, 5, 2, 2, 1, 3, 4, 6, 7, 8, 9]
    expect(rawCategoryScore(dice, 'balancedParty')).toBe(30)
    expect(rawCategoryScore([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'balancedParty')).toBe(0)
  })

  it('scores initiative and dungeon crawl straights', () => {
    const init = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5]
    expect(rawCategoryScore(init, 'initiative')).toBe(30)
    expect(rawCategoryScore(init, 'dungeonCrawl')).toBe(0)

    const crawl = [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 8]
    expect(rawCategoryScore(crawl, 'dungeonCrawl')).toBe(45)
  })
})

describe('goblin D&D patterns', () => {
  it('detects min-max, success, critical success', () => {
    const minMax = [1, 4, 1, 6, 1, 8, 1, 10, 1, 12, 1, 20]
    expect(isMinMax(minMax)).toBe(true)
    expect(rawCategoryScore(minMax, 'minMax')).toBe(MIN_MAX_SCORE)

    const success = [4, 2, 6, 1, 8, 3, 10, 5, 12, 7, 20, 9]
    expect(isSuccess(success)).toBe(true)
    expect(rawCategoryScore(success, 'success')).toBe(40)

    const crit = DIE_SIDES.slice() as unknown as number[]
    expect(isCriticalSuccess(crit)).toBe(true)
    expect(rawCategoryScore(crit, 'criticalSuccess')).toBe(CRITICAL_SUCCESS_SCORE)
  })

  it('detects failure, critical failure, twinned spell, polymorph', () => {
    const failure = [1, 3, 1, 5, 1, 7, 1, 9, 1, 11, 1, 19]
    expect(isFailure(failure)).toBe(true)
    expect(rawCategoryScore(failure, 'failure')).toBe(35)

    const allOnes = Array(12).fill(1)
    expect(isCriticalFailure(allOnes)).toBe(true)
    expect(isPolymorph(allOnes)).toBe(true)
    expect(rawCategoryScore(allOnes, 'criticalFailure')).toBe(CRITICAL_FAILURE_SCORE)
    expect(rawCategoryScore(allOnes, 'polymorph')).toBe(POLYMORPH_SCORE)
    expect(CRITICAL_FAILURE_SCORE).toBeGreaterThan(POLYMORPH_SCORE * 4)

    const twin = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]
    expect(isTwinnedSpell(twin)).toBe(true)
    expect(rawCategoryScore(twin, 'twinnedSpell')).toBe(45)

    const poly2 = Array(12).fill(2)
    expect(isPolymorph(poly2)).toBe(true)
    expect(isCriticalFailure(poly2)).toBe(false)
  })

  it('scores bag of holding as sum', () => {
    const dice = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    expect(rawCategoryScore(dice, 'bagOfHolding')).toBe(78)
  })
})

describe('goblin inspiration', () => {
  it('adds inspiration when upper reaches threshold', () => {
    const card = emptyScorecard()
    card.ones = 12
    card.twos = 24
    card.threes = 36
    card.fours = 8
    expect(upperTotal(card)).toBe(80)
    expect(inspirationBonus(card, 'halfling')).toBe(INSPIRATION_POINTS)
    expect(INSPIRATION_THRESHOLD).toBe(80)

    const st = stateWith(Array(12).fill(1), card, 'halfling')
    for (const c of Object.keys(st.scorecard) as (keyof typeof st.scorecard)[]) {
      if (st.scorecard[c] === null) st.scorecard[c] = 0
    }
    expect(totalScore(st)).toBe(80 + INSPIRATION_POINTS)
  })

  it('gives humans inspiration at 70', () => {
    const card = emptyScorecard()
    card.ones = 12
    card.twos = 24
    card.threes = 36
    expect(upperTotal(card)).toBe(72)
    expect(inspirationBonus(card, 'human')).toBe(INSPIRATION_POINTS)
    expect(inspirationBonus(card, 'elf')).toBe(0)
  })
})

describe('categoryMaxScore', () => {
  it('is positive for every category', () => {
    expect(categoryMaxScore('criticalFailure')).toBe(CRITICAL_FAILURE_SCORE)
    expect(categoryMaxScore('polymorph')).toBe(POLYMORPH_SCORE)
    expect(categoryMaxScore('tens')).toBe(60)
  })
})

describe('race score tweaks', () => {
  it('elf boosts initiative and dungeon crawl', () => {
    const init = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5]
    expect(rawCategoryScore(init, 'initiative', 'elf')).toBe(40)
    expect(rawCategoryScore(init, 'initiative', 'human')).toBe(30)

    const crawl = [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 8]
    expect(rawCategoryScore(crawl, 'dungeonCrawl', 'elf')).toBe(55)
    expect(rawCategoryScore(crawl, 'initiative', 'elf')).toBe(40)
  })

  it('dwarf boosts bag of holding', () => {
    const dice = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    expect(rawCategoryScore(dice, 'bagOfHolding', 'dwarf')).toBe(88)
  })

  it('goblin overrides crit scores', () => {
    const allOnes = Array(12).fill(1)
    const crit = DIE_SIDES.slice() as unknown as number[]
    expect(rawCategoryScore(allOnes, 'criticalFailure', 'goblin')).toBe(300)
    expect(rawCategoryScore(crit, 'criticalSuccess', 'goblin')).toBe(120)
  })

  it('wizard boosts polymorph and twinned spell', () => {
    const poly = Array(12).fill(2)
    const twin = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]
    expect(rawCategoryScore(poly, 'polymorph', 'wizard')).toBe(65)
    expect(rawCategoryScore(twin, 'twinnedSpell', 'wizard')).toBe(60)
    expect(rawCategoryScore(twin, 'twinnedSpell', 'human')).toBe(45)
  })

  it('does not apply pattern bonus when pattern misses', () => {
    const junk = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3]
    expect(rawCategoryScore(junk, 'initiative', 'elf')).toBe(0)
    expect(rawCategoryScore(junk, 'polymorph', 'wizard')).toBe(0)
  })
})

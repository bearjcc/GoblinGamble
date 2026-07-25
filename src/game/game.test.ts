import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../engine/rng.ts'
import { luckyReroll, playGame, playGameResult, rollDice, setHolds } from './game.ts'
import { CATEGORIES, DIE_SIDES, DICE_COUNT, newGame } from './types.ts'

describe('goblin game loop', () => {
  it('has 24 categories', () => {
    expect(CATEGORIES.length).toBe(24)
  })

  it('rolls dice within each die sides', () => {
    const rng = mulberry32(42)
    let state = newGame('human')
    state = rollDice(state, rng)
    expect(state.dice).toHaveLength(DICE_COUNT)
    for (let i = 0; i < DICE_COUNT; i++) {
      expect(state.dice[i]).toBeGreaterThanOrEqual(1)
      expect(state.dice[i]).toBeLessThanOrEqual(DIE_SIDES[i]!)
    }
    expect(state.rollsRemaining).toBe(2)
    expect(state.hasRolled).toBe(true)
  })

  it('completes 24 turns and fills the scorecard', () => {
    const rng = mulberry32(7)
    let turn = 0
    const result = playGameResult(rng, (state) => {
      turn++
      const open = CATEGORIES.filter((c) => state.scorecard[c] === null)
      return {
        scoreNow: true,
        held: Array(DICE_COUNT).fill(false),
        category: open[0]!,
      }
    })
    expect(CATEGORIES.every((c) => result.scorecard[c] !== null)).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(turn).toBe(CATEGORIES.length)
  })

  it('playGame matches playGameResult total', () => {
    const mk = () => {
      return (state: ReturnType<typeof newGame>) => {
        const open = CATEGORIES.filter((c) => state.scorecard[c] === null)
        return {
          scoreNow: true,
          held: Array(DICE_COUNT).fill(false),
          category: open[0]!,
        }
      }
    }
    const a = playGame(mulberry32(99), mk())
    const b = playGameResult(mulberry32(99), mk()).total
    expect(a).toBe(b)
  })

  it('respects holds on second roll', () => {
    const rng = mulberry32(1)
    let state = newGame()
    state = rollDice(state, rng)
    const first = state.dice.slice()
    state = setHolds(
      state,
      first.map((_, i) => i < 6),
    )
    state = rollDice(state, rng)
    for (let i = 0; i < 6; i++) expect(state.dice[i]).toBe(first[i])
  })
})

describe('halfling lucky reroll', () => {
  it('starts with one lucky reroll and consumes it', () => {
    const rng = mulberry32(123)
    let state = newGame('halfling')
    expect(state.luckyRerollsLeft).toBe(1)
    state = rollDice(state, rng)
    const before = state.dice[0]!
    // Force many rerolls until value changes or we prove API works
    let next = luckyReroll(state, 0, rng)
    expect(next.luckyRerollsLeft).toBe(0)
    expect(next.rollsRemaining).toBe(state.rollsRemaining)
    expect(next.dice[0]).toBeGreaterThanOrEqual(1)
    expect(next.dice[0]).toBeLessThanOrEqual(4)
    // second lucky fails
    const blocked = luckyReroll(next, 0, rng)
    expect(blocked).toEqual(next)
    void before
  })

  it('non-halflings cannot lucky reroll', () => {
    const rng = mulberry32(5)
    let state = newGame('elf')
    state = rollDice(state, rng)
    state = { ...state, luckyRerollsLeft: 1 }
    const same = luckyReroll(state, 0, rng)
    expect(same).toEqual(state)
  })
})

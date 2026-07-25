import { mulberry32, randomSeed, type Rng } from '../engine/rng.ts'
import {
  DIE_SIDES,
  DICE_COUNT,
  LOWER_LABELS,
  LOWER_SECTION,
  UPPER_LABELS,
  UPPER_SECTION,
  inspirationThresholdFor,
  luckyReroll,
  newGame,
  openCategories,
  raceDef,
  rawCategoryScore,
  rollDice,
  scoreCategory,
  toggleHold,
  totalScore,
  upperTotal,
  inspirationBonus,
  type Category,
  type GameState,
  type RaceId,
  RACES,
  RACE_IDS,
} from '../game/index.ts'
import { loadBests, recordScore, type BestScores } from '../storage.ts'

type Screen = 'title' | 'play' | 'results'

type AppModel = {
  screen: Screen
  selectedRace: RaceId
  state: GameState | null
  rng: Rng
  luckyPick: boolean
  lastScored: Category | null
  finalTotal: number
  finalInspiration: number
  bests: BestScores
  showRules: boolean
}

const root = () => document.getElementById('app')!

function createModel(): AppModel {
  return {
    screen: 'title',
    selectedRace: 'human',
    state: null,
    rng: mulberry32(randomSeed()),
    luckyPick: false,
    lastScored: null,
    finalTotal: 0,
    finalInspiration: 0,
    bests: loadBests(),
    showRules: false,
  }
}

let model = createModel()

export function startApp(): void {
  model = createModel()
  render()
}

function render(): void {
  const el = root()
  if (model.screen === 'title') el.replaceChildren(renderTitle())
  else if (model.screen === 'play') el.replaceChildren(renderPlay())
  else el.replaceChildren(renderResults())
}

function renderTitle(): HTMLElement {
  const screen = el('div', 'screen')
  const hero = el('section', 'hero hero-panel')
  hero.append(
    el('h1', 'brand', 'Goblin Gamble'),
    el(
      'p',
      'tagline',
      'Twelve polyhedral dice. Twenty-four boxes of dungeon nonsense. Pick a race, roll loud, and pretend the Critical Failure was intentional.',
    ),
  )

  const pick = el('section', 'panel')
  pick.append(el('h2', 'section-title', 'Choose your race'))

  const grid = el('div', 'race-grid')
  for (const id of RACE_IDS) {
    const race = RACES[id]
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'race-card'
    btn.setAttribute('aria-pressed', String(id === model.selectedRace))
    btn.innerHTML = `<h3>${escapeHtml(race.name)}</h3><p>${escapeHtml(race.boon)}</p>`
    btn.addEventListener('click', () => {
      model.selectedRace = id
      render()
    })
    grid.append(btn)
  }
  pick.append(grid)

  const selected = raceDef(model.selectedRace)
  pick.append(el('p', 'tagline', selected.tagline))

  const actions = el('div', 'actions')
  const play = button('Roll into the dungeon', 'btn btn-primary', () => {
    model.rng = mulberry32(randomSeed())
    model.state = newGame(model.selectedRace)
    model.luckyPick = false
    model.lastScored = null
    model.screen = 'play'
    render()
  })
  actions.append(play)
  pick.append(actions)

  const how = document.createElement('details')
  how.className = 'how-to'
  how.open = model.showRules
  how.addEventListener('toggle', () => {
    model.showRules = how.open
  })
  how.innerHTML = `
    <summary>How to play</summary>
    <ul>
      <li>Each turn you get up to 3 rolls of the fixed set: 2×d4, d6, d8, d10, d12, d20.</li>
      <li>Tap dice to hold them, then roll again — or bank a scorecard box now.</li>
      <li>Fill all 24 boxes. Upper Ones–Tens need faces 1–10. Inspiration (+35) kicks in when your upper total hits the race threshold.</li>
      <li>Lower boxes are D&amp;D-flavoured patterns: of-a-kinds, straights, crits, twins, and the ever-greedy Bag of Holding.</li>
      <li>Halflings get one free single-die Lucky Reroll each turn.</li>
    </ul>
  `

  screen.append(hero, pick, how)
  return screen
}

function renderPlay(): HTMLElement {
  const state = model.state!
  const race = raceDef(state.race)
  const screen = el('div', 'screen')

  const top = el('div', 'play-top')
  top.append(el('h1', 'play-brand', 'Goblin Gamble'))
  const meta = el('div', 'meta-row')
  meta.append(
    chip(`${race.name}`),
    chip(`Turn ${Math.min(state.turn, 24)} / 24`),
    chip(`Rolls left: ${state.rollsRemaining}`),
    chip(`Score: ${totalScore(state)}`),
  )
  if (state.luckyRerollsLeft > 0) meta.append(chip(`Lucky: ${state.luckyRerollsLeft}`))
  top.append(meta)
  screen.append(top)

  const grid = el('div', 'play-grid')
  grid.append(renderTray(state), renderScorecard(state))
  screen.append(grid)

  const boon = el('p', 'tagline')
  boon.style.marginTop = '1rem'
  boon.textContent = `Boon: ${race.boon} · Inspiration at ${inspirationThresholdFor(state.race)} upper`
  screen.append(boon)

  return screen
}

function renderTray(state: GameState): HTMLElement {
  const panel = el('section', 'panel')
  const tray = el('div', 'tray')
  const dice = el('div', 'dice-grid')

  for (let i = 0; i < DICE_COUNT; i++) {
    const sides = DIE_SIDES[i]!
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'die'
    if (state.held[i]) btn.classList.add('held')
    if (model.luckyPick) btn.classList.add('lucky-target')
    btn.dataset.sides = String(sides)
    btn.innerHTML = `<span class="face">${state.hasRolled ? state.dice[i] : '?'}</span><span class="sides">d${sides}</span>`
    btn.disabled = !state.hasRolled || state.gameOver
    btn.setAttribute(
      'aria-label',
      `d${sides} showing ${state.hasRolled ? state.dice[i] : 'unrolled'}${state.held[i] ? ', held' : ''}`,
    )
    btn.addEventListener('click', () => onDieClick(i))
    dice.append(btn)
  }
  tray.append(dice)

  const hint = el('p', 'hint')
  if (!state.hasRolled) hint.textContent = 'Smash Roll to tumble the whole party.'
  else if (model.luckyPick) hint.textContent = 'Pick one die for your Lucky Reroll.'
  else if (state.rollsRemaining === 0) hint.textContent = 'No rolls left — score a box.'
  else hint.textContent = 'Hold keepers, roll again, or score now.'

  tray.append(hint)

  const controls = el('div', 'controls')
  const canRoll = !state.gameOver && state.rollsRemaining > 0
  const rollBtn = button(state.hasRolled ? 'Roll again' : 'Roll', 'btn btn-primary', () => {
    if (!model.state) return
    model.state = rollDice(model.state, model.rng)
    model.luckyPick = false
    model.lastScored = null
    animateDice()
    render()
  })
  rollBtn.disabled = !canRoll

  const clearHolds = button('Clear holds', 'btn btn-secondary', () => {
    if (!model.state?.hasRolled || model.state.rollsRemaining <= 0) return
    model.state = { ...model.state, held: Array(DICE_COUNT).fill(false) }
    render()
  })
  clearHolds.disabled = !state.hasRolled || state.rollsRemaining <= 0 || !state.held.some(Boolean)

  controls.append(rollBtn, clearHolds)

  if (raceDef(state.race).luckyRerollsPerTurn > 0) {
    const lucky = button(
      model.luckyPick ? 'Cancel lucky' : 'Lucky Reroll',
      'btn',
      () => {
        if (!model.state || model.state.luckyRerollsLeft <= 0) return
        model.luckyPick = !model.luckyPick
        render()
      },
    )
    lucky.disabled = !state.hasRolled || state.luckyRerollsLeft <= 0 || state.gameOver
    controls.append(lucky)
  }

  const quit = button('Quit to title', 'btn btn-ghost', () => {
    model.screen = 'title'
    model.state = null
    model.luckyPick = false
    render()
  })
  controls.append(quit)

  panel.append(tray, controls)
  return panel
}

function renderScorecard(state: GameState): HTMLElement {
  const panel = el('section', 'panel')
  const table = document.createElement('table')
  table.className = 'scorecard'

  const open = new Set(openCategories(state))
  const canScore = state.hasRolled && !state.gameOver

  table.append(sectionHeader('Upper section'))
  for (const cat of UPPER_SECTION) {
    table.append(categoryRow(state, cat, UPPER_LABELS[cat], open.has(cat), canScore))
  }

  const up = upperTotal(state.scorecard)
  const insp = inspirationBonus(state.scorecard, state.race)
  const threshold = inspirationThresholdFor(state.race)
  table.append(totalRow(`Upper (${up}/${threshold})`, String(up)))
  table.append(totalRow('Inspiration', insp > 0 ? `+${insp}` : `need ${threshold}`))

  table.append(sectionHeader('Lower section'))
  for (const cat of LOWER_SECTION) {
    table.append(categoryRow(state, cat, LOWER_LABELS[cat], open.has(cat), canScore))
  }

  table.append(totalRow('Grand total', String(totalScore(state))))
  panel.append(table)
  return panel
}

function sectionHeader(label: string): HTMLTableRowElement {
  const tr = document.createElement('tr')
  const th = document.createElement('th')
  th.colSpan = 1
  th.textContent = label
  tr.append(th)
  return tr
}

function totalRow(label: string, value: string): HTMLTableRowElement {
  const tr = document.createElement('tr')
  tr.className = 'totals'
  const td = document.createElement('td')
  td.innerHTML = `<span>${escapeHtml(label)}</span><strong style="float:right">${escapeHtml(value)}</strong>`
  tr.append(td)
  return tr
}

function categoryRow(
  state: GameState,
  cat: Category,
  label: string,
  isOpen: boolean,
  canScore: boolean,
): HTMLTableRowElement {
  const tr = document.createElement('tr')
  const td = document.createElement('td')
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'cat'
  const filled = state.scorecard[cat]
  if (filled !== null) btn.classList.add('filled')
  if (model.lastScored === cat) btn.classList.add('pop')

  const preview =
    filled !== null
      ? String(filled)
      : state.hasRolled
        ? String(rawCategoryScore(state.dice, cat, state.race))
        : '—'

  btn.innerHTML = `<span>${escapeHtml(label)}</span><span class="preview ${isOpen && state.hasRolled ? 'open' : ''}">${escapeHtml(preview)}</span>`
  btn.disabled = !canScore || !isOpen
  btn.addEventListener('click', () => onScore(cat))
  td.append(btn)
  tr.append(td)
  return tr
}

function renderResults(): HTMLElement {
  const race = raceDef(model.selectedRace)
  const screen = el('div', 'screen results panel')
  screen.append(el('h1', 'brand', 'Goblin Gamble'))
  screen.append(el('p', 'tagline', `${race.name} cleared the dungeon.`))
  screen.append(el('div', 'big-score', String(model.finalTotal)))
  screen.append(
    el(
      'p',
      'sub',
      model.finalInspiration > 0
        ? `Inspiration secured (+${model.finalInspiration}). Absolute legend.`
        : 'No Inspiration this time. The dice committee is disappointed.',
    ),
  )

  const bests = el('div', 'bests')
  bests.append(el('div', '', `Best ever: ${model.bests.allTime || '—'}`))
  bests.append(el('div', '', `Best as ${race.name}: ${model.bests.byRace[model.selectedRace] ?? '—'}`))
  screen.append(bests)

  const actions = el('div', 'actions')
  actions.style.justifyContent = 'center'
  actions.append(
    button('Play again', 'btn btn-primary', () => {
      model.rng = mulberry32(randomSeed())
      model.state = newGame(model.selectedRace)
      model.luckyPick = false
      model.lastScored = null
      model.screen = 'play'
      render()
    }),
    button('Change race', 'btn btn-secondary', () => {
      model.screen = 'title'
      model.state = null
      render()
    }),
  )
  screen.append(actions)
  return screen
}

function onDieClick(index: number): void {
  if (!model.state?.hasRolled || model.state.gameOver) return
  if (model.luckyPick) {
    model.state = luckyReroll(model.state, index, model.rng)
    model.luckyPick = false
    animateDie(index)
    render()
    return
  }
  if (model.state.rollsRemaining <= 0) return
  model.state = toggleHold(model.state, index)
  render()
}

function onScore(category: Category): void {
  if (!model.state?.hasRolled || model.state.gameOver) return
  model.state = scoreCategory(model.state, category)
  model.lastScored = category
  model.luckyPick = false

  if (model.state.gameOver) {
    model.finalTotal = totalScore(model.state)
    model.finalInspiration = inspirationBonus(model.state.scorecard, model.state.race)
    model.bests = recordScore(model.state.race, model.finalTotal)
    model.screen = 'results'
  }
  render()
}

function animateDice(): void {
  requestAnimationFrame(() => {
    document.querySelectorAll('.die').forEach((node) => {
      node.classList.remove('rolling')
      // force reflow
      void (node as HTMLElement).offsetWidth
      node.classList.add('rolling')
    })
  })
}

function animateDie(index: number): void {
  requestAnimationFrame(() => {
    const node = document.querySelectorAll('.die')[index]
    if (!node) return
    node.classList.remove('rolling')
    void (node as HTMLElement).offsetWidth
    node.classList.add('rolling')
  })
}

function chip(text: string): HTMLElement {
  return el('span', 'meta-chip', text)
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = className
  btn.textContent = label
  btn.addEventListener('click', onClick)
  return btn
}

function el(tag: string, className = '', text?: string): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

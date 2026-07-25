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
  el.dataset.screen = model.screen
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

/** Compact score labels for handheld density. Full names stay in aria-label. */
const SHORT_UPPER: Record<(typeof UPPER_SECTION)[number], string> = {
  ones: '1s',
  twos: '2s',
  threes: '3s',
  fours: '4s',
  fives: '5s',
  sixes: '6s',
  sevens: '7s',
  eights: '8s',
  nines: '9s',
  tens: '10s',
}

const SHORT_LOWER: Record<(typeof LOWER_SECTION)[number], string> = {
  magicMissile: 'Missile',
  partyOfFour: 'Party4',
  fireball: 'Fireball',
  balancedParty: 'Balance',
  initiative: 'Init',
  dungeonCrawl: 'Crawl',
  polymorph: 'Poly',
  minMax: 'MinMax',
  success: 'Success',
  criticalSuccess: 'Crit+',
  failure: 'Fail',
  criticalFailure: 'Crit-',
  twinnedSpell: 'Twin',
  bagOfHolding: 'Bag',
}

function renderPlay(): HTMLElement {
  const state = model.state!
  const race = raceDef(state.race)
  const shell = el('div', 'screen play-shell')

  shell.append(renderStatusBar(state, race.name))
  shell.append(renderScorecard(state))
  shell.append(renderDock(state))
  return shell
}

function renderStatusBar(state: GameState, raceName: string): HTMLElement {
  const bar = el('header', 'status-bar')
  const left = el('div', 'status-left')
  left.append(
    el('span', 'status-brand', 'Goblin Gamble'),
    el('span', 'status-sep', '·'),
    el('span', 'status-race', raceName),
  )

  const mid = el('div', 'status-mid')
  mid.append(
    el('span', 'status-item', `T${Math.min(state.turn, 24)}/24`),
    el('span', 'status-item', `Scr ${totalScore(state)}`),
  )

  const rolls = el('span', 'status-rolls')
  rolls.setAttribute('aria-label', `${state.rollsRemaining} rolls left`)
  const max = 3
  for (let i = 0; i < max; i++) {
    const pip = el('span', i < state.rollsRemaining ? 'roll-pip on' : 'roll-pip')
    pip.textContent = '●'
    rolls.append(pip)
  }
  mid.append(rolls)

  if (state.luckyRerollsLeft > 0) {
    mid.append(el('span', 'status-item status-lucky', `L${state.luckyRerollsLeft}`))
  }

  const quit = button('×', 'btn-icon status-quit', () => {
    model.screen = 'title'
    model.state = null
    model.luckyPick = false
    render()
  })
  quit.setAttribute('aria-label', 'Quit')
  quit.title = 'Quit'

  bar.append(left, mid, quit)
  return bar
}

function renderDock(state: GameState): HTMLElement {
  const dock = el('section', 'play-dock')
  const dice = el('div', 'dice-grid')

  for (let i = 0; i < DICE_COUNT; i++) {
    const sides = DIE_SIDES[i]!
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'die'
    if (state.held[i]) btn.classList.add('held')
    if (model.luckyPick) btn.classList.add('lucky-target')
    btn.dataset.sides = String(sides)
    const face = state.hasRolled ? String(state.dice[i]) : '?'
    btn.innerHTML = `<span class="face">${face}</span><span class="die-mark" aria-hidden="true">${sides}</span>`
    btn.disabled = !state.hasRolled || state.gameOver
    btn.setAttribute(
      'aria-label',
      `d${sides} showing ${state.hasRolled ? state.dice[i] : 'unrolled'}${state.held[i] ? ', held' : ''}`,
    )
    btn.addEventListener('click', () => onDieClick(i))
    dice.append(btn)
  }
  dock.append(dice)

  const hint = el('p', 'hint')
  if (!state.hasRolled) hint.textContent = 'Roll to start.'
  else if (model.luckyPick) hint.textContent = 'Pick a die for Lucky.'
  else if (state.rollsRemaining === 0) hint.textContent = 'Score a box.'
  else hint.textContent = 'Hold · roll · or score'
  dock.append(hint)

  const controls = el('div', 'controls')
  const canRoll = !state.gameOver && state.rollsRemaining > 0
  const rollBtn = button(state.hasRolled ? 'Roll again' : 'Roll', 'btn btn-primary btn-roll', () => {
    if (!model.state) return
    model.state = rollDice(model.state, model.rng)
    model.luckyPick = false
    model.lastScored = null
    animateDice()
    render()
  })
  rollBtn.disabled = !canRoll

  const secondary = el('div', 'controls-secondary')
  const clearHolds = button('Clear holds', 'btn btn-ghost btn-secondary-action', () => {
    if (!model.state?.hasRolled || model.state.rollsRemaining <= 0) return
    model.state = { ...model.state, held: Array(DICE_COUNT).fill(false) }
    render()
  })
  clearHolds.disabled = !state.hasRolled || state.rollsRemaining <= 0 || !state.held.some(Boolean)
  secondary.append(clearHolds)

  if (raceDef(state.race).luckyRerollsPerTurn > 0) {
    const lucky = button(
      model.luckyPick ? 'Cancel lucky' : 'Lucky',
      'btn btn-ghost btn-secondary-action',
      () => {
        if (!model.state || model.state.luckyRerollsLeft <= 0) return
        model.luckyPick = !model.luckyPick
        render()
      },
    )
    lucky.disabled = !state.hasRolled || state.luckyRerollsLeft <= 0 || state.gameOver
    secondary.append(lucky)
  }

  controls.append(rollBtn, secondary)
  dock.append(controls)
  return dock
}

function renderScorecard(state: GameState): HTMLElement {
  const panel = el('section', 'play-scorecard')
  const open = new Set(openCategories(state))
  const canScore = state.hasRolled && !state.gameOver

  const grid = el('div', 'score-grid')
  const upperCol = el('div', 'score-col score-upper')
  const lowerCol = el('div', 'score-col score-lower')

  upperCol.append(el('div', 'score-col-head', 'Upper'))
  for (const cat of UPPER_SECTION) {
    upperCol.append(
      categoryCell(state, cat, SHORT_UPPER[cat], UPPER_LABELS[cat], open.has(cat), canScore),
    )
  }

  const up = upperTotal(state.scorecard)
  const insp = inspirationBonus(state.scorecard, state.race)
  const threshold = inspirationThresholdFor(state.race)
  upperCol.append(metaCell(`Up ${up}/${threshold}`, String(up)))
  upperCol.append(metaCell('Insp', insp > 0 ? `+${insp}` : `≥${threshold}`))
  // Pad to match lower column row count so row heights stay uniform.
  upperCol.append(el('div', 'score-spacer'), el('div', 'score-spacer'))

  lowerCol.append(el('div', 'score-col-head', 'Lower'))
  for (const cat of LOWER_SECTION) {
    lowerCol.append(
      categoryCell(state, cat, SHORT_LOWER[cat], LOWER_LABELS[cat], open.has(cat), canScore),
    )
  }

  grid.append(upperCol, lowerCol)
  panel.append(grid)

  const footer = el('div', 'score-footer')
  footer.append(el('span', '', 'Total'), el('strong', '', String(totalScore(state))))
  panel.append(footer)
  return panel
}

function metaCell(label: string, value: string): HTMLElement {
  const row = el('div', 'score-meta')
  row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`
  return row
}

function categoryCell(
  state: GameState,
  cat: Category,
  shortLabel: string,
  fullLabel: string,
  isOpen: boolean,
  canScore: boolean,
): HTMLElement {
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

  btn.innerHTML = `<span class="cat-label">${escapeHtml(shortLabel)}</span><span class="preview ${isOpen && state.hasRolled ? 'open' : ''}">${escapeHtml(preview)}</span>`
  btn.setAttribute('aria-label', `${fullLabel}: ${preview}`)
  btn.title = fullLabel
  btn.disabled = !canScore || !isOpen
  btn.addEventListener('click', () => onScore(cat))
  return btn
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

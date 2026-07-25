# Goblin Gamble

Single-player browser dice game: twelve polyhedral dice, a 24-box D&D-flavoured scorecard, and race boons that refuse to take themselves seriously.

Play locally or on GitHub Pages. No accounts, no server — scores stay in your browser.

## Play

```bash
npm install
npm run dev
```

Open the Vite URL, pick a race, roll.

## Race boons

| Race | Boon |
|---|---|
| Human | Inspiration at 70 upper (instead of 80) |
| Halfling | 1 free single-die reroll each turn |
| Elf | Initiative & Dungeon Crawl +10 when scored |
| Dwarf | Bag of Holding +10 when scored |
| Goblin | Critical Failure 300 / Critical Success 120 |
| Wizard | Polymorph & Twinned Spell +15 when scored |

All races keep 3 rolls per turn.

## Rules (short)

- Fixed dice: 2×d4, 2×d6, 2×d8, 2×d10, 2×d12, 2×d20
- Up to 3 rolls per turn; hold dice between rolls, then score an open box
- Upper: Ones–Tens (faces 1–10)
- Lower: Magic Missile, Party of Four, Fireball, Balanced Party, Initiative, Dungeon Crawl, Polymorph, Min-Max, Success, Critical Success, Failure, Critical Failure, Twinned Spell, Bag of Holding
- Inspiration +35 when upper total hits your race threshold

Rules engine ported from [bearjcc/yahtzee](https://github.com/bearjcc/yahtzee) Goblin Gamble.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Local Vite server |
| `npm test` | Vitest |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

## GitHub Pages

Site: `https://bearjcc.github.io/GoblinGamble/` (Vite `base` is `/GoblinGamble/`).

Production files are built into `docs/`. Pushes to `main` run
`.github/workflows/pages.yml` (test → build → commit `docs/`).

### Required Pages setting

This repo must **not** use Pages from branch `main` + `/` (root). That serves the
Vite `index.html`, which loads `/src/main.ts` and shows a blank page (MIME error).

Use either:

1. **Branch deploy (simple):** Settings → Pages → Deploy from a branch →
   `main` / **`/docs`** → Save
2. **GitHub Actions:** Settings → Pages → Source → **GitHub Actions** → Save,
   then re-run the Deploy GitHub Pages workflow

After changing the setting, wait a minute and hard-refresh the site.

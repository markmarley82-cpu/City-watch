# Player recruit art: what is in the game, and what is still needed

Updated 18 November 2026. The art team's registered recruit sheets are in
`art-review/player-recruit/v2/` (see its README). `tools/make-recruit-atlases.py` turns them
into game atlases in `dist/assets/characters-drawn-v1/fresh/`. The earlier 4 x 4 studies
stay in `art-review/player-recruit/` for reference.

## What players see now

| Art team prefix | Game body | Who sees it |
|---|---|---|
| `watch-recruit` | `watch-recruit` (default human) | player, partner, NPCs |
| `watch-recruit-female` | `watch-recruit-female` | player, partner, NPCs |
| `watch-recruit-dark` | `watch-recruit-dark` | player, partner, NPCs |
| `dwarf-recruit` | `p3_dwarf_02` (red-bearded dwarf) | player, NPCs |
| `troll-recruit` | `p3_troll_01` (stone troll) | player, NPCs |

- **The new art covers all nine moves** (idle, walk, punch, guard, hit, shove, restrain,
  surrender, down) and the **truncheon strike**.
- **These recruits still use the current art** until kit is drawn on the new frames:
  - anyone wearing Armoury armour, a coat colour, a different head, or a helmet, trousers
    or boots choice;
  - anyone holding the service sword or crossbow.
- **Portraits** are unchanged.

## Still to do

1. **Kit on the new art (developer).** The art team has delivered fitted armour, coat
   and region masks and alternate heads (`v2/README.md`). The game needs a small
   compositor to draw them.
2. **Sword and crossbow (art team).** These are drawn on top of the body at hand points
   measured on the current frames. The new frames need their own hand points: for each
   body, the hand position (x, y) in every cell of the 6 x 9 grid, or sword and crossbow
   sheets drawn on the grid.
3. **Truncheon strike kit (art team).** The kit sheets cover the body grid only. Armour,
   heads and masks for the six truncheon frames would stop the armour disappearing during
   a strike.
4. **Troll armour shoulder (art team, minor).** The armour has a perfectly round cut-out
   where the shoulder sits in front of it. It's barely visible at game size, but a cut-out
   following the shoulder's outline would read better.
5. **The silver-bearded dwarf** (`p3_dwarf_01`) needs its own approved study.

## How it works in the code

- **Build:** `python3 tools/make-recruit-atlases.py art-review/player-recruit/v2 dist`
  scales every cell by 5/6, to body cells of 160 x 160 and truncheon cells of 213 x 160.
  - That puts the human at about the resolution of the current art (98 px tall) and
    keeps each decoded atlas near the current size. The street's character cache has a
    fixed memory budget.
  - visibleHeight is the measured idle height, so in-game sizes don't change.
  - The script registers the art in both catalogues: `fresh` (with `fresh.truncheon`) on
    the body in `characters-drawn-v1/manifest.json`, and `variants.fresh` /
    `variants.freshTruncheon` in `race-recruits-v2/manifest.json`.
- **Drawing:**
  - `cw-race-player.js` draws the player for bodies in `race-recruits-v2`.
  - `cw-drawn-characters.js` draws everyone else, and has a copy in `guild-interiors/`.
  - Both use the fresh art whenever nothing fitted to the current atlas is drawn. Until
    the fresh art has loaded, they draw the current atlas.
  - Street NPCs load only the idle and walk rows of the fresh art, as they do for the
    current art. A fresh atlas in memory is enough to draw: the current one isn't
    needed.
- **Rebuilding:** rerun the script when the art changes. The current atlases are never
  modified.

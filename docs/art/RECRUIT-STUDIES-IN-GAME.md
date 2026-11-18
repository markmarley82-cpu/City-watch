# Player recruit artwork in the game

## Full recruit sheets

The five bodies in the table below now use the same artwork on the map, in rooms and
in combat when drawn by the shared character renderer.

- The runtime atlases in `dist/assets/recruit-art-v2/` contain nine body rows plus
  a tenth truncheon row. The body and kit atlases share the same foot anchor.
- The fitted breastplate, mail, jerkin, colour regions and alternate heads use
  the corresponding pose on all ten rows. The stone troll has no coat or painted
  helmet, trousers or boots to tint.
- Original-sized review sheets are on `art/player-recruit-full-set` under
  `art-review/player-recruit/v2/`. Runtime sheets are packed at half resolution
  for mobile decoding.

## Previous four-row study integration

Added 18 November 2026 at the Creative Director's request. The source sheets are the art
team's studies in `art-review/player-recruit/`. `tools/make-recruit-atlases.py` turns
them into game atlases in `dist/assets/characters-drawn-v1/fresh/`.

### Bodies and first-pass coverage

| Study | Game body | Who sees it |
|---|---|---|
| `watch-recruit.webp` | `watch-recruit` (default human) | player, partner, NPCs |
| `watch-recruit-female.webp` | `watch-recruit-female` | player, partner, NPCs |
| `watch-recruit-dark.webp` | `watch-recruit-dark` | player, partner, NPCs |
| `dwarf-recruit.webp` | `p3_dwarf_02` (red-bearded dwarf) | player, NPCs |
| `troll-recruit.webp` | `p3_troll_01` (stone troll) | player, NPCs |

- **Standing, walking, punching and guarding** use the new art.
- **Being hit, shoving, arresting, surrendering and falling down** still use the current
  frames. The studies don't include these moves.
- **Truncheon strikes** still use the current truncheon art. Most players carry a
  truncheon, so in fights their strike is still the old art.
- **Kit keeps the current art.** A recruit wearing Armoury armour (breastplate, service
  mail, leather jerkin), a coat colour, a different head, or a helmet, trousers or boots
  choice is drawn with the current atlas. Those items are fitted frame by frame to the
  current atlas, so they don't fit the new frames.
- **Portraits** are unchanged.

### Original follow-up brief

In priority order:

1. **The five missing moves for each of the five bodies:** hit, shove, restrain,
   surrender and down.
   - The troll comes first. The study troll is broad and faces the front, while the
     current troll frames are a slim side view, so he visibly changes shape mid-fight.
2. **A truncheon strike for each body,** matching the new art: six frames with the
   truncheon in hand.
3. **Six frames per move** instead of four, if possible.
   - The build currently spreads four frames over the game's six slots. The walk holds
     each stride for two ticks, and the idle plays forwards and back.
4. **Kit fitted to the new frames,** so recruits with kit can use the new art too:
   - the three armour pieces;
   - helmet, trousers and boots colour regions;
   - the two head choices;
   - the four coat colours (brown, olive, wine, ochre).

   The current fittings are tied to the exact pixels of the current atlases and were
   made with the team's own tools, which aren't in this repository.
5. **The silver-bearded dwarf** (`p3_dwarf_01`, the first dwarf option) has no study.
   - The red-bearded study went on `p3_dwarf_02`, which matches its look.
   - If the study was meant to replace the silver-bearded dwarf, say so and it can be
     moved over.

#### Review format

- One sheet per body, 6 columns × 9 rows, in this row order: idle, walk, attack, guard,
  hit, shove, restrain, surrender, down.
- Figures face left, with the same foot point in every cell.
- The four studies weren't registered to a common ground line: it drifts by up to 13 px
  between rows. The build script corrects for this by placing each frame by its feet and
  the middle of its head. A registered sheet avoids that guesswork.

### Historical runtime path (retired 18 November 2026)

The first integration built "fresh" atlases with `tools/make-recruit-atlases.py` into
`dist/assets/characters-drawn-v1/fresh/` and drew them from `cw-race-player.js` and
`cw-drawn-characters.js`. A later version on a development branch used the full v2 sheets
the same way. Both were retired in favour of `dist/cw-recruit-art-v2.mjs`, so the game
holds one copy of the recruit art: that module draws the five bodies first, with their
kit, and the other renderers only draw the current art while it loads. Both versions are
in the git history (commits fd8c6b3 and 52379cf) if they are ever needed again.

### Open points

- **Resolution.** The runtime sheets are half size: the human is 58.5 px tall in the
  atlas and drawn 60 px tall. On a phone, at 2x or 3x, that is softer than the previous
  art, which was about 98 px tall. Packing at 5/6 size (about 98 px tall, 160 px cells)
  would cost roughly 2.8x the decoded memory per layer.
- **Sword and crossbow.** `cw-weapon-art.js` places these at hand points measured on the
  previous frames (`CWWeaponGrips` and the fitted-equipment rig), so on the new frames
  they may sit off the hand (not yet checked in game). Hand points measured on the new
  sheets would fix it.
- **Rooms in guild interiors.** `guild-interiors/interior-view.mjs` creates its own
  drawn-character library, so recruits there use the previous art.
- **Troll armour shoulder (minor).** The armour has a perfectly round cut-out where the
  shoulder sits in front of it. It's barely visible at game size, but a cut-out following
  the shoulder's outline would read better.
- **The silver-bearded dwarf** (`p3_dwarf_01`) needs its own approved study.

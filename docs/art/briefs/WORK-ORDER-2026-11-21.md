# Art work order, 21 November 2026

Ordered by Mark. In priority order. Every packet follows the same delivery rules as the
shop-street, dockside, artisan and landmark packets:

- a branch `art/<packet>`, a folder `art-review/<packet>/`, `registration.json`, `README.md` and a review sheet;
- true 2:1 isometric (26.565°), one map cell = 28 × 14 px on screen;
- delivered at 2× game size (drawn at 0.5), transparent WebP;
- doors 65–75 px beside the 60 px officer;
- style matching the approved landmark redraws (`art-review/landmark-grid-redraws/`).

## 1. Final-four follow-up (`art/final-four-landmarks-v2`)

The four new landmarks (Bakery, Wayside Shrine, Crooked Alley House, Watch Outpost) are now in the
game from `art/final-four-landmarks-v1`. To finish them:

- **Night versions pixel-locked to the day paintings**: the same canvas and the same alpha, byte for
  byte, as the landmark-grid night set. The v1 night studies have shifted outlines, so the game only
  takes window positions from them.
- **Roof and walls layers** for each, so the roof can lift away when the player walks behind.
- **Watch Outpost angle**: its left foundation edge measures 24.9°; bring it to 26–27°.
- **More character, optional**: the new Alley House and Outpost are plainer than the old ones. If you
  redo them, keep the crooked lean and jettied floors for the Alley House, and the tower balcony,
  outside stair, banner and WATCH sign for the Outpost.

## 2. Interiors for the 14 new street buildings (`art/street-interiors-v1`)

The 14 street buildings placed on 20 November (cobbler, pawnbroker, curry house, lodging, bonded
warehouse, rope-maker, ship chandler, quay lodging, smithy, cooper, butcher, apothecary, Mark's cooper
workshop, and the cheap lodging common room) can't be entered yet. One room each:

- The same format as the guild rooms in `dist/guild-interiors/assets/rooms/` (for example
  `bakers-v2.webp`): a 1536 × 1024 cutaway diorama on solid black, front walls removed down to a low
  sill, back walls standing.
- The entrance doorway in the front-right wall at the lower right.
- A wide clear floor through the middle for walking, with furniture against the walls.
- Room contents: see `docs/art/midjourney/PROMPTS.md`, Job B, which describes each room.

## 3. Silver-bearded dwarf recruit (`art/recruit-dwarf-silver`)

`p3_dwarf_01`, the first dwarf option, is the last recruit body still on old art. Deliver the full
sheet in the v2 recruit format (`art-review/player-recruit/v2/`): 10 rows × 6 frames of
128 × 96 cells (idle, walk, attack, guard, hit, shove, restrain, surrender, down, truncheon). Include
the kit layers (armour, colour masks, heads), the same foot point, and the same build as
`p3_dwarf_02` but with a long silver beard.

## 4. Conversation portraits (`art/portraits-v1`)

Head-and-shoulders portraits for conversations, 512 × 512, painted in the same style and lit from the upper left:

- Sergeant Colon, Corporal Nobbs, Captain Carrot, Commander Vimes, Mrs Palm, Dibbler;
- for the street cases: a porter, a baker, a net-mender, a stallholder, a dock clerk, a carter.

## On delivery

Claude checks each packet against `docs/art/ART-QUALITY-GATE.md`, fits it into the game, and shows
Mark screenshots before anything goes live.

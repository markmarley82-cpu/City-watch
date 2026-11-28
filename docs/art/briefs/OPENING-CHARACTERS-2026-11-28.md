# Art order, 28 Nov 2026: characters for the opening (Thief on Brass Bridge)

The new opening went live on 28 Nov. For now its people borrow existing street figures, so Mr Hobb looks like a young barman. This order is for seven people of their own, so the first ten minutes of the game look as if they were made for it.

Match the existing street people exactly: same painted style, same isometric angle, same light, and same size on screen as `dist/assets/characters-drawn-v1/farmer.webp`. These are original characters, not characters from the books.

## The people, in the order the player meets them

1. **Breathless runner** (`opening-runner`): a skinny delivery boy, about 14, in a cap that's too big, out of breath, pointing back over his shoulder. Seen at the Watch House door. Needs idle and walk.
2. **Street trader** (`opening-trader`): a stout, loud woman with a tray of pies on a strap and a fierce pointing finger. She tells you which way the thief went. Needs idle and walk.
3. **Robbed carter** (`opening-carter`): a broad, weathered man in his fifties with a whip in his belt, a leather apron and an empty purse string. Angry, not frightened. Needs idle and walk.
4. **The lookout** (`opening-lookout`): a wiry lad of about 17 in a flat cap and a too-big coat, quick and cheeky. He runs, then fights. **Needs the full set:** idle, walk (running feel), attack (wild swing), guard, hit, shove, restrain, surrender, down.
5. **Dispatch clerk** (`opening-clerk`): a thin, fussy older man with ink-stained fingers, spectacles, a tally board and a pencil behind his ear. Needs idle and walk.
6. **Mr Ernest Hobb, carrier** (`opening-hobb`): fifties, prosperous gone to seed, with a good coat over a carrier's waistcoat, mutton-chop whiskers, a ledger under his arm and a short cudgel. Smug until cornered. **Needs the full set** (he fights at the end of the case).
7. **Hobb's collector** (`opening-collector`): a heavy-set man in a borrowed Watch sash that doesn't fit, with a moneybag on his belt. He's the one taking money from carters on the bridge. **Needs the full set.**

## Sheet format (the same as every street figure)

- One WebP per person with a transparent background, **6 columns × 9 rows** of **128 × 160 px** cells, 54 frames in all.
- Rows, top to bottom: **idle, walk, attack, guard, hit, shove, restrain, surrender, down**, 6 frames each. Idle and walk loop.
- **The foot point is at (64, 152) in every cell.** The figure stands about 103 px tall in the cell, as `farmer.webp` does.
- Every pose faces **left**. The game mirrors them for right.
- For people who only need idle and walk (1, 2, 3, 5), the other rows can repeat idle.
- Plus a **portrait** for each, 96 × 112 px, head and shoulders, matching `farmer-portrait.webp`.
- Night: no separate night sheet is needed. The game darkens the figures itself.

## Delivery

Put them on a branch `art/opening-characters-v1`, under `art-review/opening-characters-v1/`, with one line per file in a `manifest.json` (id, file, which rows are real). Claude will register them in `assets/characters-drawn-v1/manifest.json` and swap them into the opening.

Priority if time is short: **Hobb, then the lookout, then the collector.** These three appear in fights and are seen up close.

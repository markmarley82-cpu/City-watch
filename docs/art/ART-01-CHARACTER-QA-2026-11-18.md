# ART-01 — Character sprites, style and animation QA (18 November 2026)

**Owner:** City Watch art QA  
**Tracker:** [GitHub Issue #7](https://github.com/markmarley82-cpu/City-watch/issues/7)  
**Repository sampled:** `main` at `8a2d9cdf5e85dcc5e9c4cdeed5a004c569bbdd3a`; drawn-character manifest blob `4917a3cf31caad212a3f71e5a58f84f568bf23f9`.  
**Change boundary:** Read-only inspection and documentation. No art replacements, gameplay/code edits, changes to `dist/`, map edits or build deployment were made by this QA.

## Verdict

**Static manifest validation: PASS. Source-art visual consistency: NEEDS TARGETED FOLLOW-UP. Live-browser idle-smoke: NO ARTIFACT REPRODUCED. Animation / combat / physical-iPhone sign-off: NOT DONE.**

Do **not** mark ART-01 fully resolved or redraw all 76 characters on the basis of this sampled audit. Source sheets have visible coloured areas that warrant pixel-level alpha testing, but the first public-game idle view did **not** reproduce obvious red/yellow blocks. Different assets or alpha compositing may explain the discrepancy; it remains to be diagnosed.

## A. Structural inventory — checked

- `dist/assets/characters-drawn-v1/manifest.json`: **76 character entries**, **70 distinct atlas WebPs** and **70 portrait WebPs** in the corresponding directory; **43 weapon-variant WebPs** in `weapons/`. All entries' atlas, portrait and declared weapon-variant paths are present.
- Every one of the 76 manifest entries declares **9 action clips × 6 frame indices = 54 frames**: `idle, walk, attack, guard, hit, shove, restrain, surrender, down`. The audit checked exact 0–53 coverage, unique indices, legal frame dimensions, frame counts and in-cell foot anchors; **no structural failures** were found. Manifest `missing` and `missingWeaponVariants` arrays are also empty.
- The shipped drawn-character API validates atlas grid dimensions and clip indices before drawing. Native facings are left, with the second displayed facing mirrored; asymmetric badges, weapons and kit therefore require live inspection, not an assumption of correct right-handed artwork.
- Recorded render-height examples: ordinary Watch recruit **60px**, dwarf recruit **44px**, troll recruit **80px**, Nobby **44px**, Colon **60px**, Carrot **70px**. These are declared heights, not physical-device measurements.
- Four exact-identical manifest art SHA groups are intentional identity aliases, **not four separate production jobs**: `urchin / p3_named_street_urchin_base`; `vimes / p3_named_vimes_base`; `mentor-colon / colon / p3_named_colon_base`; `mentor-carrot / carrot / p3_named_carrot_base`. Together they explain 76 logical entries but 70 distinct body atlases. Avoid commissioning duplicate renders for these aliases.

## B. Sampled source-art inspection — findings and evidence

Inspected **8 full 54-cell character sheets** and **17 portrait files** directly from the tracked GitHub binaries. Primary samples:

| Priority | Source file(s) | Observation from source-image preview | Classification |
|---|---|---|---|
| **P0** | [Original human recruit](../../dist/assets/characters-drawn-v1/watch-recruit.webp), [portrait](../../dist/assets/characters-drawn-v1/watch-recruit-portrait.webp) | Prominent red/pink and smaller bright edge patches appear behind the figure in multiple cells; the figure has a softer, lower-contrast finish than Nobby/Colon/Vimes and the alternative recruit portraits | Reproduced in direct source preview; **not yet a confirmed live alpha fault** |
| **P0** | [First dwarf recruit](../../dist/assets/characters-drawn-v1/p3_dwarf_01.webp), [portrait](../../dist/assets/characters-drawn-v1/p3_dwarf_01-portrait.webp) | Bright yellow/red rectangular remnants around many frames and heavily softened face/beard; visibly differs from the sharper [second dwarf portrait](../../dist/assets/characters-drawn-v1/p3_dwarf_02-portrait.webp) | Same caution; targeted cleanup/repaint candidate only after compositing test |
| **P0** | [First troll recruit](../../dist/assets/characters-drawn-v1/p3_troll_01.webp), [portrait](../../dist/assets/characters-drawn-v1/p3_troll_01-portrait.webp) | Red/yellow fields around several poses, softer grey modelling; compare the more clearly inked [second troll portrait](../../dist/assets/characters-drawn-v1/p3_troll_02-portrait.webp) | Same caution |
| **P1** | [Human race variant](../../dist/assets/characters-drawn-v1/p3_human_01.webp) | Large saturated red and dark horizontal rectangular bands span space between sprite frames; also a more cartoon-like head/body proportion than named Watch portraits | Test alpha and normal-size identity context; **do not infer gameplay bug solely from a sheet** |
| **P1** | [Dark recruit](../../dist/assets/characters-drawn-v1/watch-recruit-dark.webp), [Nobby](../../dist/assets/characters-drawn-v1/mentor-nobby.webp), [zombie](../../dist/assets/characters-drawn-v1/p3_zombie_01.webp), [dwarf](../../dist/assets/characters-drawn-v1/dwarf.webp) | Additional horizontal coloured/dark bars occur on the direct sheet previews, although the character silhouettes are more crisply rendered | Broader sampled-source anomaly; test before changing any approved art |
| **Reference** | [Nobby portrait](../../dist/assets/characters-drawn-v1/mentor-nobby-portrait.webp), [Colon portrait](../../dist/assets/characters-drawn-v1/mentor-colon-portrait.webp), [Vimes portrait](../../dist/assets/characters-drawn-v1/vimes-portrait.webp) | Sharper outlines and stronger readable contrast, as set by the existing house style | Reference only |

The three most conspicuous source sheets (`watch-recruit`, `p3_dwarf_01`, `p3_troll_01`) all carry the manifest art-revision tag **`mate-originals-style-match-v1`**. Treat them as **one targeted cleanup packet**, rather than commissioning new versions of all races. Metadata declaring "exact alpha" is insufficient to establish clean browser compositing.

The 54-cell sheets visibly contain varied poses in the expected rows (including walk/strike/guard/fall); this is **not** a frame-by-frame motion, interpolation, weapon-contact or timing pass. No complete fight animation was observed here.

## C. Live browser smoke — observed, with limitations

A disposable automated Chromium session visited [the live GitHub Pages game](https://markmarley82-cpu.github.io/City-watch/) and reached **loading → Human recruit selection → signed Watch oath → Colon's first briefing → Watch Square**. It inspected the standing player and nearby street NPCs at normal zoom. **It reported no obvious red/yellow/white rectangles on those visible idle actors and described their on-screen appearance as coherent.**

[Browser run evidence / steps](https://agent.tinyfish.ai/runs/d24b3937-3415-4e9f-85c2-99427cb56337)

**Caveats:** The browser did **not** command a walk; no moving action frames, mirrored facings, attack/guard/restrain, weapon overlay, full combat cycle, dwarf or troll player selection, or second device was tested. This was **not a physical iPhone/iPad test**. A clean Human idle frame does **not** clear the suspicious source sheets, and source previews alone do **not** establish visible in-game corruption.

## D. Remediation and verification — non-duplicated work queue

1. **ART-01A — priority, investigation:** isolate the above suspicious WebPs, inspect pixel-alpha values and composite each **at actual sprite display scale** over black, white and typical city cobbles; compare original vs current rendered frame at the same coordinates. Establish whether bright source blocks are opaque, semitransparent or hidden in the actual renderer. Keep a before/after evidence sheet. **Do not replace artwork until confirmed.**
2. **ART-01B — conditional cleanup:** if confirmed, make a *candidate* source-preserving alpha cleanup and palette/edge correction for **original human, dwarf_01 and troll_01** first. Compare against Nobby/Colon/Vimes and the sharper alternative recruit portraits. Keep all 54 actions, anchors and silhouettes; no generic new models. Creative Director reviews before replacement.
3. **ART-01C — real animation pass:** record normal-scale live `idle → walk → attack → guard → hit → shove → restrain → surrender → down` for Human/Dwarf/Troll, Nobby and two enemy roles, in both displayed facings. Check foot anchor drift, jump cuts, reversed badges/axes, collision/contact frames, held and overlaid truncheon, head/torso fit, and portrait/world correspondence. Check day and night, light/dark backdrops and the actual player/partner combat flow.
4. **ART-01D — deduplication:** reference the four existing alias groups instead of repainting Vimes, Colon, Carrot or the urchin separately under another ID. Reuse one single Issue #7 work queue rather than duplicating issues.
5. **Sign-off gate:** only mark "runtime verified" after a captured motion sequence plus physical iPhone comparison; mark any new artwork `candidate / pending approval` before integration.

## Outcome

- **Completed:** repository asset presence, manifest geometry/action validation, alias scan; sampled source-image visual review; Human idle live-browser smoke.
- **Open:** pixel-level alpha confirmation, source-to-runtime asset binding identification for the visible recruit, complete animation/facing/contact evaluation, dwarf/troll and combat playtests, physical-phone acceptance.
- **Game changes:** **none**. This document is the ART-01 handoff and belongs to [Issue #7](https://github.com/markmarley82-cpu/City-watch/issues/7).

# Street interior completion repair

## Changes

- Thirteen distinct 512-pixel-tall shop staff exports, bound to the thirteen street interiors. They replace the reused guild-character appearances in those shops.
- Close, Leave and Escape dismiss a conversation while keeping the officer in the room. Delayed close events cannot dismiss a newly reopened conversation.
- Per-room human scale registration, separate foreground clipping for doorway posts and furniture, and labels placed above the selected recruit's actual height.
- The follow camera keeps tall recruits in view in landscape. Whole room offers a touch-accessible overview of all interaction markers.
- Original-resolution idle, walk, attack, guard, hit, shove, restrain, surrender and down frames for the five approved recruit designs, with truncheon variants and fitted clothing/head layers. Streets and combat use the same source-resolution renderer. Action atlases load separately to bound memory use.
- Fresh renderer URLs for streets, combat, training and the University. The dwarf choice uses the approved red-bearded body.

## Assets and source

Game staff: `dist/guild-interiors/assets/shopkeepers-v2/`.

Recruit action layers: `dist/assets/recruit-art-hd/`; original painted cells are packed by `tools/prepare-recruit-hd.py` without enlarging the source pixels.

Art direction and provenance: `art-review/shopkeepers-v2/prompts.md` and `provenance.json`.

## Verification

Unit checks cover all thirteen room routes, independent scales, staff identities, foreground depth, all five recruit designs and their nine actions, truncheon frames, bounded caches, campaign case data and combat settlement.

Full combat workflow 45716882952 passed: actual source-HD renderer in arrest/release battles, mid-turn reload, settled reload and duplicate-result handling.

Cross-browser room workflow 45717197560 is pending final result. Physical iPhone verification has not been performed.

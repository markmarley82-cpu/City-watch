# Silver-bearded dwarf recruit

Packet 3 of the 21 November work order. Candidate for `p3_dwarf_01`.

The same body, animation poses, clothing, scale and kit as `p3_dwarf_02`, using the existing
authored long forked silver-beard head as the default in every pose. The kit is copied byte for
byte from the current runtime v2 set. This is a registered composition of existing authored
layers, not a newly generated animation or a promise of a different beard design.

- Full 768 × 960 sheet: ten rows × six 128 × 96 cells.
- Rows: idle, walk, attack, guard, hit, shove, restrain, surrender, down, truncheon.
- Foot point (64, 92); visible idle height 44 px; left-facing, mirror for right.
- Breastplate, service mail, leather jerkin, coat and region masks, head mask and two heads.
- Head removal/composition follows `dist/cw-recruit-art-v2.mjs`.

`manifest.json` has the existing runtime schema with `p3_dwarf_01` as the key. It is a candidate
manifest, not a replacement for the live manifest. `registration.json` records the foot contract;
`qa.json` records all 60 cells and verifies that no body pixels outside the head mask/overlay
changed. Review all action rows in `review.png`, then compare the figure on real cobbles.

Rebuild/check: `node tools/export-silver-dwarf.cjs`.

Status: Proposed. Creative, runtime and physical-phone review pending. No `dist/` files changed.

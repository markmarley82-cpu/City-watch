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

## Renderer and motion review — 23 November

[All actions, kit and both facings (animated)](all-actions-kit-facings.gif) · [Contact-phase sheet](motion-review/phase-4.png) · [Renderer checks](renderer-audit.json) · [Cell-boundary checks](cell-boundary-qa.json)

The actual `createRecruitArt` module from the pinned main revision was executed with a native Canvas implementation. All 60 poses were checked with four kit choices and three head choices: **720 patrol/combat pairs** match byte for byte, and every right-facing result matches the horizontal mirror of the left-facing result. All layers loaded before drawing. The test exercises the tenth truncheon row through the renderer's attack/weapon selection.

No opaque silver-beard pixels were materially overwritten by any armour choice. Default-vs-head-last composition has small fringe differences; these are not evidence of a clipped beard. The final down pose has a few last-row fringe pixels at alpha 6/255 (silver head/body) or 2/255 (dark head). No silhouette pixels at alpha 32/255 or above touch a cell border. Authored non-idle body rows contain multiple distinct poses.

The motion GIF loops six phases together as a review aid at a fixed 150 ms. It does **not** simulate the game's per-action timings or held final poses. The sheet uses 44 px dwarf render height; no animation poses were redrawn or stretched.

These are renderer-level checks and asset review, not an in-game patrol, combat playthrough or physical iPhone sign-off. Creative acceptance and integration remain pending. No live files changed.

Reproduce the renderer and boundary checks after the original exporter:

```sh
node tools/check-silver-dwarf-renderer.mjs
python tools/check-silver-dwarf-boundaries.py
```

The renderer check requires `@napi-rs/canvas`; the boundary check requires Pillow. Its motion-review PNGs are preserved separately from the GIF.

# ART-PALACE-APPROACH-001 — Future Palace Approach Sprite Kit

**Prepared:** 17 November 2026  
**Art owner:** ChatGPT / City Watch art direction  
**Status:** **Candidate files prepared; NOT creatively approved, NOT integrated, NOT verified at world scale.**  
**Source of truth for the current playable game:** [`dist/`](../../../dist/) — **untouched** by this art packet.  
**Linked art tracker:** [Issue #7](https://github.com/markmarley82-cpu/City-watch/issues/7) · [Quality gate](../ART-QUALITY-GATE.md)

## Ready-to-review artwork

Four separate transparent WebP isometric sprite **candidates** plus the full-resolution PNG source-sheet and a labelled QA preview are archived in the existing **Mate — Graphics Library** Google Drive folder.

| Piece | Candidate file | Pixel size | SHA-256 | Preview |
|---|---|---|---|---|
| Open stone gatehouse/arch and iron doors | `palace-gateway-open.webp` | 528 × 521 | `2599b1a54b01aff4bcaba74394bb27f9f3da3d1cb66583739b79f8b40409aca2` | [Open asset](https://drive.google.com/file/d/18Bky4hHgm5LML7SDho7aq8NPJXHpRG9B/view) |
| Straight masonry wall with spiked iron railing | `palace-wall-straight.webp` | 520 × 528 | `17979c8c4dfffa9952f9a10263cb8181ccb60d0a58d81d061e2a1e4754d9a76d` | [Open asset](https://drive.google.com/file/d/1qn_Mo2La3QFazuBNfyqTvoUIY4-ddHss/view) |
| Corner/junction wall module | `palace-wall-corner.webp` | 528 × 528 | `6cf394831332697414cccc790ebaebbb8a9ab5a852bf3f4eae8860c9572b58f1` | [Open asset](https://drive.google.com/file/d/1dvHtw2o14sgXF2rUSUrntxjC4ikc3Q-G/view) |
| Iron lantern and dressed masonry plinth | `palace-lantern-post.webp` | 517 × 528 | `18855fbb8385a0270b63a284b86a9105e9c3695661e166a9bc58bf4bb8a6ffda` | [Open asset](https://drive.google.com/file/d/1ZYI8YHtY1adFrPNoghz5y10SWn2AJwp_/view) |

**[Complete candidate ZIP (source PNG + 4 WebPs + manifest + review sheet)](https://drive.google.com/file/d/1V20qRDdHI0OWZ5sSn2Sjgq-mqGIdjSLz/view)** · [Contact-sheet preview](https://drive.google.com/file/d/1xsTZWZbWwhgyQnXVtmcNwBZT0QU37erJ/view) · [Full-resolution source sheet](https://drive.google.com/file/d/1YLKViZmZHz1wa91TPojoJQdrGnov43Bh/view)

### Design intent

- Same **2:1 isometric** painterly treatment as the shipped [Watch Outpost](../../../dist/assets/landmark-exteriors-v1/outpost.webp) and [Palace reception range](../../../dist/assets/palace-001/reception-range.webp).
- Weathered, pale Morpork stone, moss, grey slate, dark riveted iron, discreet warm lanterns; no cartoon crown/royal insignia or modern signage.
- Each object isolated on transparent alpha so it can be measured and depth-sorted independently. Cropped to a separate WebP sprite (lightweight draft relative to full-resolution source).
- Gate is visually **open**. No collision, door binding or navigable passage has been authored/validated.

### Technical candidate properties

- Four **RGBA** sprite crops with transparent corners, exported as WebP with alpha. Detailed QA results and per-file SHA-256 are in the ZIP `MANIFEST.json`.
- Staged in Google Drive rather than under `dist/`, so they **cannot be loaded by the live game** accidentally. GitHub contains this review record; **the image binaries have not been committed to the repository**.
- No world anchor, actor scale, door aperture, ground footprint, wall grid length, collision mask, hidden-wall variant or clipping plane is claimed yet. These are **not drop-in map registrations**.
- The current lantern is lit; an unlit/daylight companion or a separate night-light overlay will need to be developed and registered only if approved.

## Approval and integration gate

1. **Measured scale:** compare 60px recruit and ~65px existing doors; calibrate gate arch as a truly walkable entrance on actual Palace map geometry.
2. **Map fit:** verify perspective, shadow direction and wall joins against the live reception range and surrounding street module. The wall modules are conceptually paired but seamless tiling is **not yet proven**.
3. **Alpha:** preview all four over black, white, cobbles and street surface; inspect edge colours, stray pixels and opaque opening.
4. **Lighting:** daylight/unlit and night-window passes consistent with `city-window-lighting.mjs`; ensure light is off in day.
5. **Cutaway and depth:** prepare `full/walls` layers and proper draw order only after placement requirements are measured.
6. **Device:** test portrait and landscape iPhone Safari at actual game zoom; no new render performance or navigation regressions.
7. **Creative signoff:** explicitly accept or reject the art. **No game changes without a fresh instruction.**

## Forward art queue (pre-production only)

| Order | Next packet | Outputs to prepare before integration |
|---|---|---|
| 1 | `ART-PALACE-APPROACH-001` | This packet; current status **candidate**, awaiting scaled reference and approval |
| 2 | `ART-CHAR-ALPHA-002` | Representative recruit/dwarf/troll/Nobby alpha-edge tests; clean candidates only if runtime composite confirms defect |
| 3 | `ART-PALACE-NIGHT-003` | Unlit/daylit and lit-night light treatment, mask and cutaway plan for approved Palace geometry |
| 4 | `ART-COMBAT-MOTION-004` | Contact-sheet audit for nine action clips, two facings and weapon alignment against current combat backgrounds |
| 5 | `ART-CITY-COHERENCE-005` | Street-by-street skyline, window-light and repeat-distance audit, with screenshot evidence and priority sectors |

## Change boundary

**This delivery is artwork staging and documentation only.** No gameplay, sprite registration, colliders, art replacement, `dist/` files or live deployment were changed as part of the Palace art packet. The archived source and all four candidates are intentionally separate pending review.

# ART-PALACE-DAYLIGHT-002 — Unlit daylight sprite candidates

**Date:** 17 November 2026  
**Owner:** Art lead · **Status:** Candidate / not approved / not integrated  
**Parent packet:** [ART-PALACE-APPROACH-001](ART-PALACE-APPROACH-001.md)  
**Art tracker:** [Issue #7](https://github.com/markmarley82-cpu/City-watch/issues/7)

## Delivered

The first Palace kit has lit night-time lanterns. This follow-up supplies **two unlit daytime counterparts** with *identical geometry, pixel dimensions and alpha* to their corresponding lit candidates, so a future integration can swap them without changing world placement.

| Candidate | Dimensions | Changed colour pixels | SHA-256 |
|---|---|---:|---|
| `palace-gateway-open-unlit-day.webp` | 528 × 521 | 13,110 | `989532f37fc087b71181848af37111307194e7fe6fe84cea374e0f8c971936a9` |
| `palace-lantern-post-unlit-day.webp` | 517 × 528 | 10,534 | `042b236ecb765bc0d4058939dc3af3cf4226f0cf372669e4273ae5cf492169f6` |

- **[Download ZIP containing two RGBA WebPs, manifest and preview](https://drive.google.com/file/d/1iEbQ7LvxhH_5HIEi0cCbNGwbmfWkIhec/view)**
- **[View lit/unlit comparison](https://drive.google.com/file/d/16euqMxMJxV-ODQufmDg5_roztl0NDmAq/view)**

## How produced / validation

- Derived from **the exact ART-001 cropped source WebPs**, not redrawn or reprojected. A constrained colour transform reduced warm lantern glow and turned panes cool grey-blue. This preserves registration and painted surface detail but is **not a hand-repainted final lighting pass**.
- Reopened both WebP outputs and compared their **full alpha arrays pixel-for-pixel** to the source: identical. Four corners remain fully transparent.
- Verified changed-pixel counts and hashes above. This does **not** verify lighting masks, in-game bloom or physical iPhone appearance.
- Source images and these unlit candidates are **not** in `dist/`; the live game is unchanged.

## Known caveats / next work

- The gateway has a residual blue/cool spill on nearby masonry from the original lantern; a targeted painterly clean-up is advisable before approval.
- Night/day variants need comparison at actual game zoom and against existing Palace reception architecture; the gate is not yet a measured map placement.
- No `city-window-lighting.mjs` binding, collision mask, night pass, wall cutaway, scale calibration or animation has been created.
- Existing straight/corner wall art can be used as the same static material in either condition if the art director approves; no separate wall-light variant is needed unless integration shows a discrepancy.

**Creative Director sign-off and separate explicit integration authorisation are required.** Do not treat this packet as game-ready simply because its file formats and alpha pass static QA.

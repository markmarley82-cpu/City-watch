# City Watch recruit sprite sheets

The five approved recruit appearances, facing screen left. Runtime can mirror the sheets for right-facing poses.

| Recruit | Body sheet | Truncheon sheet |
| --- | --- | --- |
| Stone troll (`p3_troll_01`) | [troll-recruit-body.webp](troll-recruit-body.webp) | [troll-recruit-truncheon.webp](troll-recruit-truncheon.webp) |
| Human (`watch-recruit`) | [watch-recruit-body.webp](watch-recruit-body.webp) | [watch-recruit-truncheon.webp](watch-recruit-truncheon.webp) |
| Female (`watch-recruit-female`) | [watch-recruit-female-body.webp](watch-recruit-female-body.webp) | [watch-recruit-female-truncheon.webp](watch-recruit-female-truncheon.webp) |
| Dark-skinned (`watch-recruit-dark`) | [watch-recruit-dark-body.webp](watch-recruit-dark-body.webp) | [watch-recruit-dark-truncheon.webp](watch-recruit-dark-truncheon.webp) |
| Red-bearded dwarf (`p3_dwarf_02`) | [dwarf-recruit-body.webp](dwarf-recruit-body.webp) | [dwarf-recruit-truncheon.webp](dwarf-recruit-truncheon.webp) |

Body sheets are 1152 × 1728 px, with 6 × 9 cells of 192 × 192 px and an origin of (96, 184). Truncheon sheets are 1536 × 192 px, with six 256 × 192 px cells and an origin of (128, 184). The truncheon strike uses the body scale and lands on frame 4. Nominal source idle heights are 117 px for humans, 88 px for the dwarf and 154 px for the troll.

| Body row | Move | Frame time | Playback |
| --- | --- | --- | --- |
| 1 | Idle | 200 ms | Loop |
| 2 | Walk | 100 ms | Loop |
| 3 | Unarmed punch | 85 ms | Contact at 4 |
| 4 | Guard | 90 ms | Hold 6 |
| 5 | Hit | 75 ms | Recover by 6 |
| 6 | Shove | 90 ms | Contact at 4 |
| 7 | Restrain | 100 ms | Contact at 5 |
| 8 | Surrender | 110 ms | Hold 6 |
| 9 | Down | 120 ms | Hold 6 |

Frame numbers in the table are one-based. Prone poses use the same ground line as standing poses. The exports are lossless RGBA WebP with black RGB under zero alpha. Readability and silhouettes were reviewed with the human at 60 px tall over black, white and grey City Watch cobbles.

The silver-bearded dwarf (`p3_dwarf_01`) is a separate recruit appearance and needs a separate approved study. The new fitted equipment is a follow-up to these body and weapon exports.

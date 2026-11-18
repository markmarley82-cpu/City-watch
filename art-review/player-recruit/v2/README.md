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

The silver-bearded dwarf (`p3_dwarf_01`) is a separate recruit appearance and needs a separate approved study.

## Fitted kit

Equipment, heads and masks share the corresponding body sheet’s 6 × 9 grid. The coat mask is white over the recolourable coat or dwarf vest, with black elsewhere. The regions mask uses pure red for the helmet, green for trousers and blue for boots, with black elsewhere. The default stone troll wears a loincloth and has no coat, helmet, trousers or boots, so both colour masks are black. The red-bearded dwarf has no helmet region.

| Recruit | Watch breastplate | Service mail | Leather jerkin | Coat mask | Regions mask |
| --- | --- | --- | --- | --- | --- |
| Stone troll | [troll-recruit-watch-breastplate.webp](troll-recruit-watch-breastplate.webp) | [troll-recruit-service-mail.webp](troll-recruit-service-mail.webp) | [troll-recruit-leather-jerkin.webp](troll-recruit-leather-jerkin.webp) | [troll-recruit-coat-mask.webp](troll-recruit-coat-mask.webp) | [troll-recruit-regions-mask.webp](troll-recruit-regions-mask.webp) |
| Human | [watch-recruit-watch-breastplate.webp](watch-recruit-watch-breastplate.webp) | [watch-recruit-service-mail.webp](watch-recruit-service-mail.webp) | [watch-recruit-leather-jerkin.webp](watch-recruit-leather-jerkin.webp) | [watch-recruit-coat-mask.webp](watch-recruit-coat-mask.webp) | [watch-recruit-regions-mask.webp](watch-recruit-regions-mask.webp) |
| Female | [watch-recruit-female-watch-breastplate.webp](watch-recruit-female-watch-breastplate.webp) | [watch-recruit-female-service-mail.webp](watch-recruit-female-service-mail.webp) | [watch-recruit-female-leather-jerkin.webp](watch-recruit-female-leather-jerkin.webp) | [watch-recruit-female-coat-mask.webp](watch-recruit-female-coat-mask.webp) | [watch-recruit-female-regions-mask.webp](watch-recruit-female-regions-mask.webp) |
| Dark-skinned | [watch-recruit-dark-watch-breastplate.webp](watch-recruit-dark-watch-breastplate.webp) | [watch-recruit-dark-service-mail.webp](watch-recruit-dark-service-mail.webp) | [watch-recruit-dark-leather-jerkin.webp](watch-recruit-dark-leather-jerkin.webp) | [watch-recruit-dark-coat-mask.webp](watch-recruit-dark-coat-mask.webp) | [watch-recruit-dark-regions-mask.webp](watch-recruit-dark-regions-mask.webp) |
| Red-bearded dwarf | [dwarf-recruit-watch-breastplate.webp](dwarf-recruit-watch-breastplate.webp) | [dwarf-recruit-service-mail.webp](dwarf-recruit-service-mail.webp) | [dwarf-recruit-leather-jerkin.webp](dwarf-recruit-leather-jerkin.webp) | [dwarf-recruit-coat-mask.webp](dwarf-recruit-coat-mask.webp) | [dwarf-recruit-regions-mask.webp](dwarf-recruit-regions-mask.webp) |

Clear the base head through the white areas of its head mask before compositing one alternate head. Draw the body and any coat or region tint first, then armour, then the replacement head.

| Recruit | Head removal mask | Alternate heads |
| --- | --- | --- |
| Stone troll | [troll-recruit-head-mask.webp](troll-recruit-head-mask.webp) | [troll-recruit-head-broad-granite.webp](troll-recruit-head-broad-granite.webp), [troll-recruit-head-craggy-brow.webp](troll-recruit-head-craggy-brow.webp) |
| Human | [watch-recruit-head-mask.webp](watch-recruit-head-mask.webp) | [watch-recruit-head-dark-waves-and-beard.webp](watch-recruit-head-dark-waves-and-beard.webp), [watch-recruit-head-auburn-and-freckles.webp](watch-recruit-head-auburn-and-freckles.webp) |
| Female | [watch-recruit-female-head-mask.webp](watch-recruit-female-head-mask.webp) | [watch-recruit-female-head-dark-waves-and-beard.webp](watch-recruit-female-head-dark-waves-and-beard.webp), [watch-recruit-female-head-auburn-and-freckles.webp](watch-recruit-female-head-auburn-and-freckles.webp) |
| Dark-skinned | [watch-recruit-dark-head-mask.webp](watch-recruit-dark-head-mask.webp) | [watch-recruit-dark-head-dark-waves-and-beard.webp](watch-recruit-dark-head-dark-waves-and-beard.webp), [watch-recruit-dark-head-auburn-and-freckles.webp](watch-recruit-dark-head-auburn-and-freckles.webp) |
| Red-bearded dwarf | [dwarf-recruit-head-mask.webp](dwarf-recruit-head-mask.webp) | [dwarf-recruit-head-dark-braided-beard.webp](dwarf-recruit-head-dark-braided-beard.webp), [dwarf-recruit-head-forked-silver-beard.webp](dwarf-recruit-head-forked-silver-beard.webp) |

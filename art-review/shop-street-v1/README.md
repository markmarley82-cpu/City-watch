# Four-premise shop street candidate

Prepared for Mark on 19 November 2026 against City-watch main fd76ccb. This is a new street art study with a local placement plan. A site in the live city has yet to be selected.

The row contains a cobbler with upstairs home, a narrow pawnbroker, a curry house with a kitchen vent/flue, and a three-storey cheap lodging house with an arched passage suggesting access to the rear court. Trade emblems are a boot, three brass balls and a bowl. The lodging passage and court are artwork and layout proposals awaiting door and navigation integration.

## Assets

Each building has day, night, roof, roof-night, walls, walls-night and emission WebPs on one shared cropped canvas. Use the native anchor and 0.5 draw scale in registration.json for all of its layers. Roof-off wall layers supply the exterior cutaway artwork. Ground assets are shared-paving-day, shared-paving-night and contact-shadows. Their canvas and origin are recorded in layout.json.

The proposed row uses four plots, in order, of 4 × 5, 3 × 4, 4 × 5 and 6 × 6 cells. All frontages meet y=8. The paving band is [0,8,17,2.5], with a lodging rear court [11,0,6,2]. The row has no overlapping plot areas and leaves the proposed street band clear.

## Grid and scale

Facades and roof planes were individually registered to target vertices derived from the city's 2:1 projection. The roof ridges and eaves are straight target lines. Projective plane mapping preserves straight painted lines. Each building's height was calibrated from the marked doorway to give approximately 70 px at game draw scale.

| Building | Door height | Measured raster base left/right |
| --- | ---: | ---: |
| Cobbler | 69.85 px | 26.563° / 26.568° |
| Pawnbroker | 70.05 px | 26.562° / 26.563° |
| Curry house | 70.15 px | 26.563° / 27.303° |
| Lodging house | 69.81 px | 26.613° / 27.368° |

All measured base edges pass the existing 26–28° tolerance. Raster measurements use alpha threshold 128 and exclude source cut-stone outliers. Every encoded day/night pair has byte-identical alpha, and all companion layers share its dimensions. Window emissions remain inside the building alpha. Transparent margins were cropped consistently across each set to reduce decoded memory.

## Review

street-day-review.jpg and street-night-review.jpg show the proposed row at the actual 28 × 14 projection with a 60 px recruit reference. These are composed art previews, not screenshots of the playable game. Individual building sprites remain separate for draw order and actor occlusion.

The built-in image generator created the new day artwork using the existing bakery as style reference and map-derived block guides for geometry. Separate night studies supplied cool moonlight and warm glazing. Their low-frequency lighting was transferred onto the registered day pixels, with fitted emission masks, preserving the final source silhouettes.

Shared paving reuses the game's existing dist/assets/graphics-p17/dolly_sisters/graphics/terrain/worn-0.png material. The preview scale reference is cropped from dist/assets/team-v05/watch-recruit.webp and drawn at approximately 60 px visible height.

## Status

Candidate artwork awaiting Mark's approval and in-city placement review. Door interactions, site collision, court access, road joins, game lighting blending and physical-phone runtime checks remain integration work. This packet edits art-review only.

20 November: all four roof-night companions are included, exported from the existing registered night pixels with the existing roof alpha. The complete packet is available on main. See docs/art/CITY-ART-REVIEW-INDEX.md for the consolidated delivery and checks.

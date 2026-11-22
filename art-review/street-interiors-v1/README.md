# Street interiors — 14 painted candidates

Delivered 22 November 2026 for issue #10. The fourteen distinct room paintings are in `rooms/`, each 1536 × 1024 WebP on solid black in the guild-room format. Total delivery images: 3.95 MB. Original generated paintings are in `sources/`.

[Review sheet with the actual Watch recruit for scale](review.jpg) · [Individual room gallery](review.html) · [Registration](registration.json) · [Checks](qa.json)

Each room was painted using a measured blockout derived from its exterior footprint and the approved bakery interior as the painting reference. The revised cobbler removes the construction grid and uses worn floorboards. The smaller pawnbroker was regenerated after the first painting exceeded its intended footprint. All fourteen have separate contents and a clear central floor.

## Scale and binding

The 1536 × 1024 canvas is a camera view, not a world dimension. Use the per-room `actorHeight` and `cameraMagnification` in registration together. These derive from manually sampled painting anchors and the 60 px city officer; do not leave the old guild-room actor scale or collision data attached to the new paintings.

The interior camera is rotated 90 degrees so the exterior front-left frontage becomes the interior front-right frontage. Registration includes floor polygons, entrance samples, exterior site rectangles, guide geometry, source paths and checksums. The painted anchors are approximate manual samples, not pixel-perfect segmentation. Individual exterior threshold offsets and furniture collision footprints need checking during integration.

The fourteenth room is proposed as the ground-floor common room of the existing 6 × 6 lodging building, with the sleeping room upstairs. Both stay within the same exterior footprint; no fourteenth exterior is invented. This floor allocation is proposed, not an existing game binding.

| Room | Exterior outer cells | Officer height in painting | Sampled door at city scale |
|---|---:|---:|---:|
| bonded-warehouse | 6 × 7 | 201 px | 73.0 px |
| cooper-workshop | 6 × 7 | 200 px | 68.5 px |
| lodging | 6 × 6 | 204 px | 72.2 px |
| smithy | 5 × 5 | 226 px | 74.2 px |
| quay-lodging | 4 × 6 | 234 px | 68.8 px |
| cobbler | 4 × 5 | 243 px | 69.0 px |
| curry-house | 4 × 5 | 248 px | 67.8 px |
| rope-maker | 4 × 5 | 260 px | 67.0 px |
| ship-chandler | 4 × 5 | 269 px | 64.7 px |
| cooper | 4 × 5 | 260 px | 67.0 px |
| apothecary | 4 × 5 | 265 px | 65.7 px |
| pawnbroker | 3 × 4 | 269 px | 67.0 px |
| butcher | 3 × 4 | 267 px | 66.3 px |
| cheap-lodging-common-room | 6 × 6 | 208 px | 70.7 px |

## Verification and remaining review

- All 14 export canvases and unique image checksums checked.
- All 14 sampled foundation-axis angle checks are within 2° of 26.565°.
- All 14 sampled floor envelopes fit their exterior limits under the supplied shared actor/camera scale.
- 13 of 14 sampled doors fall within 65–75 city pixels. Ship chandler is approximately 64.6 px; inspect its opening before accepting the scale. Measurements are approximate.
- The review sheet composites the actual recruit body and breastplate for scale. It is an asset review, not an in-game screenshot.
- Furniture obstacle polygons, exact external-door offsets, window correspondence, upstairs access, runtime walking and physical-phone checks remain integration work. Do not treat this packet as runtime-verified or creatively approved.

The old `studies/cobbler-unfitted.png` is preserved as a superseded source study. It is not the new `rooms/cobbler.webp` painting.

No `dist/` or live-game files changed.

## Rebuild

```sh
python tools/prepare-street-interior-guides.py
python tools/export-street-interiors.py
```

Requires Pillow. The built-in image generator produced the paintings; the full prompt set and the targeted cobbler correction are recorded in `prompts.json`. The exporter performs format conversion, annotations and review compositing, not procedural replacement of the authored paintings.

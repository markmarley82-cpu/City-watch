# Final four landmark follow-up

Proposed art packet for work order 21 November, issue #10. No live assets or game files changed.

| Requirement | Delivery |
|---|---|
| Night paintings locked to day silhouette | Four pairs; final decoded alpha bytes identical |
| Cutaway layers | Day/night roof and walls for all four; exclusive pixel partition reconstructs the full sprite exactly |
| Watch Outpost foundation | Measured 26.560° left, 26.608° right, after export correction |
| Window lighting | Separate warm emission per building, contained within walls |
| 2× game size | `game2x/`, draw at 0.5; doors approximately 70 px |
| Review | `review.jpg`, interactive `review.html`, registration and encoded-file checks |

Native-resolution files are at the packet root. Their registration is in `registration.json`.
Each entry also gives the resized `game2x` canvas, foundation and anchor for drawing at 0.5.
Keep paired layers on the same anchor; never trim them independently.

The three unchanged day paintings come from `art/final-four-landmarks-v1` at
`95b8ff46d686f05249ba88be6ed2b246c0ab9aed`. The Outpost used the built-in image generator for
a minimal projection revision. That revision alone still measured 25.012° on the left, so the
reproducible exporter adjusts the vertical registration of each column to make both foundation
axes 2:1 while preserving the scale of vertical features. `sources/` preserves the selected
generator result, original day/night studies and original registration.

Night lighting uses the existing generated night studies as smoothed illumination fields on the
day pixels, following the approved landmark-grid night delivery method. It does not substitute a
shifted night silhouette. Roof masks are explicit polygons, recorded in registration. Roof layers
include upper gables; retained walls are exterior cutaways, not new furnished interiors. In the
joined Outpost, concealed masonry behind the removed lower roof is not invented.

The Bakery, Shrine and Alley retain their approved v1 geometry. Their measured angles remain
26.468/27.318°, 27.656/28.007° and 26.390/27.246° respectively; they are not claimed to be newly
reprojected exact-grid paintings. The Outpost angle was the correction requested by this order.

Run from the repository root:

```sh
node tools/export-final-four-v2.cjs
node tools/check-final-four-v2.cjs
node tools/check-city-art-packets.cjs
```

The exporter uses `sharp`, as does the existing city-art checker. Selected generation prompt:
“Make a minimally changed version of this exact building sprite. The only change is to steepen
the diagonal lines running down toward the right on the LEFT facade by just two degrees, from
25 degrees to 27 degrees. Keep the diagonal lines on the RIGHT facade unchanged. Keep every
vertical vertical. Preserve the precise framing and the entire design of this approved painting,
roof tiles, masonry, wooden doorways, lanterns, black Watch shield with lantern symbol. Do not
widen or narrow the building. Same hand painted style and daylight. Whole building on transparent
background. Very subtle change, do not redesign or drastically alter the perspective. This is 2:1
dimetric game architecture.”

Status: asset checks passed; creative review and runtime/physical-phone verification pending.
The preview is an asset comparison, not an in-game screenshot. The other three work-order
packets (street interiors, silver dwarf, portraits) are separate work and are not completed here.

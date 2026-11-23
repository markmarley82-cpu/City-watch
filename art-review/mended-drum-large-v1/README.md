# Larger Mended Drum — source study

Based on main `f58276ef5031ac3b0163c5a9c1bfde7836cddc14`. Requested in issue #10 and docs/NEXT-STEPS.md. No dist assets or map placements change.

The new drawing expands the tavern to three storeys, a broad double entrance and a long side wing, using the approved tavern painting as its visual reference. It is a source study, **not game-ready art**. The generator preview shows a brown-looking halo, but encoded inspection confirms 671,202 fully transparent pixels and transparent outer corners. No pixels are fully opaque, so interior alpha and pale/dark compositing still require review. Sampled foundation angles are 20.7° and 25.3°, which fail the 26.6° target. The foundation points are manually sampled, not certified geometry. See registration.json and the automated inspection artifact for measured results.

## Delivery and limits

- source.png: latest generated painting, 1536 × 1024.
- reference.webp: byte-identical approved earlier painting, included for comparison.
- index.html: side-by-side review, pale/dark/green backgrounds and foundation guide. Open via a static server.
- registration.json: observed plinth points, proposed 9 × 8 cell footprint and explicit blockers.
- tools/inspect-mended-drum-large.py: checks encoded alpha, computes sampled foundation angles and estimated door scale. Writes JSON and a Markdown report; does not alter images.

Proposed 9 × 8 cell footprint is deliberately unplaced: the existing landmark rect is 5 × 6. Street/door/neighbour changes belong to integration after corrected art. Do not stretch this image into the current rect or ship it as a transparent WebP.

At a screen door height of 70 px, the sampled 190 px door implies scale 0.368 and full canvas width about 566 px, versus the older brief's 308 px display. This is a size estimate, not a proved map fit. A 2× export would draw at 0.5 after preparation.

## Next required work

Verify interior alpha and correct both foundation edges, produce the 2× transparent WebP, then agree the enlarged map position, move the entrance and check neighbouring buildings and routes. Add night emissions and cutaway layers once the day geometry is accepted. Creative and physical-device acceptance remain open.

# Larger Mended Drum — runtime installation

The tavern is registered and installed in the game files supplied by PR #14.

- Transparent 2× artwork: 1286 × 894, drawn at 0.5; 643 px display canvas.
- Both foundation edges: 26.565051177°. Door leaf: 70 px beside a 60 px officer.
- Engine footprint: `[97,240,8,9]`, enlarged from `[102,240,5,6]`.
- Entrance: `[99,250]`, linked to E064 at `[100,258]` by a measured ten-cell forecourt.
- The yard-return annex and one gap filler are replaced by the expanded tavern. Their source art is preserved. The adjoining brick-bow house moves 0.3 cells south; the bonded warehouse moves one cell south. Neither is scaled or redrawn. Public street centrelines stay unchanged.
- Cases, Atlas, automatic approaches and nearby incident detection use the moved entrance. The existing tavern interior remains connected.
- Fitted glazing emission uses the registered source and excludes most warm masonry/flower colours. Normal city lighting supplies day/night tint and depth occlusion.

## Verification

`tests/cw-drum-refit.mjs` verifies 72 solid foundation cells, clear neighbours, the measured forecourt, a 207-step Watch-to-Drum graph route and three public through-routes. The case-data checker and Bridge pilot tests pass.

The desktop and phone-sized Chromium test uses a fresh recruit and oath, then restores a valid nearby street start `[100,258,E064]`. It walks to the entrance through the visible Map → Places → Mended Drum → Walk here controls, enters the real tavern interior, returns to the same entrance, captures day/night, saves and reloads. This is a genuine nearby walking leg, not a claim to have walked the entire Watch route in-browser. All ten forecourt cells and the three through-routes are also checked against actual runtime scenery clearance.

Latest browser results and screenshots: [installation-qa/results.json](installation-qa/results.json) and the images in installation-qa/. The workflow reruns after the final emission refinement. Physical iPhone/Safari performance is not signed off.

## Reproduce

```sh
node tools/install-mended-drum-large.cjs
node tests/cw-drum-refit.mjs
node tests/cw-city-cases-data.mjs
node tests/cw-nc01-bridge-pilot.mjs
node tools/test-drum-integration.cjs
```

The asset preparer needs Sharp; the browser test needs Playwright and its Chromium browser. Installation is repeatable and does not accumulate neighbour shifts. `tools/prepare-mended-drum-large.cjs` rebuilds the registered source exports. The original unregistered study and its measurements remain archived; source-registration.json is not the runtime placement.

## Files

Runtime: `dist/assets/mended-drum-large-v1/`, the landmark manifest, city design, case place, adjoining-building registrations and cache-version changes. Review: the transparent exports, review-sheet.webp, registration, source study and current site survey in this folder.

# Mended Drum — larger registered game art

New painted three-storey tavern, registered to the city grid and exported at 2× game size. Requested in #10 and docs/NEXT-STEPS.md. The original generated source is retained.

## Ready art files

| File | Purpose |
| --- | --- |
| drum-day-2x.webp | Transparent lossless export, 1286 × 894; draw at 0.5 |
| drum-day-game.webp | Native game-size preview, 643 × 447 |
| registered.png | Registered lossless PNG master |
| registration.json | Foundation, anchor, doorway and grid measurements |
| game-registration.json | Reproducible export registration |
| review-sheet.webp | Pale, dark and muted ground-colour composites at native size |
| site-survey.json / site-plan.svg | Actual runtime objects and streets around the current tavern |

## Verified

- Both registered foundation edges: **26.565051177°**.
- Foundation screen spans: **252 px and 224 px**, corresponding to nine and eight engine grid steps.
- Door leaf height: **70 px**, beside the game's 60 px officer. Source door measurements are manual and approximate.
- Transparent lossless WebP: every decoded alpha value and every visible RGB pixel equals the registered raw export.
- Native-size pale/dark/ground-colour composites were visually inspected. Chimneys are contained, outer background is clear and no large brown halo is visible.
- Original painting remains unmodified. Registered export uses the established per-face projection approach; near-opaque generated alpha is normalised on export.
- Real game boot and site survey passed without page errors.

Exporter / browser checks: https://github.com/markmarley82-cpu/City-watch/actions/runs/45251531116

## Placement result — do not reuse the old collision box

The current tavern occupies engine rect `[102,240,5,6]`. The artwork's intended orientation needs **8 × 9 engine cells** (nine-cell left face, eight-cell right face), matching the registration. At native size the full canvas is 643 px wide, versus the current main manifest's 354.667 px render width.

The runtime survey checked 132 overlapping nearby positions. **No clear site was found.** Even its best-ranked candidate intersects three Shades buildings and ten registered road cells. The orange outline in site-plan.svg is a surveyed candidate, **not an approved placement**. Do not remove those buildings or cover the road merely to install this art.

Integration requires a deliberate street/block redesign and a moved entrance, followed by route and neighbour checks. This packet changes no dist files, collision or live placement. That is a concrete map integration dependency, not an unfinished foundation correction.

## Review and reproduction

Open index.html through a static server for equal game-scale comparison and measured guides.

```sh
npm install --prefix /tmp/drum-tools sharp@0.34.5 playwright@1.63.0
NODE_PATH=/tmp/drum-tools/node_modules node tools/prepare-mended-drum-large.cjs
NODE_PATH=/tmp/drum-tools/node_modules node tools/survey-mended-drum-site.cjs
```

Install Playwright Chromium before the survey. The branch workflow builds, validates and saves the exports to this review branch only. It does not publish Pages.

**Status:** registered daytime art exported and QA checked; creative approval, site redesign, runtime installation, physical-phone review and any separate night/cutaway work remain open. The old source study and its failed original angles are documented in source-registration.json; they are not the dimensions to use for the finished export.

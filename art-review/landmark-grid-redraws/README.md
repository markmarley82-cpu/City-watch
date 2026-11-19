# Landmark grid redraw review

Six new painted candidates for the landmark redraw brief, 19 November 2026.

The paintings were generated with the shipped bakery style reference and a 2:1 footprint guide. The generated projections still deviated, so the final sprites received a vertical column projection fit around their front corners. This sets the selected foundation edges to 26.565 degrees in each direction. Upright edges retain their length. The fitting can affect roof details and requires visual review.

The six transparent WebP sprites are drum, archives, market, lantern, crypt and store. grid-review.jpg shows all six with their measured foundation registration lines in green. registration.json records the source control points, dimensions and front corner anchors. Preview order is Mended Drum, Archives, Market Hall across the top, then Lantern Row, Crypt and Storehouse.

These are review candidates. Full in-game scale, doors, cutaways, collision registration and daylight/window emission passes remain to be fitted and checked. The base registration does not certify every roof line. The Storehouse currently has its large cart entrance on the left facade, and Lantern Row still needs its fourth distinct entrance resolved to satisfy every architectural detail of the brief.

Created using the built-in image generator. Shared prompt requested strict 2:1 dimetric projection, upright corners, weathered painted materials, warm windows and transparent isolation. Individual descriptions followed docs/art/IMAGE-TOOL-PROMPTS.md.

## Independent raster edge measurement

Measured from the final WebP alpha silhouettes, threshold 128. On each facade, samples exclude the first and last 20 pixels and outliers more than 8 pixels from the median base-line intercept, to exclude projecting steps and buttresses. The fitted slopes below are observed values, distinct from the exact control-point angles.

| Sprite | Left edge | Right edge |
| --- | ---: | ---: |
| Mended Drum | 26.71° | 26.57° |
| Archives | 26.91° | 27.01° |
| Market Hall | 27.23° | 26.48° |
| Lantern Row | 26.59° | 26.76° |
| Crypt | 26.74° | 26.64° |
| Storehouse | 26.64° | 27.67° |

All six meet the brief's 26–28° base-edge tolerance.

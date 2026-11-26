# Art order: countryside outside the city wall (26 Nov 2026)

Requested by Mark. Replaces the empty ground outside the wall.

## What
Paint the land outside Ankh-Morpork's city wall as countryside, so the edge of the playable map is
fields and farms, not empty ground. It is seen from the city streets just inside the wall; nobody
walks there. Discworld feel: the Sto Plains cabbage country — cabbage fields, muddy lanes, hedges
and ditches, a few farmsteads and barns, haystacks, carts, a windmill or two. Busier and scruffier
close to the wall (shacks, market gardens, a gibbet or a tannery), quieter further out.

## Where
Engine cells; the game projects cell [x,y] to screen x = 28·(x − y), y = 14·(x + y)
(a 2:1 isometric diamond, 56 × 28 px).

- The wall's outer line is the rectangle x 7.5–241.5, y 4.5–342.5.
- Paint a band 16 cells deep right round the outside of it.
- The 9 gates, each with a road leading straight out to the edge of the band:
  Traitors [35, 4.5] north · Rimwards [80, 4.5] north · Least [196, 4.5] north ·
  Deosil [7.5, 64] west · Shambling [7.5, 285] west ·
  Trading [241.5, 275] east · Limping [241.5, 320] east ·
  Onion [82, 342.5] south · Hubwards [174, 342.5] south
- On the south and east sides the countryside is in front of the wall from the camera's view.
  Keep anything tall at least 3 cells out from the wall there, so the lane inside stays visible.

## Style
Match the existing city paintings: the same isometric angle, light from the same side, the same
painterly texture and palette. See `art-review/mended-drum-large-v1` and `dist/assets/edge-fill-v1`
for scale. A person is about 60 px tall at game scale.

## Delivery
- Branch `art/countryside-v1`, files under `art-review/countryside-v1/`.
- Ground: flat painted tiles covering the whole band, each a 16 × 16-cell diamond, at 2× game
  scale (one cell = 112 × 56 px), WebP.
- Raised things (farmhouses, barns, windmills, trees, haystacks): separate transparent WebP
  sprites, each with its footprint in cells and the pixel of its front ground corner.
- `manifest.json` giving every tile's and sprite's cell position, size, anchor and file, plus a
  contact sheet of the whole band laid out together for review.
- A night version of the ground tiles if possible (darker, a few lit farm windows).

## Done when
The whole band is covered with no gaps or seams, every gate has a road, and the contact sheet
shows it lining up with the wall corners.

## Integration notes (for the code side)
A packed-houses version outside the wall exists on the work branch only
(`tools/make-outer-fill.py`, not live); it is replaced by this countryside.

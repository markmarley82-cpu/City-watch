# Art order: city wall and towers (26 Nov 2026)

Requested by Mark: the long stretches of city wall look thin and flat (2D) in game.

## What
Paint new modular art for Ankh-Morpork's city wall: the long straight runs, towers along them,
and the four corners. The existing gatehouses read well and can stay unless a matching redraw
is easy. The wall is the edge of the playable city; the player walks along a cobbled lane just
inside it and looks at it from the city side.

## Lore (read before drawing)
Sources the game already uses for the wall and gates:
- https://wiki.lspace.org/Category:Gates_of_Ankh-Morpork
- https://wiki.lspace.org/Hubwards_Gate
- https://wiki.lspace.org/Rimwards_Gate
- The Compleat Ankh-Morpork (map and guide)
Keep to the city's character: an old wall the city has long outgrown and stopped caring
about. Patched, repaired in mismatched stone and brick, weeds and grime, a few sheds or lean-tos
built against it on the city side. Not a clean castle wall, not a fortress. Gates are wide,
worn and usually open.

## Why it looks flat now (fix these)
- One smooth slab with very low battlements on one edge only.
- No overhanging parapet or walkway edge, so the top reads as a thin line.
- Long runs with nothing to break them up.
- The same tone on both visible faces, so there is no sense of depth.
Wanted: a clear wall-walk with battlements on the outer edge and a lower parapet on the inner
edge, deep shadow under the coping, buttresses or pilasters every few cells, stronger light/shade
between the two visible faces, and stone texture with real variation (patches, stains, repairs).

## Geometry (engine cells; screen x = 28·(x − y), y = 14·(x + y), a 2:1 isometric diamond 56 × 28 px)
- The wall's centre line is the rectangle x 7.5–241.5, y 4.5–342.5. Its walking footprint is
  0.9 cells deep (Mark earlier asked for "half as thick"). Paint can overhang this a little on the
  outer side, but must not cover the lane inside the wall.
- Height today is about 126 px at game scale to the wall-walk; up to about 150 px plus battlements
  is fine. A person is about 60 px tall.
- Gates (leave their openings clear): Traitors [35, 4.5], Rimwards [80, 4.5], Least [196, 4.5]
  north; Deosil [7.5, 64], Shambling [7.5, 285] west; Trading [241.5, 275], Limping [241.5, 320]
  east; Onion [82, 342.5], Hubwards [174, 342.5] south.

## Style
Match the city's existing paintings, not generic fantasy, anime or 3D: see
`docs/art/ART-QUALITY-GATE.md` and the references there (Outpost, Mended Drum, the S038 roofs).
Hand-painted, weathered stone, deliberate dark outlines, warm lantern light at night.
Use the current wall and gate materials as a colour reference:
`dist/assets/city-walls300/painted-materials.webp`, `dist/assets/city-walls296/stone.webp`.

## Delivery
- Branch `art/city-walls-v1`, files under `art-review/city-walls-v1/`.
- Transparent WebP sprites at 2× game scale (one cell = 112 × 56 px):
  - straight wall sections 5 cells long, for both wall directions (running along x and along y),
    as seen from inside the city (north and west walls show their inner face; south and east
    walls show their outer face to the camera), with 3–4 variants each;
  - an interval tower (about 3 cells wide, taller than the wall) for each direction;
  - four corner towers;
  - optional: night versions with a few lit arrow-slits or lanterns.
- `manifest.json` with each sprite's file, footprint in cells and the pixel of its front ground
  corner, plus a contact sheet showing a corner, a long run and a tower assembled together.

## Done when
Sections join seamlessly end to end, the wall reads as a thick old wall from the lane inside it,
and the contact sheet lines up with the 2:1 grid.

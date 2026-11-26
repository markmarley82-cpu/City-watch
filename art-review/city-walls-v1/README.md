# City Watch wall and tower art

[Day assembly](contact-day.webp) · [Night assembly](contact-night.webp) · [Sprite manifest](manifest.json) · [Verification](verification.json)

The kit has three 5-cell straight designs for each side, four interval towers (3 cells along the wall), and one tower for each corner. All 20 pieces come in day and night. North and west use the inner face with engaged pilasters. South and east use the outer face and projecting buttresses. The four sides have their own exports so the high battlements always stand outside the wall, with a lower parapet on the lane side.

The straight footprint is 0.9 cells deep. The walkway is 136 game pixels above the ground. A little outer coping overhang adds depth, and two source pixels of end overlap cover raster seams. Inner piers stop at the lane edge. Tower widening extends outward. Stone changes, brick repairs, damp at the foot and a dark coping course give the wall a history of repairs. Tower slit light is baked into the night images.

This is a review kit. The current gatehouse sprites and gate approach geometry stay in place. The manifest records the existing exact positions and six-cell gate openings, including the small differences between the rounded brief and the live Hubwards and Rimwards registrations. It also records the existing river interfaces. Use the current layout's gatehouse and river openings as exclusions when laying out full runs.

## Registration

Each transparent WebP uses the 112 × 56 px source grid and draws at half size on the game's 56 × 28 px grid. Project the placement origin plus `frontCornerCells` to get the world anchor. `anchor` is its position inside the image. `footprint` is [minX, minY, width, depth] relative to the authored origin, and `joinSockets` are the centerline connection points. At a corner, starts are offset 0.45 cells from the centerline intersection toward the corresponding run. The contact sheets use the same piece files and registration.

The bake checks each WebP's dimensions and transparency, samples day and night joins between straight variants and interval towers, compares the retained gate centers with the brief, and checks the two review assemblies against the existing gate tower rectangles. It does not modify the live renderer.

## Reference and production

- [Art brief](../../docs/art/briefs/CITY-WALLS-2026-11-26.md) and [project art references](../../docs/art/ART-QUALITY-GATE.md).
- [Gate index](https://wiki.lspace.org/Category:Gates_of_Ankh-Morpork), [Hubwards Gate](https://wiki.lspace.org/Hubwards_Gate), and [Rimwards Gate](https://wiki.lspace.org/Rimwards_Gate).
- [The Compleat Ankh-Morpork official excerpt](https://terrypratchett.com/books/the-compleat-ankh-morpork/). The excerpt describes an old wall the city has long outgrown. The published map's gate context is cross-checked through the gate entries.
- Built-in image generation supplied the hand-painted material atlas. The Outpost, Mended Drum, S038 roof 335 and stock wall material atlas guided the palette and texture. The 2:1 registration, volumes, brick patches, weathering and night treatment are baked by `build.mjs`.

**Material prompt**

Create a precise texture atlas for a hand-painted medieval isometric game's very old neglected city wall. Flat orthographic front-on stone/brick surfaces, exactly four equal rectangular quadrants, grid boundary exactly halfway each way, no gutters or labels, no perspective and no standalone objects. Top-left coarse mismatched buff-grey rubble limestone wall with softened mortar and green lower damp wear, top-right small old russet red brick repairs with dark lime mortar, bottom-left uneven horizontal stone paving slabs for a rooftop wall-walk, bottom-right large chipped pale ashlar coping stones with deep joints. Every quadrant must fill its own square, consistent stone scale within each quadrant, no gradients of scene lighting, no castellations, no plants extending outside surface. Match attached current game wall atlas closely in palette, brushwork and contrast, with more grit, cracks and moss, and match attached buildings' detailed hand-painted surfaces.

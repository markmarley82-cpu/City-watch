# Art commission: filling the city edge (CITY-EDGE)

Commissioned by Mark, 21 November 2026.

## Why

Between the built-up city and the city walls there are large stretches of empty, flat ground: ten
zones totalling about 13,000 map cells. Players can wander into nothing, and the city looks unfinished.

A test that closed these zones behind a low stone wall was rejected: "Block it natural, not just a
small wall. No empty space, fill it with stuff."

So each zone needs to be **filled** with the working back-land of a crowded old city: yards,
gardens, sheds, pens, orchards and graves. Its edge facing the streets should be blocked by
**natural or lived-in things**: hedges, thickets, trees, the back walls of sheds, stacked timber,
pens. Players should never meet an invisible wall or a bare line of stones.

## The zones

`city-edge-zones.png` (in this folder) shows them in green on the map, numbered Z1–Z10.
`city-edge-zones.json` gives each zone's cells and bounding box in map cells (x, y, width, height).
One map cell is 28 × 14 px on screen.

| Zone | Where | Size (cells) | Theme (what fills it) |
|---|---|---|---|
| Z1 | East edge, the whole length of the city wall from north to just past the river (x 189–235, y 11–244) | 5,300 | North third: **allotments and orchards** (plots, sheds, fruit trees, hedges). Middle, by the river: **tanneries and dye works**, the smelly trades pushed to the edge (vats, drying racks, hides on frames, reed beds at the water). South third: **timber yard** (log stacks, saw pit, open-sided sheds). |
| Z2 | South-east corner (x 183–233, y 258–336) | 1,776 | **Stockyards**: cattle pens with wooden rails, a barn, a cowshed, hay ricks, water troughs, muddy ground. |
| Z3 | West edge north of the river (x 14–53, y 54–118) | 1,700 | **A small city cemetery**: yew trees, leaning headstones, two or three tombs or mausoleums, a mortuary chapel, an overgrown gravel path, ivy. Bounded by yews and a churchyard hedge. |
| Z4 | North-west corner (x 14–86, y 12–47) | 1,660 | **Market gardens**: rows of cabbages and leeks, cold frames, a glasshouse, a smallholder's cottage, hedgerows between plots, a scarecrow. |
| Z5 | South-west, behind the Market Hall (x 42–73, y 279–314) | 801 | **Builders' yard and rubble lot**: stacked stone and bricks, a half-built house in scaffolding, a lime pit, carts, weeds pushing through rubble. |
| Z6 | South edge (x 102–164, y 306–336) | 634 | **Drying greens and a wash-house**: washing lines with sheets, a wash-house with a chimney, coppers, rough grass. |
| Z7 | North, beside the park pond (x 153–179, y 11–48) | 539 | **Wild orchard**: old fruit trees, long grass, a beehive row, a tumbledown shed, brambles. |
| Z8 | South-west strip along the wall (x 14–64, y 324–336) | 364 | **Coal and timber stacks**: coal heaps, cord-wood stacks, a lean-to store. |
| Z9 | North, behind the houses (x 150–177, y 60–77) | 277 | **Walled kitchen garden**: neat beds, espaliered pear trees, a potting shed. |
| Z10 | North wall, middle (x 90–106, y 11–35) | 156 | **Pigs and goats**: a sty, a paddock with a hurdle fence, a feed store. |

Where a zone meets the streets, its front row should read as a boundary: a hedge, a line of
trees, a thicket, the closed back wall of a shed or barn, a paddock fence, or stacked goods.
Nothing walkable should be painted inside a zone except as part of an object.

## What to deliver

Four packets. Each is delivered like the shop-street, dockside and artisan packets: a branch
`art/edge-<packet>` with a folder `art-review/edge-<packet>/` holding the files, a
`registration.json`, a `README.md` and a review sheet.

### EDGE-01 · Natural boundary kit (first priority)

The pieces that make edges look natural. All modular on the map grid.

- **Hedgerow**, about 45–55 px tall on screen: straight pieces one cell long in both directions
  (`se` runs along +x, `sw` along +y), an outer corner, an inner corner, an end, and a gap with a
  wooden field gate (a closed gate, not an entrance). Two variants each, one trimmed and one
  overgrown, so long runs don't look repeated.
- **Thickets**: bramble and thorn clumps at 2 × 2 and 3 × 3 cells, four of each.
- **Trees**, 12: oak, ash, elm, two yews, three fruit trees (apple, pear, plum), a dead tree, a
  pollarded willow for the riverside, a pine, and a big spreading chestnut. Each sits on one cell
  (trunk) and covers 2–4 cells of canopy.
- **Shrubs and weeds**: 6 bushes, 6 clumps of tall grass and nettles, 4 reed clumps.
- **Rubble and rocks**: 4 heaps.

### EDGE-02 · Ground for the zones

Seamless 2:1 ground tiles, to paint each zone's floor (each tile covers 4 × 4 cells, 224 × 112 px
on screen, and repeats without a visible seam):

rough grass, short grass, mud yard, trampled stockyard mud, allotment soil rows (bare / growing),
cabbage-field rows, cemetery grass with paths, gravel path, timber-yard sawdust, tannery ground
(stained), reed marsh at a river edge, rubble and weeds.

### EDGE-03 · Edge buildings (12)

All with the same layers as the shop-street packet: day, night, roof, roof-night, walls,
walls-night and window emission.

| # | Building | Footprint (cells) |
|---|---|---|
| 1 | Barn with big doors | 6 × 8 |
| 2 | Cowshed, open-fronted | 4 × 7 |
| 3–5 | Allotment sheds, three different | 2 × 2 to 2 × 3 |
| 6 | Smallholder's cottage with a lean-to | 4 × 5 |
| 7 | Tannery: low building with drying racks and vats beside it | 6 × 6 |
| 8 | Dye works: vats under an open roof, coloured cloth drying | 6 × 5 |
| 9 | Timber yard shed with a saw pit | 5 × 6 |
| 10 | Wash-house with a chimney | 4 × 5 |
| 11 | Mortuary chapel | 4 × 6 |
| 12 | Glasshouse (market garden) | 3 × 6 |

### EDGE-04 · Yard props and clusters

Free-standing objects that block where they stand. Each records its footprint in cells.

- Hay ricks and haystacks (3), log stacks (3), stone and brick stacks (3), coal heaps (2).
- Carts and wagons (3), barrels and crates in groups (4), water troughs (2), a scarecrow, compost heaps (2).
- Washing lines with sheets (3 lengths: 3, 5 and 7 cells).
- Cattle pen and paddock fence, modular like the hedge: wooden post-and-rail pieces in both
  directions, a corner and a gate.
- Cemetery set: headstones in clusters of 3–6 (4 clusters), two tombs (2 × 3 cells), a mausoleum (3 × 3).
- Beehives (row of 4), cold frames (2), a pig sty (3 × 3).

## Technical rules (all packets)

These match what the game already uses for the approved landmark redraws and the new street buildings:

- **True 2:1 isometric.** Every ground line and wall base runs at 26.565° on both sides (1 px down for
  every 2 px across). One map cell is 28 × 14 px on screen. Vertical edges are vertical. No perspective.
- **Deliver at twice game size**: the game draws the files at scale 0.5.
- **Transparent WebP** (or PNG), cropped to the object with a small margin. No background, no ground
  under buildings and props, and no baked shadow beyond a soft contact shadow.
- **Anchor**: record the pixel of the front (bottom) corner of the footprint as `nativeAnchor`, and the
  left, front and right foundation points as `base`, in `registration.json`, as the shop-street packet does.
- **Scale**: doors 65–75 px tall on screen beside the 60 px officer, as in the shop-street packet.
  Trees and hedges are sized to match.
- **Day and night** for buildings, with identical alpha, plus a window-emission layer. Natural pieces
  and props need a day version only; the game darkens them at night.
- **Style**: match the approved Mended Drum, Market Hall and Storehouse redraws
  (`art-review/landmark-grid-redraws/`). Weathered, hand-painted, warm, a little grimy.
- **Review sheet** for each packet, showing the pieces at game scale beside a 60 px figure, plus one
  assembled scene: a zone corner with hedge, trees, a building and props.
- **Checks**: `node tools/check-city-art-packets.cjs` should pass, and every piece should meet
  `docs/art/ART-QUALITY-GATE.md`.

## What happens on delivery

Claude places the pieces zone by zone with a layout tool, using `city-edge-zones.json`:

1. Paint each zone's ground.
2. Line its street-facing edge with hedges, trees, fences or building backs.
3. Fill the inside with that zone's buildings and props.
4. Leave its cells unwalkable.

Mark sees screenshots of each zone before it goes live. Gates, doorways, case locations and the
routes between them stay open: the zones were drawn to keep clear of them.

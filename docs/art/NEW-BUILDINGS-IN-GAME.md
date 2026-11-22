# New buildings in the game (20 November 2026)

Mark approved every packet in `docs/art/CITY-ART-REVIEW-INDEX.md` and asked for them to be added
"the best you can". All fifteen are now in the city:

- **Palace main block** replaces the composed Palace range drawing on its reserved foundation, with
  its walls layer for the roof cutaway and its window emission for the night glow.
- **Fourteen street buildings** (shop street, dockside, artisan street, and Mark's cooper workshop)
  stand on open public ground, each facing a street. `dist/city-new-buildings.mjs` loads them from
  `dist/assets/new-buildings-v1/`, built by `tools/make-new-buildings.py`.

## How the sites were chosen

There was no free space for whole rows: the open ground beside every street already has buildings
or street lamps. So each building got its own plot, chosen by a search over the live map
(`tools/new-buildings-sites.json`):

- the footprint is open public ground: not a street centreline, water, another building, a lamp,
  within one cell of a doorway forecourt, or within two cells of a paved neighbourhood lane;
- the front faces a street (75% or more of the frontage within two cells of a street);
- no existing building stands close in front of or behind it on screen (checked in screen
  space, so tall sprites don't hide each other or a doorway);
- near its own district where possible (the docks for the dockside set, the Shades and Dimwell
  for the shop and artisan buildings). The dense south-west had room for only some of them, so
  others are north of the river.

Every site was checked in a game screenshot (`new-buildings-in-game.jpg`); two that hid a
doorway or were squeezed behind the shrine were moved.

## What they do

They are scenery: you can't enter them yet. The game's open-ground pass leaves each footprint
unwalkable, so nobody walks through them. Window lights come from each emission layer (lower
walls). Doors, interiors, roof cutaways for the street buildings and the rope yard are not wired up.

| Building | Packet | Site [x, y, w, d] |
|---|---|---|
| bonded-warehouse | dockside-street-v1 | [102, 248, 6, 7] |
| cooper-workshop | cooper-workshop-v1 | [104, 273, 6, 7] |
| lodging | shop-street-v1 | [121, 231, 6, 6] |
| smithy | artisan-street-v1 | [110, 158, 5, 5] |
| quay-lodging | dockside-street-v1 | [93, 18, 4, 6] |
| cobbler | shop-street-v1 | [104, 137, 4, 5] |
| curry-house | shop-street-v1 | [36, 106, 4, 5] |
| rope-maker | dockside-street-v1 | [41, 99, 4, 5] |
| ship-chandler | dockside-street-v1 | [100, 61, 4, 5] |
| cooper | artisan-street-v1 | [89, 39, 4, 5] |
| apothecary | artisan-street-v1 | [149, 42, 4, 5] |
| pawnbroker | shop-street-v1 | [104, 215, 3, 4] |
| butcher | artisan-street-v1 | [114, 250, 3, 4] |

## Rooms (22 November 2026)

Twelve of the street buildings can now be entered. `addStreetDoors` in `dist/city-new-buildings.mjs`
puts a door on the street in front of each, and `tools/make-street-rooms.py` adds a room for each to
the guild-interior catalogue. The room reuses a guild room painting, with its own name, two
things to examine and a person to talk to:

| Building | Room painting |
|---|---|
| Apothecary, Smithy | Alchemists' workroom |
| Curry house | Bakers' kitchen |
| Butcher, Cooper's workshop | Butchers' hall |
| Pawnbroker | Thieves' registry counter |
| Lodging house, Quay lodging | Beggars' reception |
| Cobbler | Musicians' upstairs rooms |
| Ship chandler | Lawyers' records room |
| Bonded warehouse, Rope-maker | Fools' long hall |

The artisan-street cooper has no fitting painting and stays closed. All of these switch to their
own interiors when the art team delivers them (work order part 2). They don't appear in the
Guildhouses list.

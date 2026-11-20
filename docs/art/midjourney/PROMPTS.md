# Midjourney prompt pack: City Watch art, round 1

Two jobs:

- **Job A:** redraw the last four old landmark buildings (Bakery, Wayside Shrine, Crooked Alley House, Watch Outpost) to match the approved redraws.
- **Job B:** an inside view for each of the 13 new street buildings, so they can be entered.

Everything you need to upload is in `docs/art/midjourney/refs/`.

## What Midjourney can and can't do (and who does what)

| Need | Midjourney | Claude afterwards |
|---|---|---|
| Style, detail, the building itself | ✅ from the prompt + style reference | — |
| Exact 2:1 isometric angle | ⚠️ close if you use the layout guide | measures it, rejects anything off by more than 1–2° |
| Exact size in the game | ❌ it can't do pixel scale | scales so the doors are ~1.2× a person and the base fits the footprint |
| Transparent background | ❌ it always makes a solid background | removes the plain grey or black background |
| Night version, lit windows | ❌ not needed | builds the night lighting from the day picture |
| Roof lifted off (cutaway) | ❌ not needed | cuts the roof layer |

So all you need from Midjourney is a **clean, sharp, correctly angled picture on a plain flat background**. The rest of the list is handled afterwards.

## Settings for every job

- Use the Midjourney **website** (midjourney.com), not Discord. It makes adding reference images easy.
- **Version 7**, **Raw** style mode ("Style: Raw" in settings, or add `--style raw`).
- Drag reference images into the prompt bar. When you drop an image, choose what it's used as:
  - **Style reference** = how it should look (colours, painting style).
  - **Image prompt** = what it should contain and how it's laid out (we use the layout guides this way).
- Leave Stylize at the default, or set `--stylize 100`. Higher values make it ignore the angle.
- Make **4 images per prompt**. Rerun until at least one is right, then **Upscale (Subtle)** the best one and download the **PNG**.

### How to send them back

- Name each file after the job, for example `A-bakery-1.png` or `B-smithy-2.png`.
- Send the 2–3 best of each straight into this chat, or drop them in a Drive folder and share the link.
- Send more than one per building. I'll pick the one with the best angle and fit.

## Job A: redraw the four old landmarks

### Use Retexture: it keeps the exact angle

The first try (20 Nov) came back as perspective views at random angles, standing on a paving base.
The ordinary prompt can't hold the street angle. **Retexture** can: it repaints a picture you
upload but keeps every shape where it is.

1. On midjourney.com, open **Edit** (left menu), then **Upload image**, and choose
   `refs/blockout-<building>.png`. It's a plain shape drawing at the exact game angle, with doors
   the right size.
2. Pick **Retexture** (not Erase or Restyle).
3. Add `refs/style-exterior-1-mended-drum.png` and `refs/style-exterior-2-archives.png` as
   **Style references**. Check their thumbnails show above the prompt box labelled as style
   references before you submit.
4. Paste the building's description from below, then this ending:

> hand-painted isometric game building, same shape, same angle and same door and window positions as the input, detailed weathered materials, warm lit windows, soft daylight from the upper left, plain flat grey background #808080, no ground, no people, no text --v 7 --sw 300

5. Make 4, upscale the best, and send it. If the paint is too timid, raise `--sw` to 500. If the
   shapes start to drift, lower it to 200.

| Building | Upload (Retexture) | Description to paste first |
|---|---|---|
| Bakery | `blockout-bakery.png` | a small corner bakery: weathered red brick with cream lime plaster patches, a steep clay-tile roof with a big brick chimney, a striped canvas awning over the wide shop window full of loaves, a loaf-shaped hanging sign, a half-glazed shop door with two stone steps, flower boxes |
| Wayside Shrine | `blockout-shrine.png` | a tiny stone shrine to a minor god: pale weathered stone, a steep copper roof gone green, a stone finial, an arched oak door with a carved stone surround, a candle-lit offering niche, ivy and moss |
| Crooked Alley House | `blockout-alley.png` | a tall narrow four-storey town house: timber framing over soot-dark brick, small leaded windows with warm light, a steep slate roof with a twisted brick chimney, a lantern by the front door, washing hanging from an upper window |
| Watch Outpost | `blockout-outpost.png` | a City Watch outpost: a stone watch tower with a slate cap behind a two-storey timber-framed guard room with a clay-tile roof, heavy studded doors with lanterns, a painted Watch shield with a lantern emblem above the door, a notice board |

The ordinary-prompt method below is kept for reference. Use it only if Retexture isn't available.

### References to upload for every Job A prompt

| File | Use it as | Why |
|---|---|---|
| `refs/style-exterior-1-mended-drum.png` | Style reference | the approved look |
| `refs/style-exterior-2-archives.png` | Style reference | second style example (stone and brick) |
| `refs/guide-<building>.png` | **Image prompt** | the exact footprint, angle and a person for scale |
| `refs/current-<building>.png` | Image prompt (optional, weight low) | what the building is: keep its character |

Add `--iw 1.5` so the layout guide counts strongly, and `--sw 250` for the style. With the optional `current-` image added, use `--iw 1`.

### Shared text (put this at the end of every Job A prompt)

> single isolated building, strict 2:1 isometric dimetric game art, camera looking down at 30 degrees, building turned exactly 45 degrees, both visible walls equally foreshortened, all horizontal edges at 26.5 degrees, perfectly vertical walls, no perspective distortion, the nearest bottom corner of the building at the bottom centre of the image, whole building in frame with a margin all round, painterly hand-painted texture, soft daylight from the upper left, plain flat neutral grey background #808080, no ground, no street, no grass, no people, no text --ar 1:1 --v 7 --style raw --iw 1.5 --sw 250 --no ground plane, landscape, cobblestones, people, text, watermark, frame, cast shadow

### A1. Bakery: `guide-bakery.png`, footprint 4 × 4

> A small corner bakery in a grimy fantasy Victorian and Tudor port city: two storeys of weathered red brick with cream lime plaster patches, a steep clay-tile roof with one big brick chimney, a striped canvas awning over a wide bow shop window full of loaves, a hanging wooden sign in the shape of a loaf, a half-glazed shop door with two stone steps on the left-hand wall, flower boxes, a side door on the right-hand wall. Doors sized for a person, about one and a quarter times a person's height. [shared text]

### A2. Wayside Shrine: `guide-shrine.png`, footprint 3 × 3

> A tiny wayside shrine to a minor god in a grimy fantasy Victorian port city: a narrow stone and brick chapel only one room wide and quite tall, a steep copper roof gone green, a stone finial on top, an arched oak door with a carved stone surround and two worn steps on the left-hand wall, a small niche with a candle-lit offering shelf, ivy, moss in the joints. Door sized for a person. [shared text]

For the shrine and outpost, change `--ar 1:1` to `--ar 4:5`, because they're taller than they are wide.

### A3. Crooked Alley House: `guide-alley.png`, footprint 4 × 4, very tall

> A tall, narrow, crooked four-storey town house that leans slightly but whose walls stay vertical, timber framing over soot-dark brick, each upper floor jettied out a little over the one below, small leaded windows with warm light, a steep slate roof with a twisted brick chimney stack, a plain front door with a lantern on the left-hand wall, washing on a line from an upper window. Door sized for a person. [shared text]

Use `--ar 9:16` for this one.

### A4. Watch Outpost: `guide-outpost.png`, footprint 4 × 3

> A small City Watch outpost: a squat watch tower of rough stone with a slate cap on one end, joined to a two-storey timber-framed guard room, a heavy studded door with a lantern beside it on the left-hand wall, a painted Watch shield with a lantern emblem above the door, an outside stone stair up to the tower door on the right-hand wall, a notice board. Door sized for a person. [shared text]

Use `--ar 4:5`.

## Job B: inside views for the new buildings

These are cutaway rooms, like the guild rooms already in the game. You look down into the room with the front walls removed.

### References to upload for every Job B prompt

| File | Use it as |
|---|---|
| `refs/style-interior-1-bakers.png` | Style reference **and** image prompt |
| `refs/style-interior-2-butchers.png` | Style reference |
| `refs/guide-interior.png` | Image prompt: room outline, doorway at the lower right, person for scale |

Use `--iw 1 --sw 300`.

### Shared text (put this at the end of every Job B prompt)

> isometric cutaway interior of one room, 2:1 isometric game diorama exactly like the reference, front walls removed and shown only as a low cut stone sill, back-left and back-right walls standing with windows and beams, the entrance doorway in the front-right wall at the lower right of the image, the room filling the frame, a wide clear walkable floor through the middle of the room with furniture against the walls, every object sized for people about 1.75 m tall, warm painterly hand-painted texture, soft light from the windows, solid pure black background outside the room, no people, no text --ar 3:2 --v 7 --style raw --iw 1 --sw 300 --no people, text, watermark, frame, ceiling, roof, perspective

### The thirteen rooms

| # | File name | Prompt (then add the shared text) |
|---|---|---|
| B1 | `B-cobbler` | A cobbler's workshop: a low workbench with lasts and hammers, shelves of boots and shoes, hides hanging from a beam, a leather-cutting table, a small counter by the door with a boot-shaped sign, wood-shaving floor. |
| B2 | `B-pawnbroker` | A cramped pawnbroker's shop: a high counter with a brass grille, shelves crammed with clocks, instruments, candlesticks and odd bundles with paper tags, a locked glass cabinet, three brass balls hanging inside the window, a safe in the corner. |
| B3 | `B-curry-house` | A small curry house: a kitchen at the back with big copper pots on a brick range and a hood flue, spice jars and sacks, four plain tables with benches in the front room, a serving hatch, lanterns, a bowl painted on the window. |
| B4 | `B-lodging` | A cheap lodging house's common room: a row of narrow iron beds and straw mattresses along the walls, a stove with a kettle, a rough table with a candle, a coat rack, a ledger desk by the door for the landlord. |
| B5 | `B-bonded-warehouse` | A bonded dock warehouse: stacked crates, barrels and wrapped bales marked with numbers, a hoist and chain from a beam, a clerk's high desk with ledgers and a lamp, a weighing scale, wide double doors (the doorway can be large). |
| B6 | `B-rope-maker` | A rope-maker's shed: coils of rope and hemp bundles, a long rope-walk bench with a twisting wheel and hooks along one wall, tar buckets, a workbench with knives and fids. |
| B7 | `B-ship-chandler` | A ship chandler's shop: shelves of lanterns, blocks and pulleys, coils of line, oilskins, tins and barrels of supplies, an anchor by the counter, nautical charts pinned up, a counter with a till. |
| B8 | `B-quay-lodging` | A sailors' quay lodging: hammocks slung from the beams and a few bunks, sea chests, a stove, a long table with tankards, oilskins on pegs, a small bar counter by the door. |
| B9 | `B-smithy` | A blacksmith's forge: a glowing coal forge with bellows and a hood, an anvil on a stump, a quenching trough, tongs and hammers on racks, horseshoes and ironwork on the walls, a grindstone. |
| B10 | `B-cooper` | A cooper's workshop: barrels in every stage of making, staves stacked and steaming, iron hoops on pegs, a shaving horse, a fire basket for bending staves, adzes and drawknives on the wall. |
| B11 | `B-butcher` | A butcher's shop: a marble counter, hooks with hanging joints and sausages along a rail, a heavy chopping block with cleavers, sawdust on the floor, a scale, a cold room door at the back. |
| B12 | `B-apothecary` | An apothecary: a wall of small labelled drawers, shelves of glass jars and bottles, a pestle and mortar on the counter, bundles of drying herbs from the beams, a brass balance, a small brewing table with a burner. |
| B13 | `B-cooper-workshop` | (Your Midjourney cooper workshop.) A bigger cooper's yard workshop: as B10 but larger, with big tuns and casks, a crane for lifting casks, and a loft ladder. |

## Checks before anything goes into the game

For each picture I'll:

1. Measure the angle. It must be within 1–2° of 26.6°, otherwise I'll ask for a rerun.
2. Remove the grey or black background.
3. Scale it so a door is 65–75 px tall next to a 60 px officer, then fit the base to the building's spot on the map. Rooms are scaled so a person standing inside is the same size as in the guild rooms.
4. Build the night lighting and the lift-off roof.
5. Show you a game screenshot before it goes live.

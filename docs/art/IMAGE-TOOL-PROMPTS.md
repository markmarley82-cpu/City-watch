# Prompts for redrawing buildings with an image tool

The art team has left, and some buildings can only be fixed with new art. These prompts
are for Mark to paste into an image tool (ChatGPT image generation, Midjourney, or
similar). Send Claude whatever comes back: Claude cuts it out, checks the angle with
`tools/audit-landmark-angles.py`, sizes it and puts it in the game.

## How to use them

1. **Attach a style reference** if the tool allows it. Use
   `dist/assets/landmark-exteriors-v1/bakery.webp` (closest to the right angle) and say
   "match the style of the attached image".
2. Paste the **shared rules**, then one **building prompt** below them.
3. Make three or four tries and send all of them. Picking from several works better than
   fixing one.
4. Don't worry about the background. A plain one is easiest to cut out.

## Shared rules (paste before every building)

> Painted game art for a 2D isometric city game set in a grimy, fantasy, late-Victorian
> and Tudor port city at night-time. Single building only, on a plain flat light grey
> background, no ground, no street, no people, no text other than the building's sign.
>
> Strict 2:1 isometric (dimetric) projection, as used by classic isometric games: the
> camera looks down at about 30 degrees, the building is turned exactly 45 degrees, and
> every horizontal edge of the building runs at 26.6 degrees on screen (1 pixel up for
> every 2 across) on both the left and the right side. Both visible walls are equally
> foreshortened. Vertical edges are perfectly vertical. No perspective: parallel edges
> stay parallel. The nearest bottom corner of the building is the lowest point of the
> picture, at the horizontal centre.
>
> Detailed hand-painted texture: weathered red brick, dark timber, slate or clay roof
> tiles, soot stains, a little ivy, warm lit windows. Soft overhead light from the upper
> left. Matches the attached reference style. Wide image, about 1600 pixels wide.

## Building prompts

### 1. The Mended Drum (tavern) — needed most

> The Mended Drum: the most famous, roughest tavern in the city. A big, sprawling,
> two-and-a-half-storey corner tavern built of soot-blackened brick on the ground floor and
> crooked timber framing above, with several gables, tall chimneys and a sagging roof. A
> heavy double door with stone steps on the left-hand wall, a hanging painted sign reading
> "MENDED DRUM" with a battered drum on it, a smaller side door on the right-hand wall,
> barrels and a bench outside, lamps by the doors. It should look large and important:
> about twice the width of an ordinary house. Doors are sized for a person about a third
> of the ground-floor height.

### 2. Archives

> The city Archives: a solid civic building of red brick with pale stone dressings, tall
> arched windows, a central entrance under a stone sign reading "ARCHIVES", a slate roof
> with dormers and a small square lantern tower in the middle. Dignified but grimy.

### 3. Market Hall

> The Market Hall: a long brick market building with a row of five large open stone arches
> along the left-hand wall, market stalls with striped awnings inside the arches, a sign
> reading "MARKET HALL" over the central arch, a long slate roof with a glazed roof
> lantern running along the ridge, and plain end walls with small windows.

### 4. Lantern row

> A terrace of four narrow joined town houses, alternating red brick and white plaster
> with dark timber framing, each with its own front door and lamp along the left-hand
> wall, steep slate roofs with gables and several chimneys.

### 5. Crypt

> A small old stone chapel used as a crypt: rough grey stone walls with buttresses, a
> pointed arched door and a round rose window in the gable end facing left, a long steep
> slate roof running back to the right, a small cross on the gable, moss and ivy.

### 6. Storehouse

> A plain brick dock storehouse: two-storey red brick, a large double cart door on the
> right-hand wall, a small door with a sign reading "STOREHOUSE" on the left-hand wall,
> a loading hatch with a hoist beam in the roof, crates and barrels outside.

## What Claude checks before it goes in

- Both base edges at 26–28° (`tools/audit-landmark-angles.py`).
- Front corner at the bottom centre; walls upright.
- Door height about 1.1 to 1.4 times a character's height (characters are 60 px).
- Style next to the neighbouring buildings, in a screenshot from the game, shown to Mark
  before anything is published.

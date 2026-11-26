# Sto Plains countryside

This decorative art packet extends 16 cells outside the wall rectangle **[7.5, 4.5, 241.5, 342.5]**. It includes cabbage plots, fallow strips, muddy lanes, hedges and drainage, with tanneries and rough sheds near the wall and small farm clusters further out. All nine gate roads use the ordered centres and extend straight to the edge.

[Day contact sheet](contact-day.webp) · [Night contact sheet](contact-night.webp) · [Registration manifest](manifest.json)

Each ground image is a 16×16-cell diamond on a transparent 1792×896 canvas, drawn at half size in the current 56×28 game grid. The tile position is its back ground corner and its pixel anchor is [896, 0]. The last tile on each run uses an alpha crop to fill the remaining strip, because the wall lengths do not divide by 16. The manifest records the effective half-open bounds. The four full corner diamonds belong to the north and south runs.

Raised objects are separate 2× transparent WebPs. Each placement gives the footprint's origin, dimensions in cells, and the front ground corner in both world coordinates and sprite pixels. Trees, mills and buildings on the south and east runs stand at least three cells from the wall. The night pass darkens the same terrain registration and lights selected farmhouse and mill windows.

## Production

The ground uses a small pasture swatch from built-in image generation, registered once in world coordinates and combined with colour, field, crop, road and ditch passes before export. The props were generated as a transparent reference-based atlas using the Mended Drum for painting style and the edge-fill catalogue for scale. `register-sprites.py` records the prop crops and window masks. `build.py` bakes the world and checks every exported alpha mask, band coverage, the nine road corridors and the tall-prop setback. Install NumPy and Pillow and run `python art-review/countryside-v1/build.py` to rebuild from the included sprite exports and swatch.

Keep tile loads near the camera and keep the opposite lighting variant out of decoded memory. Each full 2× ground tile decodes to about 6.1 MiB. This branch is an art delivery. The game map, movement and wall assets are not edited.

## Wall studies

Three small comparisons use the existing wall mesh, 0.9-cell curtain thickness and six-cell gate opening. [Road and fields](wall-studies/road-and-fields-day.webp) uses warmer masonry. [River verge](wall-studies/river-verge-day.webp) uses a cooler damp palette. [Scrub and tracks](wall-studies/scrub-and-tracks-day.webp) uses patchier stone. These are separate appearance studies. Gate positions in the countryside manifest follow the current art order.

## Image prompts

**Pasture swatch**  
Create one seamless square hand-painted game terrain material for a gritty medieval fantasy isometric browser RPG: dry muted olive pasture ground, very short stubble and tiny ochre soil patches. Entire canvas is a single seamless ground texture viewed straight down, no perspective, must tile across all edges, no directional light, no large blobs, no shadows, no rocks/props/trees/flowers/paths, muted low contrast, painterly brush detail at 128 pixels, used as subtle material beneath projected 2:1 isometric fields. Fill canvas, no borders, no labels.

**Raised sprite atlas**  
Game sprite atlas on genuinely transparent background, exactly 3 columns by 3 rows evenly spaced centered individual isolated full objects with generous blank gutters, no overlap. Match supplied Mended Drum's hand-painted textured muted medieval stone/timber style, 2:1 isometric angle, top-left warm daytime light, two visible faces, consistent slope, no ground plane or shadows outside each footprint, no people, no labels. All objects contained fully within their own 1/9 square. Row 1 left to right: modest stone farmhouse with thatch roof and two visible small dark windows; weathered barn with slate roof and timber doors; stone tower windmill with four wooden sails. Row 2: low rough plank tannery shack with vats tucked beside it; squat golden thatched haystack; empty small wooden farm cart with wheels. Row 3: lumpy leafy oak tree with visible trunk base; low crooked hedge clump; slender old wooden gibbet with empty rope loop. No terrain base or backdrop. Individual cutout assets with clear bottom/front anchor.

# Art brief: clacks tower for the ending's memorial

The ending's memorial shows a clacks tower at night sending "GNU Terry Pratchett".
It must match the city's painted isometric art. Generate it with an image model
(ChatGPT), attaching two reference images from the game:

- `dist/assets/landmark-exteriors-v1/outpost.webp` (the Watch Outpost: building style)
- `dist/assets/furniture-p4/fantasy_harbor_dock_props_sprite_sheet.webp` (timber, iron, rope and stone detail)

## Prompt

```
Using the two attached images as the style reference, paint one new game sprite in exactly the same style: detailed hand-painted isometric fantasy pixel art, the same 2:1 isometric angle, the same weathered timber, dark iron fittings with rivets, rope lashings, mossy stone and slate, the same crisp dark outlines and the same warm lantern light. It must look like it belongs in the same city as the attached buildings.

Subject: a clacks tower (a semaphore signalling tower, in the spirit of Discworld's Ankh-Morpork). A tall, narrow wooden lattice tower on a mossy stone plinth: four stout timber legs that taper slightly towards the top, X-shaped timber cross-bracing, iron bands with rivets where the timbers meet, a wooden ladder up one side. At the top, a small timber platform with a railing and a wooden shutter house with a slate or wooden-shingle roof and a small pennant on a pole.

The shutter array is the most important part: on the face of the shutter house that faces the lower-left (towards the viewer), a large wooden frame holding nine square wooden shutters in a 3 by 3 grid, all shown CLOSED, flat and clearly separated by the frame, with nothing in front of them (no ladder, rope, flag or railing crossing them). One small lit window on the other face, and one small lantern hanging under the platform.

Lighting: evening, as in the attached buildings: warm lantern glow, light falling from the upper left, the right-hand faces in shadow.

Format: a single object on a fully transparent background (PNG with alpha), the whole tower visible from the stone plinth to the pennant, centred, portrait canvas (1024 x 1536), the tower filling most of the height. No ground, no other buildings, no people, no text, no logos, no signature, no drop shadow beyond a small contact shadow under the plinth.
```

If the result is not transparent, ask: "Same image, but with a fully transparent background."
If the shutters come out open or hidden, ask: "Same tower, but the nine shutters on the front face must be closed, flat and fully visible."

## Delivering it

Upload the PNG to the repository (GitHub → Add file → Upload files) as
`clacks-tower.png` in the root, or to the team Drive folder. It will go in
`dist/assets/ending-v1/` and the game lights the nine shutters in sequence.

# Conversation portraits — 12 candidates

Delivered for work order 21 November, issue #10. Twelve individually generated head-and-shoulders portraits, exported as 512 × 512 lossless RGBA WebP. Intended presentation: 256 px or 128 px, bottom-centred, preserving the canvas.

[Full review with 64 px examples](review.jpg) · [Nobby beside Dibbler](nobby-dibbler-comparison.jpg) · [Light, dark and actual cobbles alpha check](alpha-review.jpg)

| Character | Production file |
|---|---|
| Sergeant Fred Colon | [`colon.webp`](portraits/colon.webp) |
| Corporal Nobby Nobbs | [`nobby.webp`](portraits/nobby.webp) |
| Captain Carrot Ironfoundersson | [`carrot.webp`](portraits/carrot.webp) |
| Commander Sam Vimes | [`vimes.webp`](portraits/vimes.webp) |
| Mrs Rosemary Palm | [`mrs-palm.webp`](portraits/mrs-palm.webp) |
| Cut-Me-Own-Throat Dibbler | [`dibbler.webp`](portraits/dibbler.webp) |
| Street porter | [`porter.webp`](portraits/porter.webp) |
| Street baker | [`baker.webp`](portraits/baker.webp) |
| Street net-mender | [`net-mender.webp`](portraits/net-mender.webp) |
| Street stallholder | [`stallholder.webp`](portraits/stallholder.webp) |
| Dock clerk | [`dock-clerk.webp`](portraits/dock-clerk.webp) |
| Street carter | [`carter.webp`](portraits/carter.webp) |

The six named characters use the shipped portraits or Dibbler sprite as design references. The six street workers are original unnamed HUMAN conversation faces for the requested roles; they are not new named Discworld characters, universal random-NPC replacements, or portrait assignments for dwarfs, trolls or other species.

Nobby was revised after Mark found him too similar to Dibbler: a shorter broad crooked nose, squatter uneven face, large rounded ears, heavy eyelids and pursed mouth. Dibbler retains the narrow face, pointed nose, cloth hat and salesman's grin. The first rejected Nobby is not in the delivery.

Style: hand-painted, earthy fabric and aged iron, deliberate outlines, warm key light from the upper left. Registration includes source and export paths, checksums, sizes, alpha bounds and intended display sizes. Full prompts are in `prompts.json`. The built-in image generator made each image separately; the exporter only performs alpha-aware sizing, format conversion and review compositing.

## Checks

- 12 unique 512 × 512 WebPs with real transparency and clear space above the head.
- Zero visible saturated-red artifact pixels in exports. Raw generation PNGs contain some red RGB values beneath **zero alpha**; those pixels do not display. Alpha-aware resizing avoids hidden-colour bleed.
- Reviewed on pale, dark and real city-cobble backgrounds; sheet includes 64 px examples.
- Nobby and Dibbler have a separate silhouette/face comparison.

Status: **Proposed art packet.** Creative acceptance, dialogue bindings, in-game comparison and physical iPhone verification are pending. No `dist/` or live-game files changed. Do not infer creative approval from the presence of an export.

## Rebuild

```sh
python tools/export-conversation-portraits.py
```

Requires Pillow and NumPy. `refs/cobbles.webp` is the existing game tile from `dist/assets/city-paving-v2/cobbles-a.webp`, retained for reproducible compositing checks.

## Portrait-to-map correspondence review — 23 November

[Map, current dialogue and new portrait comparison](world-portrait-review.jpg) · [Explicit candidate mappings](portrait-bindings.json) · [Source audit](world-portrait-audit.json)

Compared all six named characters with the shipped map sprites and dialogue art. The five regular character atlases have 270 nonempty action frames in total; Dibbler uses the actual single-figure crop from `cw-dibbler.mjs`. Review includes each map figure at game size and enlarged 2×, with the current and proposed portraits beside it.

Colon, Carrot, Vimes, Mrs Palm and Dibbler retain their broad costume, hair/headwear and colour identifiers. This is a visual sampling judgement, not exact facial identity certification. Nobby's portrait intentionally has a broader nose and face after Mark rejected the first version as too similar to Dibbler. **His current world sprite still has the older, narrower face. Exact portrait/world facial parity is therefore not signed off.** The comparison makes that remaining difference explicit; no world animation was silently replaced.

The six street-role portraits remain unbound. Assign each to a matching human case NPC after reviewing the actual scene; do not select a portrait from skin colour alone or use these as random fallbacks. The candidate mappings contain explicit named-character keys, no conflicting aliases and no automatic fallback to another person.

Rebuild with `python tools/review-portrait-correspondence.py` (Pillow). It reads the pinned local `origin/main` Git objects and does not write `dist/`. The JSON records the exact source revision. Runtime dialogue bindings, creative acceptance and physical-phone checks are pending.

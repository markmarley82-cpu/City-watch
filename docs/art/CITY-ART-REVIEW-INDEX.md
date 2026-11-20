# City art delivery — 20 November 2026

All five packets are now collected on `main`; no branch hunting is needed.
This delivery contains 19 building sets, the separate rope yard and four Palace approach night companions.

| Packet | Buildings | Files and previews | Status |
| --- | ---: | --- | --- |
| Mended Drum, Archives, Market Hall, Lantern Row, Crypt, Storehouse | 6 | [Landmark redraws](../../art-review/landmark-grid-redraws/README.md) | Day artwork approved; these six are already used by landmark-exteriors-v3. Night source variants supplied. |
| Palace administrative block | 1 | [Palace](../../art-review/palace-main-block-v1/README.md) | Candidate; roof and wall night exports completed in this delivery. |
| Cobbler, pawnbroker, curry house, lodging | 4 | [Shop street](../../art-review/shop-street-v1/README.md) | Candidate; all four night roof exports completed in this delivery. |
| Bonded warehouse, rope-maker, ship chandler, quay lodging | 4 | [Dockside](../../art-review/dockside-street-v1/README.md) | Candidate; includes separate working yard and day/night review scenes. |
| Smithy, cooper, butcher, apothecary | 4 | [Artisan street](../../art-review/artisan-street-v1/README.md) | Complete candidate packet, including butcher night and all night cutaway companions. |

The twelve street buildings and Palace block each supply full day/night sprites,
roof day/night, wall day/night and an emission layer. Their original registration,
plot proposals, source colours and silhouettes are retained. The added layers export
existing night pixels using existing layer masks; no new building designs were substituted.

The three street layouts are local proposals awaiting world sites, entrances and collision
integration. Candidate status is retained; upload does not imply new creative approval.
Cutaway walls are exterior shells, not furnished rooms. This commit changes no `dist/` files.

## Checked for this delivery

`node tools/check-city-art-packets.cjs` passes for all 19 buildings and the yard:
file checksums, image decoding, identical full day/night alpha, matching layer canvases,
roof and wall day/night alpha, emissions contained in walls, exact street foundation
target slopes and 65–75 px door heights against the 60 px officer reference.
Existing layer alpha has edge quantization differences of up to 4/255 relative to
full sprites; the report records those instead of claiming exact layer containment.

[Machine-readable results](CITY-ART-PACKET-CHECKS.json).
The day/night assembled street previews were visually inspected. They are art review
scenes, not gameplay screenshots. World placement, normal player flow and physical-phone
performance for the new candidates remain untested.

## Provenance

Sources were collected from `art/landmark-grid-redraws` (`16f2692`),
`art/palace-main-block` (`260a2cb`), `art/shop-street-v1` (`1a78823`),
`art/dockside-street-v1` (`0f34a8c`) and `art/artisan-street-v1` (`11e3ddb`).
The six supplemental layer exports are reproducible with
`node tools/export-city-night-layers.cjs` (Node with Sharp installed).

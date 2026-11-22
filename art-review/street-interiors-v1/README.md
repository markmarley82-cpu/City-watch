# Street interiors — footprint checks before painting

Mark's requirement, 22 November 2026: an interior must fit the fully visible exterior. Keep the floor area, human scale, doorway, windows and stairs consistent. The 1536×1024 export canvas is not a room dimension.

The current map has 13 distinct exterior sites for this commission. Their exact outer limits are recorded in [footprint-constraints.json](footprint-constraints.json), extracted from tools/new-buildings-sites.json at revision 5a14c73f55191ad05e4b02e8e92005414a205704. Interior floor area must be smaller after accounting for walls. Do not stretch any room to fill a fixed canvas or treat these outer limits as usable floor dimensions.

| Exterior | Maximum outer footprint, cells |
|---|---|
| bonded-warehouse | 6 × 7 |
| cooper-workshop | 6 × 7 |
| lodging | 6 × 6 |
| smithy | 5 × 5 |
| quay-lodging | 4 × 6 |
| cobbler | 4 × 5 |
| curry-house | 4 × 5 |
| rope-maker | 4 × 5 |
| ship-chandler | 4 × 5 |
| cooper | 4 × 5 |
| apothecary | 4 × 5 |
| pawnbroker | 3 × 4 |
| butcher | 3 × 4 |

## Cobbler study — HOLD

[Unfitted cobbler study](studies/cobbler-unfitted.png) is retained as a source candidate only. It was generated in the resumed chat using the guild bakery as a style/geometry reference before the exterior was measured. It has not been proven to fit the cobbler's 4×5 exterior, its doorway side, windows or human scale. This is not finished, approved, or integrated room art. Do not substitute it into the game.

The existing street-cobbler runtime room reuses assets/rooms/musicians-v2.webp with actorHeight=250 and exteriorBinding=null. That establishes an unbound placeholder, not a measured proof that the displayed room is oversized. Fixing the relationship requires a shared world scale and floor/door registration checked against the exterior.

## Remaining preparation

For each site, measure the exterior door and windows, establish a common cell-to-human scale and wall thickness, then produce the room within that envelope. If the interior camera is rotated, map the entrance to the exterior doorway explicitly. Validate the floor polygon, obstacles and entry together; do not merely swap an image while retaining the old guild-room collision data.

The work order asks for 14 room paintings but tools/new-buildings-sites.json contains 13 exterior sites. The additional cheap-lodging common room must be bound to its intended lodging building before assigning dimensions. No extra exterior site is assumed.

No game files changed. This packet records source recovery and constraints; it does not claim that the room commission is complete.

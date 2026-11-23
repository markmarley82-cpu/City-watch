# Street interior navigation annotation delivery

Issue #10 packet 2: [interior review packet](../../art-review/street-interiors-v1/README.md), branch `art/street-interiors-v1`.

Fourteen room layouts now include 59 conservative furniture-contact footprints, safe entry spawns, floor polygons and reachable examination stands. Offline clearance-aware grid checks pass for all 14 entries and all 59 examination stands. These are asset-layout tests, not game-engine or physical-phone tests.

The chandler door flag was an annotation error: inner jamb samples measure 308 and 303 painting pixels (306 representative, approximately 68.2 city pixels). All fourteen sampled door-scale checks now pass. No painting or live-game files changed. Exact threshold registration, upstairs access and runtime walking remain for integration review.

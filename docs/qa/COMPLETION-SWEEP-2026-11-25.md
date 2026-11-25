# Five-area completion sweep — 25 November 2026

Requested scope: finish map control overlap, reduce phone startup downloads, check combat rewards/arrests/reloads, trace intersection movement snags, and align campaign conversation portraits with current art. Base: d979c0db27b09a109fb6e6b26cf6c1d0dd06298d, including backup restoration, persistent storage/reminders and the latest Drum crossing fix.

## Changes

1. Map: the district picker sits above the open destination sheet; its normal closed-index location is retained. The cartouche is constrained so it cannot cover Close on narrow phones. Tests now check controls against other controls as well as map labels.
2. Startup: University street paintings are registered from their authored dimensions and streamed near the phone camera using the existing image budget. Mirrored paintings remain eager because their pixels are needed to construct reflections. Geometry, source paintings and desktop image loading are retained. Prefetch requests are tagged so the next deployed prefetch list includes only resources the game actually consumes, rather than learning optional prefetch requests as startup requirements.
3. Combat: settlement contracts cover lawful arrests, releases, subdued/withdrawn/defeat outcomes, single payouts, stale stores, reload, failed storage and two-suspect case progression. No settlement-rule change was justified by those passing checks. Browser play checks lawful and released outcomes through the actual combat UI, saved-turn reload and repeated result delivery.
4. Movement: ordinary junctions could retain an old street's wide end cap and leave its allowed handoff zone. The movement chooser now considers legal forward continuation and the fewest identity handoffs. It also follows explicit zero-distance connectors before a spatial step (including street → E020 → Watch Square). It never creates a join from painted overlap. Base-map audit improved from 1,142 passing / 95 stalled cardinal crossings to 1,237 passing / zero stalled, with no lost passing cases. Occupied cells, diagonal corner guards and unregistered overlaps remain blocked. Installed-city pointer-drag and saved-position checks passed on both phone and desktop.
5. Portraits: campaign portrait slots use the existing approved Colon, Carrot, Vimes, Mrs Palm, Nobby and Dibbler faces. Existing callbacks/text remain authoritative. Failed named images use a Watch seal, with a stale-error guard. Other campaign characters retain their existing renderer.

## Verification plan

`City completion sweep checks` runs local policy/data checks plus four browser jobs: map, startup comparison, installed-city movement, and campaign portraits/combat. Startup uses separately baked baseline/current builds, gzip delivery, identical cold phone contexts and 6 Mbps download throttling. It measures bytes/time to first ready frame, preserves city/door geometry and checks later University art arrival. Screenshots and machine-readable results are retained as workflow artifacts.

Tests use disposable state and the public restore API to position an officer at a test doorway/junction. Campaign portrait checks instrument the existing dialogue adapter to open its real portrait slots; they are not a full story playthrough. Browser/physical-device performance claims will be limited to the evidence collected. Human uncoached Bridge acceptance and physical iPhone/Safari release acceptance are separate.

Status: all five areas implemented and browser-verified; publishing to main and checking the deployed build.

## Collected evidence

- Run 45533092271: all four Atlas layouts passed; phone, landscape, tablet and desktop screenshots reviewed with the district picker clear of the destination sheet.
- The same run's separately baked, cold Chromium phone comparison at 6 Mbps/40 ms measured 55,072,099 → 44,841,786 transferred bytes before ready (10,230,313 bytes / 18.6% fewer). Ready time was 89,469 → 74,568 ms in this one comparison. University requests before ready fell from 148 to 8, with matching world/door geometry and later University images arriving at its entrance. This is an emulated browser measurement, not physical Safari timing.
- Run 45533790831: all 18 campaign portrait layouts passed, as did failed-image fallback and stale-image-error protection. These reuse approved artwork without changing any dialogue outcomes.
- Run 45533790831: six installed-city pointer-drag crossings passed on both phone and desktop (12 total), followed by explicit Save game and exact-position restoration after reload on both layouts. No page errors. Positions are test fixtures on the actual installed world; movement itself uses pointer events.
- Run 45534573089 (code/test head `3f7d4b1dc3881ee7dcc60518713aa63afac583de`): campaign portraits passed again; actual phone combat completed with two lawful arrests (8 merit) and two releases (5 merit). Both survived a saved-turn reload and a settled-state reload. Replaying the real result message produced no extra payment or archive entry; no page errors. Result screenshots reviewed.

## Public-route follow-up

The first public smoke test resumed an existing Constable save at the Post Office and reproduced a stop at Short Street `[113,248]` on the Atlas route to the Drum. The manual chooser's new preferred street identity disagreed with the planner's still-legal identity at overlapping registered bands; exact-step validation rejected that route. `manualNeighbour` now supports validating a requested target identity, and `acceptStreetStep` uses it for already-planned steps. Manual choices keep forward continuation; occupancy, graph joins, traversal and diagonal/bridge guards still apply. A regression test failed on 127 planned steps before the correction and now accepts all 3,342 steps on 12 cross-city base-map routes. Browser verification adds Post Office ↔ Drum through actual Atlas controls on both phone and desktop before republication.

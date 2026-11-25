# Handoff for a new chat (updated 25 November 2026)

Read this first, then `docs/NEXT-STEPS.md`.

## Working with Mark

- Keep replies **short and plain**. Mark finds long reports and back-and-forth expensive and frustrating.
- **Ask before building** anything with more than one sensible approach, especially anything
  visual. Show a screenshot before something big goes live.
- **No invisible walls**, and no visible boundary walls either. Areas you can't enter should look
  like city: roofs and buildings.
- Don't use Midjourney: Mark dropped it. Claude can't paint art itself.
- **New art** comes from the art team as GitHub branches named `art/<packet>`, with files under
  `art-review/<packet>/`. Order art with a GitHub issue plus a brief in `docs/art/briefs/`.
  Only check for new art when Mark asks.
- Only do full browser play-throughs for big changes; they are the expensive part.

## How the project works

- The live game is https://markmarley82-cpu.github.io/City-watch/. GitHub Pages publishes `dist/`
  from `main` (`.github/workflows/pages.yml`, which also bakes the startup cache).
- Work on `claude/gallant-thompson-ii1f0c`, push, then fast-forward `main`
  (`git push origin HEAD:main`) once checks pass.
- Commits end with the Co-Authored-By and Claude-Session lines; there are no model names in commits.
- Pages deploys sometimes fail with "No artifacts named github-pages". That's GitHub's side:
  re-run the workflow.
- **Cache tags**: Pages caches files for 10 minutes. When a module changes, bump its `?v=` tag where
  it's imported, and the chain up to `index.html` (`phone-map.js?v=…`, which sets the city module tag).
  The current boot/map cache tag is `completion-sweep-v1`. Phones (≤600 px wide) use city zoom 1.25 (`DEFAULT_CITY_ZOOM` in `dist/city.mjs`).

## Testing (local)

- Serve: `python3 -I tools/test-pages-server.py <dir containing a City-watch → dist symlink>` (port 8766).
- Drive: `node tools/test-game-driver.cjs <cmd dir> <saved state json>`. Drop `cmdN.js` files (an async
  body with `p`, `ctx`, `H`) into the directory and read `outN.txt`. Only one driver at a time.
- Page-error crawl: `node tools/test-crawl-errors.cjs`.
- Unit tests: `node tests/cw-nc01-bridge-pilot.mjs`, `node tests/cw-city-cases-data.mjs`,
  `node tests/bench-street-route.mjs`.
- `CWP21City.restore([x,y,edge])` moves the player; `CWP21Game.walkTo(doorId)` walks to a door.

## What was done recently (19–22 Nov)

- **Movement**: "Walk to …" is planned in the background; route search is about 5× faster (collision
  foot cache in `city-e045-reservation.mjs`); walks wait for carts instead of failing.
- **Art**:
  - The ten landmark buildings are redrawn on the 2:1 grid (`dist/assets/landmark-exteriors-v3`,
    `tools/make-landmark-v3.py`). The last four (Bakery, Shrine, Alley House, Outpost) are the
    plainer v1 candidates; Mark said put all of them in.
  - The Brass Bridge waterline is in.
  - 15 new buildings: the Palace main block plus 13 street buildings (`dist/city-new-buildings.mjs`,
    sites in `tools/new-buildings-sites.json`).
- **Empty edge ground**: filled with 613 reused house paintings (`dist/city-edge-fill.mjs`,
  `tools/make-edge-fill.py`). The low-wall version was rejected and is no longer loaded.
- **Rooms**: all 13 street buildings can be entered, with their own paintings (see Street interiors below).
- **Cases**: CW-NC-05 "The Bread at the Wrong Door" and CW-NC-43 "The Sack With Two Tags" are live (`dist/cases/city-cases.json`).
- **Phone view (22 Nov)**: phones (≤600 px wide) use city zoom 1.25.

- **Outpost angle (22 Nov)**: the Watch Outpost uses the corrected 2:1 painting from `art/final-four-landmarks-v2`
  (`tools/make-landmark-v3.py` run with that packet; its registration converted to the v1 format). The packet's
  pixel-locked night and roof/wall layers are not used yet: the game only takes window lights from night art.
  The silver-dwarf packet (`art/recruit-dwarf-silver`) was not taken: the existing dwarf already offers the silver beard.

- **Street interiors (23 Nov)**: the 14 paintings from `art/street-interiors-v1` are fitted to the 13 street
  buildings by `tools/fit-street-interiors.py` (furniture and hotspots in floor coordinates; run after
  `tools/make-street-rooms.py`). The lodging house uses the common-room painting; the upstairs bedroom painting
  is unused. The artisan cooper is open as the Barrel-maker (`new-cooper`).
- **Room view v2 (23 Nov)**: guild and street rooms use a full-screen view like the Watch House
  (`roomMarkupV2` in `guild-interiors/room-markup.mjs`, drawing in `interior-view.mjs`). The post office, bank and
  palace now share the following camera and tappable markers through `guild-interiors/civic-room-view.mjs`
  (24 Nov). Their authored sessions, contacts, saved visits and street returns stay in their civic hosts.
  Whole room toggles the overview; Contacts still reaches staff outside the camera. See
  `docs/qa/CIVIC-ROOM-VIEW-V2.md` for the browser checks.
- **Busier streets (23 Nov, live)**: phones get 8 street people by day (was 5), and night halves the count
  (`limit` in `city.mjs`, `wanted` in `city-street-life.mjs`).
- **Conversation portraits (23 Nov, live)**: `cw-speaker-portraits.js` puts the art/portraits-v1 portrait beside any
  parchment dialogue whose heading names Colon, Nobby, Carrot, Vimes, Mrs Palm or Dibbler
  (`dist/assets/portraits-v1/`). The drawn-character portraits for the first five were also replaced (used by the
  guild contact view and the ending). The six street-worker portraits show beside matching case speakers (porter, baker, net-mender, stallholder, dock clerk, carter), matched on the speaker line. The campaign engine's own
  dialogues now use the same approved six faces through `cw-campaign-portraits.js` (25 Nov); other speakers retain their existing renderer.

- **Landmark layers (23 Nov)**: the Bakery, Shrine, Alley House and Outpost carry the v2 packet's walls layer
  (shown in the see-through window behind them, as `roofHidden`) and window emission (`nightEmission`), added by
  `tools/add-landmark-layers.py`. The six grid redraws have no such layers yet. The packet's full night paintings
  are not used: the game lights buildings itself.

## Open

- **Art work order** (issue #10): parts 1, 2 and 4 are in the game; part 3 (silver dwarf) was declined because
  the live dwarf already offers the silver beard. **Larger Mended Drum installed (23 Nov)**: Mark chose the version with the door on the open street, plot `[103,239,9,8]`, door `[106,247]`, via `dist/city-drum-plot.mjs` and `tools/place-mended-drum.py`; the earlier neighbour-shifting install (8acd890) is no longer in `dist/`. Physical iPhone/Safari acceptance remains open.
  Unused but kept: the lodging bedroom painting, the six grid landmarks have no walls/emission layers.
- **Phone lag and getting stuck**: Mark reported both on his iPhone 11. Simulated-phone tests (4x slowed CPU) showed
  walking speed holds and no snags; frame time is mostly the building see-through compositing
  (`city-local-cutaway.mjs`), drawing people, and ground repaints (`city-ground-cache.mjs`). Headless timings were too
  noisy to prove a fix, so nothing was changed. Needs Mark's own report of where it happens.
- **Startup image recovery (24 Nov)**: the loader waits 300 ms and 1.2 s before two cache-busted retries;
  healthy loads do not wait. Permanent failures retain the Retry loading screen. See
  `docs/qa/STARTUP-IMAGE-RECOVERY.md` and `tools/test-startup-recovery.cjs`.
- **Automated check (23 Nov)**: a fresh iPhone 11 player completes the opening purse case end to end with no errors;
  `tools/test-crawl-errors.cjs` reports no failures on all pages.
- The Bridge case still needs Mark's playtest (`docs/cases/Bridge-Shift-Playtest.md`).
- Housekeeping for Mark: set the Drive folder to Restricted; decide on git history cleanup.

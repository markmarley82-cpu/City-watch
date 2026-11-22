# Handoff for a new chat (22 November 2026)

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
  The current chain tag is `pilot53-phone-zoom`. Phones (≤600 px wide) use city zoom 1.25 (`DEFAULT_CITY_ZOOM` in `dist/city.mjs`).

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
- **Rooms**: 12 street buildings can be entered. They reuse guild room paintings (`street-*` rooms in
  `dist/guild-interiors/rooms.json`, made by `tools/make-street-rooms.py`). The artisan cooper stays closed.
- **Cases**: CW-NC-05 "The Bread at the Wrong Door" is live (`dist/cases/city-cases.json`).

## Open

- **Art work order**: issue #10, `docs/art/briefs/WORK-ORDER-2026-11-21.md`.
  1. Final-four follow-up: night versions locked to the day ones, roof layers, the Outpost angle.
  2. Street interiors. The branch `art/street-interiors-v1` exists but is still empty.
  3. Silver-bearded dwarf recruit.
  4. Conversation portraits.

  When the interiors arrive, swap the `image` of each `street-*` room and open the artisan cooper.
- **Next case** if Mark wants one: "The Sack With Two Tags", using the dock buildings.
- The Bridge case still needs Mark's playtest (`docs/cases/Bridge-Shift-Playtest.md`).
- Housekeeping for Mark: set the Drive folder to Restricted; decide on git history cleanup.

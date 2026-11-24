# City Watch: next steps

The live game is `main`, published to https://markmarley82-cpu.github.io/City-watch/.
Every case and its status is in `docs/cases/CASE-REGISTER.md`.

## How the team works (to avoid duplicate builds)

- **Build on `main`.** Branch from the latest `main`, never from an older
  release zip, so recent fixes are not lost.
- **Claim before building.** Before starting a case, mark it "in progress (who)"
  in `docs/cases/CASE-REGISTER.md` on `main`. CW-NC-01 was built twice in
  parallel; this stops that happening again.
- **One way to build cases.** Data-driven cases go in `dist/cases/city-cases.json`
  (played by `dist/cw-cases.js`; see the README). A case that needs its own
  logic, like the Bridge pilot, goes in `dist/cases/<name>.mjs` with a test in
  `tests/`.
- **Done means:** both branches playable, reload-safe, pays once, case register
  updated, and played in a browser.

## 1. Now: playtest the Bridge case (blocks new cases)

- Run `docs/cases/Bridge-Shift-Playtest.md` with at least two players,
  uncoached, on desktop and on an iPhone.
- Milestone: two players make different reasonable choices, see different
  consequences, and both feel they did good police work.
- Watch for: whether the two reports (reopened / proved) feel like enough
  outcomes; whether players notice the newspaper follow-up; whether the
  ✦ button makes the stops clear.

## 2. While waiting for playtest results (no new cases needed)

These make what already exists reliable:

- **Done: played the live content end to end.** Guild licence check, Market
  enquiry, Dimwell beat, Carrot's assignment, Mended Drum brawl, the University
  case and the Commander's final choice all play through; the fixes are listed
  in the register.
- **Done: Random patrols.** The "not saved" message is fixed, and the report
  sites are now real places on the new map (see the register).
- **Done: the 14 old street cases and the Thirteenth Chime** are ported to City
  cases (CW-SC-01 to 14, CW-MY-01) at places on the new map. Check them with
  `node tests/cw-city-cases-data.mjs` after editing the case data.

## 3. After the playtest

- Revise the Bridge case from the findings.
- Build the next batch the way that tested best, in small groups: first the
  "enquiry" briefs (fit the existing pattern), then partner missions
  (CW-PS-01 to 20), then "extension" briefs, then the Inquirer arc (INQ-02 to 04).

## 4. Finishing Version 1.0

- **Status 23 Nov:** content and the larger Mended Drum installation are complete for 1.0. What remains is
  Mark's play-through on his iPhone, fixing whatever that turns up, and the Bridge playtest.

- **Done: promotion.** Claiming the commendation makes you at least Constable,
  and the Commander's Decision at least Corporal (`career()` in
  `dist/cw-p21-state.js`); higher ranks earned on Night duty are kept.
- **Done: the ending** (`dist/cw-ending.js`): a night ceremony in Watch Square
  with the whole Watch, personal lines from Colon, Nobby and Carrot, Vimes and
  the stripe, the service record, a memorial for Sir Terry Pratchett and the
  dedication, then free patrol.
- **Done: story gaps.** Chapter 1 ends with Colon asking who took the ledger:
  the careful finding (hidden for collection, guild mark unconfirmed, no name)
  pays full merit, "the guild did it" files as suspected for less, and blaming
  the urchin is turned down. Each chapter now ends on its own case-filed
  screen. Vimes briefs chapter 2 (and reacts to your ledger finding), gives a
  hint at each step, debriefs it, and briefs chapter 3; the ending remembers if
  you named the guild early (`ledgerFinding` in `campaign-engine.html`).
- **Done: sound.** Sound comes on with the first tap; street life by district;
  full-length music by scene with crossfades; fight sounds, voices and a crowd,
  all real CC0 recordings (credits in each `dist/assets/*/CREDITS.txt`).
- Final release check on desktop and a physical iPhone.

## 5. Polish (any time)

- Faster phone loading. Startup on a simulated mid-range phone is now about
  58 s on 4G (was 83 s) and 39 s with instant downloads (was 66 s).
  - Visual layers (side-street paving, the Atlas map's extra waypoints, the
    public paving correction) load after the game is playable.
  - Each deploy bakes `startup-cache.json` (tools/bake-startup-cache.js, run by
    the Pages workflow): expensive startup checks are verified once for that
    exact build, and phones skip them only when the city they build has the
    same fingerprint (`city-startup-cache.mjs`). The Hide Park north door check
    is the first. The same deploy step regenerates `cw-prefetch-list.json`, so
    it cannot go stale. The last step of each deploy log prints what was baked.
  - To add another check: give it a name, call `startupCheck(startupCache,
    name)` with a `fingerprint` of what it reads, skip it when `verified()`,
    and `record()` after it passes.
  - The river's scattered detail (litter, ripples, snag pockets) is worked out after the game
    is playable, in slices (`createRiverDetailPlanSliced`, same plan byte for byte); until
    then the river shows the same water and banks without it. Reused buildings are tinted
    with canvas blending instead of reading every pixel back (`city-reuse-finish.mjs`;
    visible difference at most 2/255). Together about 5 s off a slow phone's start
    (39 s to 34 s with downloads excluded, 4x slowed CPU, deploy-time checks baked).
  - Measuring locally: GitHub Pages compresses JSON/JS/CSS, so test with compression
    (about 9 MB of data files shrink several times), and bake `startup-cache.json` first
    (`node tools/bake-startup-cache.js <copy of dist>`), or the door check runs and adds
    about 6 s.
  - What is left: about 24 MB of images before you can move before you can move (~30 s on
    4G alone), and the per-district ground work. Loading distant districts'
    art later would be the next big step; it touches how each district is
    installed.
- **Done: overlapping map labels (24 Nov).** Landmark, district and street names now use measured
  collision-aware placement, small vertical offsets and crowding/clipping suppression. Pins and
  routes stay at their original coordinates. Phone/landscape/tablet/desktop checks cover pan, zoom,
  pinch, focus, district/destination selection, rotation and Walk here. See `docs/qa/ATLAS-LABEL-READABILITY.md`.
- Done: `bridge.html` and `layout.html` (old test scenes) load without errors again.
- Done: the Night duty menu sits on the team's Night Duty board
  (`dist/cw-night-board.css`, built in `nightBoard()` in `dist/cw-patrol-duty.mjs`).
  The title goes on the plaque, rank, pay and city time go on the three plates, and
  the night's choices go on the parchment, with the general pay notes below them.
  Short landscape screens get a plain parchment sheet instead, because the 2:3 board
  would make the text too small. The rest of a shift (incident choices, the Dimwell
  beat, licence check, enquiries and the shift report) already uses the parchment
  notebook dialog, checked by playing the Opera shift through on 18 November.
- Done: the art team's full recruit set is in the game (`dist/cw-recruit-art-v2.mjs`, the
  team's integration): the default human, female and dark-skinned recruits, the red-bearded
  dwarf and the stone troll, with all nine moves, the truncheon strike, armour, colours and
  heads. Open points (resolution, sword and crossbow hand points, guild-interior rooms) are
  in `docs/art/RECRUIT-STUDIES-IN-GAME.md`.
- Done: the two bugs from the 17 November playtest. "Walk to current assignment" now
  heads for Carrot when Carrot has the assignment, and Carrot's case has a walk button.
- **Done: larger Mended Drum exterior and placement (23 Nov).** Mark compared two
  installs side by side and chose the one with the door facing the open street. The
  tavern sits on plot `[103,239,9,8]` with its door at `[106,247]` (APRON:drum);
  `dist/city-drum-plot.mjs` retires the 35 street cells under it and keeps every route
  connected. Rebuild with `tools/place-mended-drum.py <art-review packet>`. The earlier
  install that shifted the neighbouring warehouse and house (commit 8acd890) was taken
  out of `dist/`; its review evidence stays in `art-review/mended-drum-large-v1/`.
  Physical iPhone/Safari acceptance remains Mark's check.
- The historical angle audit of the other landmarks remains in
  `docs/art/audit/LANDMARK-ANGLE-SIZE-AUDIT.md`.

## Housekeeping (Mark)

- Set the team Google Drive folder back to **Restricted** sharing.
- Decide whether to clean the old zip uploads out of the git history
  (about 535 MB to download; it rewrites `main`'s history).
- Check `City-Watch-Patrol-Cases-v1.zip` and `City-Watch-Quest-Emblems-v1.zip`
  in Drive for anything not already in the register.

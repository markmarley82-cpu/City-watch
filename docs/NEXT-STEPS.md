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
  - What is left: about 32 MB of art downloads before you can move (~30 s on
    4G alone), and the per-district ground work. Loading distant districts'
    art later would be the next big step; it touches how each district is
    installed.
- Overlapping labels on the city map (needs the map source).
- Done: `bridge.html` and `layout.html` (old test scenes) load without errors again.
- Done: the Night duty menu sits on the team's Night Duty board
  (`dist/cw-night-board.css`, built in `nightBoard()` in `dist/cw-patrol-duty.mjs`).
  The title goes on the plaque, rank, pay and city time go on the three plates, and
  the night's choices go on the parchment, with the general pay notes below them.
  Short landscape screens get a plain parchment sheet instead, because the 2:3 board
  would make the text too small. The other Night duty screens still use the older
  engine look.
- Done: the two bugs from the 17 November playtest. "Walk to current assignment" now
  heads for Carrot when Carrot has the assignment, and Carrot's case has a walk button.

## Housekeeping (Mark)

- Set the team Google Drive folder back to **Restricted** sharing.
- Decide whether to clean the old zip uploads out of the git history
  (about 535 MB to download; it rewrites `main`'s history).
- Check `City-Watch-Patrol-Cases-v1.zip` and `City-Watch-Quest-Emblems-v1.zip`
  in Drive for anything not already in the register.

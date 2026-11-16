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

- **Play the untested live content end to end** and fix what breaks: Guild
  licence check, Market enquiry, Dimwell beat, Carrot's assignment, Mended Drum
  brawl, the University case, and the Commander's final choice.
- **Random patrols:** opening the docket showed "The patrol change was not
  saved"; find out why and whether a report ever appears.
- **The 14 hidden street cases:** test them in the current game; switch on the
  ones that work.

## 3. After the playtest

- Revise the Bridge case from the findings.
- Build the next batch the way that tested best, in small groups: first the
  "enquiry" briefs (fit the existing pattern), then partner missions
  (CW-PS-01 to 20), then "extension" briefs, then the Inquirer arc (INQ-02 to 04).

## 4. Finishing Version 1.0

- **Promotion at the commendation** (approved): claiming the commendation also
  promotes the recruit, so story-only players are not stuck at Lance-Constable.
- **The ending** (approved design): after the Commander's final choice, a
  closing scene with Vimes that ties the guild threads together, the promotion,
  a personal record card, credits and the fan-game note, then free patrol.
- **Story gaps:** Vimes has almost no lines in chapter 2; chapters 1 and 2 end
  on the same generic report screen; the ledger case files itself without a
  "who did it?" choice.
- Final release check on desktop and a physical iPhone.

## 5. Polish (any time)

- Faster phone loading: load the area around the player first (startup is
  about 69 s on a simulated mid-range phone; 30 s of that is computing).
- Overlapping labels on the city map (needs the map source).
- `bridge.html` and `layout.html` show errors; fix or hide the menu links.
- Night duty uses the older interface; match it to the new one.

## Housekeeping (Mark)

- Set the team Google Drive folder back to **Restricted** sharing.
- Decide whether to clean the old zip uploads out of the git history
  (about 535 MB to download; it rewrites `main`'s history).
- Check `City-Watch-Patrol-Cases-v1.zip` and `City-Watch-Quest-Emblems-v1.zip`
  in Drive for anything not already in the register.

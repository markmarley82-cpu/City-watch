# City Watch: The Lantern Files

An unofficial, non-commercial Discworld fan game for phones and browsers. You
play a new recruit in the Ankh-Morpork City Watch: walk a painted isometric
city, take cases from Sergeant Colon, question witnesses, keep a Notebook of
evidence, and work night duty.

**Play:** https://markmarley82-cpu.github.io/City-watch/

Discworld is © the Terry Pratchett estate. This project is not affiliated with
or endorsed by its owners.

## How to play

- Choose a recruit, enter a name and sign the Watch oath.
- Drag on the city to walk, or tap open ground to walk a route there.
- Follow the assignment shown at the top. **Duty** opens the main menu,
  **Notebook** holds your cases and evidence, **Map** opens the city atlas.
- Progress is saved in your browser. Use **Duty → Back up save to a file** to
  keep a copy, and add the game to your Home Screen so Safari doesn't clear it.

## Repository layout

- `dist/` is the whole game: plain HTML, CSS and JavaScript modules with no
  build step. `dist/index.html` is the entry page; `dist/campaign-engine.html`
  is the Night duty and interiors screen, opened inside the main page.
- `dist/assets/` holds the art, audio and data. Licences and credits for
  music and sound are in `dist/assets/echo-*/CREDITS.txt`.
- `.github/workflows/pages.yml` publishes `dist/` to GitHub Pages on every push
  to `main`. It leaves out the old `play-*.html` test pages and
  `source-inventory.json`.

## Running locally

Serve the `dist` folder with any static web server, for example:

```bash
cd dist && python3 -m http.server 8000
```

Then open http://localhost:8000/. The game must be served over HTTP (not opened
as a file) because it uses JavaScript modules.

## City cases

Duty → **City cases** offers optional street cases after the opening purse case.
They are played by `dist/cw-cases.js` from the data in
`dist/cases/city-cases.json`, so a new case is mostly writing:

- `places`: named street points (`[x, y, edge]`) where scenes happen.
- each case: `scenes` (with `gives` clues, `requires` clues, an optional
  `choice`, and `requiresChoice` for branch-only scenes), and a `file` section
  with `findings`. A finding pays only if its `requires` clues were recorded;
  findings without an `outcome` are wrong answers that are gently rejected.
- every case needs a partial finding that can always be filed, and a fuller one
  for the second branch.

Progress is saved in the campaign record (`state.flags.cityCasesV1`), each case
pays once, and reloading resumes the same branch. The briefs these come from are
in `docs/cases/`. Built so far: CW-NC-05, CW-NC-08, CW-NC-12 and CW-NC-43, plus the old engine's 14
street cases (CW-SC-01 to 14) and its Thirteenth Chime mystery (CW-MY-01), ported
to the current city. (CW-NC-01, the Bridge case, is the team's pilot in
`dist/cases/bridge-closure.mjs`.) The case player also supports replayable
partner shifts (`shift`, `partners`, partner-specific text and outcomes) and
`derive` rules: a clue that follows from others, which can also express "either
of these clues" with one rule per clue. The board shows five open cases at a
time, and city cases appear in the Watch Notebook's Cases tab. `docs/cases/CASE-REGISTER.md` tracks every
case in the project and its status; `docs/cases/Bridge-Shift-Playtest.md` is the
uncoached playtest sheet.

## The ending

`dist/cw-ending.js` shows the ending once, after the Commander's Decision: a
night ceremony in Watch Square where the Watch gathers and Colon, Nobby and
Carrot recall things the player actually did (read from the save), Vimes ties
the story together and hands over the stripe; then the service record, a
memorial for Sir Terry Pratchett (his portrait, `dist/assets/memorial-v1/`, in front of
the clacks tower from `dist/assets/clacks-v1/` cycling its signal frames),
the dedication, and back to free patrol. It sets `state.flags.endingV1`;
players can see it again from Duty → Your Watch record. There is no credits
screen: music and sound attribution (required for the CC BY tracks) stays in the
music panel's "Credits and excerpt details" and in `dist/assets/echo-*/`.

## Faster loading on phones

`dist/cw-prefetch.js` downloads, in the background, the files the city asks
for later in startup, using the list in `dist/cw-prefetch-list.json`. The list
uses the exact file names and `?v=` version tags. After a release changes them,
regenerate it with `node tools/make-prefetch-list.js` (instructions at the top
of that file). An out-of-date list does no harm beyond some wasted downloads;
the game still loads every file it needs itself.

## Notes for contributors

- The game is served from a sub-folder on GitHub Pages (`/City-watch/`), so
  paths must be relative. A path starting with `/` will break the live site.
- Most JavaScript is minified, one long line per file. Keep edits small and
  re-test in a browser served under a sub-folder.

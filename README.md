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

## Notes for contributors

- The game is served from a sub-folder on GitHub Pages (`/City-watch/`), so
  paths must be relative. A path starting with `/` will break the live site.
- Most JavaScript is minified, one long line per file. Keep edits small and
  re-test in a browser served under a sub-folder.

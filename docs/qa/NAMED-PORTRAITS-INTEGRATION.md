# Named conversation portraits — draft integration

This branch puts six reviewed named portraits into the existing People & Contacts conversation profile and Dibbler’s shop introduction. Colon, Nobby, Carrot, Vimes, Mrs Palm and Dibbler have explicit identity mappings; the three supported Watch partners use their mentor keys. Generic NPC keys, unnamed workers and other partners retain the existing art.

## Behaviour

Images load when the conversation/shop opens. Six lossless RGBA WebPs at 256 × 256 total 372,978 bytes; filenames contain their content hashes. The source commit and checksums are recorded in `dist/assets/conversation-portraits-v1/manifest.json`. An image failure restores the previous portrait. Late failures cannot replace a different person’s current portrait. Shop purchases and input/modal behaviour retain their existing handlers.

The import-cache chain through the game, city loader, phone loader and entry page is bumped. Only the named dialogue and shop profile surfaces are changed; campaign-engine screens, combat sprites and map faces are not replaced. In particular, Nobby’s existing narrow map face remains different from the newly revised broad portrait.

The latest main already includes fitted street interiors (95c34a7); this branch does not redo that integration.

## Validation actually performed

- `node tests/cw-conversation-portraits.mjs`: explicit identity selection, exclusion of unrelated actors and prototype keys, production asset presence and stale-error protection.
- `tests/cw-conversation-portraits-dom.mjs` with Happy DOM 21.0.4: all six named dialogue paths through the actual contacts module, partner modal and input restoration, legacy fallbacks, lazy shop loading, Dibbler purchase/save callback and close. This is DOM component execution, not visual browser proof.
- Existing bridge-pilot and city-case-data tests pass (18 cases, 23 places).
- Module syntax, diff whitespace, 256 px asset dimensions and transparency checks pass.

**Browser and physical-phone verification are not complete.** The local Chromium process could not start in this execution environment, and the separate cloud browser could not access the local server. No screenshots, opening-case playthrough, mobile-layout pass or live deployment are claimed. Review in a real browser before merging or publishing.

## Reproduce

```sh
python tools/export-dialogue-portrait-assets.py
node tests/cw-conversation-portraits.mjs
npm install --prefix /tmp/cw-portrait-qa --no-audit --no-fund happy-dom@21.0.4
CW_QA_DOM_MODULE=/tmp/cw-portrait-qa/node_modules/happy-dom/lib/index.js node tests/cw-conversation-portraits-dom.mjs
node tests/cw-nc01-bridge-pilot.mjs
node tests/cw-city-cases-data.mjs
```

The exporter reads the source commit recorded in the manifest. Fetch `art/portraits-v1` if that Git object is not available locally. Pillow is needed for export; Happy DOM is a test-only dependency installed outside the repository.

## Browser review still needed

Open a named conversation, confirm the portrait and text fit on a phone, switch between contacts, close and return to patrol. Open Dibbler’s shop, inspect the portrait in portrait and landscape layouts, buy an item, and return to patrol. Test a blocked portrait request to confirm the old image appears. Do not mark this browser-verified from the automated checks above.

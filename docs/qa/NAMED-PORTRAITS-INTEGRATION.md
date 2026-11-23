# Named portraits — integration review

This branch follows main at 6e03d6f, which has already installed the six named portraits and a heading decorator. The direct contact/shop profiles use 256 px transparent versions (372,978 bytes total), explicit character identity mappings, lazy loading and legacy-image fallbacks.

## Compatibility with current main

The heading decorator now leaves dialogues with their own profile alone, preventing a second portrait beside the same character's words. Legacy parchment headings still receive one portrait and remove it when the speaker changes. Main's existing portrait assets, larger phone crowd and night crowd behaviour are retained. The import-cache chain is advanced without restoring older city or entry files.

The six street-worker portraits remain unbound. Nobby's world sprite still has the older face. This change covers conversation/shop presentation, not a world/combat sprite redraw.

## Checks

The previous revision passed the explicit-identity, stale-error and DOM component tests. Current-main decorator compatibility and Chromium tests are in the portrait-review workflow; its result and evidence artifact are the authority for this revision.

The Chromium job checks six named dialogue paths at phone, landscape and desktop sizes, image loading, duplicate faces, horizontal fit, return to patrol, a Dibbler purchase and failed-image fallback. It also attempts the real fresh-recruit flow through the oath, first briefing and Nobby conversation. These are automated Chromium checks, not a physical iPhone/Safari sign-off. Screenshots and results.json are retained in the portrait-browser-review artifact.

No live deployment is performed by the review workflow.

## Reproduce

```sh
node tests/cw-conversation-portraits.mjs
npm install --prefix /tmp/cw-portrait-qa playwright@1.63.0 happy-dom@21.0.4
CW_QA_DOM_MODULE=/tmp/cw-portrait-qa/node_modules/happy-dom/lib/index.js node tests/cw-conversation-portraits-dom.mjs
NODE_PATH=/tmp/cw-portrait-qa/node_modules node tools/test-portrait-browser.cjs
```

Install the Playwright Chromium browser before the last command. The asset exporter reads its source commit from dist/assets/conversation-portraits-v1/manifest.json. The workflow does not use repository secrets or publish GitHub Pages.

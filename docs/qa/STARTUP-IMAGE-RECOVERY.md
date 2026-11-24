# Startup painting recovery — 24 November 2026

A public-site check stopped with “Painting could not load” and resumed only after Retry loading. The shared image loader allowed one immediate retry. It now allows two retries, separated by 300 ms and 1.2 s pauses, with distinct cw-retry URLs. Healthy images incur no pause or extra request. Existing image-queue concurrency, 20-second per-attempt timeout, shared pending requests and successful-image caches remain in city.mjs. After three failed attempts the original error still reaches the existing Retry loading screen.

The boot cache chain is versioned through index.html, phone-map.js and city.mjs. Save handling and room/case data are unchanged.

## Checks

- `node tests/city-image-retry.mjs`: healthy requests, timeout then network failure followed by recovery, query/hash preservation, exact delay schedule, bounded permanent failure, explicit zero/one-retry limits.
- `tools/test-startup-recovery.cjs`: full-game Chromium phone and desktop boots with the first two image requests for the required Watch House painting aborted. Recovery must reach ready without navigation/reload or a failed overlay. The actual request sequence and delay lower bounds are checked.
- The phone flow completes the real recruit/oath/briefing, reloads with the same painting permanently unavailable, verifies three attempts and the useful Retry loading screen, and checks saved position, visits, steps, encounters, pending work, health, coins, rank, chapter, stage and items. Restoring the network and clicking Retry loading must resume the existing patrol without returning to character creation.
- Existing city case and Bridge pilot data checks also run.

The Actions artifact includes screenshots and results.json. Tests demonstrate recovery from injected image-request failures, not a diagnosis of the original public connection failure or proof of physical Safari performance. This does not defer distant art or reduce the startup download size.

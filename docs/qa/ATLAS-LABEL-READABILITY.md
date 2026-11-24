# Atlas label readability — 24 November 2026

The public map showed Watch Quarter over the Opera House label. District/street spans and landmark pseudo-elements previously painted independently.

Landmark names now use measured text spans. A deterministic placement pass tries small vertical offsets (up to 36 screen pixels), then suppresses a name if it still collides or would be clipped. Focused/selected names take priority over other landmarks, district names and street names. The player, beat marker and map controls reserve their space. Destination pins, their 44-pixel buttons, positions, accessible names, district options, destination index and walking routes are retained.

Placement runs once per animation frame while the map is open, after pan, zoom, pinch, selection, focus, resize and font readiness. It does not run in the street's rendering loop.

## Verification

- Pure layout checks cover priority, local offsets, reserved controls, viewport clipping, crowding, stable order and unchanged input geometry.
- Full-game Chromium checks cover phone, landscape, tablet and desktop. They open the real map after recruit/oath/briefing and check visible text boxes against each other, the player and controls at overview/detail zoom, keyboard pan, district focus, landmark focus, touch pinch, destination/route selection and phone-to-landscape resize.
- Pin position styles and coordinate data must remain unchanged. Map interaction must not move the officer until Walk here is clicked; Walk here must then start real street navigation.
- Screenshots and results.json are retained by the Atlas label and navigation checks workflow. Existing city/Bridge and startup-retry checks run alongside it.

These are Chromium layout and input checks. Physical iPhone/Safari acceptance remains separate.

## Result

All four viewport flows and the layout/existing regression checks passed in [Actions run 45510255448](https://github.com/markmarley82-cpu/City-watch/actions/runs/45510255448). The [artifact](https://github.com/markmarley82-cpu/City-watch/actions/runs/45510255448/artifacts/14974734032) contains overview, initial and selected-route screenshots at all four sizes, the phone landscape resize and results.json. No JavaScript page errors were reported.

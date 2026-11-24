# Civic room view v2 — 24 November 2026

Post Office, Royal Bank and Palace use the shared following camera, direct walk-and-use markers, Whole room toggle and safe-area controls. Phone artwork is approximately 1.86–2.01 times its previous whole-image fit. Contacts remains available for off-screen destinations. Room art, floor geometry, collision, dialogue, campaign rewards and exterior doors are unchanged.

## Verification

`tools/test-civic-room-view.cjs` opens the full game, creates a recruit and completes the oath/briefing in four browser configurations: touch phone 390×844, touch landscape 844×390, touch tablet 768×1024 and mouse desktop 1280×900. It restores the disposable test officer to each real civic street door, then enters through the normal Use control. It does not test a city-wide walking route.

For each room/configuration it checks: full-screen stage, visible action controls, direct marker tap/click with walk and automatic dialogue, a different Contacts selection with Approach and Interact, Whole room/follow toggles, no required room asset failures or JavaScript page errors, and exit restoring the original street position/edge. Phone tests reload inside all three rooms and verify the resumed position. Screenshots cover the room and contact in all 12 combinations.

The first screenshot review found legacy landscape grid placement clipping action buttons, plus overlapping entrance labels. The shared stylesheet now clears that placement, tests assert every visible action button stays within the viewport, and the player label is suppressed beside an active destination/exit label.

Validation includes Node syntax checks and the existing city case and Bridge pilot checks. Browser runs and screenshots are retained in PR #15's Actions artifact. These are Chromium viewport/touch checks; physical iPhone/iPad Safari performance remains unverified by this change.

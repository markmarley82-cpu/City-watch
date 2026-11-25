# Shop room readability repair

Street room actors render at 65% of their former magnification. The officer uses the original 192 x 192 idle/walk cells (117 px human height), replacing the reduced 128 x 96 runtime cells (58.5 px human height). All five approved recruit bodies retain their equipment, head and tint layers. Only the two motion rows are loaded indoors; existing street and combat rendering is unchanged.

43 lossless motion layers were checked against the original source pixels. The extra exports total about 1.1 MB compressed. Guild NPCs retain their existing source art at the corrected scale; no higher-resolution NPC detail is claimed.

Dialogue and inspection panels have opaque parchment fallbacks. Headers and response buttons remain legible if decorative textures fail.

Verified by GitHub Actions run 45707216705 at 390 x 700 CSS pixels, DPR 3: actual recruitment and oath, shop entrance, original-resolution recruit renderer active, tap and walk to butcher, talk, leave, same street position restored, no JavaScript exceptions. Decorative notebook/tab requests were deliberately blocked. Physical iPhone verification remains outstanding.

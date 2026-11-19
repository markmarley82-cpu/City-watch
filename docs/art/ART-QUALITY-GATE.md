# City Watch — Art Direction & Quality Gate

**Owner:** Art lead (ChatGPT) · **Creative approval:** Creative Director  
**Audit date:** 17 November 2026  
**Live game:** https://markmarley82-cpu.github.io/City-watch/  
**Work tracker:** [Art direction and visual QA — Issue #7](https://github.com/markmarley82-cpu/City-watch/issues/7)  
**Release-readiness tracker:** [Issue #5](https://github.com/markmarley82-cpu/City-watch/issues/5)  
**Instruction in force:** Documentation and non-invasive art audits are permitted. **Do not change, replace, remove, or integrate game code, art, map placements, or other files under `dist/` without a new explicit instruction.** A candidate is not approved merely because it appears in GitHub.

## Art authority: actual game assets

Work from these files rather than generic fantasy/anime/3D references:

| Asset type | Approved or in-repo *reference* | What to match |
|---|---|---|
| Watch architecture | [Outpost](../../dist/assets/landmark-exteriors-v1/outpost.webp) | 2:1 isometric geometry, warm lantern windows, deliberate dark outlines, timber/brick/slate detail |
| Tavern architecture | [Mended Drum](../../dist/assets/landmark-exteriors-v1/drum.webp) | Brick/timber variation, door scale, contact shadow, readable silhouette. **Current art rejected by Mark, 19 Nov 2026: too small. Replacement needed (see `docs/NEXT-STEPS.md`).** |
| Common city buildings | [S038 roof 335](../../dist/assets/section-s038/roof-335-full.webp), [roof 349](../../dist/assets/section-s038/roof-349-full.webp) | Same street-level scale and painterly finish without obvious cloned neighbours |
| Watch character treatment | [Nobby portrait](../../dist/assets/characters-drawn-v1/mentor-nobby-portrait.webp), [Colon](../../dist/assets/characters-drawn-v1/mentor-colon-portrait.webp), [Vimes](../../dist/assets/characters-drawn-v1/vimes-portrait.webp) | Consistent silhouettes and rank/character-appropriate costume at actual in-game display size |
| Race art | [Recruit](../../dist/assets/characters-drawn-v1/watch-recruit-portrait.webp), [dwarf](../../dist/assets/characters-drawn-v1/p3_dwarf_01-portrait.webp), [troll](../../dist/assets/characters-drawn-v1/p3_troll_01-portrait.webp) | Preserve racial scale differences; inspect edge quality and alpha on cobbles, not just transparent preview |
| Signal tower | [Clacks frame sheet](../../dist/assets/clacks-v1/clacks-tower-8-shutter-states.webp) | Eight shutters in **two columns × four rows**; lit windows behind appropriate shutters, not arbitrary decorative lanterns |

**Style rule:** Hand-painted game art in the established isometric perspective. Weathered stone, slate, plaster, iron, timber and warm nighttime lamplight. Cohesive outline weights, painterly texture, contact shadows, proportions and scale. Resist modern/anime styling or pasted-in photoreal textures.

**Reuse rule:** Reuse existing building art only when separated sufficiently that identical copies are not obvious from a normal patrol route. Subtle hue variation may help; never use mass repetition to fill a street. Artwork must not obstruct walkable streets.

## Verified static inventory (17 November 2026)

Checked against the full tracked `main` tree. This is a **presence and manifest-reference** audit, not pixel-level or runtime certification.

| Category | Confirmed in repository | Remaining validation |
|---|---:|---|
| General `dist/assets/` inventory | 3,978 files (including 3,540 WebPs) | Runtime usage, stale files/duplicates, mobile decode cost |
| Drawn character manifest | **76** character assets, nine declared action clips each | Visual frame quality, correct facing, animation cadence, scale, weapon registration |
| Recruit body manifest | **17** race bodies | Race/portrait consistency, phone readability, outfit fit |
| Combat backdrop manifest | **13** scene files | Match world districts, daylight/night lighting and usable composition |
| Approved Clacks sprite sheet | **4** configured signal frames | Actual alpha and cropping, lore/letter encoding not verified |
| Missing static references in above four manifest groups | **0** | Does not prove all files load or draw correctly in Safari |

Character manifest reports no missing clips and no missing weapon variants but identifies itself as **“READY FOR VISUAL AND RUNTIME QA.”** Do not reclassify it as visual sign-off.

## Work queue — art lead

1. **ART-01 · P0 · Character alpha and silhouette pass.** Inspect the recruit, dwarf, troll, Watch officers and 8 adversary types on both pale and dark backgrounds. Check for unwanted red/yellow fringes seen in some GitHub previews. **Status: suspected, not confirmed as runtime corruption.** For each sample capture idle, walk, attack, guard and arrest in ordinary gameplay. Confirm mirrored equipment/insignia.
2. **ART-02 · P0 · Dibbler alpha and scale.** Review [approved-sheet](../../dist/assets/dibbler-v1/approved-sheet.webp) for apparent coloured background blocks in its preview; determine actual alpha and whether this source is rendered at runtime before raising a defect. Test alongside other market NPCs.
3. **ART-03 · P0 · Patrician's Palace.** [Palace manifest](../../dist/assets/palace-001/manifest.json) explicitly says the remaining palace is unfinished, `physicalPhoneVerified: false`, `creativeAcceptance: false`. Inspect in-city angle, 60px actor scale / ~65px doorway, gate/walls, road overlap, cutaway and walkable ground, in daylight and at night. Do **not** change placement in the art audit.
4. **ART-04 · P1 · Windows and lighting.** City-wide day/night comparison; no daytime illuminated panes, no floating or wall-wide bloom, no dark walkways, no incorrect cutaway masks.
5. **ART-05 · P1 · Combat and partner animation.** Check all nine source actions, foot pivots, contact frames, weapon overlays and visibly different enemy tactics. Check attacks and arrests at normal zoom, with Nobby and a second partner.
6. **ART-06 · P1 · Clacks and memorial.** Test 2×4 shutters, frame-to-frame registration, alpha, portrait/tower scale and reduced-motion behaviour. Visual frame patterns alone are not verified Clacks/GNU encoding.
7. **ART-07 · P2 · Interface/interior unity.** Duty, Notebook, oath, shops, battle sheets and older Night Duty UI: consistent ornamental surfaces, spacing and text margins on a physical iPhone and iPad.

## Acceptance procedure for any future art packet

1. Name a **single packet** (`ART-01`, etc.), identify source and exact candidate paths, and point to the canonical live reference(s).
2. Supply normal-scale comparison: game screenshot + candidate overlay, ideally **day and night** for world art; portrait at actual displayed size for characters.
3. Run transparency test on light, dark and cobbled surfaces (not screenshots on checkerboard only). Check no coloured fringe, baked matte, broken alpha or cut seams.
4. Verify 2:1 perspective, real-world relative scale (actor height, door/foot anchor), draw order, wall masking, clear street path and non-obvious repetition.
5. For characters: check nine clips, both displayed facings (including mirrored kit), animation frame spacing, attack/restrain contact, no stretched PNG; test NPC/battle parity.
6. For phone: test a physical iPhone Safari at default zoom; check readability, clipping, FPS/decoding impact, loading and light-at-night.
7. Record status as **Proposed → Art QA passed → Creative Director approved → Integrated → Runtime verified**. Missing a stage is **not approved**.
8. Preserve prior approved source files. Never overwrite an approved asset or merge visual changes into `main` without explicit authorisation.

### Review record template

```text
Packet:
Candidate path(s):
Reference path(s):
Source revision:
Device / viewport:
Screenshots (day/night or idle/actions):
Perspective / scale / anchor:
Alpha on pale/dark/cobbles:
Masks / windows / lighting:
Facings / animation (if character):
Visual issue and reproduction:
Status: Proposed | QA passed | Approved | Integrated | Runtime verified
Creative approval:
Notes / next action:
```

## Operating rule

**Every art QA result, candidate inventory and acceptance decision must be recorded in the GitHub art issue (#7) or a linked `docs/art/` record.** Work saved locally or described only in chat is not delivered. The playable build remains unchanged by documentation work.

**Audit limitations:** Reference previews and manifests were inspected; pixel-perfect alpha, every district, nighttime compositing, and a physical-device art sign-off remain unverified. These are explicit test targets, not claimed failures.

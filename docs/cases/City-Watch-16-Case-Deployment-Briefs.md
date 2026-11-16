# City Watch: The Lantern Files — 16 case deployment briefs

**Status:** Design ready for review; no quest logic, map edits, assets, save migration, or deployment. The identifiers below are proposed case keys, not existing runtime IDs. Locations are existing map areas or existing interactions; exact standing points, route edges and callback bindings must be checked on the integration commit.

**Receiving branch:** `markmarley82-cpu/City-watch/main`. Reference HEAD observed during prep: `51dc264fa0e99c21ca9f8a317f50c6c70ed63f05`; resolve HEAD again before coding. Keep the Pages path, startup work, opening case, Night Duty, and save backup/restore intact. These are original stories set around established characters; unnamed witnesses and invented events do not establish canon.

**Release order:** Start with CW-NC-01 as the multi-location pilot. CW-NC-08 and CW-NC-12 are smaller evidence-led cases for proving the common filing flow. Cases marked **extension** need a new case action or state transition; reuse current movement and interactions, and do not ship a fake stakeout, escort, or timed branch that just advances a dialogue flag. Cases marked **enquiry** fit the existing evidence/finding pattern, although they still need route registration, text, and browser verification.

## CW-NC-01 — The Bridge That Was Closed · extension
**Route:** Colon at Watch Square → public bridge approach → quay → Carrot at Watch Square. Nobby is the optional observer. Misbegot (E007) is a candidate, subject to public approach and cart clearance checks.
**Evidence:** An unofficial closure notice redirects deliveries. The quay tally shows one trader repeatedly arriving ahead of the delayed carts. Seeing a payment connects that trader to the person posting the notice; timing alone does not.
**Choice and filing:** Remove the notice for immediate relief, or leave it briefly while Nobby watches for a handoff. File obstruction if you only have the notice and tally; allege orchestration only with corroboration.
**Test:** Both branches conclude; removing the prop never blocks or alters a bridge lane or a through-route.

## CW-NC-02 — Dibbler’s Guarantee · extension
**Route:** Dibbler’s existing pitch → Watch Square → public University approach. Use the live pitch resolver and existing University contact only if applicable.
**Evidence:** Customers repeat the same complaint verbatim. The rival stall is a diversion to let someone recover a sealed packet under Dibbler’s pitch. The repeated script and a witnessed retrieval establish different facts.
**Choice and filing:** Ask Dibbler to cooperate in a stakeout, or recover the packet first. Recovering it closes the immediate risk but can leave the organiser unidentified. Never open the packet to manufacture proof.
**Test:** Find Dibbler at his actual active pitch after reload; neither branch changes shop inventory, price, or regular availability.

## CW-NC-03 — The Lodger Who Never Left · enquiry
**Route:** Existing lodging service → Mended Drum public frontage → docks. Mrs Palm is consulted at her existing Market contact if needed; Colon receives the report.
**Evidence:** Rent is still being paid for an empty room. The lodger left voluntarily; someone is collecting wages under their name. A witness can confirm departure, while a wage tally establishes use of the name.
**Choice and filing:** Close the missing-person inquiry without disclosing an address; pursue the wage claim separately, or confront early with only partial proof.
**Test:** The safe-return conclusion works with departure evidence alone. Fraud cannot be marked proved from the rent receipt alone.

## CW-NC-04 — The Lamp That Went Out · extension
**Route:** Public lane in the Shades → nearby lawful observation spot → Carrot at Watch Square. Nobby can cover a second position.
**Evidence:** The lamp is working; a covered cart blocks the light. The driver stops because someone puts an obstruction in the lane. A sighting of the obstruction setter distinguishes the organiser from the driver.
**Choice and filing:** Prevent the next theft, or keep watch long enough to identify the organiser. The player may protect pedestrians without proving the full scheme.
**Test:** A missed observation has a follow-up. No global lighting, lamp registration, or city collision changes; the scene works after dusk and reopens the observation window if missed.

## CW-NC-05 — The Bread at the Wrong Door · enquiry
**Route:** Walkable frontage at Watch Square → existing bakery frontage chosen from the atlas → quay or Market delivery stop. Colon briefs; Nobby spots the reused wrapping.
**Evidence:** A baker’s delivery is blamed for missing supplies. The wrappers are theirs, but their count and folding differ from the tally. A second witness confirms that sacks were switched after delivery.
**Choice and filing:** Return the identifiable bread promptly or keep a witnessed count for a stronger report. A reused wrapper is not enough to blame the bakery.
**Test:** The case works entirely at lawful frontages, with no new shop or inventory system.

## CW-NC-06 — An Unquiet Return · enquiry
**Route:** University public approach → existing Market contact → Watch Square. Use an existing wizard contact; Mrs Palm can identify the person who arranged the sale.
**Evidence:** A returned University instrument appears intact, but its engraved repair mark is wrong. A repair receipt shows that a copy was ordered before the original went missing.
**Choice and filing:** Recover the original from a buyer who acted in good faith, or arrange a witnessed return to identify the seller. The buyer can be cleared without solving the theft.
**Test:** Reading the repair receipt first or inspecting the return first leads to the same findings. No University room or new entrance required.

## CW-NC-07 — The Queue That Paid Twice · enquiry
**Route:** Royal Bank external public approach → Market Square → Carrot. Use an existing public approach only; keep the counter unnecessary.
**Evidence:** Two depositors show identical queue tokens. A supposed helper is charging people to exchange valid tickets for worthless duplicates. A real receipt and one witnessed sale distinguish this from a bank error.
**Choice and filing:** Warn those still waiting or identify the seller through a buyer who has already paid. Record stopped losses separately from proven fraud.
**Test:** A player can complete the case outdoors without opening a bank account, changing balances, or adding an entrance.

## CW-NC-08 — A Receipt for a Raincoat · enquiry
**Route:** Existing Market contact → public approach to the Mended Drum → Colon. Mrs Palm can vouch for the borrower’s timing.
**Evidence:** A raincoat turns up at a seller’s table with a plausible receipt. A distinctive repaired seam confirms its identity, but the receipt was for a different coat. A second witness explains how the mix-up happened.
**Choice and filing:** Arrange a return without accusing the seller of theft, or investigate who substituted the receipt. Leave the unresolved allegation out of the report if unproved.
**Test:** The player can recover the coat without arrest; the debrief distinguishes mistaken possession from deliberate substitution.

## CW-NC-09 — A Quiet Place to Wait · extension
**Route:** Palace public approach → Watch Square → Market public frontage. Use the existing unnamed attendant only if the live contact is available; otherwise place the briefing with Colon outside.
**Evidence:** People selling “guaranteed audiences” tell petitioners to wait at an unofficial meeting point. The same phrase appears in two independent accounts. A payment witnessed at the meeting point identifies the operator.
**Choice and filing:** Disperse the queue and protect petitioners or ask one willing witness to remain while you observe. Either ending allows a report without naming reluctant witnesses.
**Test:** No secondary Palace entrance, new address, new ranks, or access to restricted areas; a reluctant witness never blocks all progress.

## CW-NC-10 — The Bell Without a Rope · extension
**Route:** Public University frontage → nearby lawful viewing spot → Watch Square. An existing University contact and Nobby compare accounts.
**Evidence:** A claimed warning bell goes off during a series of diversions. In truth, the sound comes from goods striking a metal plate as a cart turns. A second observation tests whether the timing follows the cart rather than a supposed signalman.
**Choice and filing:** Stop the cart to inspect it or observe another pass to identify who takes advantage of the distraction. A clean cart is a valid finding even when the theft remains open.
**Test:** Caption or text conveys every sound clue; a player with audio off can solve it. No live cart-route changes.

## CW-NC-11 — The Paper Before the Story · enquiry
**Route:** An existing newspaper seller → public Watch Square board or street contact → Market Square → Colon. Use the existing Times/Inquirer seller from the live roster.
**Evidence:** A purported early edition announces a closing time that was never agreed. The seller can show the genuine edition. A witness at the Market saw the false sheet being given only to holders of certain pitches.
**Choice and filing:** Correct the rumour in public or question the distributor first. A genuine edition disproves the claim, but only the witness links the distributor.
**Test:** Clues and outcomes are case-local; existing newspaper purchase, ownership and publication logic are unchanged.

## CW-NC-12 — The Fine on the Nail · enquiry
**Route:** Shades public frontage → Watch Square duty desk → public Market contact. Carrot verifies the claimed penalty.
**Evidence:** Residents find unsigned fine notices hung outside their doors. The duty desk has no corresponding record. A witness saw someone collect a payment from a neighbour, turning a nuisance notice into a provable fraud.
**Choice and filing:** Tell residents to stop paying, or identify the collector before issuing the warning. A false notice and a paid fraud are separate findings.
**Test:** The case never deducts coins from the player; both warning-first and witness-first play produce a valid report.

## CW-NC-13 — The Wrong Parcel of Keys · extension
**Route:** Existing delivery point at the Post Office exterior → public lodging frontage → Watch Square. Colon files; Nobby can carry the sealed parcel if that action is supported.
**Evidence:** A parcel is correctly addressed but contains duplicate keys for several rooms. Delivery evidence proves which parcel went where, not who ordered the keys. A witnessed attempt to use one supplies the missing link.
**Choice and filing:** Warn the keeper and secure the rooms, or observe the public approach first. Secure the keys on either branch, even if the intended user escapes.
**Test:** No new Post Office entrance, locked-room access, or reusable key mechanic; protect the already existing Postage Due routing.

## CW-NC-14 — The Cart That Came Back Empty · extension
**Route:** Quayside dispatch → public bridge-side junction → existing market approach → Carrot. Use the atlas and existing cart route as context.
**Evidence:** A driver returns with an empty cart and a genuine delivery receipt. The intended recipient signed for one crate; someone added a second crate to the dispatch tally. Count seals or ask the market receiver to verify the original quantity.
**Choice and filing:** Clear the driver and audit the dispatch tally, or quietly watch the next handover for the person adding cargo. A genuine signature is evidence of one delivery, not of the entire load.
**Test:** No changes to global cart spawn, routes or collision; use an existing stopped contact or case tableau for observation.

## CW-NC-15 — The Second Curtain · enquiry
**Route:** Opera House public exterior → Watch Square → lawful neighbouring public approach. Colon briefs; Nobby speaks to the existing public-facing contact if available.
**Evidence:** A supposed public rehearsal notice caused deliveries to be left off the usual route. Its time is real; its instruction about the delivery location was added later. A worker’s copy and a porter’s recollection distinguish the original notice from the edit.
**Choice and filing:** Redirect the next delivery safely or protect the evidence before confronting the person who altered the notice. Keep the logistics fraud separate from the existing Opera disturbance case.
**Test:** No Opera interior or backstage route is needed; current Opera incidents and prompts remain available.

## CW-NC-16 — The Witness With Two Stories · extension
**Route:** Market Square → public dock approach → Watch Square. Mrs Palm offers a private statement; Carrot receives the report.
**Evidence:** A witness gives one story in public and the opposite one in private. Both are accurate about different journeys of the same borrowed cart. A loading tally distinguishes the journeys and exposes misuse of the cart by a third party.
**Choice and filing:** Let the witness stay out of the public account and corroborate with the tally, or arrange voluntary testimony. If the third party cannot be proved, clear the original suspect and leave the follow-up open.
**Test:** Public and private interview order does not lock the case; the Notebook records the context of each statement rather than replacing one with the other.

## Integration and acceptance

- **Existing source hooks:** Reference Build 534 uses `dist/cw-patrol-enquiries.mjs` for its explicit enquiry allowlist, route/stop bindings, and per-instance evidence snapshot; `dist/cw-patrol-data.js` for case content; `dist/cw-patrol-duty.mjs` and `dist/cw-patrol-handoff.mjs` for street actions and reports; `dist/cw-p21-state.js` for campaign persistence. Recheck these on the receiving branch. A data row alone does not activate a case. Preserve current first-case, Postage Due, and paid shift bindings.
- **Booking and flow:** Make the new case available through existing Duty after the opening case. Use one active case at a time. Each brief needs two independent evidence sources, a lawful report with incomplete evidence, and one distinct second outcome. Do not open an unrelated case over a saved encounter. Keep proposed story contacts unnamed unless an existing eligible character is used.
- **Map fit:** Bind to actual walkable street points and existing interactions. Check approach and return on the current map, including tap and assisted walking, no held links, bridges and carts unaffected. A frontage is sufficient when access to an interior is unverified. No new map, art or service is required to start the pilot.
- **Save and reward:** Persist the lead, recorded evidence, choice and resolution in the existing case instance pattern. Reload before and after the choice and after filing. No duplicate reward, no automatic promotion for a partial report, no new save origin or reset. Exact reward values remain a balancing decision.
- **Performance and accessibility:** Keep any dossier or scene data out of cold startup until needed. Every clue has a readable Notebook record. No required clue depends on hearing audio, distinguishing colour, or catching a single short timer.
- **Ship gate:** Confirm the approved case is registered, both outcomes can be reached and filed, reload resumes the exact branch, and no existing opening case or Night Duty regression. Verify in GitHub Pages and separately on physical iPhone Safari before marking it ready for release. Creative approval remains with Mark.

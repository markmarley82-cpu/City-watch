# City Watch — Patrol partner story missions

Ten original missions, one for each officer in the current partner roster. Taking the same partner again should feel like building a working relationship: each mission starts with the officer’s instinct, gives the player room to question it, and ends with a debrief specific to what the two of you did. These are implementation briefs, not active quests or canon additions.

## How the current partner matters

- **Offer, don't assign.** After the opening patrol, Duty offers the story mission matching the player's current eligible partner. Keep normal Night Duty and other cases available. Reuse the existing merit gates and decline the offer gracefully when that officer is unavailable. Never silently swap partners.
- **Make the strength usable.** Give the player one contextual action such as **Ask Nobby to distract** or **Ask Cheery to compare the marks**. The action changes what happens or what can be observed. It never fills the whole evidence list or automatically files a verdict. Each mission also has a two-officer route the player can take without using the suggested action.
- **Keep one officer from briefing to report.** On acceptance record the existing mentor ID with the story instance; preserve it through street scenes, any encounter and the saved debrief. Hold partner changes until the mission is filed or explicitly stood down. Resume the same officer and branch on reload. A temporarily unavailable officer must not create a hard lock: allow a safe partial report or stand the mission down and offer it again when eligible.
- **Separate actions, findings, and rewards.** Persist the chosen approach, observations and outcome; one reward per filed instance. Never give a wrong verdict just because a partner pointed out a plausible lead. Keep these mechanics and case data out of startup until requested.

Roster and traits were checked on GitHub main in `dist/cw-patrol-mentors.js` and `dist/cw-patrol-partner.js`; selection in `dist/cw-p21-game.mjs` already uses the roster’s merit gates. These briefs extend the story meaning of the traits, not canon powers or new permanent combat skills. Named map areas below are proposed routing anchors: resolve lawful standing points and public approaches against the release build. No new interiors, roads, or artwork are assumed.

## CW-PS-01 — Nobby Nobbs: The Honest Lookout
**Route:** Watch Square → Market public frontage → Colon. **Strength:** Street sense and distraction.

A stallholder offers the same explanation for three missing purses: a particular child was hanging around. Nobby notices that the stallholder never watches the child; they watch the people gathering to hear the accusation.

**Partner move:** Ask Nobby to attract the stallholder’s attention with an argument over change. You can watch who moves behind the crowd and identify the actual lookout. If you decline, compare two customer accounts and follow the handover yourself.

**Decision and payoff:** Clear the child publicly as soon as the account falls apart, or let the story run long enough to identify who pays the lookout. Nobby’s debrief distinguishes spotting a con from proving who ran it. **Gate:** Both branches clear the child with evidence; neither requires an arrest or auto-files the larger allegation.

## CW-PS-02 — Sergeant Colon: A Lane for Two
**Route:** Watch Square → Opera House public frontage → nearby public junction. **Strength:** Holding a position and covering a colleague.

A disputed delivery backs up a crowd outside the Opera. A porter is being blamed for taking a load that never reached the frontage. Someone is using the crush to move it out through a second public route.

**Partner move:** Ask Colon to hold a clear pedestrian lane while you examine the dispatch receipt or watch the second exit. Without his cover, move the witnesses to a calm spot and reconstruct the order of arrivals.

**Decision and payoff:** Disperse the crowd now and prevent injury, or hold a safe line while a witness confirms the diverted load. Colon judges whether the player kept the street safe even if the diversion remains unresolved. **Gate:** No real path is closed; the duty officer’s crowd action must not cancel existing route-following or Opera incidents.

## CW-PS-03 — Detritus: Behind the Barrow
**Route:** Dry quay → public dock junction → Watch Square. **Strength:** Heavy, controlled restraint.

A delivery hand is pinned against a wall by a loaded barrow; a second man insists the person holding it is attacking him. The supposed attacker is actually stopping it from rolling into the crowd, and the load has been deliberately shifted.

**Partner move:** Ask Detritus to brace the case-local barrow while you get people clear and take separate accounts. Or clear the lane, ask the carrier to keep holding, and reconstruct the incident after the pressure is off. Use an existing prop or a short staged interaction rather than global cart physics.

**Decision and payoff:** Help the injured witness first or secure the disputed load before its owner can reclaim it, after immediate danger has been removed. Detritus credits the distinction between using force and preventing harm. **Gate:** No weapon escalation, terrain edit or permanent cart change; every outcome resolves the immediate danger.

## CW-PS-04 — Constable Visit: The Third Account
**Route:** Market public pitches → Small Gods public approach → Watch Square. **Strength:** Patient persuasion.

Two neighbours each insist that the other took a shared collection box. A third person has heard both accounts but is afraid that talking will cost them their pitch. Their hesitation is about the consequences of speaking, not their reliability.

**Partner move:** Ask Visit to give the witness a private, unhurried interview while you compare the collection receipts. Decline and earn corroboration by checking the actual collection timings with two other traders.

**Decision and payoff:** Accept a private statement and keep the witness out of the public account, or obtain their consent to a joint explanation that settles the dispute immediately. Visit's debrief credits evidence obtained without leaning on someone. **Gate:** Interview order is flexible; refusal does not block a partial report.

## CW-PS-05 — Reg Shoe: Whose Names Were on the List?
**Route:** Shades public frontage → Market notice point → Colon. **Strength:** Standing ground and making space for unpopular witnesses.

A building owner claims there were no objections to a fee. People who tried to sign were turned away at a crowded notice point. One person did sign and later found their name listed as supporting the fee.

**Partner move:** Ask Reg to hold a public listening point where every resident gets a turn, while you compare a retained copy with the posted list. Or call on two residents separately and avoid a public confrontation.

**Decision and payoff:** Correct the public record now, or preserve the altered list long enough to identify who changed it. Reg can back the player’s decision to protect identities even when a full fraud finding is unavailable. **Gate:** Keep testimony and agreement as separate notebook facts; no public name or permanent noticeboard change is required.

## CW-PS-06 — Cheery Littlebottom: What the Wax Kept
**Route:** Post Office exterior → existing workshop frontage → Carrot. **Strength:** Careful evidence work.

A parcel is claimed to have been opened. The wax was reheated, but the seam shows that this happened before dispatch. The suspected carrier is innocent of reopening it; that does not settle whether the sender tried to hide a substituted item.

**Partner move:** Ask Cheery to compare impressions and record which marks were found on which surface. Without her comparison, find the dispatch copy and interview the worker who handled the parcel before the seal set.

**Decision and payoff:** Clear the carrier and release the intact parcel, or keep a witnessed record of the seal and follow up with the sender. Cheery asks for the one observation that actually excludes the carrier. **Gate:** Use a distinct case instance and evidence IDs; preserve Postage Due’s routing, flags and ledger.

## CW-PS-07 — Dorfl: The Promise at the Door
**Route:** Lodging frontage → lawful public junction → Watch Square. **Strength:** Measured restraint and separating statements from facts.

A creditor blocks a lodging doorway to keep a debtor from leaving. They claim they were “promised everything in the room.” Two accounts quote different halves of the same promise, and the room contains belongings left by a third person.

**Partner move:** Ask Dorfl to keep the public exit clear without using force while you hear both accounts. Or agree on a safe meeting point away from the doorway, then verify the property receipt.

**Decision and payoff:** End the obstruction and file a narrow report, or pursue the disputed property only after you identify what the promise could actually cover. Dorfl distinguishes what someone said from what it establishes. **Gate:** Safe separation never depends on combat; no new item custody, debt or lodging mechanic.

## CW-PS-08 — Angua von Überwald: The Runner Who Turned Back
**Route:** Watch Square → two verified public routes in the Shades → lawful handover point. **Strength:** Pursuit and interception on existing paths.

A frightened runner doubles back whenever someone appears at a junction. A witness calls them the thief. The runner is carrying a stolen satchel but is trying to return it without meeting the person who made them take it.

**Partner move:** Ask Angua to cover the nearer exit while you approach from the public street. Or stop chasing and interview the handover witness, then request a meeting. Use the current interception rules if the approach becomes an encounter; no transformation or new tracking power.

**Decision and payoff:** Recover the satchel and offer a safe exit, or follow the runner’s account to the person applying pressure. Stopping the runner does not convict them of organising the theft. **Gate:** Prove both routes are legal, including the rejoin after reload. A lost pursuit can finish through the witness.

## CW-PS-09 — Sally von Humpeding: A Seat by the Door
**Route:** Mended Drum public frontage → Market approach → Carrot. **Strength:** Reading movement and keeping a tense conversation calm.

The loudest person in a disputed payment seems ready to run. Sally notices that the quieter person is mirroring every move towards the exit. The one making threats wants attention; the one who never raises their voice has the token used to collect the disputed money.

**Partner move:** Ask Sally to keep the loud speaker talking while you watch the exit and observe the token exchange. Or interview the receiver off the route and compare their description before reapproaching.

**Decision and payoff:** Intervene at the exit and stop the handover, or keep talking to establish who sent the collector. Sally points out what movement told you and which parts still needed corroboration. **Gate:** Night atmosphere is optional; clues can be read in daylight and no new vampire ability or coercive shortcut is added.

## CW-PS-10 — Captain Carrot: Three People, One Key
**Route:** Watch Square → public workshop or lodging frontage → Market → Watch Square. **Strength:** Calm authority and a public agreement.

Three people each claim the right to use a shared yard. They all have a key, but each was promised a different time. A broker profited from issuing overlapping permissions, and the people fighting at the gate are all legitimate users.

**Partner move:** Ask Carrot to bring the three parties to one conversation and agree on immediate safe access while you compare the payment records. Or take separate statements and reconstruct the conflicting promises off the street.

**Decision and payoff:** Settle the access dispute and file the broker question unresolved, or retain a willing witness and prepare the fraud case. Carrot doesn’t decide whose key is real; he makes it safe for everyone to explain how they got it. **Gate:** Treat the key and access as evidence and dialogue only; do not add a door or change collision.

## Shared-case check: The Bridge That Was Closed (CW-NC-01)

Use one ordinary case to prove that the current partner affects more than its nameplate. Common facts: a bogus closure notice sends carts on a detour; the quay tally establishes who benefits; witnessing or corroborating a handover links the organiser. The player decides whether to protect the route immediately or keep observing. Suggested slices:

| Current partner | One useful action | Trade-off |
|---|---|---|
| Nobby | Blend into the waiting queue while you watch the handover | More direct evidence; the queue waits a little longer |
| Colon | Keep the public passage orderly while you remove and retain the notice | Quickest relief; the organiser may never return |
| Cheery | Compare the same physical mark across the retained notice and a second copy | Preserves corroboration; does not prove who paid |
| Angua | Cover the lawful second exit when the notice collector leaves | Keeps contact with the collector; testimony is still needed to link the organiser |
| Carrot | Get two waiting traders to give separate accounts and agree on reopening | Protects drivers and gives corroboration; they may not know who ordered the notice |

Implement an honest public-help outcome and a proven finding from the same evidence model. Do not lock an ordinary case to a required partner or award more simply because an officer unlocks later. Later profiles can reuse the action types with distinct observations: Detritus safely clears space for waiting pedestrians; Visit gives a hesitant driver time; Reg keeps the most unpopular witness from being shouted down; Dorfl holds a clear exit and separates the individual claims; Sally keeps the collector in conversation while the player watches the exchange.

## First playable slice and release checks

Start with **Nobby’s The Honest Lookout** and **Colon’s A Lane for Two**. They are early roster options and contrast strongly: Nobby improves the chance of seeing a quiet exchange; Colon protects people and keeps a public exit legible. Then add Cheery’s comparison and Angua’s interception. Use existing case bindings and save storage rather than a second progression system.

Before merging an implementation, test the same shared case with two partners and assert different player actions and recorded facts, but valid reports on both branches. Test decline, stand-down, unavailable partner, mid-case reload, encounter partner identity, and report payment exactly once. Test the first patrol and a paid Night Duty with no story accepted. Verify navigation on live map anchors and test both hosted Chromium and physical iPhone Safari. None of these release checks are claimed complete by this document.

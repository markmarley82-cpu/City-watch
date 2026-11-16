# The Ankh-Morpork Inquirer — Questions the Watch Won’t Answer

Four editions, two optional street enquiries, and one conspiracy the paper gets the wrong way round. Design and copy only. Starts with [The Bridge That Was Closed (CW-NC-01)](City-Watch-16-Case-Deployment-Briefs.md). Uses the existing Inquirer seller, edition ownership and Notebook reading. Verify all public inspection points on the implementation build. No new entrance, permanent road closure, named staff member or canon claim.

**Editorial rule:** Each edition has a public observation, an interpretation the paper wants to sell, and a specific lead the player can check. Characters are allowed to guess. The Watch files only what the evidence supports. The paper can get a fact right while being spectacularly wrong about why it happened.

## INQ-01 — Who Really Owns the Bridges?

**When:** The first newly issued edition after the player files the bridge case. The paper knows about the public disruption and the notice. It does not know anything that only the player or a protected witness saw.

**Front page**

> The Watch says it never closed the bridge. The person collecting a penny to show drivers the “official diversion” took a different view. At the quay, one trader’s carts were already unloaded before the others arrived. Coincidence? Possibly. This paper counts three coincidences, which is two more than it generally trusts.
>
> A reader has sent us a second notice, from another bridge. Same wording. Same upside-down stamp. The Watch calls the first notice a forgery. We await its explanation for the second.

Put one short opening line before the article, derived from the *public* result. If the patrol removed the notice: “Watch removes notice it says it never put up.” If it observed first: “Drivers report that the Watch was present while they waited.” If it proved who paid, only name a payer if that fact was released in the public report; otherwise write about the delay. A reporter’s source is an unnamed driver or other public observer, not a witness who spoke privately.

**Playable lead:** Inspect a reproduction of the second notice at a verified, accessible approach to a different approved bridge. It is a case prop and never changes the route. An optional Notebook clipping unlocks the prompt. A driver at the first bridge can give exactly the same lead to a player without the paper.

**What the player can establish:** Its supposed stamp is identical in print, but the second notice has a fold line that appears *inside the printed image*, not on the real paper. It was reproduced from a picture or impression of the first. Similarity is now a lead about copying rather than proof of a single organiser.

## INQ-02 — The Secret Office Behind the Secret Signs

**When:** A later edition after the player records the second notice, if the story hasn't already been closed. Repeated sleep, reload, or repurchase must not advance the same edition.

**Front page**

> Evidence mounts that somebody is behind the city’s signs. This paper can further reveal that the same bent nail has appeared at two entirely separate scenes. We put it to the Watch that a normal nail could only be in one place at a time. The Watch declined to impound the printing press.
>
> Both notices promise a diversion “until the next bell.” Neither says which bell. Someone at the quay has been happy to tell drivers, for a small consideration.

**Playable lead:** In the first optional enquiry, the player follows either the print detail or the claim about the bell. Nobby can ask drivers what they were charged while the player compares the notes; Cheery can distinguish the printed fold from the actual fold. Other partners can secure both observations through direct interviews and inspection.

**What the player can establish:** The bent nail was reproduced as part of the illustration. The first closure benefited a trader. The second operator is a copycat charging for directions. Neither fact excludes a third hand distributing the copies, but proving a common plot requires independent evidence.

**Choice:** Warn the waiting drivers now, or retain the reproduced notice and ask a willing driver to identify the collector. The player can help the drivers without taking anyone into custody or proving who printed the copy.

## INQ-03 — Our Readers Were Right to Be Worried

**When:** An edition after the optional enquiry is filed. Run one of two short features in the same existing edition slot.

**If the collector was identified or the evidence of copying was made public**

> TWO SEPARATE BRIDGE PLOTS, SAYS WATCH.
>
> Is it reassuring that two apparently unconnected people arrived at the same scheme? This paper thinks it would be more reassuring if either of them had paid for the photograph they used.
>
> A seller says somebody has been asking for bundles of yesterday’s paper to send to the quay. We cannot confirm why. Our subscriptions department confirms that bulk orders receive no special discount.

**If the patrol helped drivers but filed an unresolved report**

> WATCH WARNS DRIVERS; WON’T SAY WHO WARNED THE WATCH.
>
> Drivers are crossing again. We applaud this temporary victory over whichever forces wished them not to. One seller reports that somebody bought every copy of yesterday’s edition and then asked for directions to the quay.

**Playable lead:** Talk to the existing seller or hear the rumour in the street. The player can check two public locations in either order: the seller’s account of the bundle and a public quay contact’s tally of what the buyer was actually doing. Preserve the existing purchase flow; no new newspaper seller or dependency on buying back issues.

**What the player can establish:** The bulk buyer was selling copies of the public notice as supposed proof of an “official disruption,” so others could pad delivery invoices. The paper did expose something real. Its coverage also supplied a reusable piece of evidence for a different scam. Link the bulk buyer through a witnessed sale plus a disputed invoice, not just proof that they bought newspapers.

**Choice:** Put out a public correction that immediately makes the copies less useful, or get a willing merchant to demonstrate how the proof was sold. If the Watch has insufficient evidence for fraud, let it file a public clarification and leave the buyer unaccused.

## INQ-04 — We Stand by the Question Mark

**When:** The next newly issued edition after the second enquiry is filed. This closes the arc; reading the column does not start another incident.

**If the resale was proved**

> This paper has been asked whether its reporting helped bring about the very scheme it exposed. We note that it would have been harder to detect without our reporting, and considerably harder to make a copy without our reporting. We consider the matter evenly balanced.

**If the Watch clarified the notices but did not prove the resale**

> The Watch has now explained what a genuine closure looks like. We are pleased to publish the description. We trust the next person to manufacture one will have the decency to change at least one detail.

**Street payoff:** On one later patrol, a driver or the existing seller can quote the line appropriate to the public outcome. Keep it in a case-aware bark so the player never hears an accusation they didn't file. No unproved “bridge syndicate” becomes world fact.

## Implementation boundary and release order

1. **First release: INQ-01 and inspectable clipping lead only.** Hook to the filed CW-NC-01 result and public facts; record one neutral follow-up observation. It should be possible to read the paper and check something in the street. Do not imply the later editions or suspects already exist.
2. **Second release: INQ-02 and its enquiry.** Let one verified copy detail and one independent account support separate findings. A driver can repeat essential information for free. Check a clean report, a protected witness, and an unresolved report.
3. **Third release: INQ-03/04 and closure.** Verify both paid-edition and free-witness routes, one-time payment and rewards, and that a mid-case reload resumes the branch and partner cleanly.

**Source hooks checked:** Current GitHub main has `dist/cw-newspaper-runtime.mjs` for Notebook context; `dist/cw-newspaper-sellers.mjs` for the existing Inquirer street seller and quote/purchase; and a shared ledger imported from `dist/newspapers/purchases.mjs` for edition keys and ownership. Check the latest receiving commit before wiring. Add case-specific copy and reference only public, case-local facts; keep expensive content off startup and avoid global newspaper, price or install changes.

**Edition stability:** Generate the issue variant once at the next existing edition boundary after the trigger. An already published or bought issue should keep its wording; do not rewrite its headline when the player files a different report later that day. Preserve ordinary daily editions outside the arc and the old-save fallback. Keep the paper readable as text, and avoid disclosing protected names, addresses, or sealed evidence.

**Acceptance:** Check each public headline against its source facts, both legal bridge approaches, return navigation, repeat edition purchase, save/reload mid-lead, and once-only filing. Check first patrol, Night Duty and ordinary newspaper reading again before release. Separate hosted Chrome and physical iPhone results.

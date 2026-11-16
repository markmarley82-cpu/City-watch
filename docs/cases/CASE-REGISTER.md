# City Watch: case register

Every mission and case known to the project, from the game files and the design briefs, with its current status. Update this file whenever a case is built, tested or switched on. Generated from `dist/campaign-engine.html`, `dist/cw-patrol-data.js`, `dist/cw-patrol-enquiries.mjs`, `dist/cases/city-cases.json` and `docs/cases/`.

**Status key:** **Live, tested** = playable and played end to end · Live, untested = reachable by players, not yet played through · Hidden = written, but players cannot reach it · Design only = a brief, not yet built.

## Main story and opening

| Case | Where it lives | Status |
|---|---|---|
| Opening case: The stolen purse | cw-patrol-duty.mjs (first patrol) | **Live, tested** |
| Chapter 1: The missing ledger | campaign-engine.html chapter 0 | **Live, tested** |
| Chapter 2: Break-ins and the old crypt | campaign-engine.html chapter 1 | **Live, tested** |
| Chapter 3: Assaults on patrol | campaign-engine.html chapter 2 | **Live, tested** |
| Final choice: The Commander's Decision | campaign-engine.html finalVerdict | Live, untested |
| Ending (after the final choice) | not built | Design agreed, on hold until the case list is settled |

## Night duty and side jobs

| Job | Where it lives | Status |
|---|---|---|
| Opera disturbance | cw-patrol-duty.mjs | **Live, tested** (win and loss) |
| Guild licence check | cw-patrol-duty.mjs | Live, untested |
| Market enquiry | cw-patrol-duty.mjs | Live, untested |
| Dimwell beat (with street incidents) | cw-patrol-duty.mjs | Live, untested |
| Captain Carrot's delivery assignment | cw-patrol-duty.mjs | Live, untested |
| Mended Drum brawl | Duty → Street incidents | Live, untested |
| University: Hex Names the Wrong Porter | university-case/ | Live, untested |

## City cases (new case player, `dist/cases/city-cases.json`) and design briefs (`docs/cases/`)

| ID | Title | Type | Status |
|---|---|---|---|
| CW-NC-01 | The Bridge That Was Closed | extension | **Live, tested** — rebuilt as the replayable partner shift (Nobby/Colon) |
| CW-NC-02 | Dibbler’s Guarantee | extension | Design only |
| CW-NC-03 | The Lodger Who Never Left | enquiry | Design only |
| CW-NC-04 | The Lamp That Went Out | extension | Design only |
| CW-NC-05 | The Bread at the Wrong Door | enquiry | Design only |
| CW-NC-06 | An Unquiet Return | enquiry | Design only |
| CW-NC-07 | The Queue That Paid Twice | enquiry | Design only |
| CW-NC-08 | A Receipt for a Raincoat | enquiry | **Live, tested** (City cases) |
| CW-NC-09 | A Quiet Place to Wait | extension | Design only |
| CW-NC-10 | The Bell Without a Rope | extension | Design only |
| CW-NC-11 | The Paper Before the Story | enquiry | Design only |
| CW-NC-12 | The Fine on the Nail | enquiry | **Live, tested** (City cases) |
| CW-NC-13 | The Wrong Parcel of Keys | extension | Design only |
| CW-NC-14 | The Cart That Came Back Empty | extension | Design only |
| CW-NC-15 | The Second Curtain | enquiry | Design only |
| CW-NC-16 | The Witness With Two Stories | extension | Design only |
| CW-NC-17 | A Cart for the Wrong Funeral | enquiry | Design only |
| CW-NC-18 | The Door That Was Knocked Twice | extension | Design only |
| CW-NC-19 | The Brass Weight | enquiry | Design only |
| CW-NC-20 | Whose Round Is It? | enquiry | Design only |
| CW-NC-21 | The Window That Wasn’t Broken | enquiry | Design only |
| CW-NC-22 | The Cost of a Dry Crossing | extension | Design only |
| CW-NC-23 | Blue Chalk, White Chalk | enquiry | Design only |
| CW-NC-24 | The Unsent Letter | enquiry | Design only |
| CW-NC-25 | One Boot at the Quay | extension | Design only |
| CW-NC-26 | The Last Stool | enquiry | Design only |
| CW-NC-27 | The Empty Evidence Bag | enquiry | Design only |
| CW-NC-28 | No Change Given | enquiry | Design only |
| CW-NC-29 | The Watchman’s Shadow | extension | Design only |
| CW-NC-30 | The Loan of a Ledger | enquiry | Design only |
| CW-NC-31 | A Witness for Hire | enquiry | Design only |
| CW-NC-32 | The Quiet Delivery | extension | Design only |
| CW-NC-33 | The Borrowed Voice | enquiry | Design only |
| CW-NC-34 | The Newspaper on the Wrong Step | enquiry | Design only |
| CW-NC-35 | One Place Left | extension | Design only |
| CW-NC-36 | The Empty Stool at Closing | enquiry | Design only |
| CW-NC-37 | A Matter of Inches | enquiry | Design only |
| CW-NC-38 | The Half-Penny Chorus | extension | Design only |
| CW-NC-39 | The Name Under the Paint | enquiry | Design only |
| CW-NC-40 | A Debt to Nobody | enquiry | Design only |
| CW-NC-41 | Keep the Lantern Lit | extension | Design only |
| CW-NC-42 | Tickets for Tomorrow | enquiry | Design only |
| CW-NC-43 | The Sack With Two Tags | enquiry | Design only |
| CW-NC-44 | Tally at Low Water | enquiry | Design only |
| CW-NC-45 | The House With No Complaints | enquiry | Design only |
| CW-NC-46 | A Coat for the Captain | extension | Design only |
| CW-NC-47 | The Street That Was Sold | enquiry | Design only |
| CW-NC-48 | The Second Report | extension | Design only |

## Partner story missions (`docs/cases/City-Watch-Partner-Story-Missions.md`)

| ID | Mission | Status |
|---|---|---|
| CW-PS-01 | Nobby Nobbs: The Honest Lookout | Design only |
| CW-PS-02 | Sergeant Colon: A Lane for Two | Design only |
| CW-PS-03 | Detritus: Behind the Barrow | Design only |
| CW-PS-04 | Constable Visit: The Third Account | Design only |
| CW-PS-05 | Reg Shoe: Whose Names Were on the List? | Design only |
| CW-PS-06 | Cheery Littlebottom: What the Wax Kept | Design only |
| CW-PS-07 | Dorfl: The Promise at the Door | Design only |
| CW-PS-08 | Angua von Überwald: The Runner Who Turned Back | Design only |
| CW-PS-09 | Sally von Humpeding: A Seat by the Door | Design only |
| CW-PS-10 | Captain Carrot: Three People, One Key | Design only |

## Street cases (old engine, `streetFiles` in campaign-engine.html)

Written and complete, but the "Street cases" button is hidden, so players cannot reach them. Next step: test whether they still work in the current game, then switch them on.

| # | Title | Status |
|---|---|---|
| 1 | The Missing Bell | Hidden |
| 2 | A Pie of Questionable Origin | Hidden |
| 3 | The Forged Permit | Hidden |
| 4 | Lights on the River | Hidden |
| 5 | The Unpaid Watchman | Hidden |
| 6 | The Clock That Struck Thirteen | Hidden |
| 7 | The Bookseller’s Secret | Hidden |
| 8 | The Lost Watch Badge | Hidden |
| 9 | The Disappearing Door | Hidden |
| 10 | A Very Expensive Fish | Hidden |
| 11 | The Night-Soil Dispute | Hidden |
| 12 | The Phantom Watchman | Hidden |
| 13 | An Unfortunate Portrait | Hidden |
| 14 | The Lantern Tax | Hidden |

## Random patrol reports (`dist/cw-patrol-data.js`, 48 cases × 3 variants)

Offered through Casebook → Random patrols when walking through markets, quays and working streets; the data marks them "authored design data, not integrated". Four are used inside Night duty jobs.

| ID | Title | Status |
|---|---|---|
| CW-RP-001 | Watch-Approved! | Reachable via Random patrols, untested |
| CW-RP-002 | Short Measure, Long Argument | Live in Night duty · Market enquiry, untested |
| CW-RP-003 | Awnings of Responsibility | Reachable via Random patrols, untested |
| CW-RP-004 | The Price of a Promise | Reachable via Random patrols, untested |
| CW-RP-005 | One Stall, Two Breakfasts | Reachable via Random patrols, untested |
| CW-RP-006 | The Queue That Went Round | Reachable via Random patrols, untested |
| CW-RP-007 | Taking on Water | Reachable via Random patrols, untested |
| CW-RP-008 | The Boat Nobody Ordered | Reachable via Random patrols, untested |
| CW-RP-009 | The Rope Across the Road | Reachable via Random patrols, untested |
| CW-RP-010 | A Very Respectable Splash | Reachable via Random patrols, untested |
| CW-RP-011 | The Wrong Way Down | Reachable via Random patrols, untested |
| CW-RP-012 | The Drowned Washing | Reachable via Random patrols, untested |
| CW-RP-013 | A Fight in Three Acts | Reachable via Random patrols, untested |
| CW-RP-014 | The Borrowed Crowd | Reachable via Random patrols, untested |
| CW-RP-015 | A Funeral With Two Addresses | Reachable via Random patrols, untested |
| CW-RP-016 | The Statue Is Complaining | Reachable via Random patrols, untested |
| CW-RP-017 | A Petition in Several Hands | Reachable via Random patrols, untested |
| CW-RP-018 | The Last Bench | Live in Night duty · Watch Square stop 1, untested |
| CW-RP-019 | A Case of Missing Type | Reachable via Random patrols, untested |
| CW-RP-020 | Corrections on the Corner | Reachable via Random patrols, untested |
| CW-RP-021 | Return to the Return Address | Reachable via Random patrols, untested |
| CW-RP-022 | The Stamp That Would Not Stick | Reachable via Random patrols, untested |
| CW-RP-023 | A Message Too Soon | Reachable via Random patrols, untested |
| CW-RP-024 | The Notice Beneath the Notice | Reachable via Random patrols, untested |
| CW-RP-025 | A Small Matter of Access | Reachable via Random patrols, untested |
| CW-RP-026 | The Window Owes Me Rent | Reachable via Random patrols, untested |
| CW-RP-027 | A Room Too Many | Reachable via Random patrols, untested |
| CW-RP-028 | A Key With Several Owners | Reachable via Random patrols, untested |
| CW-RP-029 | The Chimney That Changed Sides | Reachable via Random patrols, untested |
| CW-RP-030 | A Quiet Word Through the Wall | Reachable via Random patrols, untested |
| CW-RP-031 | Rubbish With an Owner | Reachable via Random patrols, untested |
| CW-RP-032 | The Apprentice and the Grindstone | Reachable via Random patrols, untested |
| CW-RP-033 | All Tied Up | Reachable via Random patrols, untested |
| CW-RP-034 | The Lunch That Kept Working | Reachable via Random patrols, untested |
| CW-RP-035 | The Barrel With a Future | Reachable via Random patrols, untested |
| CW-RP-036 | Borrowed Until Yesterday | Reachable via Random patrols, untested |
| CW-RP-037 | Stop, Thief! Which One? | Reachable via Random patrols, untested |
| CW-RP-038 | The Hat That Describes a Man | Reachable via Random patrols, untested |
| CW-RP-039 | The Helpful Escort | Live in Night duty · Market escort, untested |
| CW-RP-040 | The Unclaimed Purse | Live in Night duty · Watch Square stop 2, untested |
| CW-RP-041 | A Shortcut With a Toll | Reachable via Random patrols, untested |
| CW-RP-042 | No Such House Number | Reachable via Random patrols, untested |
| CW-RP-043 | An Exhibition of Bread | Reachable via Random patrols, untested |
| CW-RP-044 | The Experiment Has Left the Building | Reachable via Random patrols, untested |
| CW-RP-045 | A Smell With Paperwork | Reachable via Random patrols, untested |
| CW-RP-046 | Twelve Hats, One Apprentice | Reachable via Random patrols, untested |
| CW-RP-047 | An Argument in Footnotes | Reachable via Random patrols, untested |
| CW-RP-048 | The Box That Must Not Be Opened | Reachable via Random patrols, untested |

## Old-engine mystery sites

The Bell Tower, The Dock Ledger, The Market Stall, The Shades Workshop: from the older version of the game, not connected to the current one. Not planned for 1.0.

## Not yet checked

- `City-Watch-Patrol-Cases-v1.zip` and `City-Watch-Quest-Emblems-v1.zip` in the team Google Drive folder.


**Total tracked: 137** (including the ending and 4 old mystery sites).

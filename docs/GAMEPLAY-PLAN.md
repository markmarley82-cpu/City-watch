# City Watch: gameplay plan (Mark, 28 Nov 2026)

Agreed with Mark on a voice call. **The city's look and the menus are done.** From here the work is gameplay. His own test sessions last a few minutes because "it feels like just walking about and nothing happens", and his first testers got bored early in the Bridge case. Every item below exists to make something happen.

Order of work: 1 → 2 → 3, then the rest as they fit.

## 1. A strong opening (first priority) — built 28 Nov 2026

**Status:** built in `dist/cases/bridge-closure.mjs` as the case's opening stages (`startPrologue`, `corner`, `observe`), with the street people, chase and fights in `dist/cw-p21-game.mjs`. The fights are `opening-lookout` (one lad, toe to toe) and `bridge-hobb` (Hobb and his collector) in `dist/cw-opening-suspect.js`. The old Colon purse patrol follows once the case is filed. The tutorial pop-up is off for the new opening, and `?opening=old` restores the old start. The playtest link starts at the alarm too.

In the first seconds the player should know where to go, and within a couple of minutes they should have had a fight. The model is the start of Final Fantasy VII: a place to go straight away and an easy fight that teaches the controls.

1. **Sign up.** Choosing your recruit and signing the oath is filling in the Watch's sign-up form at the front desk. You get your badge.
2. **The alarm.** Before the ink is dry, a runner bursts in: a carter has just been robbed on Brass Bridge. This is your first job, and there are no menus first.
3. **Out into Watch Square.** Nobby falls in beside you, grumbling about missing his tea. The lantern trail lights the way to the bridge.
4. **The trader.** On the way, a street trader shouts "Thief went that way!". This teaches you to follow the trail and talk to people.
5. **The chase.** At the bridge, the carter points at a lad running into an alley. A scripted chase: the thief runs a set path a few cells ahead and always ends in a dead end. This teaches movement.
6. **The first fight.** An easy fight with the lookout that teaches combat (swing, dodge, down in about three hits).
7. **"Someone paid me."** The lookout was paid by a man in a carrier's coat to watch carts on the bridge. The small robbery turns into the real case: the existing **Bridge case** (carters, the dispatch clerk, Mr Ernest Hobb).
8. **Hobb fights.** The Bridge case ends with a proper fight with Hobb, so the case ends with a bang.

**Teach by doing, with no pop-up tutorial:** the trader teaches following the trail, the chase teaches movement, the lookout teaches combat, and the carters teach questioning.

## 2. Life between cases — first version built 28 Nov 2026

**Status:** `dist/cases/street-incidents.mjs` (a pickpocket, a brawl, a cart in the road, a lost child) spawns one incident a few steps away when the city is quiet, at most every 75 s and 25 steps. The lantern trail points at it, you tap the people, and you pick what to do. The pickpocket and the brawl can turn into fights (`incident-thief`, `incident-brawl`). Each pays 1 merit, or 2 for a won fight.

After Hobb, patrol with small **street incidents** that pop up as you walk: a pickpocket, a tavern brawl, a lost dog, a cart in the road. Each takes about a minute and pays a little merit. Then the next proper case arrives from Vimes, a bit tougher than the last.

## 3. Progression

- **One currency: merit**, from cases and incidents.
- **Ranks that change how you play:** recruit → lance-constable (new district) → constable (better truncheon and armour) → corporal (pick your partner) → sergeant (the big conspiracy cases). The newspapers track your rise.
- **Partners:** start with Nobby, "the useless low-ranker". As you rise you pick your own partners from the Watch, each with their own ability: Angua sniffs out a trail when the lantern goes cold, Carrot talks a brawl down, Detritus breaks a locked door. The partner roster and merit gates already exist (`dist/cw-patrol-mentors.js`), and the partner story missions are briefed in `docs/cases/City-Watch-Partner-Story-Missions.md`.
- **Locked beats:** districts open by rank. Locked streets stay visible, but your partner turns you back in their own voice: Nobby fearful ("Not down the Shades, mate, not on our pay"), Carrot polite, Angua with a glare. This also means a phone only has to load the area you're allowed in.

## 4. The city reacts to you

- **Newspapers** report what you did: a headline about Hobb's arrest the next morning. (Check how far the current papers follow case results. The Bridge case already feeds the Inquirer.)
- Small touches: carters nod at you on the bridge afterwards, Hobb's yard gets boarded up, and the trader greets you by name.

## 5. Narrator footnotes

Text only, with no voice. A footnote box with an asterisk slides in at the bottom when you tap something, enter a new street or something funny happens, about once a minute at most. The lines should be **original**, in a dry tone in the spirit of the books, never quoted from them. They include trivia about streets and places. Claude writes a batch, and Mark picks the ones that land.

## 6. The pyramid

Lots of small cases at the start, all connecting up to one peak. Each small case leaves an odd clue, and every small crook turns out to have been paid by someone further up. At the top is a shadowy group trying to steer the city from behind the scenes, with a guild leader behind it plotting to remove the Patrician. The feel Mark wants is the conspiracies of *The Truth* and *Guards! Guards!*: secret groups hiring people to act for them. The schemers and the scheme are our own invention, not copied from the books.

## Notes

- Already in the game: Dibbler (sausages restore stamina but cost health), and Death appearing at the side of the battle screen when you're near death.
- The game is a free fan project and will stay free.

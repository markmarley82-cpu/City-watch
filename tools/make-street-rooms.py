# Adds rooms for the new street buildings (tools/new-buildings-sites.json) to the guild-interior
# room catalogue, reusing the guild room paintings until the commissioned street interiors arrive
# (docs/art/briefs/WORK-ORDER-2026-11-21.md, part 2). Each room keeps its painting's floor, entry,
# furniture and NPC position, with its own name, things to examine and a person to talk to.
#   python3 tools/make-street-rooms.py
import json
ROOMS = 'dist/guild-interiors/rooms.json'; BIND = 'dist/guild-interiors/guild-bindings.json'
STREET = {
 'apothecary': ('alchemists', 'Apothecary', 'The apothecary',
   [('Shelves of jars', 'Jars of dried leaves, powders and pickled roots, every one labelled in a neat, tiny hand. Some labels are in a language you don’t read.'),
    ('The workbench', 'A pestle and mortar, a brass balance and a small burner. Something green simmers gently. It smells of mint and something underneath the mint.')],
   'Speak with the apothecary', 'Cough, sprain or nerves? I sell remedies, officer, not miracles. And I keep a poison book, signed, like the law says. You can look at it any time.'),
 'smithy': ('alchemists', 'Smithy', 'The smith',
   [('The forge', 'Coals glow under the hood. Tongs and hammers hang in a neat row, each worn bright where the hand goes.'),
    ('Ironwork', 'Hinges, hooks, a set of manacles that look Watch issue, and a gate latch waiting to be collected.')],
   'Speak with the smith', 'Mind the sparks. If it’s about those manacles, they’re for the Yard, paid in advance. Mostly in advance.'),
 'curry-house': ('bakers', 'Curry house', 'The cook',
   [('The ovens', 'Flatbreads puff and blister against the hot brick. The whole room smells of cumin, smoke and something very hot.'),
    ('The long table', 'Bowls, spoons and a jug of something cooling. Dock workers eat here at all hours and pay in coin, mostly.')],
   'Speak with the cook', 'Sit, eat, officer. First bowl is mild. The second is how we make it for ourselves. No one has asked for a third.'),
 'butcher': ('butchers', 'Butcher’s shop', 'The butcher',
   [('The long table', 'Scrubbed boards, a row of cleavers and a ledger of orders. Everything here is weighed twice.'),
    ('Hooks and rails', 'Joints hang along the rail, each with a paper tag and a name.')],
   'Speak with the butcher', 'Clean scales, clean counter, licence on the wall. If anyone says otherwise, send them to me. I’ll weigh them.'),
 'cooper-workshop': ('butchers', 'Cooper’s workshop', 'The cooper',
   [('Barrels in progress', 'Staves stacked to dry, half-hooped casks and a cask for the docks waiting for its lid.'),
    ('The workbench', 'Adzes, drawknives and a crozier, laid out in the order they’re used.')],
   'Speak with the cooper', 'A good barrel holds anything, officer. A bad one holds anything for about a week. I make the good sort.'),
 'pawnbroker': ('thieves', 'Pawnbroker', 'The pawnbroker',
   [('The counter', 'A long counter with a brass rail, a ledger open to today and a pen on a chain.'),
    ('Pigeonholes', 'Hundreds of small parcels, each tagged with a number and a date. Some dates are very old.')],
   'Speak with the pawnbroker', 'Everything here has a ticket and every ticket has a name. If you’re looking for something particular, give me the description and I’ll give you the book.'),
 'lodging': ('beggars', 'Lodging house', 'The landlady',
   [('The benches', 'Hard benches and a stove. A few lodgers doze sitting up; it costs less than a bed.'),
    ('The ledger desk', 'Names, nights and pennies paid, in a firm hand. Several names are clearly made up.')],
   'Speak with the landlady', 'Penny a night on the bench, tuppence for a bed, and no fighting after the lamps are out. Who are you after?'),
 'quay-lodging': ('beggars', 'Quay lodging', 'The keeper',
   [('Sea chests', 'Battered chests with rope handles, each with a lodger’s mark burned into the lid.'),
    ('The stove', 'A kettle that is never quite off the boil, and oilskins steaming on pegs.')],
   'Speak with the keeper', 'Sailors pay by the tide, not the night. If someone’s missed his ship, he’ll be here sulking. If he’s caught it, he won’t.'),
 'cobbler': ('musicians', 'Cobbler', 'The cobbler',
   [('The workbench', 'Lasts, awls and a pot of wax. A pair of boots waits with a chit tied to the laces.'),
    ('Shelves of boots', 'Mended boots in a row, each with a name. A few have waited a long time for their owners.')],
   'Speak with the cobbler', 'Heels while you wait, soles by Thursday. And no, I don’t lend boots to anyone “just for an evening”.'),
 'ship-chandler': ('lawyers', 'Ship chandler', 'The chandler',
   [('Caged stores', 'Lanterns, blocks, rope and tins of ship’s biscuit, locked behind iron mesh.'),
    ('The counter', 'Orders for three ships pinned up, two of them overdue for payment.')],
   'Speak with the chandler', 'I supply ships, officer. Rope, tar, lamps, biscuit. If a ship sails without paying me, I’d very much like to know where to.'),
 'bonded-warehouse': ('fools', 'Bonded warehouse', 'The warehouse clerk',
   [('Shelves of goods', 'Rows of crates and bales, each with a bond number chalked on the side.'),
    ('The doorway', 'A heavy door with two locks. The clerk has one key; the excise man has the other.')],
   'Speak with the clerk', 'Nothing leaves without two signatures, officer. Mine, and whoever’s paid the duty. Today that’s nobody, so nothing’s leaving.'),
 'rope-maker': ('fools', 'Rope-maker’s shed', 'The rope-maker',
   [('The long walk', 'A long, bare floor for laying rope, with hooks at either end and coils waiting to be twisted.'),
    ('Coils of rope', 'Hemp, tarred and plain, sold by the fathom. A length has been cut off one coil very recently.')],
   'Speak with the rope-maker', 'Rope’s rope, officer, until someone uses it for something they shouldn’t. Then it’s evidence, and I want it back.'),
 'cooper': ('butchers', 'Barrel-maker', 'The barrel-maker',
   [('Half-made casks', 'Staves bound in a hoop, waiting for the fire to bend them. Curls of shaving drift round your boots.'),
    ('The shaving horse', 'A bench you sit astride to shave a stave. The drawknife is sharp enough to make you careful just looking at it.')],
   'Speak with the barrel-maker', 'Small casks, officer: firkins, kegs, a pin for a pub. The big yard by the docks does the hogsheads. I do the ones people carry home.'),
}
cat = json.load(open(ROOMS))
base = {r['id']: r for r in cat['rooms'] if not r['id'].startswith('street-')}
cat['rooms'] = [r for r in cat['rooms'] if not r['id'].startswith('street-')]
sites = {s['name'] for s in json.load(open('tools/new-buildings-sites.json'))}
for name, (src, title, person, examine, talk_title, talk) in STREET.items():
    assert name in sites, name
    b = base[src]; hs_ex = [h for h in b['hotspots'] if h['kind'] == 'examine']; hs_talk = [h for h in b['hotspots'] if h['kind'] == 'talk'][0]
    room = {**b, 'id': 'street-' + name, 'name': title, 'npc': {**b['npc'], 'name': person},
            'hotspots': [{**hs_ex[i], 'id': f'{name}-{i}', 'title': t, 'text': x} for i, (t, x) in enumerate(examine)] +
                        [{**hs_talk, 'id': name + '-talk', 'title': talk_title, 'text': talk}],
            'lore': 'Street building interior reusing the ' + src + ' room painting until its own interior is delivered.',
            'layoutProvenance': b['layoutProvenance'], 'exteriorBinding': None}
    cat['rooms'].append(room)
json.dump(cat, open(ROOMS, 'w'), ensure_ascii=False, separators=(',', ':'))
reg = json.load(open(BIND))
reg['bindings'] = [x for x in reg['bindings'] if not x['doorID'].startswith('new-')] + [{'doorID': 'new-' + n, 'roomID': 'street-' + n} for n in STREET]
json.dump(reg, open(BIND, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(STREET), 'street rooms;', len(cat['rooms']), 'rooms in the catalogue')

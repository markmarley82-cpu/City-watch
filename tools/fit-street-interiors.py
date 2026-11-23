# Fits the commissioned street interiors (branch art/street-interiors-v1, delivered 22 Nov 2026)
# into the guild-interior room catalogue, replacing the reused guild paintings.
#
#   python3 tools/fit-street-interiors.py <art-review/street-interiors-v1 folder>
#
# Each room's floor is the packet's registered floor parallelogram. Furniture, hotspot stand
# points and the shopkeeper are given here in floor coordinates (u, v):
#   u runs from the back corner along the right-hand back wall (0) to the door wall (1);
#   v runs from the back corner along the left-hand back wall (0) to the front-left wall (1).
# Furniture footprints were placed by eye on a grid drawn over each painting.
# The room's names and texts come from tools/make-street-rooms.py (STREET).
import hashlib, importlib.util, json, os, shutil, sys

SRC = sys.argv[1]
ROOMS = 'dist/guild-interiors/rooms.json'
OUT = 'dist/guild-interiors/assets/rooms/street-v1/'
spec = importlib.util.spec_from_file_location('streetrooms', 'tools/make-street-rooms.py')

# room id -> painting id, [furniture boxes (u0, u1, v0, v1)], {hotspot index: (u, v)}, shopkeeper (u, v)
#   [, door v: where the painted doorway meets the floor, when it differs from the registered threshold]
# hotspot keys: 0 and 1 are the two things to examine, 'talk' is where you stand to talk.
FIT = {
 'cobbler': ('cobbler', [
     (0, .66, 0, .12),        # barrel, baskets and the foot of the boot shelves
     (0, .16, .14, .60),      # tool bench on the left wall
     (.10, .23, .40, .56),    # stool
     (0, .29, .62, 1),        # cutting table, front left
     (.72, .98, .30, .50)],   # counter beside the door
   {0: (.26, .34), 1: (.42, .20), 'talk': (.50, .62)}, (.55, .50), .12),
 'smithy': ('smithy', [
     (0, .23, .10, .53),      # forge hearth and coal box
     (.12, .28, .17, .37),    # anvil on its stump
     (.10, .63, 0, .14),      # barrel and water trough on the right wall
     (.57, .71, 0, .12),      # bucket
     (0, .11, .55, .73),      # coal barrel
     (0, .27, .75, 1),        # grindstone
     (.19, .33, .87, 1)],     # bucket by the grindstone
   {0: (.30, .45), 1: (.48, .22), 'talk': (.42, .40)}, (.33, .29)),
 'bonded-warehouse': ('bonded-warehouse', [
     (0, .25, .75, 1),        # clerk's desk and scales
     (.08, .18, .60, .73),    # stool
     (0, .13, .44, .61),      # barrel
     (0, .26, 0, .44),        # stacked crates, back left
     (.25, .79, 0, .17)],     # crates, bales and barrels, back right
   {0: (.45, .28), 1: (.85, .40), 'talk': (.42, .70)}, (.31, .80)),
 'cooper-workshop': ('cooper-workshop', [
     (0, .13, .10, .44),      # steam box
     (.05, .14, .40, .48),    # brazier
     (0, .13, .44, 1),        # bench, ladder and hoops on the left wall
     (.29, .51, .84, 1),      # shaving horse
     (.10, .90, 0, .17),      # barrels, windlass and hoops, back right
     (.68, .86, .17, .29),    # barrel on its side
     (.74, .91, .30, .42)],   # bench and keg by the door
   {0: (.60, .32), 1: (.24, .62), 'talk': (.46, .52)}, (.36, .44)),
 'lodging': ('cheap-lodging-common-room', [
     (0, .14, 0, .14),        # stove
     (0, .10, .14, .68),      # stairs and bench on the left wall
     (.12, .50, 0, .13),      # table and bench, back right
     (.55, .73, 0, .09),      # dresser
     (.76, 1, .25, .38),      # ledger desk and stool by the door
     (0, .42, .72, 1)],       # long table and benches, front left
   {0: (.26, .60), 1: (.70, .48), 'talk': (.58, .44)}, (.62, .32)),
 'quay-lodging': ('quay-lodging', [
     (0, .14, 0, .20),        # stove
     (0, .13, .20, .76),      # bunks and barrel on the left wall
     (.12, .56, 0, .11),      # sea chests and rope
     (0, .37, .74, 1),        # table and stools, front left
     (.78, .99, .30, .58)],   # counter beside the door
   {0: (.36, .22), 1: (.20, .30), 'talk': (.66, .66)}, (.60, .55)),
 'curry-house': ('curry-house', [
     (0, .43, 0, .14),        # hearth, pots and sacks
     (0, .13, .10, .42),      # spice dresser
     (0, .15, .60, .95),      # table and benches, back left
     (.11, .43, .71, 1),      # table and benches, front left
     (.39, .71, 0, .23),      # table and benches, back right
     (.65, .98, .38, .71)],   # table and benches, front right
   {0: (.28, .26), 1: (.55, .50), 'talk': (.48, .38)}, (.42, .30)),
 'rope-maker': ('rope-maker', [
     (0, .18, .14, .93),      # long rope bench on the left wall
     (0, .21, 0, .30),        # coils, crates and baskets, back corner
     (.24, .46, 0, .21),      # rope-walk jack
     (.50, .83, 0, .21)],     # workbench, chest and buckets
   {0: (.45, .60), 1: (.30, .38), 'talk': (.62, .36)}, (.64, .28)),
 'ship-chandler': ('ship-chandler', [
     (0, .11, .05, .76),      # shelves of lanterns, blocks and rope
     (0, .15, .74, 1),        # big rope coil and basket, front left
     (0, .52, 0, .11),        # anchor, barrels and crate, back wall
     (.62, .97, .23, .56)],   # counter
   {0: (.20, .40), 1: (.56, .62), 'talk': (.50, .40)}, (.70, .18), .11),
 'cooper': ('cooper', [
     (0, .09, .30, .80),      # planks against the left wall
     (0, .22, .62, 1),        # crate of shavings and bucket
     (0, .18, .20, .52),      # shaving horse
     (.09, .21, .44, .56),    # stool
     (0, .17, 0, .13),        # barrel in the corner
     (.15, .61, 0, .23),      # half-made casks and stump
     (.55, .80, 0, .11)],     # brazier and planks
   {0: (.40, .34), 1: (.28, .48), 'talk': (.58, .40)}, (.56, .30)),
 'apothecary': ('apothecary', [
     (0, .11, 0, 1),          # drawer cabinet, and scrolls front left
     (0, .51, 0, .15),        # still, jars and stool on the back bench
     (.52, .81, 0, .21)],     # mortar counter
   {0: (.22, .50), 1: (.35, .26), 'talk': (.62, .34)}, (.66, .27), .16),
 'pawnbroker': ('pawnbroker', [
     (0, .21, .25, .76),      # pledge desk under the brass cage
     (0, .28, .74, 1),        # rolls and boxes, front left
     (0, .76, 0, .13)],       # safe, shelves, parcels and cabinet
   {0: (.30, .50), 1: (.42, .22), 'talk': (.50, .62)}, (.30, .32), .26),
 'butcher': ('butcher', [
     (0, .17, 0, .96),        # counter and joints along the left wall
     (.24, .63, 0, .18)],     # chopping block and bucket
   {0: (.30, .50), 1: (.30, .22), 'talk': (.55, .45)}, (.50, .30), .25),
}

def norm(r, u, v):
    P0, P1, _, P3 = r['floorPolygonPixels']
    x = P0[0] + u * (P1[0] - P0[0]) + v * (P3[0] - P0[0])
    y = P0[1] + u * (P1[1] - P0[1]) + v * (P3[1] - P0[1])
    return [round(x / r['canvas'][0], 5), round(y / r['canvas'][1], 5)]

def door_v(r):
    # Middle of the registered door threshold, in floor coordinates.
    P0, P1, _, P3 = r['floorPolygonPixels']
    ax, ay, bx, by = P1[0] - P0[0], P1[1] - P0[1], P3[0] - P0[0], P3[1] - P0[1]
    det = ax * by - ay * bx
    vs = [(ax * (q[1] - P0[1]) - ay * (q[0] - P0[0])) / det for q in r['doorThreshold']]
    return sum(vs) / len(vs)

def box(r, u0, u1, v0, v1):
    return [norm(r, u0, v0), norm(r, u1, v0), norm(r, u1, v1), norm(r, u0, v1)]

def main():
    mod = importlib.util.module_from_spec(spec)
    src = open('tools/make-street-rooms.py').read()
    exec(compile(src.split('cat = json.load')[0], 'make-street-rooms', 'exec'), mod.__dict__)
    street = mod.STREET
    reg = {r['id']: r for r in json.load(open(os.path.join(SRC, 'registration.json')))['rooms']}
    cat = json.load(open(ROOMS))
    os.makedirs(OUT, exist_ok=True)
    for rid, (paint, furniture, stands, keeper, *door) in FIT.items():
        r = reg[paint]
        room = next(x for x in cat['rooms'] if x['id'] == 'street-' + rid)
        _, name, person, things, talk_title, talk_text = street[rid]
        image = os.path.join(SRC, r['image'])
        dest = OUT + paint + '.webp'
        shutil.copyfile(image, dest)
        sha = hashlib.sha256(open(dest, 'rb').read()).hexdigest()
        hot = [{'id': f'{rid}-{i}', 'title': t, 'stand': norm(r, *stands[i]), 'text': x, 'kind': 'examine', 'radius': 0.045}
               for i, (t, x) in enumerate(things)]
        hot.append({'id': f'{rid}-talk', 'title': talk_title, 'stand': norm(r, *stands['talk']), 'text': talk_text, 'kind': 'talk', 'radius': 0.045})
        room.update({
            'image': dest[len('dist/guild-interiors/'):], 'sha256': sha, 'size': r['canvas'],
            'floor': box(r, 0, 1, 0, 1), 'entry': norm(r, .93, door[0] if door else door_v(r)),  # just inside the door
            'obstacles': [{'id': f'furniture-{i}', 'polygon': box(r, *b)} for i, b in enumerate(furniture)],
            'hotspots': hot, 'actorHeight': round(r['actorHeight'], 1),
            'lore': f'Street building interior: {name}. Painting from art/street-interiors-v1, fitted to the {r["outerCells"][0]} x {r["outerCells"][1]} exterior.',
            'layoutProvenance': 'Floor from the art packet registration; furniture footprints placed by eye (tools/fit-street-interiors.py).',
            'spatialIdentity': f'Own painting, {r["outerCells"][0]} x {r["outerCells"][1]} cells outside.',
            'revision': 3,
        })
        room['npc'] = {**room['npc'], 'name': person, 'position': norm(r, *keeper)}
        print(f'{rid:16} {paint:28} furniture {len(furniture)}  actor {room["actorHeight"]}')
    json.dump(cat, open(ROOMS, 'w'), ensure_ascii=False, separators=(',', ':'))

main()

# Closes off the empty ground between the built city and the city walls, with a visible low wall
# along every edge (Mark: "no invisible walls"). Writes dist/assets/closed-ground-v1/manifest.json.
#
#   python3 tools/make-closed-ground.py <city dump> <wet grid> <base members>
#
# The three inputs are dumps of the running game (members and objects, the river grid) and of
# the compiled street map; see docs/CLOSED-GROUND.md for how they were made.
# Closed ground: walkable open ground at least 4 cells from any street centreline or building,
# 5 from any doorway forecourt, case place or scripted position, clear of lamps and trees,
# squared up to 3 x 3 blocks so the walls run straight, without small patches. Any walkable
# pocket the closed ground cuts off is closed too. Walls go on every edge between closed ground
# and ground you can still walk on, one wall piece per cell edge.
import json, re, sys, glob
from collections import deque
dump, wetf, basef = sys.argv[1:4]
d = json.load(open(dump)); wet = json.load(open(wetf))
base = {tuple(map(int, k.split(','))) for k in json.load(open(basef))}
mem = {tuple(map(int, k.split(','))): v for k, v in d['members']}
W, H = 251, 351
SOLID = ('building', 'wall', 'individual-house', 'courtyard_compound', 'joined-premises', 'yard_enclosure', 'palace-range', 'private-yard', '')
occ, objs = set(), set()
# The city wall itself doesn't count as a building to keep a gap from: closed ground runs up to it.
rects = [(o['rect'], o['kind']) for o in d['objects'] if o['rect'] and not o['id'].startswith('fort:')] + [(b['rect'], 'building') for b in json.load(open('tools/new-buildings-sites.json'))]
for (x0, y0, w, h), kind in rects:
    cells = {(x, y) for x in range(int(x0), int(x0 + w + .999)) for y in range(int(y0), int(y0 + h + .999))}
    (occ if kind in SOLID else objs).update(cells)
keep = {c for c, ids in mem.items() if any(not i.startswith('E0') for i in ids)}
for k, v in json.load(open('dist/cases/city-cases.json'))['places'].items(): keep.add(tuple(v['at'][:2]))
for f in glob.glob('dist/*.mjs') + glob.glob('dist/*.js') + glob.glob('dist/cases/*.mjs'):
    for m in re.finditer(r"\[(\d{1,3}),(\d{1,3}),'(?:E0\d+|RC1|APRON:[a-z-]+)'\]", open(f, errors='ignore').read()): keep.add((int(m.group(1)), int(m.group(2))))
def grow(cells, r):
    out = set()
    for x, y in cells:
        for a in range(-r, r + 1):
            for b in range(-r, r + 1): out.add((x + a, y + b))
    return out
dist = {}; q = deque()
for c in occ | base: dist[c] = 0; q.append(c)
while q:
    x, y = q.popleft()
    for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        n = (x + a, y + b)
        if 0 <= n[0] < W and 0 <= n[1] < H and n not in dist: dist[n] = dist[(x, y)] + 1; q.append(n)
near_keep, near_obj = grow(keep, 5), grow(objs, 1)
fort = set()
for o in d['objects']:
    if o['id'].startswith('fort:') and o['rect']:
        x0, y0, w, h = o['rect']; fort.update((x, y) for x in range(int(x0), int(x0 + w + .999)) for y in range(int(y0), int(y0 + h + .999)))
F = {c for c in mem if c not in fort and c not in base and c not in occ and wet[c[1]][c[0]] == '0' and dist.get(c, 0) >= 4 and c not in near_keep and c not in near_obj}
B = set()
for bx in range(0, W, 3):
    for by in range(0, H, 3):
        block = [(bx + a, by + b) for a in range(3) for b in range(3)]
        if all(c in F for c in block): B.update(block)
def components(cells):
    seen, out = set(), []
    for c in cells:
        if c in seen: continue
        q = deque([c]); seen.add(c); part = []
        while q:
            x, y = q.popleft(); part.append((x, y))
            for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + a, y + b)
                if n in cells and n not in seen: seen.add(n); q.append(n)
        out.append(part)
    return out
B = set().union(*[set(p) for p in components(B) if len(p) >= 45])
# Fill the strip the 3 x 3 rounding leaves against the city wall: eligible cells that touch only
# closed or eligible ground or the wall, never ground that stays open.
B0 = set(B)
far_keep = grow(keep, 9)
for _ in range(3):
    add = {(x, y) for (x, y) in F - B if (x, y) not in far_keep and any((x + a, y + b) in B for a in (-1, 0, 1) for b in (-1, 0, 1))
           and all((x + a, y + b) in F or (x + a, y + b) in B or (x + a, y + b) not in mem for a in (-1, 0, 1) for b in (-1, 0, 1))}
    B |= add
# The wall-side fill must not cut anything off: where a gate or scripted place loses its way to
# the streets, undo the fill near it and try again.
filled = B - B0
for _ in range(20):
    walk = set(mem) - B
    cut = [p for p in components(walk) if len(p) > 3 and not any(c in base for c in p) and any(c in keep for c in p)]
    if not cut: break
    near = grow(set().union(*map(set, cut)), 12)
    undo = filled & near
    if not undo: break
    B -= undo; filled -= undo
# Close any walkable pocket the closed ground cuts off (a pocket with no street in it).
walk = set(mem) - B
for part in components(walk):
    if not any(c in base for c in part) and not any(c in keep for c in part): B.update(part)
walk = set(mem) - B
before = len([p for p in components(set(mem)) if len(p) > 3]); after = len([p for p in components(walk) if len(p) > 3])
if after > before:
    for p in components(walk):
        if len(p) > 3: print("component", len(p), sorted(p)[:3], [mem[c] for c in sorted(p)[:2]], "has base", any(c in base for c in p))
    raise SystemExit("walkable ground split")
# Walkable-cell rows as rects for the open-ground pass (privateAreas).
rows = []
for y in range(H):
    xs = sorted(x for x, yy in B if yy == y); i = 0
    while i < len(xs):
        j = i
        while j + 1 < len(xs) and xs[j + 1] == xs[j] + 1: j += 1
        rows.append([xs[i], y, xs[j] - xs[i] + 1, 1]); i = j + 1
# Wall pieces on every edge between closed ground and walkable ground.
# 'se' pieces run along +x on the line y + 0.5 (between (x, y) and (x, y + 1));
# 'sw' pieces run along +y on the line x + 0.5 (between (x, y) and (x + 1, y)).
walls = []
for x, y in B:
    for (nx, ny), kind in (((x, y + 1), 'se'), ((x, y - 1), 'se'), ((x + 1, y), 'sw'), ((x - 1, y), 'sw')):
        if (nx, ny) not in walk: continue
        if kind == 'se': yy = max(y, ny) - .5; walls.append(['se', x - .5, yy])
        else: xx = max(x, nx) - .5; walls.append(['sw', xx, y - .5])
# Posts where a wall run ends or turns.
ends = {}
for k, x, y in walls:
    a, b = ((x, y), (x + 1, y)) if k == 'se' else ((x, y), (x, y + 1))
    for p in (a, b): ends.setdefault(p, set()).add(k)
count = {}
for k, x, y in walls:
    for p in (((x, y), (x + 1, y)) if k == 'se' else ((x, y), (x, y + 1))): count[p] = count.get(p, 0) + 1
posts = [list(p) for p, n in count.items() if n == 1 or len(ends[p]) == 2]
json.dump({'id': 'closed-ground-v1', 'closedCells': len(B), 'privateAreas': rows, 'walls': walls, 'posts': posts}, open('dist/assets/closed-ground-v1/manifest.json', 'w'), separators=(',', ':'))
print('closed cells', len(B), 'rows', len(rows), 'wall pieces', len(walls), 'posts', len(posts), 'components', before, '->', after)

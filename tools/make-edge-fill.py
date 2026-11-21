# Fills the empty ground between the built city and the city walls with packed rows of existing
# house paintings, so it reads as more city you can't get into (Mark, 21 Nov 2026: "roofs, city
# streets, places you can't go ... blocked off naturally", no visible walls).
#
#   python3 tools/make-edge-fill.py      -> dist/assets/edge-fill-v1/manifest.json
#
# Zones: the closed-ground cells from tools/make-closed-ground.py (dist/assets/closed-ground-v1),
# which keep clear of streets, doorways, gates, case places and the routes between them.
# Paintings: tools/edge-fill-catalog.json, the approved house paintings from the section-* and
# mate-481-* sets (file, footprint, anchor). Each painting is reused at most MAX_USES times and
# never within REPEAT_GAP cells of itself. A placed house blocks walking through the game's
# ordinary open-ground pass (its footprint), exactly like every other house; nothing invisible.
import json, random
random.seed(21)
MAX_USES, REPEAT_GAP = 7, 18
cat = json.load(open('tools/edge-fill-catalog.json'))
zone = set()
for x, y, w, h in json.load(open('dist/assets/closed-ground-v1/manifest.json'))['privateAreas']:
    for i in range(w): zone.add((x + i, y))
covered, placed, uses = set(), [], {i: [] for i in range(len(cat))}
def fits(ox, oy, w, h):
    return all((ox + a, oy + b) in zone and (ox + a, oy + b) not in covered for a in range(w) for b in range(h))
order = sorted(zone, key=lambda c: (c[1] + c[0], c[0]))
for size_pass in (16, 12, 9):
    for (ox, oy) in order:
        if (ox, oy) in covered: continue
        opts = [i for i, c in enumerate(cat) if c['cells'][0] * c['cells'][1] >= size_pass and len(uses[i]) < MAX_USES
                and all(abs(px - ox) + abs(py - oy) > REPEAT_GAP for px, py in uses[i]) and fits(ox, oy, *c['cells'])]
        if not opts: continue
        best = max(c['cells'][0] * c['cells'][1] for c in (cat[i] for i in opts))
        i = random.choice([i for i in opts if cat[i]['cells'][0] * cat[i]['cells'][1] >= best - 4])
        c = cat[i]; w, h = c['cells']
        covered |= {(ox + a, oy + b) for a in range(w) for b in range(h)}; uses[i].append((ox, oy))
        x, y = c['rect'][2], c['rect'][3]
        placed.append({'id': f'EDGE-FILL:{len(placed)}', 'path': c['path'], 'dimensions': c['dimensions'], 'anchor': c['anchor'],
                       'scale': c['scale'], 'rect': [ox, oy, x, y], 'p': [round(ox + c['pOffset'][0], 4), round(oy + c['pOffset'][1], 4)],
                       'windows': c['windows'], 'painting': c['src']})
# Gaps between houses: a gap that opens onto walkable ground outside the zone stays walkable (a
# short dead-end alley); a gap shut in by houses on every side is closed, since nobody can see in.
from collections import deque
gaps = zone - covered; open_gap = set(); q = deque()
for (x, y) in gaps:
    if any((x + a, y + b) not in zone for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): open_gap.add((x, y)); q.append((x, y))
while q:
    x, y = q.popleft()
    for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        n = (x + a, y + b)
        if n in gaps and n not in open_gap: open_gap.add(n); q.append(n)
shut = sorted(gaps - open_gap, key=lambda c: (c[1], c[0])); rows = []
for x, y in shut:
    if rows and rows[-1][1] == y and rows[-1][0] + rows[-1][2] == x: rows[-1][2] += 1
    else: rows.append([x, y, 1, 1])
print('gaps', len(gaps), 'shut in and closed', len(shut), 'open alleys', len(open_gap))
json.dump({'id': 'edge-fill-v1', 'houses': placed, 'closedGaps': rows}, open('dist/assets/edge-fill-v1/manifest.json', 'w'), separators=(',', ':'))
print('houses', len(placed), 'zone cells', len(zone), 'covered', len(covered), f'({100 * len(covered) / len(zone):.0f}%)',
      'paintings used', sum(1 for u in uses.values() if u))

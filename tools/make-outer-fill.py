# Packs existing house paintings outside the city wall, so the city carries on past the wall instead
# of ending in empty dark ground (Mark, 26 Nov 2026). Same catalogue and rules as make-edge-fill.py;
# nothing here is walkable, so the houses need no collision.
#
#   python3 tools/make-outer-fill.py   -> dist/assets/edge-fill-v1/outer.json
#
# The wall runs at x 4.75-7.5 (west), y 1.75-4.5 (north), x 241.5-244.25 (east), y 342.5-345.25 (south).
# BAND cells of houses go beyond it. On the south and east sides the houses stand in front of the
# wall from the camera's view, so they start GAP_FRONT cells out to keep the lane inside visible.
import json, random
random.seed(26)
MAX_USES, REPEAT_GAP, BAND, GAP_FRONT = 9, 16, 16, 3
WEST, NORTH, EAST, SOUTH = 4, 1, 245, 346          # first cell clear of the wall on each side
cat = json.load(open('tools/edge-fill-catalog.json'))
X0, X1, Y0, Y1 = WEST - BAND, EAST + GAP_FRONT + BAND, NORTH - BAND, SOUTH + GAP_FRONT + BAND
zone = set()
for x in range(X0, X1):
    for y in range(Y0, Y1):
        outside_back = x < WEST or y < NORTH                       # behind the wall: right up to it
        outside_front = x >= EAST + GAP_FRONT or y >= SOUTH + GAP_FRONT
        if outside_back or outside_front:
            zone.add((x, y))
covered, placed, uses = set(), [], {i: [] for i in range(len(cat))}
def fits(ox, oy, w, h):
    return all((ox + a, oy + b) in zone and (ox + a, oy + b) not in covered for a in range(w) for b in range(h))
order = sorted(zone, key=lambda c: (c[1] + c[0], c[0]))
for size_pass in (16, 12, 9, 6):
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
        placed.append({'id': f'OUTER-FILL:{len(placed)}', 'path': c['path'], 'dimensions': c['dimensions'], 'anchor': c['anchor'],
                       'scale': c['scale'], 'rect': [ox, oy, x, y], 'p': [round(ox + c['pOffset'][0], 4), round(oy + c['pOffset'][1], 4)],
                       'windows': c['windows'], 'painting': c['src'] if 'src' in c else c['path']})
json.dump({'id': 'outer-fill-v1', 'houses': placed}, open('dist/assets/edge-fill-v1/outer.json', 'w'), separators=(',', ':'))
print('houses', len(placed), 'zone cells', len(zone), 'covered', len(covered), f'({100 * len(covered) / len(zone):.0f}%)')

"""Trim guild plots to their painted walls on the visible right-hand side.

Each guild's blocked squares come from its city-design plot (footprint_xywh), but
the guild painting is placed separately and is narrower: on the right-hand face
1-3 squares of open paving were blocked (invisible walls; Mark, 25 Nov 2026, at
the Musicians' Guild by Three Lamps Alley). This lowers the engine-x extent of each
plot to the measured right edge of its painting. Back and left squares are hidden
behind the buildings and stay blocked; doors and approaches are unchanged.
Run: python3 -I tools/trim-guild-plots.py dist/assets/city-v07/city-design.json
"""
import json, sys
# engine-x cells to remove from each plot's right-hand side, measured from the paintings
TRIM = {'guild-assassins': 3, 'guild-fools': 1, 'guild-alchemists': 3, 'guild-thieves': 3,
        'guild-musicians': 1, 'guild-butchers': 2, 'guild-lawyers': 2}
path = sys.argv[1]
raw = open(path).read()
d = json.loads(raw)
for l in d['landmarks']:
    k = TRIM.get(l.get('game_id'))
    if not k or not l.get('guild_exterior'):
        continue
    X, Y, W, H = l['footprint_xywh']        # source grid; engine x = 224 - source y
    l['footprint_xywh'] = [X, Y + k, W, H - k]
    ex, ey, ew, eh = l['guild_exterior']['rect']
    l['guild_exterior']['rect'] = [ex, ey, ew - k, eh]
    poly = l.get('engine_footprint_polygon')
    if poly:
        right = max(p[0] for p in poly)
        l['engine_footprint_polygon'] = [[p[0] - k if p[0] == right else p[0], p[1]] for p in poly]
    print(l['game_id'], 'rect', [ex, ey, ew, eh], '->', l['guild_exterior']['rect'])
open(path, 'w').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')) if '\n' not in raw[:200] else json.dumps(d, ensure_ascii=False, indent=1))

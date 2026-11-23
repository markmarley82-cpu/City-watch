# Puts the large Mended Drum (art/mended-drum-large-v1, 23 Nov 2026) in the city.
#
#   python3 tools/place-mended-drum.py <art-review/mended-drum-large-v1 folder>
#
# The new tavern needs a 9 x 8 cell plot (9-cell left face, 8-cell right face). It grows from the old
# 5 x 6 plot into the open street ground to its east and north; a search of the real city (no other
# building, door or water inside, every walkable cell outside still connected) found this the nearest
# clear plot. Its doorway is on the left face, so the entrance moves from the east side to the south
# side, onto the street below. The approach-side street lamp moves with the door.
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image

SRC = sys.argv[1]
RECT = [103, 239, 9, 8]              # sprite rect, as in landmark-exteriors-v3
DOOR = [106, 247]                    # street cell in front of the painted doorway
V3 = 'dist/assets/landmark-exteriors-v3/'

# Window light points, as make-landmark-v3.py finds them (the day painting's windows are lit).
src = open('tools/make-landmark-v3.py').read()
ns = {'np': np, 'deque': __import__('collections').deque}
exec(src[src.index('def label('):src.index('rows = []')], ns)
reg = json.load(open(os.path.join(SRC, 'registration.json')))
day = Image.open(os.path.join(SRC, reg['file'])).convert('RGBA')
assert list(day.size) == reg['dimensions']
cx, cy = reg['foundation']['corner']
lights = ns['lights'](day, day, reg['foundation'], 4)

shutil.copyfile(os.path.join(SRC, reg['file']), V3 + 'drum-large.webp')
m = json.load(open(V3 + 'manifest.json'))
row = next(r for r in m['instances'] if r['landmarkID'] == 'drum')
x, y, w, h = RECT
row.update({'file': 'drum-large.webp', 'dimensions': reg['dimensions'], 'rect': RECT, 'p': [x + w - 1, y + h - 1],
            # The front corner is half a cell beyond the centre of the last cell: 14 drawn px lower.
            'anchor': [round(cx, 3), round(cy - 14 / reg['drawScale'], 3)], 'scale': reg['drawScale'],
            'renderedWidth': round(reg['dimensions'][0] * reg['drawScale'], 3), 'uniqueStructure': 'three-storey-tavern',
            'sha256': hashlib.sha256(open(V3 + 'drum-large.webp', 'rb').read()).hexdigest(),
            'windowAnchors': [[round(v, 2) for v in p] for p in lights],
            'source': 'art/mended-drum-large-v1 drum-day-2x.webp', 'sourceScale': reg['drawScale']})
json.dump(m, open(V3 + 'manifest.json', 'w'), indent=1)

# Map footprint and door (engine polygon corners use the same offset as the old plot).
p = 'dist/assets/city-v07/city-design.json'
d = json.load(open(p))
lm = next(l for l in d['landmarks'] if l['game_id'] == 'drum')
lm['engine_footprint_polygon'] = [[x - 1 + w, y], [x - 1 + w, y + h], [x - 1, y + h], [x - 1, y]]
lm['engine_approach_xy'] = DOOR
json.dump(d, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))

# The lamp that marked the old approach moves to the new doorway.
p = 'dist/assets/city-street-lamps-v1/manifest.json'
L = json.load(open(p))
lamp = next(i for i in L['instances'] if i['id'] == 'CITY-LIGHTS-001:post-020')
lamp.update({'p': [DOOR[0] - 1.3, DOOR[1] + .3], 'cell': [DOOR[0] - 1, DOOR[1]], 'side': [0, -1],
             'rect': [round(DOOR[0] - 1.36, 2), round(DOOR[1] + .24, 2), .12, .12]})
lamp.pop('edges', None)
json.dump(L, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
print('Drum at', RECT, 'door', DOOR, 'lights', len(lights))

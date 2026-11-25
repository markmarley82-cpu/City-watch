"""Draw the eight Hide Park north premises on their own plots.

Their manifest gave `p` as the plot's first (back) cell, but the drawing code pins
the picture's anchor to the centre of cell `p`, and each picture's foundation front
corner sits near the bottom of the canvas. The buildings were therefore drawn 10-15
cells north of their collision plots: doors stood on open pavement with no building,
and the plots were invisible blocks. This uses the landmark rule instead: `p` is the
plot's last (front) cell and the anchor is the picture's front corner minus 14 px.
Run: python3 -I tools/fix-hide-park-north-placement.py dist/assets/hide-park-north258
"""
import json, sys
import numpy as np
from PIL import Image
d = sys.argv[1]
path = d + '/manifest.json'
m = json.load(open(path))
for r in m['premises']:
    x, y, w, h = r['rect']
    a = np.asarray(Image.open(f"{d}/{r['body']}").convert('RGBA'))[..., 3]
    cx = int(r['anchor'][0])
    front = int(np.where(a[:, cx - 6:cx + 6].max(axis=1) > 40)[0].max())
    old = (r['p'], r['anchor'])
    r['p'] = [x + w - 1, y + h - 1]
    r['anchor'] = [r['anchor'][0], front - 14]
    print(r['id'], 'p', old[0], '->', r['p'], 'anchor', old[1], '->', r['anchor'])
open(path, 'w').write(json.dumps(m, indent=2) + '\n')

# Checks the landmark buildings against the map's 2:1 isometric grid.
#
#   python3 tools/audit-landmark-angles.py [art folder, default dist/assets/landmark-exteriors-v2/]
#
# Prints, for each building in dist/assets/landmark-exteriors-v1, the angle of the foot of the
# art on each side (should be about 27 degrees) and its footprint, and writes
# docs/art/audit/landmark-footprints.png: each building with its map footprint drawn in red.
# The angles are rough (steps, plants and shadows at the foot pull them a few degrees).
import json, math
import numpy as np
from PIL import Image, ImageDraw

import sys
D = sys.argv[1] if len(sys.argv) > 1 else 'dist/assets/landmark-exteriors-v2/'
m = json.load(open(D + 'manifest.json'))
tiles = []
for it in m['instances']:
    im = Image.open(D + it['file']).convert('RGBA'); w, h = im.size
    a = np.asarray(im)[..., 3] > 64
    bottom = np.array([np.where(a[:, x])[0].max() if a[:, x].any() else -1 for x in range(w)])
    xs = np.where(bottom > 0)[0]; x0, x1 = xs.min(), xs.max(); span = x1 - x0
    xl = int(np.argmax(bottom))
    def fit(lo, hi):
        pts = [(x, bottom[x]) for x in range(lo, hi) if bottom[x] > 0]
        return np.polyfit(*zip(*pts), 1)[0] if len(pts) > 8 else float('nan')
    deg = lambda s: math.degrees(math.atan(s)) if s == s else float('nan')
    left = deg(fit(x0 + int(.08 * span), xl - int(.05 * span)))
    right = deg(-fit(xl + int(.05 * span), x1 - int(.08 * span)))
    rw, rh = it['rect'][2], it['rect'][3]
    print(f"{it['landmarkID']:10s} {w}x{h} footprint {rw}x{rh} drawn {it['renderedWidth']:.0f}px  base L {left:.0f} R {right:.0f} deg (want 27)")
    ax, ay = it['anchor']; s = 1 / it['scale']
    # The left wall runs along the footprint's x side (rw cells), the right wall along its y side (rh).
    c = (ax, ay); L = (ax - 28 * rw * s, ay - 14 * rw * s); R = (ax + 28 * rh * s, ay - 14 * rh * s)
    B = (L[0] + 28 * rh * s, L[1] - 14 * rh * s)
    bg = Image.new('RGBA', (w + 40, h + 60), (235, 230, 220, 255)); bg.alpha_composite(im, (20, 40))
    d = ImageDraw.Draw(bg); o = lambda p: (p[0] + 20, p[1] + 40)
    d.line([o(c), o(L), o(B), o(R), o(c)], fill=(220, 0, 0, 255), width=3)
    d.text((8, 8), f"{it['landmarkID']}  footprint {rw}x{rh}  (red = its map footprint, true 2:1)", fill=(0, 0, 0, 255))
    tiles.append(bg)
W = max(t.width for t in tiles); cols = [0, 0]
sheet = Image.new('RGBA', (W * 2 + 10, sum(t.height + 10 for t in tiles)), (255, 255, 255, 255))
for t in tiles:
    k = 0 if cols[0] <= cols[1] else 1
    sheet.alpha_composite(t, (k * (W + 10), cols[k])); cols[k] += t.height + 10
sheet.crop((0, 0, sheet.width, max(cols))).convert('RGB').save('docs/art/audit/landmark-footprints' + ('-original' if 'v1' in D else '') + '.png')

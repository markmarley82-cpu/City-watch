# Builds dist/assets/new-buildings-v1 from the approved art packets collected on main (Mark approved
# all of them on 20 Nov 2026): the shop street, dockside and artisan street buildings, the cooper
# workshop, and the Palace main block.
#
#   python3 tools/make-new-buildings.py
#
# Sites for the 14 street buildings are in tools/new-buildings-sites.json (rect = [x, y, w, d] in map
# cells; chosen on open public ground that faces a street, near the district each set belongs to).
# The game's open-ground pass leaves a building's footprint out of the walkable ground, so nobody
# walks through it. Each sprite is cropped to its pixels and stored at 1.5x its drawn size (as the
# landmark art is). Its anchor is the foundation's front corner, placed on the footprint's front
# corner: the same screen x as the last cell's centre (p) and 14 drawn px lower.
# Lights come from each packet's emission layer (lower walls only, so roof windows don't throw a
# pool onto the street). The Palace block keeps its walls layer for the roof cutaway and its
# window emission for the night glow.
import hashlib, json, os
from collections import deque
import numpy as np
from PIL import Image

OUT = 'dist/assets/new-buildings-v1/'
STORE = 1.5                     # stored px per drawn px
os.makedirs(OUT, exist_ok=True)
sites = json.load(open('tools/new-buildings-sites.json'))

def blobs(mask):
    h, w = mask.shape; seen = np.zeros_like(mask, bool); out = []
    for y0, x0 in zip(*np.where(mask)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; xs, ys = [], []
        while q:
            y, x = q.popleft(); xs.append(x); ys.append(y)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < h and 0 <= u < w and mask[v, u] and not seen[v, u]: seen[v, u] = True; q.append((v, u))
        out.append((len(xs), float(np.mean(xs)), float(np.mean(ys))))
    return sorted(out, reverse=True)

def lights(emission, base, alpha, k=4):
    e = np.asarray(emission.convert('RGBA')).astype(np.float32)
    lum = e[..., 3] * (e[..., 0] + e[..., 1]) / 510 if e[..., 3].max() > 0 else e[..., :3].mean(-1)
    mask = lum > max(40, lum.max() * .35)
    rows = np.where(alpha.max(axis=1) > 64)[0]; top = rows.min(); cy = base['corner'][1]
    low = top + .45 * (cy - top)
    (lx, ly), (cx, cy), (rx, ry) = base['left'], base['corner'], base['right']
    ground = lambda x: ly + (cy - ly) * (x - lx) / (cx - lx) if x <= cx else cy + (ry - cy) * (x - cx) / (rx - cx)
    pts = []
    for size, x, y in blobs(mask):
        if size < 12 or len(pts) >= k: break
        if y < low or any(abs(x - p[0]) < 60 and abs(y - p[1]) < 60 for p in pts): continue
        pts.append([x, y, x, ground(x)])
    return pts

def store(img, box, f):
    img = img.crop(box)
    return img.resize((max(1, round(img.width * f)), max(1, round(img.height * f))), Image.LANCZOS)

reg = {}
for p in ['shop-street-v1', 'dockside-street-v1', 'artisan-street-v1']:
    for b in json.load(open(f'art-review/{p}/registration.json')): reg[(p, b['name'])] = b
c = json.load(open('art-review/cooper-workshop-v1/registration.json')); reg[('cooper-workshop-v1', 'cooper-workshop')] = c

rows = []
for s in sites:
    p, name = s['packet'], s['name']; b = reg[(p, name)]
    stem = 'cooper' if p == 'cooper-workshop-v1' else name
    day = Image.open(f'art-review/{p}/{stem}-day.webp').convert('RGBA')
    emission = Image.open(f'art-review/{p}/{stem}-emission.webp')
    alpha = np.asarray(day)[..., 3]
    ys, xs = np.where(alpha > 0); box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    f = STORE * b['drawScale']                       # stored px per native px
    base = b['base']; ax, ay = b['nativeAnchor']
    out = store(day, box, f); out.save(OUT + name + '.webp', 'WEBP', quality=88, method=6)
    tx = lambda x: round((x - box[0]) * f, 2); ty = lambda y: round((y - box[1]) * f, 2)
    pts = [[tx(x), ty(y), tx(gx), ty(gy)] for x, y, gx, gy in lights(emission, base, alpha)]
    x, y, w, d = s['rect']
    rows.append({'id': 'NEW-BUILDING:' + name, 'name': name, 'packet': p, 'file': name + '.webp', 'dimensions': list(out.size),
                 'p': [x + w - 1, y + d - 1], 'rect': [x, y, w, d], 'anchor': [tx(ax), round(ty(ay) - 14 * STORE, 2)],
                 'scale': round(1 / STORE, 6), 'windowAnchors': pts, 'near': s.get('near')})
    print(f'{name:17s} site {s["rect"]} stored {out.size} lights {len(pts)}')

# The Palace main block replaces the composed Palace range drawing at its reserved foundation.
pr = json.load(open('art-review/palace-main-block-v1/registration.json'))
pd = Image.open('art-review/palace-main-block-v1/main-day.webp').convert('RGBA')
alpha = np.asarray(pd)[..., 3]; ys, xs = np.where(alpha > 0); box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
f = STORE * pr['drawScale']
for layer, src in [('palace-main', 'main-day'), ('palace-main-walls', 'main-walls'), ('palace-main-emission', 'main-window-emission')]:
    store(Image.open(f'art-review/palace-main-block-v1/{src}.webp').convert('RGBA'), box, f).save(OUT + layer + '.webp', 'WEBP', quality=88, method=6)
ax, ay = pr['nativeAnchor']
palace = {'files': {'day': 'palace-main.webp', 'walls': 'palace-main-walls.webp', 'emission': 'palace-main-emission.webp'},
          'dimensions': list(Image.open(OUT + 'palace-main.webp').size), 'p': pr['worldAnchor'],
          'anchor': [round((ax - box[0]) * f, 2), round((ay - box[1]) * f, 2)], 'scale': round(1 / STORE, 6),
          'foundation': pr['foundation']}
print('palace', palace['dimensions'], palace['anchor'])
palace['sha256'] = {k: hashlib.sha256(open(OUT + v, 'rb').read()).hexdigest() for k, v in palace['files'].items()}
for r in rows: r['sha256'] = hashlib.sha256(open(OUT + r['file'], 'rb').read()).hexdigest()
json.dump({'id': 'new-buildings-v1', 'approved': 'Mark, 20 Nov 2026', 'buildings': rows, 'palace': palace}, open(OUT + 'manifest.json', 'w'), indent=1)

# Builds dist/assets/landmark-exteriors-v3: the six approved landmark redraws (Mended Drum, Archives,
# Market Hall, Lantern Row, Crypt, Storehouse; branch art/landmark-grid-redraws, approved by Mark
# 19 Nov 2026) plus the four unchanged buildings from landmark-exteriors-v1.
#
#   python3 tools/make-landmark-v3.py <folder with the review files>
#
# The folder holds <name>.webp, night/<name>-night.webp and registration.json from
# art-review/landmark-grid-redraws. Each redraw is drawn on a true 2:1 grid; registration.json
# gives the left, front-corner and right points of its foundation. Each building is scaled so the
# foundation spans its existing map footprint (28 px per footprint cell across, as the game draws
# the map), and its front corner is placed on the footprint's front corner. Walking, doors and the
# footprint stay as they were. Files are stored at 1.5x the drawn size, as v1 was.
# Window and lantern lights come from the night versions: the warmest, brightest spots.
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image
from collections import deque

SRC = sys.argv[1]
V1, OUT = 'dist/assets/landmark-exteriors-v1/', 'dist/assets/landmark-exteriors-v3/'
STORE = 1.5          # stored pixels per drawn pixel
LIGHTS = 4           # light points per building
m = json.load(open(V1 + 'manifest.json'))
reg = {r['name']: r for r in json.load(open(os.path.join(SRC, 'registration.json')))}
os.makedirs(OUT, exist_ok=True)

def label(mask):
    # Connected warm spots, largest first: [(size, xs, ys)].
    h, w = mask.shape; seen = np.zeros_like(mask, bool); out = []
    for y0, x0 in zip(*np.where(mask)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; xs, ys = [], []
        while q:
            y, x = q.popleft(); xs.append(x); ys.append(y)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < h and 0 <= u < w and mask[v, u] and not seen[v, u]: seen[v, u] = True; q.append((v, u))
        out.append((len(xs), xs, ys))
    return sorted(out, key=lambda b: -b[0])

def lights(night, day, base, k):
    n = np.asarray(night.convert('RGB')).astype(np.float32); a = np.asarray(night.convert('RGBA'))[..., 3]
    r, g, b = n[..., 0], n[..., 1], n[..., 2]
    warm = (r > 200) & (g > 140) & (b < 150) & (r - b > 90) & (a > 200)
    blobs = label(warm)
    if not blobs: return []
    (lx, ly), (cx, cy), (rx, ry) = base['left'], base['corner'], base['right']
    def ground(x):  # the foundation line under x
        return ly + (cy - ly) * (x - lx) / (cx - lx) if x <= cx else cy + (ry - cy) * (x - cx) / (rx - cx)
    rows = np.where(a.max(axis=1) > 64)[0]; top = rows.min()
    low = top + .45 * (cy - top)   # roof and tower lights would throw a pool onto the street below
    pts = []
    for size, xs, ys in blobs:
        if size < 40 or len(pts) >= k: break
        x, y = float(np.mean(xs)), float(np.mean(ys))
        if y < low: continue
        if any(abs(x - p[0]) < 90 and abs(y - p[1]) < 90 for p in pts): continue
        pts.append([round(x, 1), round(y, 1), round(x, 1), round(min(ground(x), a.shape[0] - 1), 1)])
    return pts

rows = []
for row in m['instances']:
    lid = row['landmarkID']
    if lid not in reg:
        shutil.copyfile(V1 + row['file'], OUT + row['file']); rows.append(row); continue
    r = reg[lid]
    day = Image.open(os.path.join(SRC, r['file'])).convert('RGBA')
    night = Image.open(os.path.join(SRC, 'night', lid + '-night.webp') if os.path.exists(os.path.join(SRC, 'night')) else os.path.join(SRC, lid + '-night.webp')).convert('RGBA')
    assert list(day.size) == r['dimensions'] == list(night.size), lid
    rx, ry, rw, rh = row['rect']
    span = r['base']['right'][0] - r['base']['left'][0]
    drawn = 28 * (rw + rh) / span                  # drawn px per source px
    store = drawn * STORE                          # stored px per source px
    W, H = round(day.width * store), round(day.height * store)
    small = day.resize((W, H), Image.LANCZOS)
    small.save(OUT + row['file'], 'WEBP', quality=88, method=6)
    cx, cy = r['base']['corner']
    # The footprint's front corner is half a cell beyond the centre of its last cell (p): the same
    # screen x, 14 px lower.
    anchor = [round(cx * store, 3), round(cy * store - 14 * STORE, 3)]
    pts = [[round(v * store, 2) for v in p] for p in lights(night, day, r['base'], LIGHTS)]
    rows.append({**row, 'file': row['file'], 'dimensions': [W, H], 'anchor': anchor, 'scale': round(1 / STORE, 6),
                 'renderedWidth': round(W / STORE, 3), 'estimatedDoorHeight': None, 'windowAnchors': pts,
                 'mirrored': False, 'stretched': False, 'source': 'art/landmark-grid-redraws ' + r['file'],
                 'sourceScale': round(drawn, 4)})
    print(f"{lid:9s} footprint {rw}x{rh}  drawn {drawn:.3f} of source  stored {W}x{H}  lights {len(pts)}")
for row in rows: row['sha256'] = hashlib.sha256(open(OUT + row['file'], 'rb').read()).hexdigest()
m2 = {**m, 'id': 'landmark-exteriors-v3', 'instances': rows,
      'note': 'Six approved redraws (art/landmark-grid-redraws, 19 Nov 2026) fitted to the existing footprints by tools/make-landmark-v3.py; outpost, bakery, shrine and alley unchanged from v1.'}
json.dump(m2, open(OUT + 'manifest.json', 'w'), indent=1)

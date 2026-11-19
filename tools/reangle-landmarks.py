# Re-angles landmark buildings whose painted base doesn't follow the map's 2:1 isometric grid.
#
#   python3 tools/reangle-landmarks.py            writes dist/assets/landmark-exteriors-v2/
#   python3 tools/reangle-landmarks.py --sheet F  also writes a before/after sheet to F
#
# Each column of the picture is moved up or down (never sideways), so walls stay upright and
# nothing is redrawn. Left of the building's front corner the columns shift so the base runs at
# 2:1; right of it likewise. The front corner stays where it was on screen, so the building
# keeps its place on the map. The source is landmark-exteriors-v1 (the art team's files).
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image

SRC, OUT = 'dist/assets/landmark-exteriors-v1/', 'dist/assets/landmark-exteriors-v2/'
# Buildings to correct. corner: x of the front corner in the source file (None = lowest point
# of the base). Found by eye on the overlay in docs/art/audit/landmark-footprints.png.
FIX = {'drum': None, 'market': None, 'archives': None, 'lantern': None, 'crypt': None, 'store': None}
# Drawn larger than the art team's 2/3 (still a reduction, so no blur). Mark judged the Drum too small.
SCALE = {'drum': 5 / 6}
TARGET = 0.5   # 2:1 isometric: 1 px down for every 2 px across

def base_line(a):
    h, w = a.shape
    return np.array([np.where(a[:, x])[0].max() if a[:, x].any() else -1 for x in range(w)])

def robust_slope(xs, ys):
    xs, ys = np.asarray(xs, float), np.asarray(ys, float)
    keep = np.ones(len(xs), bool)
    for _ in range(6):
        k, b = np.polyfit(xs[keep], ys[keep], 1)
        r = ys - (k * xs + b)
        # The base is the lowest edge: steps and plants stick out below it, so drop those first.
        new = np.abs(r) < max(3.0, 2.0 * np.std(r[keep]))
        if (new == keep).all(): break
        keep = new
    return k

def measure(a, corner=None):
    bottom = base_line(a)
    xs = np.where(bottom > 0)[0]; x0, x1 = xs.min(), xs.max(); span = x1 - x0
    if corner is None:
        mid = slice(x0 + int(.1 * span), x1 - int(.1 * span))
        corner = int(np.argmax(bottom[mid]) + mid.start)
    L = [x for x in range(x0 + int(.06 * span), corner - int(.04 * span)) if bottom[x] > 0]
    R = [x for x in range(corner + int(.04 * span), x1 - int(.06 * span)) if bottom[x] > 0]
    sl = robust_slope(L, bottom[L]) if len(L) > 10 else TARGET            # base rises to the left: y grows with x
    sr = -robust_slope(R, bottom[R]) if len(R) > 10 else TARGET
    return corner, sl, sr

def shear(im, corner, sl, sr):
    px = np.asarray(im.convert('RGBA')).astype(np.float32)
    h, w, _ = px.shape
    x = np.arange(w)
    # Downward shift for each column (negative = up). Zero at the corner.
    shift = np.where(x < corner, -(TARGET - sl) * (corner - x), -(TARGET - sr) * (x - corner))
    up, down = int(np.ceil(max(0, -shift.min()))), int(np.ceil(max(0, shift.max())))
    H = h + up + down
    out = np.zeros((H, w, 4), np.float32)
    rows = np.arange(H)
    # Premultiply so edges don't pick up dark fringes.
    pm = px.copy(); pm[..., :3] *= pm[..., 3:4] / 255
    for c in range(w):
        src = rows - up - shift[c]
        for k in range(4): out[:, c, k] = np.interp(src, np.arange(h), pm[:, c, k], left=0, right=0)
    a = out[..., 3:4]; out[..., :3] = np.where(a > 0, out[..., :3] * 255 / np.maximum(a, 1e-3), 0)
    return Image.fromarray(out.clip(0, 255).round().astype(np.uint8)), shift, up

def main():
    m = json.load(open(SRC + 'manifest.json'))
    os.makedirs(OUT, exist_ok=True)
    sheet = []
    for row in m['instances']:
        lid = row['landmarkID']
        src = Image.open(SRC + row['file'])
        if lid not in FIX:
            shutil.copyfile(SRC + row['file'], OUT + row['file']); continue
        a = np.asarray(src.convert('RGBA'))[..., 3] > 64
        corner, sl, sr = measure(a, FIX[lid])
        fixed, shift, up = shear(src, corner, sl, sr)
        fixed.save(OUT + row['file'], 'WEBP', quality=90, method=6)
        s = lambda x: float(shift[int(min(max(round(x), 0), len(shift) - 1))])
        ax, ay = row['anchor']
        row['anchor'] = [ax, round(ay + up + s(ax), 3)]
        row['windowAnchors'] = [[x, round(y + up + s(x), 3), gx, round(gy + up + s(gx), 3)] for x, y, gx, gy in row['windowAnchors']]
        row['dimensions'] = list(fixed.size)
        if lid in SCALE:
            k = SCALE[lid] / row['scale']
            row['scale'] = SCALE[lid]; row['renderedWidth'] = round(fixed.width * SCALE[lid], 3)
            row['estimatedDoorHeight'] = round(row['estimatedDoorHeight'] * k)
        row['reangled'] = {'corner': corner, 'from': [round(float(sl), 3), round(float(sr), 3)], 'to': TARGET}
        after = measure(np.asarray(fixed)[..., 3] > 64, corner)
        print(f'{lid:9s} corner {corner:4d}  base slopes {sl:.2f}/{sr:.2f} -> {after[1]:.2f}/{after[2]:.2f}  size {src.size} -> {fixed.size}')
        sheet.append((lid, src.convert('RGBA'), fixed))
    for row in m['instances']:
        row['sha256'] = hashlib.sha256(open(OUT + row['file'], 'rb').read()).hexdigest()
    m['id'] = m['id'] + '-reangled'
    m['reangledBy'] = 'tools/reangle-landmarks.py'
    json.dump(m, open(OUT + 'manifest.json', 'w'), indent=1)
    if '--sheet' in sys.argv:
        f = sys.argv[sys.argv.index('--sheet') + 1]
        tiles = []
        for lid, a, b in sheet:
            W, H = a.width + b.width + 30, max(a.height, b.height) + 20
            t = Image.new('RGBA', (W, H), (235, 230, 220, 255))
            t.alpha_composite(a, (10, H - 10 - a.height)); t.alpha_composite(b, (a.width + 20, H - 10 - b.height))
            tiles.append(t)
        Wm = max(t.width for t in tiles); S = Image.new('RGB', (Wm, sum(t.height + 6 for t in tiles)), 'white'); y = 0
        for t in tiles: S.paste(t.convert('RGB'), (0, y)); y += t.height + 6
        S.save(f)

main()

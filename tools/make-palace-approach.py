# Prepares the approved Palace approach kit (ART-PALACE-APPROACH-001 with the unlit daytime
# gateway and lantern from ART-PALACE-DAYLIGHT-002; docs/art/candidates) for the game.
#
#   python3 tools/make-palace-approach.py <dir with the six source WebPs> dist
#
# Source files (checked against the SHA-256 recorded in the candidate docs):
#   palace-gateway-open.webp, palace-wall-straight.webp, palace-wall-corner.webp,
#   palace-lantern-post.webp (lit night versions) and palace-gateway-open-unlit-day.webp,
#   palace-lantern-post-unlit-day.webp (same geometry and alpha, lanterns unlit).
# The game draws the unlit versions and lights the lanterns itself at night through its
# window-lighting anchors, so the lights are off by day. The anchors are where the lit and
# unlit versions differ most (the lantern glass). Images are stored at half size (about the
# game's own resolution for this scale), with colour under transparent pixels cleared.
import hashlib, json, os, sys
import numpy as np
from PIL import Image
from collections import deque

def blobs(mask, grow=3):
    # Connected groups of changed pixels (8-neighbour), after growing each pixel by `grow`.
    h, w = mask.shape; ys, xs = np.where(mask); seen = np.zeros_like(mask); out = []
    pts = set(zip(ys.tolist(), xs.tolist()))
    for start in pts:
        if seen[start]: continue
        group, q = [], deque([start]); seen[start] = True
        while q:
            y, x = q.popleft(); group.append((y, x))
            for dy in range(-grow, grow + 1):
                for dx in range(-grow, grow + 1):
                    n = (y + dy, x + dx)
                    if 0 <= n[0] < h and 0 <= n[1] < w and mask[n] and not seen[n]: seen[n] = True; q.append(n)
        out.append(np.array(group))
    return out

SRC, DIST = sys.argv[1], sys.argv[2]
OUT = os.path.join(DIST, 'assets/palace-approach-v1'); os.makedirs(OUT, exist_ok=True)
SHA = {'palace-gateway-open.webp': '2599b1a54b01aff4bcaba74394bb27f9f3da3d1cb66583739b79f8b40409aca2',
       'palace-wall-straight.webp': '17979c8c4dfffa9952f9a10263cb8181ccb60d0a58d81d061e2a1e4754d9a76d',
       'palace-wall-corner.webp': '6cf394831332697414cccc790ebaebbb8a9ab5a852bf3f4eae8860c9572b58f1',
       'palace-lantern-post.webp': '18855fbb8385a0270b63a284b86a9105e9c3695661e166a9bc58bf4bb8a6ffda',
       'palace-gateway-open-unlit-day.webp': '989532f37fc087b71181848af37111307194e7fe6fe84cea374e0f8c971936a9',
       'palace-lantern-post-unlit-day.webp': '042b236ecb765bc0d4058939dc3af3cf4226f0cf372669e4273ae5cf492169f6'}
for f, h in SHA.items():
    if hashlib.sha256(open(os.path.join(SRC, f), 'rb').read()).hexdigest() != h: raise SystemExit('checksum differs: ' + f)
STORE = 0.5
PIECES = {'gateway': ('palace-gateway-open-unlit-day.webp', 'palace-gateway-open.webp'),
          'wall-straight': ('palace-wall-straight.webp', None),
          'wall-corner': ('palace-wall-corner.webp', None),
          'lantern-post': ('palace-lantern-post-unlit-day.webp', 'palace-lantern-post.webp')}
manifest = {'id': 'PALACE-APPROACH-v1', 'source': 'ART-PALACE-APPROACH-001 + ART-PALACE-DAYLIGHT-002', 'storeScale': STORE, 'pieces': {}}
for name, (day, lit) in PIECES.items():
    im = Image.open(os.path.join(SRC, day)).convert('RGBA')
    w, h = round(im.width * STORE), round(im.height * STORE)
    small = im.resize((w, h), Image.LANCZOS)
    px = np.asarray(small).copy(); px[px[..., 3] == 0, :3] = 0
    path = os.path.join(OUT, name + '.webp'); Image.fromarray(px).save(path, 'WEBP', quality=90, method=6)
    a = np.asarray(small)[..., 3] > 128; ys, xs = np.where(a)
    lights = []
    if lit:
        d = np.abs(np.asarray(Image.open(os.path.join(SRC, lit)).convert('RGB')).astype(int) - np.asarray(im.convert('RGB')).astype(int)).sum(-1)
        g = max(blobs(d > 90), key=len)  # each piece has one lantern; smaller groups are warm spill on stone
        lights.append([round(float(g[:, 1].mean()) * STORE, 1), round(float(g[:, 0].mean()) * STORE, 1)])
    data = open(path, 'rb').read()
    manifest['pieces'][name] = {'file': name + '.webp', 'size': [w, h], 'sha256': hashlib.sha256(data).hexdigest(),
                                'bottom': [round(float(xs[ys >= ys.max() - 2].mean()), 1), int(ys.max())], 'lights': lights}
    print(name, (w, h), len(data), 'bytes, lights', lights)
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)

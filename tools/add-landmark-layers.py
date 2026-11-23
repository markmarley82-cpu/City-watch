# Adds the final-four landmark cutaway and window layers (art/final-four-landmarks-v2, 22 Nov 2026) to
# dist/assets/landmark-exteriors-v3. Each building's walls layer (the painting with its roof removed)
# and its warm window emission are resized exactly as make-landmark-v3.py resized the day painting,
# so they line up pixel for pixel. Run after make-landmark-v3.py.
#
#   python3 tools/add-landmark-layers.py <art-review/final-four-landmarks-v2 folder>
import hashlib, json, os, sys
from PIL import Image

SRC = sys.argv[1]
OUT = 'dist/assets/landmark-exteriors-v3/'
m = json.load(open(OUT + 'manifest.json'))
for row in m['instances']:
    lid = row['landmarkID']
    day = os.path.join(SRC, lid + '-day.webp')
    if not os.path.exists(day):
        continue
    w, h = row['dimensions']
    for layer in ('walls', 'emission'):
        im = Image.open(os.path.join(SRC, f'{lid}-{layer}.webp')).convert('RGBA')
        assert im.size == Image.open(day).size, (lid, layer)
        name = f'{lid}-{layer}.webp'
        im.resize((w, h), Image.LANCZOS).save(OUT + name, 'WEBP', quality=88, method=6, exact=True)
        row[layer] = {'file': name, 'sha256': hashlib.sha256(open(OUT + name, 'rb').read()).hexdigest()}
    print(f'{lid:8} walls and emission at {w}x{h}')
json.dump(m, open(OUT + 'manifest.json', 'w'), indent=1)

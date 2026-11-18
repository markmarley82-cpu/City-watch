# Builds the "fresh" recruit atlases from the art team's player recruit studies
# (branch art/player-recruit-sprite-review, art-review/player-recruit/*.webp).
#
#   python3 tools/make-recruit-atlases.py art-review/player-recruit dist
#
# Each study is a 4 x 4 sheet: idle, walk, unarmed strike and guard, four frames each,
# facing left. The game's character atlases are 6 columns x 9 rows (nine actions, six
# frames), so each new atlas is built on the current one for that body:
#   - idle, walk, attack and guard come from the study, spread over six slots:
#       idle    1 2 3 4 3 2   (loops back and forth)
#       walk    1 1 2 3 3 4   (strides held for two ticks; same 600 ms cycle as before)
#       attack  1 2 2 3 3 4   (the strike lands on slot 4, the game's contact frame)
#       guard   1 2 2 3 3 3   (ends holding the block, which the game holds while guarding)
#   - hit, shove, restrain, surrender and down keep the current frames (no study yet).
# The cell size, foot point and visible height stay those of the current atlas, so the
# game's sizes, pivots and the frames kept from the current atlas line up. Every study
# frame is scaled to the current idle height and placed by its feet (lowest opaque row)
# and the middle of its head, because the study grid itself is not registered.
# Colour under fully transparent pixels is cleared.
import hashlib, json, os, sys
import numpy as np
from PIL import Image

STUDIES, DIST = sys.argv[1], sys.argv[2]
DRAWN = os.path.join(DIST, 'assets/characters-drawn-v1')
OUT = os.path.join(DRAWN, 'fresh')
os.makedirs(OUT, exist_ok=True)
BODIES = {  # game body id: study sheet
    'watch-recruit': 'watch-recruit.webp',
    'watch-recruit-female': 'watch-recruit-female.webp',
    'watch-recruit-dark': 'watch-recruit-dark.webp',
    'p3_dwarf_02': 'dwarf-recruit.webp',
    'p3_troll_01': 'troll-recruit.webp',
}
ORDER = {0: [0, 1, 2, 3, 2, 1], 1: [0, 0, 1, 2, 2, 3], 2: [0, 1, 1, 2, 2, 3], 3: [0, 1, 1, 2, 2, 2]}
manifest = json.load(open(os.path.join(DRAWN, 'manifest.json')))['assets']

def measure(cell, threshold=40):
    a = np.asarray(cell)[..., 3] > threshold
    ys, xs = np.where(a)
    top, bottom = ys.min(), ys.max()
    head = a[top:top + max(4, int((bottom - top) * .22))]
    hy, hx = np.where(head)
    return {'top': top, 'bottom': bottom, 'height': bottom - top + 1, 'headX': hx.mean(), 'left': xs.min(), 'right': xs.max()}

report = {}
for body, sheet in BODIES.items():
    e = manifest[body]
    cw, ch, cols = e['cellWidth'], e['cellHeight'], e['cols']
    current = Image.open(os.path.join(DIST, e['atlas'])).convert('RGBA')
    ref = measure(current.crop((0, 0, cw, ch)))  # current idle, frame 1
    study = Image.open(os.path.join(STUDIES, sheet)).convert('RGBA')
    sw, sh = study.width / 4, study.height / 4
    frames = [[study.crop((round(c * sw), round(r * sh), round((c + 1) * sw), round((r + 1) * sh))) for c in range(4)] for r in range(4)]
    scale = ref['height'] / float(np.median([measure(f)['height'] for f in frames[0]]))
    atlas = current.copy()
    clipped = []
    for row, order in ORDER.items():
        placed = []
        for f in frames[row]:
            m = measure(f)
            small = f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.LANCZOS)
            x = round(ref['headX'] - m['headX'] * scale)
            y = round(ref['bottom'] - (m['bottom'] + .5) * scale + .5)
            cell = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
            cell.alpha_composite(small, (max(0, x), max(0, y)), (max(0, -x), max(0, -y)))
            lost = (np.asarray(small)[..., 3] > 40).sum() - (np.asarray(cell)[..., 3] > 40).sum()
            if lost > 0: clipped.append((row, len(placed), int(lost)))
            placed.append(cell)
        for slot, k in enumerate(order):
            i = row * 6 + slot
            atlas.paste(placed[k], ((i % cols) * cw, (i // cols) * ch))
    px = np.asarray(atlas).copy()
    px[px[..., 3] == 0, :3] = 0
    atlas = Image.fromarray(px)
    path = os.path.join(OUT, body + '.webp')
    atlas.save(path, 'WEBP', quality=90, method=6)
    data = open(path, 'rb').read()
    report[body] = {'atlas': 'assets/characters-drawn-v1/fresh/' + body + '.webp', 'sha256': hashlib.sha256(data).hexdigest(),
                    'runtimeBytes': len(data), 'study': 'art-review/player-recruit/' + sheet, 'scale': round(scale, 4),
                    'studyActions': ['idle', 'walk', 'attack', 'guard'], 'currentActions': ['hit', 'shove', 'restrain', 'surrender', 'down'],
                    'clippedPixels': clipped}
    print(body, 'scale %.3f' % scale, len(data), 'bytes', 'clipped', clipped)
json.dump(report, open(os.path.join(OUT, 'build.json'), 'w'), indent=1)

# Register the new atlases. The current atlas stays the body's main art: armour, clothing,
# heads and coat colours are fitted to its frames, so the game only draws the fresh atlas
# for a recruit wearing none of those (cw-drawn-characters.js, cw-race-player.js).
def fresh(body):
    r = report[body]
    return {'atlas': r['atlas'], 'sha256': r['sha256'], 'artRevision': 'recruit-studies-v1', 'runtimeBytes': r['runtimeBytes'],
            'study': r['study'], 'studyActions': r['studyActions'], 'currentActions': r['currentActions'],
            'usedWhen': 'no armour, clothing, head or coat colour chosen'}
path = os.path.join(DRAWN, 'manifest.json'); drawn = json.load(open(path))
for body in BODIES: drawn['assets'][body]['fresh'] = fresh(body)
open(path, 'w', encoding='utf-8').write(json.dumps(drawn, separators=(',', ':'), ensure_ascii=False) + '\n')
path = os.path.join(DIST, 'assets/race-recruits-v2/manifest.json'); race = json.load(open(path))
for body in BODIES:
    if body in race['bodies']:
        v = {k: x for k, x in race['bodies'][body]['variants']['base'].items() if k != 'nativeBounds'}
        v.update({'atlas': report[body]['atlas'], 'sha256': report[body]['sha256'], 'equipmentVariant': 'fresh', 'artRevision': 'recruit-studies-v1'})
        race['bodies'][body]['variants']['fresh'] = v
open(path, 'w', encoding='utf-8').write(json.dumps(race, separators=(',', ':')) + '\n')

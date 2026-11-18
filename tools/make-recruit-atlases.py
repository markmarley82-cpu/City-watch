# Builds the "fresh" recruit art in the game from the art team's registered recruit sheets
# (art-review/player-recruit/v2, branch art/player-recruit-full-set; see its README).
#
#   python3 tools/make-recruit-atlases.py art-review/player-recruit/v2 dist
#
# Each body sheet is 6 x 9 cells of 192 x 192 px (idle, walk, punch, guard, hit, shove,
# restrain, surrender, down; six frames each), feet at (96, 184), facing left. Each
# truncheon sheet is six 256 x 192 px cells, feet at (128, 184). Every cell is scaled by
# 5/6 (body cells 160 x 160, truncheon cells 213 x 160), which puts the human at about the
# resolution of the current art (98 px tall) and keeps the decoded size close to the
# current atlases: the street's character cache has a fixed memory budget. The game scales
# every sprite by renderHeight / visibleHeight, so visibleHeight is measured here as the
# idle height and the in-game size stays that of the body's current art.
#
# Output: dist/assets/characters-drawn-v1/fresh/<body>.webp and <body>-truncheon.webp,
# registered as "fresh" art in characters-drawn-v1/manifest.json (entry.fresh) and in
# race-recruits-v2/manifest.json (variants.fresh / variants.freshTruncheon). The current
# atlases are not modified: armour, clothing, heads, coat colours and the sword and
# crossbow are still fitted to them, so the game only uses the fresh art for a recruit
# with none of those (cw-drawn-characters.js, cw-race-player.js).
# Colour under fully transparent pixels is cleared.
import hashlib, json, os, sys
import numpy as np
from PIL import Image

SRC, DIST = sys.argv[1], sys.argv[2]
DRAWN = os.path.join(DIST, 'assets/characters-drawn-v1')
OUT = os.path.join(DRAWN, 'fresh')
os.makedirs(OUT, exist_ok=True)
BODIES = {  # game body id: art team file prefix
    'watch-recruit': 'watch-recruit',
    'watch-recruit-female': 'watch-recruit-female',
    'watch-recruit-dark': 'watch-recruit-dark',
    'p3_dwarf_02': 'dwarf-recruit',
    'p3_troll_01': 'troll-recruit',
}
SCALE = 5 / 6
BODY = {'cellWidth': 160, 'cellHeight': 160, 'cols': 6, 'rows': 9, 'frames': 54, 'footX': 80, 'footY': round(184 * SCALE, 3)}
TRUNCHEON = {'cellWidth': 213, 'cellHeight': 160, 'cols': 6, 'rows': 1, 'frames': 6, 'footX': 106.5, 'footY': round(184 * SCALE, 3)}
SOURCE_CELL = {'body': (192, 192), 'truncheon': (256, 192)}

def export(src, name, size, kind):
    im = Image.open(src).convert('RGBA')
    if im.size != size: raise SystemExit('%s is %s, expected %s' % (src, im.size, size))
    (sw, sh), geo = SOURCE_CELL[kind], (BODY if kind == 'body' else TRUNCHEON)
    out = Image.new('RGBA', (geo['cols'] * geo['cellWidth'], geo['rows'] * geo['cellHeight']), (0, 0, 0, 0))
    for i in range(geo['frames']):
        c, r = i % geo['cols'], i // geo['cols']
        cell = im.crop((c * sw, r * sh, (c + 1) * sw, (r + 1) * sh)).resize((geo['cellWidth'], geo['cellHeight']), Image.LANCZOS)
        out.paste(cell, (c * geo['cellWidth'], r * geo['cellHeight']))
    px = np.asarray(out).copy(); px[px[..., 3] == 0, :3] = 0
    path = os.path.join(OUT, name)
    Image.fromarray(px).save(path, 'WEBP', quality=90, method=6)
    data = open(path, 'rb').read()
    return {'atlas': 'assets/characters-drawn-v1/fresh/' + name, 'sha256': hashlib.sha256(data).hexdigest(), 'runtimeBytes': len(data)}, px

def idle_height(px):
    heights, w, h = [], BODY['cellWidth'], BODY['cellHeight']
    for c in range(6):
        a = px[0:h, c * w:(c + 1) * w, 3] > 40
        ys = np.where(a.any(1))[0]; heights.append(ys.max() - ys.min() + 1)
    return float(np.median(heights))

for old in os.listdir(OUT):  # earlier builds
    if old.endswith('.webp') or old == 'build.json': os.remove(os.path.join(OUT, old))
report = {}
for body, prefix in BODIES.items():
    b, px = export(os.path.join(SRC, prefix + '-body.webp'), body + '.webp', (1152, 1728), 'body')
    t, _ = export(os.path.join(SRC, prefix + '-truncheon.webp'), body + '-truncheon.webp', (1536, 192), 'truncheon')
    height = idle_height(px)
    report[body] = {**b, **BODY, 'visibleHeight': height, 'artRevision': 'recruit-v2',
                    'source': SRC.rstrip('/') + '/' + prefix + '-body.webp',
                    'truncheon': {**t, **TRUNCHEON, 'visibleHeight': height, 'artRevision': 'recruit-v2',
                                  'source': SRC.rstrip('/') + '/' + prefix + '-truncheon.webp'},
                    'usedWhen': 'no armour, clothing, head, coat colour, sword or crossbow'}
    print(body, 'idle height', height, b['runtimeBytes'], '+', t['runtimeBytes'], 'bytes')
json.dump(report, open(os.path.join(OUT, 'build.json'), 'w'), indent=1)

path = os.path.join(DRAWN, 'manifest.json'); drawn = json.load(open(path, encoding='utf-8'))
for body in BODIES: drawn['assets'][body]['fresh'] = report[body]
open(path, 'w', encoding='utf-8').write(json.dumps(drawn, separators=(',', ':'), ensure_ascii=False) + '\n')

path = os.path.join(DIST, 'assets/race-recruits-v2/manifest.json'); race = json.load(open(path, encoding='utf-8'))
for body in BODIES:
    if body not in race['bodies']: continue
    variants, r = race['bodies'][body]['variants'], report[body]
    keep = lambda v: {k: x for k, x in v.items() if k not in ('nativeBounds', 'frameRenderScale')}
    variants['fresh'] = {**keep(variants['base']), **BODY, 'visibleHeight': r['visibleHeight'], 'atlas': r['atlas'],
                         'sha256': r['sha256'], 'equipmentVariant': 'fresh', 'artRevision': 'recruit-v2'}
    variants['freshTruncheon'] = {**keep(variants['truncheon']), **TRUNCHEON, 'visibleHeight': r['visibleHeight'],
                                  'atlas': r['truncheon']['atlas'], 'sha256': r['truncheon']['sha256'],
                                  'equipmentVariant': 'freshTruncheon', 'artRevision': 'recruit-v2'}
open(path, 'w', encoding='utf-8').write(json.dumps(race, separators=(',', ':')) + '\n')

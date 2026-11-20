# Simple massing drawings at the game's exact 2:1 isometric angle, for Midjourney's Retexture
# (it repaints the picture but keeps the shapes). Doors are 72 game px tall (1.2 x a 60 px person).
#   python3 tools/make-midjourney-blockouts.py   -> docs/art/midjourney/refs/blockout-*.png
import numpy as np
from PIL import Image, ImageDraw
K = 3.2; GREY = (128, 128, 128)
def P(x, y, z, o): return (o[0] + 28 * K * (x - y), o[1] + 14 * K * (x + y) - z * K)
def box(d, o, x0, y0, x1, y1, h, c):
    d.polygon([P(x0, y1, 0, o), P(x1, y1, 0, o), P(x1, y1, h, o), P(x0, y1, h, o)], fill=c[0])
    d.polygon([P(x1, y0, 0, o), P(x1, y1, 0, o), P(x1, y1, h, o), P(x1, y0, h, o)], fill=c[1])
def gable(d, o, x0, y0, x1, y1, h, rise, c, ridge):
    if ridge == 'x':
        ym = (y0 + y1) / 2
        d.polygon([P(x0, y1, h, o), P(x1, y1, h, o), P(x1, ym, h + rise, o), P(x0, ym, h + rise, o)], fill=c[0])
        d.polygon([P(x1, y0, h, o), P(x1, y1, h, o), P(x1, ym, h + rise, o)], fill=c[2])
    else:
        xm = (x0 + x1) / 2
        d.polygon([P(x1, y0, h, o), P(x1, y1, h, o), P(xm, y1, h + rise, o), P(xm, y0, h + rise, o)], fill=c[1])
        d.polygon([P(x0, y1, h, o), P(x1, y1, h, o), P(xm, y1, h + rise, o)], fill=c[2])
def L(d, o, x0, x1, y, z0, z1, c): d.polygon([P(x0, y, z0, o), P(x1, y, z0, o), P(x1, y, z1, o), P(x0, y, z1, o)], fill=c)
def R(d, o, y0, y1, x, z0, z1, c): d.polygon([P(x, y0, z0, o), P(x, y1, z0, o), P(x, y1, z1, o), P(x, y0, z1, o)], fill=c)
WALL = ((196, 150, 120), (150, 110, 88)); ROOF = ((120, 70, 55), (95, 55, 45), (170, 128, 100)); DOOR = (60, 40, 30); WIN = (70, 85, 95)
o = (1500, 2600)
def bakery(d):
    box(d, o, 0, 0, 4, 4, 190, WALL); gable(d, o, 0, 0, 4, 4, 190, 110, ROOF, 'x')
    L(d, o, .5, 1.3, 4, 0, 72, DOOR); L(d, o, 1.7, 3.6, 4, 15, 80, WIN)
    for a in (.7, 2.0, 3.2): L(d, o, a, a + .6, 4, 115, 160, WIN)
    R(d, o, 1.4, 2.2, 4, 0, 72, DOOR)
    for a in (.6, 2.8): R(d, o, a, a + .6, 4, 115, 160, WIN)
def shrine(d):
    box(d, o, 0, 0, 3, 3, 170, ((170, 165, 150), (130, 125, 115)))
    gable(d, o, 0, 0, 3, 3, 170, 130, ((80, 120, 100), (60, 95, 80), (185, 180, 165)), 'y')
    L(d, o, 1.0, 2.0, 3, 0, 80, DOOR); R(d, o, 1.1, 1.9, 3, 80, 140, WIN)
def alley(d):
    box(d, o, 0, 0, 4, 4, 380, WALL); gable(d, o, 0, 0, 4, 4, 380, 130, ROOF, 'y'); L(d, o, 1.4, 2.2, 4, 0, 72, DOOR)
    for z in (115, 210, 305):
        for a in (.5, 2.6): L(d, o, a, a + .7, 4, z, z + 50, WIN)
        for a in (.8, 2.6): R(d, o, a, a + .7, 4, z, z + 50, WIN)
def outpost(d):
    box(d, o, 0, 0, 1.6, 3, 300, ((165, 160, 150), (125, 120, 110)))
    gable(d, o, 0, 0, 1.6, 3, 300, 70, ((85, 90, 100), (65, 70, 80), (160, 155, 145)), 'x')
    box(d, o, 1.6, 0, 4, 3, 180, WALL); gable(d, o, 1.6, 0, 4, 3, 180, 90, ROOF, 'x'); L(d, o, .4, 1.2, 3, 0, 72, DOOR)
    for a in (2.0, 3.1): L(d, o, a, a + .6, 3, 100, 150, WIN)
    R(d, o, .8, 1.6, 4, 0, 72, DOOR)
for name, f, (W, H) in [('bakery', bakery, (1024, 1024)), ('shrine', shrine, (1024, 1280)), ('alley', alley, (1024, 1820)), ('outpost', outpost, (1024, 1280))]:
    g = Image.new('RGB', (3000, 3000), GREY); f(ImageDraw.Draw(g))
    a = np.asarray(g).astype(int); ys, xs = np.where(abs(a - 128).sum(-1) > 0)
    crop = g.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = min(W * .84 / crop.width, H * .84 / crop.height); crop = crop.resize((int(crop.width * s), int(crop.height * s)), Image.LANCZOS)
    out = Image.new('RGB', (W, H), GREY); out.paste(crop, ((W - crop.width) // 2, H - crop.height - int(H * .06)))
    out.save(f'docs/art/midjourney/refs/blockout-{name}.png')

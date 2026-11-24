"""Build the missing inventory bag lining (bag-<mode>-inside.exact.webp).

The Inventory panel layers inside -> items -> rim -> front. Only rim and front were
ever delivered, so the panel fell back to a flat dark box. This fills the opening the
rim encloses with a dark leather lining: shaded deeper at the top (the mouth of the
bag), lighter low down, with soft grain noise. Colours come from the rim's own leather.
Run: python3 -I tools/make-bag-inside.py dist/assets/p20-base-03/inventory-v06
"""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
d = sys.argv[1]
rng = np.random.default_rng(7)
for mode in ('portrait', 'landscape'):
    rim = np.asarray(Image.open(f'{d}/bag-{mode}-rim.exact.webp').convert('RGBA')).astype(float)
    front = np.asarray(Image.open(f'{d}/bag-{mode}-front.exact.webp').convert('RGBA')).astype(float)
    solid = (rim[..., 3] > 40) | (front[..., 3] > 40)
    filled = ndimage.binary_fill_holes(ndimage.binary_closing(solid, iterations=6))
    inside = filled & ~solid
    inside = ndimage.binary_dilation(inside, iterations=10) & filled   # tuck under the rim edge
    h, w = inside.shape
    leather = rim[..., :3][rim[..., 3] > 200].mean(axis=0)
    ys = np.linspace(0, 1, h)[:, None]
    shade = 0.20 + 0.16 * ys                                      # dark at the mouth, lighter low down
    dist = ndimage.distance_transform_edt(inside)
    edge = np.clip(dist / 60.0, 0, 1)                              # darker where the lining meets the rim
    grain = ndimage.gaussian_filter(rng.normal(0, 1, (h, w)), 1.2) * 0.035 \
          + ndimage.gaussian_filter(rng.normal(0, 1, (h, w)), 9) * 0.05
    k = np.clip((shade * (0.55 + 0.45 * edge)) + grain, 0.05, 0.6)
    rgb = np.clip(leather[None, None, :] * k[..., None], 0, 255)
    alpha = ndimage.gaussian_filter(inside.astype(float), 1.5) * 255
    out = np.dstack([rgb, alpha]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'{d}/bag-{mode}-inside.exact.webp', lossless=True, quality=100, method=6)
    print(mode, w, h, 'lining px', int(inside.sum()))

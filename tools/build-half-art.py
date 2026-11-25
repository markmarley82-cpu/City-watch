"""Copy the half-resolution paintings that phones can use into the published site.

art-half-resolution/ holds 50% copies of every game picture (made from one source
commit). Only copies whose original still matches the current dist/ file are used,
so a painting changed since then keeps loading at full size. Output:
  <site>/half/<path>       the half-size file (same path as in dist/)
  <site>/half/index.json   {"<path>": [original width, original height], ...}
Phones in low-memory mode load half/<path> and treat it as the original's size.
Run: python3 -I tools/build-half-art.py dist art-half-resolution <site dir>
"""
import hashlib, json, os, shutil, sys

dist, half_root, site = sys.argv[1:4]
manifest = json.load(open(os.path.join(half_root, 'resize-manifest.json')))
out_dir = os.path.join(site, 'half')
index, skipped, copied = {}, 0, 0
for f in manifest['files']:
    path = f['path']
    if not path.startswith('dist/') or not path.lower().endswith(('.webp', '.png', '.jpg', '.jpeg')):
        continue
    if f.get('frames', 1) != 1:
        continue
    rel = path[len('dist/'):]
    original, small = os.path.join(dist, rel), os.path.join(half_root, path)
    if not (os.path.isfile(original) and os.path.isfile(small)):
        skipped += 1; continue
    if hashlib.sha256(open(original, 'rb').read()).hexdigest() != f['original_sha256']:
        skipped += 1; continue  # painting changed since the half copies were made
    target = os.path.join(out_dir, rel)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.copyfile(small, target)
    index[rel] = [f['original_width'], f['original_height']]
    copied += 1
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, 'index.json'), 'w') as fh:
    json.dump(index, fh, separators=(',', ':'))
print('half-size paintings:', copied, 'used,', skipped, 'skipped (changed or missing)')

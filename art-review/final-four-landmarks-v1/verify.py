from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops
p=Path(__file__).resolve().parent
r=json.loads((p/'registration.json').read_text())
for a in r['assets']:
 for v in a['variants'].values():
  f=p/v['file']; im=Image.open(f).convert('RGBA'); src=Image.open(p/v['source']).convert('RGBA')
  assert list(im.size)==v['dimensions']
  assert hashlib.sha256(f.read_bytes()).hexdigest()==v['sha256']
  assert im.tobytes()==src.tobytes()
  assert im.getchannel('A').getextrema()[0]==0
  assert 0<=v['nativeAnchor'][0]<im.width and 0<=v['nativeAnchor'][1]<im.height
print('PASS: 8 transparent images, decoded source equality, dimensions, checksums and anchor bounds.')
print('Runtime placement, pixel-locked night registration, cutaways and physical-phone review remain unverified.')

"""Export original recruit idle/walk cells without downsampling or changing artwork."""
from pathlib import Path
from PIL import Image
import json
source=Path('art-review/player-recruit/v2')
target=Path('dist/guild-interiors/assets/recruit-motion-hd'); target.mkdir(parents=True,exist_ok=True)
manifest=json.loads(Path('dist/assets/recruit-art-v2/manifest.json').read_text())
manifest.update(cellWidth=192,cellHeight=192,rows=2,footX=96,footY=184,directory='guild-interiors/assets/recruit-motion-hd/')
for body in manifest['bodies'].values():
    body['visibleHeight']*=2
    for kind,name in list(body['files'].items()):
        if kind=='truncheon':
            del body['files'][kind]; continue
        image=Image.open(source/name)
        assert image.size==(1152,1728),(name,image.size)
        image.crop((0,0,1152,384)).save(target/name,lossless=True,exact=True)
(target/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported',len(list(target.glob('*.webp'))),'original-resolution motion layers')

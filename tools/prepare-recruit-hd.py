"""Pack the original painted recruit cells at source resolution, split by action."""
from pathlib import Path
from PIL import Image
import json
source=Path('art-review/player-recruit/v2');target=Path('dist/assets/recruit-art-hd');target.mkdir(parents=True,exist_ok=True)
m=json.loads(Path('dist/assets/recruit-art-v2/manifest.json').read_text());m.update(cellWidth=256,cellHeight=192,footX=128,footY=184,splitActions=True,directory='assets/recruit-art-hd/')
clips=['idle','walk','attack','guard','hit','shove','restrain','surrender','down','truncheon']
for body in m['bodies'].values():
 body['visibleHeight']*=2
 for kind,name in body['files'].items():
  if kind=='truncheon':continue
  original=Image.open(source/name).convert('RGBA')
  for row,action in enumerate(clips):
   out=Image.new('RGBA',(1536,192))
   for col in range(6):
    if action=='truncheon' and kind=='body':tile=Image.open(source/name.replace('-body.webp','-truncheon.webp')).convert('RGBA').crop((col*256,0,(col+1)*256,192));out.paste(tile,(col*256,0))
    else:
     original_row=2 if action=='truncheon' else row
     tile=original.crop((col*192,original_row*192,(col+1)*192,(original_row+1)*192));out.paste(tile,(col*256+32,0))
   folder=target/action;folder.mkdir(exist_ok=True);out.save(folder/name,lossless=True,exact=True)
(target/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
print('Packed',len(list(target.rglob('*.webp'))),'source-resolution action layers')

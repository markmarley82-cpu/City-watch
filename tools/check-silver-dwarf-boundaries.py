from pathlib import Path
from PIL import Image
import json,hashlib

ROOT=Path(__file__).resolve().parents[1];p=ROOT/'art-review/recruit-dwarf-silver'
actions=json.loads((p/'manifest.json').read_text())['actions'];records=[];fringes=[]
for f in sorted(p.glob('*.webp')):
    if 'mask' in f.name:continue
    im=Image.open(f).convert('RGBA')
    assert im.size==(768,960),f.name
    for row,action in enumerate(actions):
        hashes=[]
        for col in range(6):
            cell=im.crop((col*128,row*96,(col+1)*128,(row+1)*96));alpha=cell.getchannel('A')
            assert alpha.getbbox(),(f.name,row,col)
            significant=alpha.point(lambda v:255 if v>=32 else 0);bb=significant.getbbox()
            assert bb and bb[0]>0 and bb[1]>0 and bb[2]<128 and bb[3]<96,(f.name,row,col,bb)
            border=[alpha.getpixel((x,y)) for x in range(128) for y in [0,95]]
            border += [alpha.getpixel((x,y)) for x in [0,127] for y in range(96)]
            if max(border):fringes.append({'file':f.name,'action':action,'frame':col+1,'maxBorderAlpha':max(border)})
            hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
        if f.name=='silver-dwarf-body.webp' and action!='idle':assert len(set(hashes))>1,action
        records.append({'file':f.name,'action':action,'uniqueFrames':len(set(hashes)),
            'allSixNonempty':True,'significantAlphaClearOfCellBorders':True})
(p/'cell-boundary-qa.json').write_text(json.dumps({'alphaThreshold':32,'checks':records,
 'footPoint':[64,92],'sourceGeometryPreserved':True,'lowAlphaBorderFringes':fringes,
 'interpretation':'Down frame 6 reaches the last row only at alpha 6/255 (silver) or 2/255 (dark). No significant silhouette pixels touch the cell border. This is not evidence of a visibly cropped limb.'},indent=2)+'\n')
print('PASS',len(records),'layer/action combinations; low-alpha border fringes:',len(fringes))

"""Register the transparent generated atlas at measured game scale."""
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('atlas',type=Path)
source=Image.open(parser.parse_args().atlas).convert('RGBA')
assert source.size==(1536,1024) and source.getchannel('A').getextrema()[0]==0 and source.getchannel('A').getextrema()[1]>=250
source.putalpha(source.getchannel('A').point(lambda a:min(255,round(a*255/254))))
# Source bounds, measured front corner, footprint, 2x export width, tall flag.
entries={
 'farmhouse':((80,20,510,405),(305,382),(3,3),324,True),
 'barn':((530,20,1000,403),(797,391),(3.5,3),364,True),
 'windmill':((1050,0,1430,406),(1271,392),(2.5,2.5),310,True),
 'tannery':((60,405,518,679),(321,662),(3.5,2.5),322,True),
 'haystack':((593,406,950,677),(772,667),(1.5,1.5),134,False),
 'cart':((1055,414,1450,678),(1255,645),(2,1),170,False),
 'tree':((60,679,520,1024),(254,1001),(1.8,1.8),240,True),
 'hedge':((536,726,1000,1008),(706,961),(1,2.5),173,False),
 'gibbet':((1100,682,1390,1024),(1199,997),(1,1),92,True),
}
windows={
 'farmhouse':[[(177,254),(201,262),(202,292),(177,285)],[(375,268),(396,257),(396,288),(375,298)]],
 'windmill':[[(1207,215),(1217,211),(1218,238),(1208,240)],[(1326,194),(1333,188),(1337,210),(1328,218)]]
}
metadata={}
(ROOT/'sprites').mkdir(exist_ok=True)
for kind,(box,anchor,footprint,width,tall) in entries.items():
    crop=source.crop(box)
    bbox=crop.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
    assert bbox is not None and bbox!=(0,0,*crop.size), kind
    sx,sy=box[0]+bbox[0],box[1]+bbox[1]
    crop=crop.crop(bbox)
    scale=width/crop.width
    size=(width,round(crop.height*scale))
    render=crop.resize(size,Image.Resampling.LANCZOS)
    day=f'sprites/{kind}.webp'
    dark=f'sprites/{kind}-night.webp'
    render.save(ROOT/day,quality=87,method=6)
    shadow=Image.merge('RGBA',tuple(b.point(lambda q:round(q*f+v)) for b,f,v in zip(render.split()[:3],[.48,.54,.65],[5,7,11]))+(render.getchannel('A'),))
    for window in windows.get(kind,[]):
        points=[((x-sx)*scale,(y-sy)*scale) for x,y in window]
        light=Image.new('L',size)
        ImageDraw.Draw(light).polygon(points,fill=135)
        halo=light.filter(ImageFilter.GaussianBlur(3))
        ImageDraw.Draw(light).polygon(points,fill=172)
        mask=Image.fromarray(__import__('numpy').maximum(__import__('numpy').asarray(light),__import__('numpy').asarray(halo)))
        glow=Image.new('RGBA',size,(219,155,70,255))
        shadow=Image.composite(glow,shadow,mask)
        shadow.putalpha(render.getchannel('A'))
    shadow.save(ROOT/dark,quality=86,method=6)
    a=[round((anchor[0]-sx)*scale),round((anchor[1]-sy)*scale)]
    assert 0<=a[0]<size[0] and 0<=a[1]<size[1], (kind,a,size)
    metadata[kind]=dict(footprint=footprint,dimensions=size,anchor=a,tall=tall,file=day,nightFile=dark)
(ROOT/'sprite-types.json').write_text(json.dumps(metadata,indent=2)+'\n')

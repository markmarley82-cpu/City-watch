"""Produce measured blockouts, not finished artwork. No runtime files are changed."""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'art-review/street-interiors-v1'
constraints = json.loads((OUT/'footprint-constraints.json').read_text())
entries = []
for site in constraints['buildings']:
    name = site['id']
    ew, ed = site['maximumOuterFloorCells']
    # Rotate the interior camera by 90 degrees: (a,b) = (ed-v,u).
    # The exterior front-left facade is then the interior front-right facade.
    w, d = ed, ew
    zoom = min(4, 1260/(28*(w+d)), 820/(14*(w+d)+80))
    sx, sy, h = 28*zoom, 14*zoom, 70*zoom
    cx = 768 - (w-d)*sx/2
    top = [cx, 512 + h/2-(w+d)*sy/2]
    def p(a,b,z=0): return [round(top[0]+sx*(a-b),2),round(top[1]+sy*(a+b)-z,2)]
    outer = [p(0,0),p(w,0),p(w,d),p(0,d)]
    floor = [p(.18,.18),p(w-.18,.18),p(w-.18,d-.18),p(.18,d-.18)]
    img=Image.new('RGB',(1536,1024),'black'); dr=ImageDraw.Draw(img)
    dr.polygon([p(0,0),p(w,0),p(w,0,h),p(0,0,h)],fill='#77736b',outline='#e4d8c0',width=3)
    dr.polygon([p(0,0),p(0,d),p(0,d,h),p(0,0,h)],fill='#66645f',outline='#e4d8c0',width=3)
    dr.polygon(outer,fill='#9b8b6b',outline='#eee0c0',width=3)
    for a in range(1,w): dr.line([tuple(p(a,0)),tuple(p(a,d))],fill='#bba77e',width=2)
    for b in range(1,d): dr.line([tuple(p(0,b)),tuple(p(w,b))],fill='#bba77e',width=2)
    # Door is near the far end of the front-right wall, matching existing shop frontage.
    # Store the explicit camera transform and threshold; no mirror is used.
    b0,b1=.55,1.55
    if name=='bonded-warehouse': b0,b1=.55,2.15
    door=[p(w,b0),p(w,b1)]
    dr.line([tuple(p(0,d)),tuple(p(w,d))],fill='#ddd0b6',width=12)
    dr.line([tuple(p(w,0)),tuple(p(w,b0))],fill='#ddd0b6',width=12)
    dr.line([tuple(p(w,b1)),tuple(p(w,d))],fill='#ddd0b6',width=12)
    for b in [b0,b1]:
        dr.line([tuple(p(w,b)),tuple(p(w,b,70*zoom))],fill='#b68a4b',width=14)
    dr.line([tuple(p(w,b0,70*zoom)),tuple(p(w,b1,70*zoom))],fill='#b68a4b',width=14)
    img.save(OUT/'guides'/f'{name}.png')
    entries.append({'id':name,'exteriorFile':site['exteriorFile'],'exteriorRect':site['siteRectCells'],
      'outerCells':[ew,ed],'wallThicknessCells':.18,'usableFloorCells':[ew-.36,ed-.36],
      'cameraTransform':'interior(a,b)=(exteriorDepth-v,u); 90 degree rotation',
      'canvas':[1536,1024],'cameraMagnification':zoom,'worldStepPixels':[sx,sy],
      'actorHeightPixels':60*zoom,'doorHeightPixels':70*zoom,'floorPolygon':floor,
      'outerFloorPolygon':outer,'doorThreshold':door,'guide':f'guides/{name}.png',
      'status':'measured blockout; generated painting requires alignment check'})
lodging = next(x for x in entries if x['id']=='lodging')
lodging['level'] = 1
common = {**lodging, 'id':'cheap-lodging-common-room', 'level':0,
          'guide':'guides/cheap-lodging-common-room.png',
          'bindingStatus':'proposed second floor allocation within the existing lodging site'}
entries.append(common)
Image.open(OUT/'guides/lodging.png').save(OUT/common['guide'])
(OUT/'layout-contracts.json').write_text(json.dumps(entries,indent=2)+'\n')
print('Prepared',len(entries),'measured blockouts')

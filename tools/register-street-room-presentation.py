"""Register actor scale and foreground against each 1536x1024 room painting."""
import json
from pathlib import Path
from scipy.spatial import ConvexHull
# Human height, foreground doorway jamb centre/base/top/width; registered against painting pixels.
profiles={
'apothecary':(236,1123,760,466,22),'smithy':(218,1118,725,450,22),
'curry-house':(220,1096,764,486,22),'butcher':(244,1008,780,468,32),
'cooper-workshop':(192,1199,716,476,22),'pawnbroker':(232,1038,775,470,22),
'lodging':(208,1189,723,465,20),'quay-lodging':(211,1202,793,527,24),
'cobbler':(222,1081,771,492,22),'ship-chandler':(234,1198,755,462,22),
'bonded-warehouse':(202,1148,790,535,22),'rope-maker':(220,1138,777,465,24),
'cooper':(228,1113,780,460,24)}
path=Path('dist/guild-interiors/rooms.json');m=json.loads(path.read_text())
for r in m['rooms']:
 if not r['id'].startswith('street-'):continue
 key=r['id'][7:];height,x,y,top,width=profiles[key]
 foreground=[{'id':'door-front-jamb','base':[[x-width/2,y-8],[x+width/2,y],[x+width/2,y+5],[x-width/2,y-3]],'mask':[[x-width/2,top-5],[x+width/2,top+5],[x+width/2,y+5],[x-width/2,y-3]]}]
 for i,o in enumerate(r['obstacles']):
  if o['id']=='contact-footprint':continue
  points=[[round(p[0]*1536,2),round(p[1]*1024,2)] for p in o['polygon']]
  rise={'smithy':112,'curry-house':108,'butcher':143,'cooper-workshop':120,'lodging':100,'quay-lodging':112,'cobbler':122,'ship-chandler':145,'bonded-warehouse':155,'rope-maker':125,'cooper':124}.get(key,155)
  vertices=points+[[p[0],p[1]-rise] for p in points]
  hull=ConvexHull(vertices);mask=[vertices[int(j)] for j in hull.vertices]
  foreground.append({'id':o['id'],'base':points,'mask':mask})
 r['presentation']={'humanHeight':height,'doorwayHeight':y-top,'foreground':foreground,'registration':'1536x1024 painting pixels; doorway jamb, existing furniture footprints and vertical object silhouettes; 25 November 2026'}
 r['npc']['actorId']='shop-'+key
path.write_text(json.dumps(m,separators=(',',':'))+'\n')
print('Registered',len(profiles),'rooms with independent scales and foreground geometry')

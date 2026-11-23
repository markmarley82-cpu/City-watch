"""Export painted candidates and a review packet. Does not modify dist/."""
from pathlib import Path
import json, math, hashlib, copy
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art-review/street-interiors-v1'
contracts=json.loads((OUT/'layout-contracts.json').read_text())
anchors=json.loads((OUT/'painted-anchors.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
body=Image.open(ROOT/'art-review/player-recruit/v2/watch-recruit-body.webp').convert('RGBA').crop((0,0,192,192))
kit=Image.open(ROOT/'art-review/player-recruit/v2/watch-recruit-watch-breastplate.webp').convert('RGBA').crop((0,0,192,192))
body.alpha_composite(kit)
body=body.crop(body.getbbox())
body.save(OUT/'officer-scale-reference.png')
entries=[]; tests=[]
sheet=Image.new('RGB',(1536,math.ceil(len(contracts)/2)*576),'#11110f')
for i,c in enumerate(contracts):
    n=c['id']; a=anchors[n]; ew,ed=c['outerCells']
    image=Image.open(OUT/'sources'/f'{n}.png').convert('RGB')
    assert image.size==(1536,1024),n
    path=OUT/'rooms'/f'{n}.webp';image.save(path,quality=94,method=6)
    L,F,R=a['left'],a['front'],a['right']; B=[L[0]+R[0]-F[0],L[1]+R[1]-F[1]]
    ua=[(R[j]-B[j])/ed for j in range(2)]
    va=[(L[j]-B[j])/ew for j in range(2)]
    def xy(u,v):return [B[j]+u*ua[j]+v*va[j] for j in range(2)]
    # Largest scale keeps BOTH dimensions within their existing exterior limits.
    zoom=max(abs(ua[0]),abs(va[0]))/28
    actor=60*zoom
    angles=[math.degrees(math.atan2(abs(q[1]),abs(q[0]))) for q in [ua,va]]
    floor=[xy(.18,.18),xy(ed-.18,.18),xy(ed-.18,ew-.18),xy(.18,ew-.18)]
    actualDoor=a['doorHeight']/zoom
    normalized=lambda q:[round(q[0]/1536,5),round(q[1]/1024,5)]
    entry={**c,'image':f'rooms/{n}.webp','source':f'sources/{n}.png',
      'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
      'registrationMethod':'manually sampled painting anchors; approximate, not pixel segmentation',
      'outerFloorPolygonPixels':[B,R,F,L],'floorPolygonPixels':floor,
      'floor':[normalized(q) for q in floor],'entry':normalized(a['entry']),
      'axisPixels':[ua,va],'measuredAxisAnglesDegrees':angles,
      'cameraMagnification':zoom,'actorHeight':round(actor,2),
      'sampledDoorHeightPixels':a['doorHeight'],'doorHeightAtCityCamera':round(actualDoor,2),
      'renderedOuterExtentCells':[abs(ua[0])/(28*zoom)*ed,abs(va[0])/(28*zoom)*ew],
      'safeCenter':normalized(xy(.62*ed,.62*ew)),
      'status':'painting delivered; candidate for integration review',
      'runtimeVerified':False,'creativeApproval':False,
      'collisionStatus':'run tools/check-street-interior-navigation.py after export to attach tested layout annotations'}
    if 'doorEdgeSamples' in a:
        entry['doorEdgeSamples']=a['doorEdgeSamples']
        entry['doorMeasurementNote']=a['doorMeasurementNote']
    if n=='lodging': entry.update(level=1,doorRole='internal landing doorway; proposed upper sleeping floor')
    if n=='cheap-lodging-common-room':
        entry.update(exteriorFile=next(x['exteriorFile'] for x in contracts if x['id']=='lodging'),
          exteriorSite='lodging',level=0,doorRole='street entrance; proposed common-room ground floor',
          bindingStatus='proposed two-floor interpretation, not a shipped binding')
    entries.append(entry)
    tests.append({'id':n,'size':list(image.size),'uniqueImageSHA256':entry['sha256'],
      'angleWithinTwoDegrees':all(abs(v-26.565051)<2 for v in angles),
      'sampledScaleFitsOuterFootprint':all(x<=y+1e-8 for x,y in zip(entry['renderedOuterExtentCells'],[ed,ew])),
      'sampledDoorWithin65to75':65<=actualDoor<=75,
      'note':'Sampled geometry only; no claim of pixel-locked guide alignment or runtime acceptance.'})
    tile=image.copy().convert('RGBA')
    scaled=body.resize((round(body.width*actor/body.height),round(actor)),Image.Resampling.LANCZOS)
    pos=xy(.62*ed,.62*ew);tile.alpha_composite(scaled,(round(pos[0]-scaled.width/2),round(pos[1]-scaled.height)))
    tile=tile.convert('RGB').resize((768,512),Image.Resampling.LANCZOS)
    x=(i%2)*768;y=(i//2)*576
    sheet.paste(tile,(x,y));dr=ImageDraw.Draw(sheet)
    dr.text((x+18,y+515),n,fill='#ead7ac',font=font)
    dr.text((x+18,y+546),f'{ew} x {ed} outer cells | officer {actor:.0f}px | asset review, not runtime',fill='#bfb9a9',font=small)
registration={'schema':'city-watch.street-interiors.v1','packet':'street-interiors-v1',
 'canvas':[1536,1024],'background':'solid black as requested for guild-room paintings',
 'generator':'built-in image generator; prompts.json records the prompt set',
 'status':'14 painted candidates delivered; integration and phone review pending',
 'scaleMethod':'28/14 screen-space axis steps, sampled painting footprint, 60px city officer, shared camera zoom',
 'doorMapping':'90 degree interior camera rotation maps exterior front-left frontage to interior front-right frontage; individual threshold offsets require integration checking',
 'rooms':entries}
(OUT/'registration.json').write_text(json.dumps(registration,indent=2)+'\n')
assert len(set(t['uniqueImageSHA256'] for t in tests))==14
(OUT/'qa.json').write_text(json.dumps({'rooms':tests,'runtimeTested':False,'physicalPhoneTested':False},indent=2)+'\n')
sheet.save(OUT/'review.jpg',quality=90)
print(json.dumps({'paintings':len(entries),'totalWebPBytes':sum((OUT/e['image']).stat().st_size for e in entries),
 'angleChecksPassed':sum(t['angleWithinTwoDegrees'] for t in tests),
 'sampledFootprintChecksPassed':sum(t['sampledScaleFitsOuterFootprint'] for t in tests),
 'sampledDoorChecksPassed':sum(t['sampledDoorWithin65to75'] for t in tests)},indent=2))

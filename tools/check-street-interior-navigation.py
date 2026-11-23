"""Annotate room contact footprints and test routes without changing the game."""
from pathlib import Path
from collections import deque
import json, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'art-review/street-interiors-v1'
reg=json.loads((OUT/'registration.json').read_text())
layouts=json.loads((OUT/'furniture-layouts.json').read_text())['rooms']
paintedAnchors=json.loads((OUT/'painted-anchors.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
results=[]; patches=[]
sheet=Image.new('RGB',(1536,7*558),'#111111')
for index,r in enumerate(reg['rooms']):
    n=r['id']; W,H=1536,1024; ew,ed=r['outerCells']
    B=r['outerFloorPolygonPixels'][0]; ua,va=r['axisPixels']
    def pixel(u,v):return [B[j]+u*ed*ua[j]+v*ew*va[j] for j in range(2)]
    def norm(p):return [round(p[0]/W,6),round(p[1]/H,6)]
    obstacles=[]
    for label,u0,v0,u1,v1 in layouts[n]:
        poly=[pixel(u0,v0),pixel(u1,v0),pixel(u1,v1),pixel(u0,v1)]
        obstacles.append({'id':label,'polygon':[norm(p) for p in poly],
                          'roomPlaneBounds':[u0,v0,u1,v1]})
    raster=4
    floor=Image.new('L',(W//raster,H//raster)); d=ImageDraw.Draw(floor)
    d.polygon([(p[0]/raster,p[1]/raster) for p in r['floorPolygonPixels']],fill=255)
    radius=max(12,round(r['actorHeight']*.06))
    # Round outward: coarse raster never reduces the requested foot clearance.
    rr=math.ceil(radius/raster)
    floor=floor.filter(ImageFilter.MinFilter(2*rr+1))
    solid=Image.new('L',(W//raster,H//raster));d=ImageDraw.Draw(solid)
    for o in obstacles:d.polygon([(p[0]*W/raster,p[1]*H/raster) for p in o['polygon']],fill=255)
    solid=solid.filter(ImageFilter.MaxFilter(2*rr+1))
    step=8; gw,gh=W//step,H//step
    free={(x,y) for y in range(gh) for x in range(gw)
          if floor.getpixel(((x*step+4)//raster,(y*step+4)//raster))>0 and solid.getpixel(((x*step+4)//raster,(y*step+4)//raster))==0}
    def near(p,pool=free):
        return min(pool,key=lambda q:(q[0]*step+4-p[0])**2+(q[1]*step+4-p[1])**2)
    def px(q):return [q[0]*step+4,q[1]*step+4]
    threshold=paintedAnchors[n]['entry']
    # Portal samples may sit on the threshold. Do not snap a spawn to an isolated
    # raster speck or a one-cell corner pocket left by polygon rasterisation.
    portalFree={q for q in free if all((q[0]+dx,q[1]+dy) in free
                                    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])}
    start=near([threshold[j]-.35*ua[j] for j in range(2)],portalFree)
    assert math.dist(threshold,px(start))<=120, f'{n}: no safe spawn near the door'
    prev={start:None}; q=deque([start])
    while q:
        x,y=q.popleft()
        for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
            v=(x+dx,y+dy)
            if v not in free or v in prev:continue
            if dx and dy and ((x+dx,y) not in free or (x,y+dy) not in free):continue
            prev[v]=(x,y);q.append(v)
    def route(target):
        end=near(target)
        if end not in prev:return None
        path=[]
        while end is not None:path.append(px(end));end=prev[end]
        return path[::-1]
    center=pixel(.61,.61); central=route(center)
    if central is None:
        debug=Image.new('RGB',(gw,gh))
        dd=ImageDraw.Draw(debug)
        for point in free:dd.point(point,fill='#777777')
        for point in prev:dd.point(point,fill='#00aa55')
        dd.ellipse((start[0]-2,start[1]-2,start[0]+2,start[1]+2),fill='red')
        ct=near(center);dd.ellipse((ct[0]-2,ct[1]-2,ct[0]+2,ct[1]+2),fill='yellow')
        debug.resize((768,512)).save(OUT/'collision-debug.png')
        print(n, 'start',px(start),'target',px(ct),'threshold',threshold,'component',len(prev),'of',len(free),flush=True)
    assert central is not None, f'{n}: entry cannot reach center'
    stands=[]; routes=[central]
    for o in obstacles:
        u0,v0,u1,v1=o['roomPlaneBounds']; um=(u0+u1)/2;vm=(v0+v1)/2
        candidates=[pixel(u0-.10,vm),pixel(u1+.10,vm),pixel(um,v0-.10),pixel(um,v1+.10)]
        options=[]
        for candidate in candidates:
            path=route(candidate)
            if path is not None:
                end=path[-1];dist=math.dist(candidate,end)
                if dist<90:options.append((dist,len(path),path))
        assert options,f'{n}: no reachable examination stand for {o["id"]}'
        path=min(options,key=lambda p:(p[0],p[1]))[2]
        stands.append({'id':o['id'],'stand':norm(path[-1]),'kind':'examine'})
        routes.append(path)
    for path in routes:
        assert all((round((p[0]-4)/step),round((p[1]-4)/step)) in free for p in path)
    test={'id':n,'obstacles':len(obstacles),'gridStepPixels':step,'footRadiusPixels':radius,
          'reachableCells':len(prev),'freeCells':len(free),'entryToCenterPassed':True,
          'examinationStandsReached':len(stands),'allRecordedRouteSamplesClear':True,
          'thresholdToSpawnPixels':round(math.dist(threshold,px(start)),2),
          'source':'offline raster graph, not game-engine or physical-phone verification'}
    results.append(test)
    patch={'id':'street-'+n,'image':r['image'],'size':[W,H],'floor':r['floor'],
      'entry':norm(px(start)),'doorThreshold':norm(threshold),'obstacles':obstacles,
      'examineStands':stands,'actorHeight':r['actorHeight'],
      'footRadiusPixels':radius,'exteriorBinding':{'siteRectCells':r['exteriorRect'],
         'level':r.get('level',0),'status':'proposed; verify exact door offset before integration'},
      'annotationStatus':'manual conservative footprints, offline routes checked; runtime pending'}
    patches.append(patch)
    r.update(obstacles=obstacles,entry=patch['entry'],doorThreshold=patch['doorThreshold'],
      examineStands=stands,collisionStatus=patch['annotationStatus'])
    image=Image.open(OUT/r['image']).convert('RGBA');overlay=Image.new('RGBA',image.size);d=ImageDraw.Draw(overlay)
    d.line([tuple(p) for p in r['floorPolygonPixels']+[r['floorPolygonPixels'][0]]],fill='#72e8b5',width=4)
    for o in obstacles:
        poly=[(p[0]*W,p[1]*H) for p in o['polygon']]
        d.polygon(poly,fill=(240,70,40,75),outline=(255,160,90,255),width=3)
    for path in routes:d.line([tuple(p) for p in path],fill=(80,210,255,180),width=4)
    for stand in stands:
        x,y=stand['stand'][0]*W,stand['stand'][1]*H;d.ellipse((x-7,y-7,x+7,y+7),fill='yellow')
    x,y=px(start);d.ellipse((x-10,y-10,x+10,y+10),fill='#00ff88')
    image.alpha_composite(overlay);image.convert('RGB').save(OUT/'collision-review'/f'{n}.jpg',quality=86)
    tile=image.convert('RGB').resize((768,512),Image.Resampling.LANCZOS)
    x=(index%2)*768;y=(index//2)*558;sheet.paste(tile,(x,y))
    ImageDraw.Draw(sheet).text((x+12,y+517),f'{n}: {len(obstacles)} footprints / {len(stands)} reachable stands',font=font,fill='white')
(OUT/'registration.json').write_text(json.dumps(reg,indent=2)+'\n')
(OUT/'navigation-layouts.json').write_text(json.dumps({'schema':'city-watch.room-layout-patches.v1','autoApply':False,
 'note':'Merge per-room layout fields deliberately; retain NPC/dialogue separately. Never copy old guild-room collision data.',
 'rooms':patches},indent=2)+'\n')
(OUT/'navigation-qa.json').write_text(json.dumps({'runtimeVerified':False,'physicalPhoneVerified':False,'results':results},indent=2)+'\n')
sheet.save(OUT/'collision-review.jpg',quality=88)
(OUT/'collision-debug.png').unlink(missing_ok=True)
print(json.dumps({'rooms':len(results),'obstacles':sum(t['obstacles'] for t in results),
 'entryToCenterPasses':len(results),'reachableExaminationStands':sum(t['examinationStandsReached'] for t in results)},indent=2))

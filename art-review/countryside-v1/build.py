"""Bake a single registered country landscape into independent isometric WebPs."""
import json
from pathlib import Path
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
X0, Y0, X1, Y1 = 7.5, 4.5, 241.5, 342.5
DEPTH, W, H = 16, 1792, 896
GATES = [
    ('Traitors', 35, Y0, 0, -1), ('Rimwards', 80, Y0, 0, -1),
    ('Least', 196, Y0, 0, -1), ('Deosil', X0, 64, -1, 0),
    ('Shambling', X0, 285, -1, 0), ('Trading', X1, 275, 1, 0),
    ('Limping', X1, 320, 1, 0), ('Onion', 82, Y1, 0, 1),
    ('Hubwards', 174, Y1, 0, 1)
]
SIDES = [
    ('north', X0-16, Y0-16, X1+16, Y0, True),
    ('south', X0-16, Y1, X1+16, Y1+16, True),
    ('west', X0-16, Y0, X0, Y1, False),
    ('east', X1, Y0, X1+16, Y1, False)
]
TEX = np.asarray(Image.open(ROOT/'pasture.webp').convert('RGB'), dtype=np.float32)
DETAIL = (TEX.mean(axis=2) - TEX.mean()) * .9

def road_bounds(gate):
    _, x, y, dx, dy = gate
    return ([min(x,x+16*dx), y-3, max(x,x+16*dx), y+3] if dx else
            [x-3, min(y,y+16*dy), x+3, max(y,y+16*dy)])

def terrain(x, y):
    """World coordinates govern all colour decisions, including across tile edges."""
    north, south = y < Y0, y >= Y1
    along = np.where(north | south, x, y)
    depth = np.where(north, Y0-y, np.where(south, y-Y1, np.where(x<X0, X0-x, x-X1)))
    side = np.where(north, 0, np.where(south, 1, np.where(x<X0, 2, 3)))
    broad = 6*np.sin(x*.31+y*.21) + 4*np.sin(y*.78-x*.26) + 2*np.cos(x*2.17+y*1.7)
    noise = DETAIL[(y*38).astype(np.int32)%128, (x*38).astype(np.int32)%128]
    grain = ((np.floor(x*97).astype(np.int32)*374761393 ^ np.floor(y*97).astype(np.int32)*668265263) & 255)/255-.5
    rgb = np.empty(x.shape+(3,), np.float32)
    rgb[:] = [110,111,66]
    def paint(mask, color):
        rgb[mask] = color
    plot = np.floor((along+3*np.sin(along*.038))/12).astype(int)
    local = (along+3*np.sin(along*.038))%12
    inner = depth < 5.2+.6*np.sin(along*.41)
    paint(inner, [103,91,62])
    paint(inner & (np.sin(along*1.31+depth*2)> .64), [111,109,64])
    field = (local>1)&(local<11)&(depth>5.6 + np.sin(along*.13))&(depth<14.4+.7*np.cos(along*.2))
    cabbage = field & (((plot+side*2)%7)<4)
    fallow = field & ~cabbage
    paint(cabbage, [111,87,54])
    paint(fallow, [122,112,64])
    furrow = (depth+.07*np.sin(along*.6)) % .76
    paint(fallow & (furrow<.19), [99,88,52])
    paint(cabbage & (furrow<.29), [84,68,47])
    leafx = ((along+.13*np.sin(np.floor(depth/.76)*5.7))% .56)-.28
    leafy = furrow-.18
    leaf = (leafx/.19)**2+(leafy/.22)**2 + .12*np.cos(leafx*48+leafy*25)
    paint(cabbage & (leaf<1.35), [53,64,41])
    paint(cabbage & (leaf<.90), [70,87,49])
    paint(cabbage & (((leafx+.04)/.12)**2+((leafy+.036)/.14)**2<1), [98,111,63])
    paint(cabbage & (((leafx+.065)/.058)**2+((leafy+.048)/.08)**2<1), [128,138,82])
    hedge = (local>.15)&(local<.64)&(depth>5.1)&(depth<14.9)&((plot%4)!=3)
    paint(hedge, [57,69,39])
    paint(hedge & (np.sin(depth*22+along*5)>-.15)&(local<.44), [79,91,50])
    ditch = abs(depth-(4.55+.23*np.sin(along*.37)))<.20
    paint(ditch, [65,62,43])
    paint(ditch & (np.sin(along*.88)>.2), [76,82,55])
    lane = abs(depth-(2.25+.29*np.sin(along*.16)+.14*np.sin(along*.48))) < .56
    paint(lane, [123,106,73])
    for gate in GATES:
        _, gx, gy, dx, dy = gate
        distance = (x-gx)*dx+(y-gy)*dy
        offset = abs((x-gx)*dy+(y-gy)*dx)
        lead = (distance>=0)&(distance<16)
        paint(lead & (offset<3.15+.12*np.sin(distance*3)), [100,88,61])
        paint(lead & (offset<2.92+.07*np.sin(distance*5)), [145,125,88])
        paint(lead & (abs(offset-1.39)<.22+.06*np.sin(distance*1.6)), [112,93,66])
        paint(lead & (offset<.22)&(np.sin(distance*2.9)>.15), [129,119,76])
    rgb += (broad + noise + grain*10)[...,None]
    return np.uint8(np.clip(rgb,0,255))

def night(rgb):
    return np.uint8(np.clip(rgb.astype(np.float32)*[.54,.60,.72]+[3,6,12],0,255))

def rects():
    for side, x0,y0,x1,y1,horizontal in SIDES:
        lo,hi=(x0,x1) if horizontal else (y0,y1)
        for i in range(0, int(hi-lo), 16):
            start=lo+i
            stop=min(start+16,hi)
            # The final image is still a 16-cell diamond. Its duplicate interval is alpha-clipped.
            origin=min(start,hi-16)
            yield (f'{side}-{i//16:02d}', side, (origin,y0) if horizontal else (x0,origin),
                   (start,y0,stop,y1) if horizontal else (x0,start,x1,stop))

def tile(origin, coverage):
    row,col=np.ogrid[:H,:W]
    x=origin[0]+(col+.5-W/2)/112+(row+.5)/56
    y=origin[1]-(col+.5-W/2)/112+(row+.5)/56
    lx,ly,hx,hy=coverage
    keep=(x>=lx)&(x<hx)&(y>=ly)&(y<hy)
    # Clip using exact rational coordinates to eliminate ceil/floor disagreement at seams.
    return terrain(x,y), np.uint8(keep)*255

def export_scene():
    for folder in ('ground/day','ground/night'):
        (ROOT/folder).mkdir(parents=True,exist_ok=True)
    tiles=[]
    for id,side,origin,coverage in rects():
        dayfile=f'ground/day/{id}.webp'
        nightfile=f'ground/night/{id}.webp'
        day,alpha=tile(origin,coverage)
        for rgb, name in [(day,dayfile),(night(day),nightfile)]:
            Image.fromarray(np.dstack((rgb,alpha))).save(ROOT/name,quality=82,method=3)
        tiles.append(dict(id=id,side=side,position=origin,footprint=[16,16],dimensions=[W,H],
                          anchor=[W//2,0],anchorKind='back ground corner',
                          coverageBounds=coverage,file=dayfile,nightFile=nightfile))
    source=json.loads((ROOT/'sprite-types.json').read_text())
    placements=place_sprites(source)
    manifest=dict(schema='city-watch-countryside-v1', decorativeOnly=True, pixelsPerCell=[112,56],
                  gamePixelsPerCell=[56,28], artScale=2,bandDepth=16, wallBounds=[X0,Y0,X1,Y1],
                  southEastTallSetback=3, gates=[dict(name=n, position=[x,y], direction=[dx,dy],
                  roadEnd=[x+16*dx,y+16*dy],roadBounds=road_bounds((n,x,y,dx,dy))) for n,x,y,dx,dy in GATES],
                  tiles=tiles,sprites=placements)
    (ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    verify(manifest)
    for mode in ('day','night'):
        contact(manifest,mode)

def place_sprites(types):
    def overlaps(a,b):
        return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
    roads=[road_bounds(g) for g in GATES]
    placements=[]
    rng=random.Random(261126)
    def add(kind,x,y,side):
        meta=types[kind]
        w,d=meta['footprint']
        r=[x,y,x+w,y+d]
        depth={'north':Y0-r[3],'south':r[1]-Y1,'west':X0-r[2],'east':r[0]-X1}[side]
        if depth < (3 if side in ('south','east') and meta['tall'] else .45):return False
        if any(overlaps(r,q) for q in roads):return False
        if any(overlaps(r,p['bounds']) for p in placements):return False
        if x<X0-16 or y<Y0-16 or r[2]>X1+16 or r[3]>Y1+16:return False
        placements.append(dict(meta,id=f'{kind}-{len(placements):03d}',type=kind,side=side,
                               origin=[x,y], position=r[2:],bounds=r,anchorKind='front ground corner'))
        return True
    def local(kind, side, along, distance):
        w,d=types[kind]['footprint']
        x,y={'north':(along,Y0-distance-d),'south':(along,Y1+distance),
             'west':(X0-distance-w,along),'east':(X1+distance,along)}[side]
        return add(kind,x,y,side)
    for side,points in [('north',[48,149,213]),('south',[37,111,191]),
                        ('west',[92,174,305]),('east',[51,186,292])]:
        for t in points:
            local('farmhouse',side,t,9)
            local('barn',side,t+5.5,7.5)
            local('haystack',side,t+3.2,6.5)
            local('cart',side,t+1,4.2)
    local('windmill','north',106,9)
    local('windmill','south',137,9)
    local('gibbet','west',70,2.9)
    for side,t in [('north',91),('west',261),('south',93),('east',310),('south',162)]:
        local('tannery',side,t,3.35 if side in ('east','south') else 1)
    for side,lo,hi in [('north',10,238),('south',10,238),('west',8,338),('east',8,338)]:
        for t in range(lo,hi,7):
            kind=rng.choices(['tree','hedge','haystack'],[.37,.51,.12])[0]
            local(kind,side,t+rng.uniform(-1,1),rng.choice([.85,3.9,5,11.8]))
    return placements

def verify(data):
    cover=np.zeros((370,266),dtype=np.uint8)
    for t in data['tiles']:
        x0,y0,x1,y1=t['coverageBounds']
        x0,x1=int(x0-X0+16),int(x1-X0+16)
        y0,y1=int(y0-Y0+16),int(y1-Y0+16)
        cover[y0:y1,x0:x1]+=1
    # WebP alpha must match the exact registered half-open bounds at export scale.
    # This tests every pixel, including short end tiles and the four corner joins.
    row,col=np.ogrid[:H,:W]
    for t in data['tiles']:
        x,y=t['position']
        lx,ly,hx,hy=t['coverageBounds']
        # Integer numerators relative to the diamond's back corner (denominator 224).
        px=(2*col+1-W)+2*(2*row+1)
        py=-(2*col+1-W)+2*(2*row+1)
        expected_alpha=((px>=(lx-x)*224)&(px<(hx-x)*224)&
                        (py>=(ly-y)*224)&(py<(hy-y)*224))
        for variant in ('file','nightFile'):
            with Image.open(ROOT/t[variant]) as im:
                assert im.size==(W,H)
                alpha=np.asarray(im.getchannel('A'))
                np.testing.assert_array_equal(alpha, np.uint8(expected_alpha)*255)
    expected=np.ones_like(cover)
    expected[16:-16,16:-16]=0
    np.testing.assert_array_equal(cover,expected)
    for _,gx,gy,dx,dy in GATES:
        for d in np.arange(.5,16,.5):
            ix=int(gx+dx*d-X0+16);iy=int(gy+dy*d-Y0+16)
            assert cover[iy,ix]==1
    for sprite in data['sprites']:
        x0,y0,_,_=sprite['bounds']
        if sprite['tall'] and sprite['side']=='east':assert x0-X1>=3
        if sprite['tall'] and sprite['side']=='south':assert y0-Y1>=3
    # Check that gate road pixels survive composition and export. At the same depth
    # the packed road centre should be lighter than the rut on either side.
    for _,gx,gy,dx,dy in GATES:
        for d in [.5,3,7,11,15.5]:
            for u in [0,-1.4,1.4]:
                x,y=gx+dx*d-dy*u,gy+dy*d+dx*u
                tx=next(t for t in data['tiles'] if t['coverageBounds'][0]<=x<t['coverageBounds'][2]
                        and t['coverageBounds'][1]<=y<t['coverageBounds'][3])
                ix,iy=tx['position']
                a,b=int(W/2+56*((x-ix)-(y-iy))),int(28*((x-ix)+(y-iy)))
                with Image.open(ROOT/tx['file']) as im:
                    r,g,blue,alpha=im.getpixel((a,b))
                    assert alpha==255 and r>g>blue, (gx,gy,d,u)
    print(f"Verified {int(cover.sum()):,} cells with single coverage, nine straight gate roads and {len(data['sprites'])} sprite placements")

def contact(data,mode):
    scale=1/14
    def p(x,y):return (round((x-y-((X0-16)-(Y1+16)))*56*scale+32),round((x+y-(X0+Y0-32))*28*scale+64))
    size=(round((266+370)*56*scale)+64,round((266+370)*28*scale)+130)
    sheet=Image.new('RGBA',size,'#252722' if mode=='day' else '#171e2c')
    for t in data['tiles']:
        im=Image.open(ROOT/t['file' if mode=='day' else 'nightFile']).convert('RGBA')
        im=im.resize((round(W*scale),round(H*scale)),Image.Resampling.LANCZOS)
        x,y=p(*t['position'])
        sheet.alpha_composite(im,(x-im.width//2,y))
    draw=ImageDraw.Draw(sheet)
    corners=[p(*q) for q in [(X0,Y0),(X1,Y0),(X1,Y1),(X0,Y1)]]
    draw.polygon(corners,fill='#413d35' if mode=='day' else '#2a303b')
    draw.line(corners+[corners[0]],fill='#c0ae85' if mode=='day' else '#817c6f',width=3)
    for s in sorted(data['sprites'],key=lambda s:sum(s['position'])):
        im=Image.open(ROOT/s['file' if mode=='day' else 'nightFile']).convert('RGBA')
        im=im.resize(tuple(max(1,round(v*scale)) for v in im.size),Image.Resampling.LANCZOS)
        x,y=p(*s['position'])
        sheet.alpha_composite(im,(x-round(s['anchor'][0]*scale),y-round(s['anchor'][1]*scale)))
    font=ImageFont.load_default(size=17)
    for gate in data['gates']:
        x,y=p(*gate['position'])
        draw.ellipse((x-4,y-4,x+4,y+4),fill='#e9c88d')
        draw.text((x,y+13),gate['name'],font=font,anchor='mt',fill='#e7d6b6',stroke_width=2,stroke_fill='#24251f')
    draw.text((27,23),f'STO PLAINS  /  {mode.upper()}  /  16-CELL COUNTRYSIDE BAND',font=ImageFont.load_default(size=22),fill='#e7d6b6')
    sheet.convert('RGB').save(ROOT/f'contact-{mode}.webp',quality=89,method=5)

if __name__=='__main__':
    export_scene()

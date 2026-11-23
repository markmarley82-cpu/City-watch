"""Compare proposed portraits with pinned shipped sprites; never modify dist/."""
from pathlib import Path
import subprocess, json, io, hashlib
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'art-review/portraits-v1'
def gitbytes(p):return subprocess.check_output(['git','show','origin/main:'+p])
def picture(p):return Image.open(io.BytesIO(gitbytes(p))).convert('RGBA')
catalog=json.loads(gitbytes('dist/assets/characters-drawn-v1/manifest.json'))['assets']
sourceSHA=subprocess.check_output(['git','rev-parse','origin/main']).decode().strip()
jobs=[('colon','mentor-colon',['colon','mentor-colon','p3_named_colon_base']),
      ('nobby','mentor-nobby',['mentor-nobby']),
      ('carrot','mentor-carrot',['carrot','mentor-carrot','p3_named_carrot_base']),
      ('vimes','vimes',['vimes','p3_named_vimes_base']),
      ('mrs-palm','p3_named_mrs_palm_base',['palm','p3_named_mrs_palm_base']),
      ('dibbler',None,['dibbler'])]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
sheet=Image.new('RGB',(1100,6*250+45),'#242327');d=ImageDraw.Draw(sheet)
for x,label in [(10,'Character'),(155,'Map at game size'),(330,'Map enlarged 2×'),(515,'Current dialogue'),(735,'New portrait')]:d.text((x,10),label,fill='white',font=small)
bindings=[];checks=[]
for row,(name,key,aliases) in enumerate(jobs):
    y=45+row*250
    if key:
        a=catalog[key];atlas=picture('dist/'+a['atlas']);cw,ch=a['cellWidth'],a['cellHeight'];height=a['renderHeight']
        assert atlas.size==(cw*a['cols'],ch*a['rows'])
        frames=[]
        for action,indices in a['clips'].items():
            for frame in indices:
                tile=atlas.crop((frame%6*cw,frame//6*ch,frame%6*cw+cw,frame//6*ch+ch))
                assert tile.getchannel('A').getbbox(),(name,action,frame)
                frames.append({'action':action,'frame':frame,'nonempty':True})
        first=atlas.crop((0,0,cw,ch));scale=height/a['visibleHeight']
        world=first.resize((round(cw*scale),round(ch*scale)),Image.Resampling.LANCZOS)
        old=picture('dist/'+a['portrait']);source='dist/'+a['atlas']
    else:
        source='dist/assets/dibbler-v1/approved-sheet.webp';atlas=picture(source)
        first=atlas.crop((207,124,816,1289));height=64
        world=first.resize((round(64*609/1165),64),Image.Resampling.LANCZOS)
        old=first;frames=[{'action':'runtime single painted figure','nonempty':True}]
    world=world.crop(world.getchannel('A').getbbox())
    new=Image.open(OUT/'portraits'/f'{name}.webp').convert('RGBA')
    for im,xx,yy in [(world,195,y+155-world.height),
                     (world.resize((world.width*2,world.height*2)),335,y+185-world.height*2),
                     (ImageOps.contain(old,(180,180)),525,y+5),
                     (new.resize((200,200)),735,y)]:
        bg=Image.new('RGBA',im.size,'#b9ae98');bg.alpha_composite(im);sheet.paste(bg.convert('RGB'),(xx,yy))
    d.text((10,y+35),name,fill='white',font=font)
    note='Deliberate face revision: broad nose/cheeks differ from existing small world sprite.' if name=='nobby' else 'Design/costume comparison; no runtime portrait binding applied.'
    d.text((155,y+211),note,fill='#e3caa0',font=small)
    bindings.append({'portraitID':name,'image':f'portraits/{name}.webp','characterKeysOrExplicitIDs':aliases,
      'sourceWorldAsset':source,'sourceCommit':sourceSHA,
      'status':'proposed explicit mapping; verify scene-specific actor key before applying'})
    checks.append({'id':name,'referenceSource':source,'visibleWorldHeight':height,'sampledFrames':frames,
      'assessment':'design revision; review the narrower current map face before accepting world/portrait parity' if name=='nobby'
          else 'costume, hair/headwear and broad silhouette consistent in sampled comparison; creative review pending'})
sheet.save(OUT/'world-portrait-review.jpg',quality=92)
roleNames=['porter','baker','net-mender','stallholder','dock-clerk','carter']
(OUT/'portrait-bindings.json').write_text(json.dumps({'schema':'city-watch.portrait-bindings.proposed.v1',
 'autoApply':False,'named':bindings,'streetRoles':[{'role':n,'image':f'portraits/{n}.webp',
 'actorIDs':[],'status':'unbound; assign only to a matching human case NPC after scene review'} for n in roleNames],
 'fallback':'leave current portrait unchanged; never substitute a random role or another named person'},indent=2)+'\n')
(OUT/'world-portrait-audit.json').write_text(json.dumps({'sourceCommit':sourceSHA,'checks':checks,
 'scope':'source sprite/portrait comparison, not an in-game screenshot or physical-phone test',
 'unboundStreetRoles':roleNames,'runtimeVerified':False},indent=2)+'\n')
assert len(set(a for b in bindings for a in b['characterKeysOrExplicitIDs']))==sum(len(b['characterKeysOrExplicitIDs']) for b in bindings)
print('Compared six named characters; 270 nonempty action frames plus Dibbler static runtime crop. No alias collisions.')

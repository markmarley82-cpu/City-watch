"""Export individually generated portraits, preserving alpha, and produce composite QA."""
from pathlib import Path
import json, hashlib, math
from PIL import Image, ImageDraw, ImageFont, ImageOps
import numpy as np

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'art-review/portraits-v1'
jobs=json.loads((OUT/'prompts.json').read_text())['portraits']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
texture=Image.open(OUT/'refs/cobbles.webp').convert('RGBA').resize((256,256))
sheet=Image.new('RGB',(4*384,3*346),'#161619')
alphaSheet=Image.new('RGB',(768,12*276),'#191919')
manifest=[];checks=[]
for i,job in enumerate(jobs):
    n=job['id']; src=Image.open(OUT/'sources'/f'{n}.png').convert('RGBA')
    # Noncreative production sizing. Alpha-aware resampling avoids hidden-RGB bleed.
    bb=src.getchannel('A').getbbox(); assert bb,n
    tile=ImageOps.contain(src.crop(bb),(480,480),Image.Resampling.LANCZOS)
    portrait=Image.new('RGBA',(512,512));portrait.alpha_composite(tile,((512-tile.width)//2,512-tile.height))
    p=OUT/'portraits'/f'{n}.webp';portrait.save(p,format='WEBP',lossless=True,method=6)
    decoded=Image.open(p).convert('RGBA');a=np.array(decoded)
    assert decoded.size==(512,512)
    assert (a[:,:,3]==0).sum()>10000,n
    assert a[:16,:,3].max()==0,n
    assert not ((a[:,:,0]>220)&(a[:,:,1]<60)&(a[:,:,2]<60)&(a[:,:,3]>10)).any(),n
    sha=hashlib.sha256(p.read_bytes()).hexdigest()
    eye=[.45,.38] # Layout hint only; all portraits are presented uncropped by default.
    entry={'id':n,'name':job['name'],'image':f'portraits/{n}.webp','source':f'sources/{n}.png',
      'size':[512,512],'sha256':sha,'alpha':True,'drawSize':[256,256],
      'recommendedSmallSize':[128,128],'alignment':'bottom-center; do not auto-crop to alpha bounds',
      'sourceAlphaBounds':list(bb),'exportAlphaBounds':list(decoded.getchannel('A').getbbox()),
      'status':'proposed conversation portrait; creative and runtime review pending'}
    manifest.append(entry)
    checks.append({'id':n,'dimensionsPassed':True,'transparentBackgroundPassed':True,
      'headMarginPassed':True,'visibleBrightRedArtifactPixels':0,'sourceHiddenRedPixels':int(((np.array(src)[:,:,0]>220)&(np.array(src)[:,:,1]<60)&(np.array(src)[:,:,2]<60)&(np.array(src)[:,:,3]==0)).sum()),
      'sha256':sha})
    x=(i%4)*384;y=(i//4)*346
    bg=Image.new('RGBA',(288,288),'#d1c2a5');bg.alpha_composite(decoded.resize((288,288),Image.Resampling.LANCZOS))
    sheet.paste(bg.convert('RGB'),(x+48,y));dr=ImageDraw.Draw(sheet)
    dr.text((x+12,y+296),job['name'],fill='white',font=font)
    tiny=decoded.resize((64,64),Image.Resampling.LANCZOS);mini=Image.new('RGBA',(64,64),'#343039');mini.alpha_composite(tiny)
    sheet.paste(mini.convert('RGB'),(x+304,y+270))
    for k,color in enumerate(['#f0ece2','#151518','cobbles']):
        bg=texture.copy() if color=='cobbles' else Image.new('RGBA',(256,256),color)
        bg.alpha_composite(decoded.resize((256,256),Image.Resampling.LANCZOS));alphaSheet.paste(bg.convert('RGB'),(k*256,i*276))
    ImageDraw.Draw(alphaSheet).text((10,i*276+256),n+' — light / dark / actual city cobbles',fill='white',font=small)
(OUT/'registration.json').write_text(json.dumps({'schema':'city-watch.conversation-portraits.v1','packet':'portraits-v1',
 'status':'12 individually painted candidates; no runtime bindings changed',
 'lighting':'warm key from upper left','format':'lossless RGBA WebP',
 'characters':manifest},indent=2)+'\n')
assert len(set(x['sha256'] for x in manifest))==12
(OUT/'qa.json').write_text(json.dumps({'checks':checks,'runtimeVerified':False,'physicalPhoneVerified':False},indent=2)+'\n')
sheet.save(OUT/'review.jpg',quality=92);alphaSheet.save(OUT/'alpha-review.jpg',quality=92)
comparison=Image.new('RGB',(512,300),'#c8b99d')
for i,n in enumerate(['nobby','dibbler']):
    im=Image.open(OUT/'portraits'/f'{n}.webp').convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',(256,256),'#c8b99d');bg.alpha_composite(im);comparison.paste(bg.convert('RGB'),(i*256,0))
    ImageDraw.Draw(comparison).text((i*256+12,268),n,fill='black',font=font)
comparison.save(OUT/'nobby-dibbler-comparison.jpg',quality=94)
print('12 portraits: size, transparent alpha, head margin, visible red-artifact and unique-image checks passed.')
print('Production WebP bytes:',sum((OUT/x['image']).stat().st_size for x in manifest))

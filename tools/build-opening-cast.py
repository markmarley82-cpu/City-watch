import sys,json
from PIL import Image
SRC='/home/claude/cast-zip/x/'; OUT='/home/claude/city-watch/dist/assets/characters-drawn-v1/'
S=102/195; CW,CH=128,160; FX,FY=64,152; AX,AY=128,232
def frame(c,n): return Image.open(f'{SRC}{c}/{n}.webp').convert('RGBA')
def place(im,rot=0):
  w,h=im.size; sc=im.resize((round(w*S),round(h*S)),Image.LANCZOS)
  if rot: sc=sc.rotate(rot,resample=Image.BICUBIC,expand=False,center=(AX*S,AY*S))
  cell=Image.new('RGBA',(CW,CH),(0,0,0,0)); cell.alpha_composite(sc,(round(FX-AX*S),round(FY-AY*S)) if False else (0,0)) if False else None
  ox,oy=round(FX-AX*S),round(FY-AY*S); tmp=Image.new('RGBA',(CW,CH),(0,0,0,0)); tmp.paste(sc,(ox,oy),sc); return tmp
def lying(im,angle):
  if angle==0: return place(im)
  bb=im.getchannel('A').getbbox(); fig=im.crop(bb); fig=fig.rotate(angle,resample=Image.BICUBIC,expand=True)
  b2=fig.getchannel('A').getbbox(); fig=fig.crop(b2); w,h=fig.size; sc=fig.resize((max(1,round(w*S)),max(1,round(h*S))),Image.LANCZOS)
  tmp=Image.new('RGBA',(CW,CH),(0,0,0,0)); tmp.paste(sc,(round(FX-sc.width/2),FY-sc.height),sc); return tmp
for c in ['lookout','hobb','collector']:
  f={n:frame(c,n) for n in ['street-idle','run-away-contact','run-away-extension','street-step','combat-guard','combat-windup','combat-strike','combat-recoil']}
  I,RA,RB,ST,G,W,K,R=[f[k] for k in ['street-idle','run-away-contact','run-away-extension','street-step','combat-guard','combat-windup','combat-strike','combat-recoil']]
  walk=[RA,RB,RA,RB,RA,RB] if c=='lookout' else [ST,I,ST,I,ST,I]
  rows=[[I,I,I,I,I,I],walk,[G,W,W,K,K,G],[G]*6,[R,R,R,G,G,G],[W,K,K,K,G,G],[G,W,K,K,K,G],[R,R,I,I,I,I],None]
  atlas=Image.new('RGBA',(CW*6,CH*9),(0,0,0,0))
  for ri,row in enumerate(rows):
    for ci in range(6):
      if row is None: cell=lying(R,[0,-25,-50,-75,-88,-88][ci])
      else: cell=place(row[ci])
      atlas.paste(cell,(ci*CW,ri*CH),cell)
  atlas.save(OUT+f'opening-{c}.webp','WEBP',lossless=True,quality=100,method=6)
  bb=I.getchannel('A').getbbox(); cx=(bb[0]+bb[2])//2
  por=I.crop((cx-58,bb[1]-6,cx+58,bb[1]-6+135)).resize((96,112),Image.LANCZOS)
  por.save(OUT+f'opening-{c}-portrait.webp','WEBP',lossless=True,method=6)
  print(c,atlas.size)

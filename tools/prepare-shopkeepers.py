"""Register generated full-body staff as transparent, bounded game sprites."""
from pathlib import Path
from PIL import Image
import json,hashlib
source=Path('/workspace/scratch/44d2266b6235/generated_images')
files={'butcher':'74bd9edd','apothecary':'9875e04f','smithy':'5162730e','curry-house':'8890cce9','ship-chandler':'7643208f','bonded-warehouse':'8bf1b619','cooper':'a69c9336','quay-lodging':'2e8afa27','cooper-workshop':'2713b0ef','pawnbroker':'25b4155b','lodging':'8595b546','cobbler':'e13e018b','rope-maker':'1411b2e8'}
target=Path('dist/guild-interiors/assets/shopkeepers-v2');target.mkdir(parents=True,exist_ok=True)
manifest={'schema':1,'characters':{}};provenance=[]
for role,prefix in files.items():
 path=next(source.glob('exec-'+prefix+'*.png'));im=Image.open(path).convert('RGBA');bounds=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();assert bounds
 sprite=im.crop(bounds);w=round(sprite.width*512/sprite.height);sprite=sprite.resize((w,512),Image.Resampling.LANCZOS);out=Image.new('RGBA',(w+12,524));out.paste(sprite,(6,6));name=role+'.webp';out.save(target/name,quality=94,method=6,exact=True)
 manifest['characters']['shop-'+role]={'image':'assets/shopkeepers-v2/'+name,'width':out.width,'height':out.height,'visibleHeight':512,'footX':out.width/2,'footY':518,'relativeHeight':1,'original':True,'nativeFacing':'left','sourceHeight':bounds[3]-bounds[1]}
 provenance.append({'role':role,'source':path.name,'sourceSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),'runtime':name,'runtimeSHA256':hashlib.sha256((target/name).read_bytes()).hexdigest()})
(target/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
review=Path('art-review/shopkeepers-v2');review.mkdir(parents=True,exist_ok=True);(review/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Registered',len(manifest['characters']),'distinct 512px staff sprites')

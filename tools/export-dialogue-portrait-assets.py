"""Build phone-sized dialogue assets from the reviewed portrait commit, not art masters."""
from pathlib import Path
import hashlib,io,json,re,subprocess,sys
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets/conversation-portraits-v1'
previous=json.loads((OUT/'manifest.json').read_text())
source=sys.argv[1] if len(sys.argv)>1 else previous['sourceCommit']
labels={'colon':'Sergeant Fred Colon','nobby':'Corporal Nobby Nobbs','carrot':'Captain Carrot',
        'vimes':'Commander Sam Vimes','mrs-palm':'Mrs Rosemary Palm','dibbler':'C.M.O.T. Dibbler'}
entries={}; OUT.mkdir(parents=True,exist_ok=True)
for name in labels:
    src=f'art-review/portraits-v1/portraits/{name}.webp'
    raw=subprocess.check_output(['git','show',source+':'+src],cwd=ROOT)
    image=Image.open(io.BytesIO(raw)).convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
    stream=io.BytesIO();image.save(stream,format='WEBP',lossless=True,method=6)
    data=stream.getvalue();digest=hashlib.sha256(data).hexdigest();file=f'{name}-{digest[:12]}.webp'
    (OUT/file).write_bytes(data)
    entries[name]={'file':file,'size':[256,256],'bytes':len(data),'sha256':digest,
                   'source':src,'sourceSHA256':hashlib.sha256(raw).hexdigest()}
commit=subprocess.check_output(['git','rev-parse',source],cwd=ROOT).decode().strip()
(OUT/'manifest.json').write_text(json.dumps({'sourceCommit':commit,'portraits':entries},indent=2)+'\n')
p=ROOT/'dist/cw-conversation-portraits.mjs';module=p.read_text()
catalog={n:{'name':labels[n],'file':'assets/conversation-portraits-v1/'+e['file']} for n,e in entries.items()}
module,count=re.subn(r'const entries = Object.freeze\([\s\S]*?\);\nconst namedIDs',
    lambda _: 'const entries = Object.freeze('+json.dumps(catalog,indent=2)+');\nconst namedIDs',module,count=1)
assert count==1,'Cannot locate portrait catalogue'
p.write_text(module)
print('Exported six lazy dialogue portraits:',sum(e['bytes'] for e in entries.values()),'bytes')

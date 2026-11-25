from pathlib import Path
from PIL import Image, ImageSequence
from concurrent.futures import ThreadPoolExecutor, as_completed
import subprocess, hashlib, json, csv, io, zipfile, time
SRC=Path(__file__).resolve().parents[1]
OUT=SRC/'art-half-resolution'
EXT={'.png','.webp','.jpg','.jpeg','.gif','.bmp','.tif','.tiff','.ico','.avif','.svg'}
files=[p for p in subprocess.check_output(['git','ls-files','-z'],cwd=SRC).decode().split('\0') if p and not p.startswith('art-half-resolution/') and Path(p).suffix.lower() in EXT]
OUT.mkdir(exist_ok=True)
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=SRC,text=True).strip()
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def work(rel):
    src=SRC/rel; dst=OUT/rel; dst.parent.mkdir(parents=True,exist_ok=True)
    before=sha(src)
    if src.suffix.lower()=='.svg':
        import xml.etree.ElementTree as ET, re
        ET.register_namespace('', 'http://www.w3.org/2000/svg')
        tree=ET.parse(src); root=tree.getroot()
        vb=root.get('viewBox')
        parts=[float(x) for x in re.split(r'[ ,]+',vb.strip())] if vb else None
        dims=[]
        for idx,attr in enumerate(('width','height')):
            val=root.get(attr)
            match=re.fullmatch(r'([0-9.]+)([a-zA-Z]*)',val or '')
            if match:
                v=float(match.group(1)); root.set(attr,f'{v/2:g}{match.group(2)}'); dims.append(v)
            elif parts:
                v=parts[idx+2]; root.set(attr,f'{v/2:g}'); dims.append(v)
            else: raise ValueError('SVG has no numeric dimensions or viewBox')
        if not vb: root.set('viewBox',f'0 0 {dims[0]:g} {dims[1]:g}')
        tree.write(dst,encoding='utf-8',xml_declaration=True)
        assert sha(src)==before
        return {'path':rel,'original_width':dims[0],'original_height':dims[1],'width':dims[0]/2,'height':dims[1]/2,'frames':1,'original_bytes':src.stat().st_size,'bytes':dst.stat().st_size,'original_sha256':before,'sha256':sha(dst),'vector':True}
    with Image.open(src) as im:
        w,h=im.size; size=(max(1,(w+1)//2),max(1,(h+1)//2))
        fmt=im.format; n=getattr(im,'n_frames',1)
        frames=[]; durations=[]
        alpha=False
        for i in range(n):
            im.seek(i)
            fr=im.convert('RGBA')
            alpha=alpha or fr.getextrema()[3][0]<255
            frames.append(fr.resize(size,Image.Resampling.LANCZOS))
            durations.append(im.info.get('duration',100))
        kw={}
        if fmt=='WEBP': kw={'lossless':True,'method':4}
        elif fmt=='JPEG': frames=[f.convert('RGB') for f in frames]; kw={'quality':95,'subsampling':0}
        elif fmt=='PNG': kw={'compress_level':9}
        elif fmt=='ICO': kw={'sizes':[size]}
        if n>1:
            kw.update(save_all=True,append_images=frames[1:])
            if fmt in ('PNG','GIF','WEBP'):
                kw.update(duration=durations,loop=im.info.get('loop',0))
            if fmt=='GIF': kw.update(disposal=2,optimize=False)
        frames[0].save(dst,format=fmt,**kw)
    with Image.open(dst) as check:
        assert check.size==size,(rel,check.size,size)
        assert getattr(check,'n_frames',1)==n,(rel,'frame count')
        if alpha and fmt in ('PNG','WEBP','TIFF','GIF','AVIF'):
            assert check.convert('RGBA').getextrema()[3][0]<255,(rel,'alpha lost')
    assert sha(src)==before,(rel,'original changed')
    return {'path':rel,'original_width':w,'original_height':h,'width':size[0],'height':size[1],'frames':n,'original_bytes':src.stat().st_size,'bytes':dst.stat().st_size,'original_sha256':before,'sha256':sha(dst)}
rows=[]; errors=[]
with ThreadPoolExecutor(max_workers=6) as pool:
    pending={pool.submit(work,p):p for p in files}
    for future in as_completed(pending):
        rel=pending[future]
        try: rows.append(future.result())
        except Exception as e: errors.append({'path':rel,'error':str(e)})
        if (len(rows)+len(errors))%100==0: print(json.dumps({'processed':len(rows),'errors':len(errors),'total':len(files)}),flush=True)
rows.sort(key=lambda r:r['path'])
summary={'source_repository':'https://github.com/markmarley82-cpu/City-watch','source_commit':commit,'count':len(rows),'source_count':len(files),'errors':errors,'original_bytes':sum(r['original_bytes'] for r in rows),'bytes':sum(r['bytes'] for r in rows),'files':rows}
(OUT/'resize-manifest.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='files'}),flush=True)
if errors: raise SystemExit(1)
(OUT/'README.txt').write_text('City Watch — Half-Resolution Artwork\n\n'+f'Source commit: {commit}\nImages: {len(rows)}\n\nRaster images are copied at 50% width and 50% height (odd dimensions round up; minimum 1 pixel). SVG vectors have half-size display dimensions and retain their viewBox. Original filenames and repository paths are preserved beneath this separate folder. Originals and game files have not been edited. Transparency and animation frame counts are checked. No game code or original-resolution images are included.\n\nThese are separate art copies. Sprite atlas coordinates and game layouts are not changed; do not overwrite game assets without updating their metadata. See resize-manifest.json for dimensions and checksums.\n')
assert subprocess.check_output(['git','diff','--name-only'],cwd=SRC,text=True)==''
print('Verified every reduced image; tracked originals unchanged.',flush=True)

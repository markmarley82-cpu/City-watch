/* Independent cosmetic heads. Authored art; per-frame sockets; bounded atlas cache. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWHeads=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-heads.js');}})(globalThis,function(root){
 'use strict';
 const preferenceKey='city_watch_lab01_heads_v1';
 const groups=[
  ['human','Human',['watch-recruit','watch-recruit-dark','watch-recruit-female','p3_human_01','p3_human_02','townswoman','young-citizen'],['Dark waves & beard','Auburn & freckles']],
  ['dwarf','Dwarf',['p3_dwarf_01','p3_dwarf_02','dwarf-adventurer'],['Dark braided beard','Forked silver beard']],
  ['troll','Troll',['p3_troll_01','p3_troll_02'],['Broad granite','Craggy brow']],
  ['goblin','Goblin',['p3_goblin_01','p3_goblin_02','goblin'],['Hooked nose','Pale wiry hair']],
  ['gnome','Gnome',['p3_gnome_01','p3_gnome_02','gnome'],['Brown sideburns','White beard']],
  ['feegle','Feegle',['p3_feegle_01','p3_feegle_02'],['Wild red beard','Long red braids']],
  ['imp','Imp',['blue-imp'],['Orange spikes','Swept white hair']],
  ['vampire','Vampire',['p3_vampire_01','p3_vampire_02','vampire'],['Black widow’s peak','Long silver hair']],
  ['zombie','Zombie',['p3_zombie_01','p3_zombie_02'],['Patchy dark hair','Bald & stitched']],
  ['ghoul','Ghoul',['ghoul'],['Hollow bald brow','Wispy grey hair']],
  ['werewolf','Werewolf',['p3_werewolf_human_01','p3_werewolf_human_02','werefolk'],['Thick sideburns','Chestnut mane']],
  ['igor','Igor',['p3_igor_01','p3_igor_02'],['Stitched forehead','Grey side hair']],
  ['orc','Orc',['p3_orc_01','p3_orc_02'],['Close dark hair','Silver crest']],
  ['golem','Golem',['p3_golem_01','p3_golem_02'],['Terracotta block','Ochre clay']],
  ['gargoyle','Gargoyle',['p3_gargoyle_01','p3_gargoyle_02'],['Ridged stone ears','Curled stone horns']],
  ['elf','Elf',['p3_elf_01','p3_elf_02'],['Flowing silver','Flowing black']],
  ['gnoll','Gnoll',['p3_gnoll_01','p3_gnoll_02'],['Dark mane','Sandy & notched ear']]
 ];
 const races=Object.freeze(groups.map(([id,label,bodies,labels])=>Object.freeze({id,label,bodies:Object.freeze(bodies),labels:Object.freeze(labels)})));
 const recruits=Object.freeze(races.flatMap(r=>r.bodies));
 function raceOf(id){return races.find(r=>r.bodies.includes(id));}
 function choices(id){const r=raceOf(id);return r?[{id:'original',label:'Original head'},{id:'a',label:r.labels[0]},{id:'b',label:r.labels[1]}]:[];}
 function normalize(id,value){return raceOf(id)&&['a','b'].includes(value)?value:'original';}
 let session=new Map();const stored=new WeakMap();
 function storage(){try{return root.localStorage||null;}catch{return null;}}
 function read(s){try{if(s&&stored.has(s))return stored.get(s);const v=JSON.parse(s?.getItem(preferenceKey)||'null'),heads=v?.version===1&&v.heads&&typeof v.heads==='object'?v.heads:{};if(s)stored.set(s,heads);return heads;}catch{return {};}}
 function selected(id,s){return normalize(id,!s&&session.has(id)?session.get(id):read(s||storage())[id]);}
 function save(id,value,s){if(!raceOf(id))return false;const next=normalize(id,value);if(!s)session.set(id,next);try{const target=s||storage();if(!target)return false;const heads={...read(target),[id]:next};target.setItem(preferenceKey,JSON.stringify({version:1,heads}));stored.set(target,heads);return true;}catch{return false;}}
 root.addEventListener?.('storage',e=>{if(e.key===preferenceKey||e.key===null){session.clear();const s=storage();if(s)stored.delete(s);}});
 const defaultBase=root.document?.currentScript?.src?new URL('./',root.document.currentScript.src):null;
 let contract,images,loading,loadError=null,bytes=0,builds=0;const cache=new Map(),maxDecodedBytes=4*1024*1024;
 function clear(){cache.clear();bytes=0;}
 function configure(data,art){
  if(data?.version!==1||!data.rigs||!data.heads||!data.sheets)throw Error('Invalid head contract');
  for(const [name,spec]of Object.entries(data.sheets)){const im=art[name];if(!im||im.complete===false||(im.naturalWidth||im.width)!==spec.width||(im.naturalHeight||im.height)!==spec.height)throw Error('Head sheet dimensions differ');}
  for(const id of recruits){const r=raceOf(id),rig=data.rigs[id];if(!rig||!Array.isArray(rig.sockets)||rig.sockets.length!==rig.frames)throw Error('Missing head sockets: '+id);for(const s of rig.sockets){if(![s.neckX,s.neckY,s.height,s.eraseX,s.eraseWidth].every(Number.isFinite)||s.neckX<0||s.neckX>rig.cellWidth||s.neckY<=0||s.neckY>=rig.footY||s.height<=0||typeof s.right!=='boolean'||!Array.isArray(s.eraseSpans)||s.eraseSpans.some(a=>a.length!==3||a.some(n=>!Number.isInteger(n))||a[0]<0||a[0]>=s.neckY||a[1]<0||a[2]<=0||a[1]+a[2]>rig.cellWidth))throw Error('Invalid head socket: '+id);}for(const key of ['a','b']){const h=data.heads[r.id]?.[key],sheet=data.sheets[h?.sheet];if(!sheet||!h.rect||h.rect.length!==4||h.rect.some(n=>!Number.isFinite(n))||h.rect[2]<=0||h.rect[3]<=0||h.rect[0]<0||h.rect[1]<0||h.rect[0]+h.rect[2]>sheet.width||h.rect[1]+h.rect[3]>sheet.height)throw Error('Invalid head crop: '+r.id);}}
  contract=data;images=art;loadError=null;clear();return true;
 }
 function ensure(base){
  if(contract)return Promise.resolve(true);if(loading)return loading;
  const url=p=>new URL('assets/appearance-v13/'+p,base||defaultBase||root.document?.baseURI).href;
  loading=(async()=>{const response=await root.fetch(url('head-sockets.json?v=0.20-races1'));if(!response.ok)throw Error('Head catalogue could not load');const data=await response.json(),art={};await Promise.all(Object.entries(data.sheets).map(async([key,s])=>{art[key]=await new Promise((resolve,reject)=>{const im=new root.Image(),timer=setTimeout(()=>reject(Error('Head art timed out')),15000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(Error('Head art could not load'));};im.src=url(s.file);});}));configure(data,art);return true;})().catch(e=>{loadError=String(e.message||e);loading=null;throw e;});return loading;
 }
 function validate(meta){const r=contract?.rigs[meta?.id];if(!r)return false;for(const k of ['cellWidth','cellHeight','cols','rows','frames','footX','footY','visibleHeight'])if(r[k]!==meta[k])return false;for(const k of ['clips','nativeFacing','frameMS','p3Full'])if(JSON.stringify(r[k])!==JSON.stringify(meta[k]))return false;return true;}
 function canvas(w,h){if(typeof root.OffscreenCanvas==='function')return new root.OffscreenCanvas(w,h);const c=root.document?.createElement('canvas');if(!c)throw Error('Canvas unavailable');c.width=w;c.height=h;return c;}
 function dress(meta,value){
  const choice=normalize(meta.id,value===true?selected(meta.id):value);if(choice==='original')return meta;if(!contract){if(!loadError)ensure().catch(()=>{});return meta;}if(!validate(meta)||!meta.atlasImage||meta.atlasImage.complete===false)return meta;
  const key=meta.id+':'+choice,cached=cache.get(key);if(cached?.source===meta.atlasImage){cache.delete(key);cache.set(key,cached);return cached.meta;}
  const rig=contract.rigs[meta.id],head=contract.heads[raceOf(meta.id).id][choice],source=images[head.sheet],w=meta.cellWidth*meta.cols,h=meta.cellHeight*meta.rows,size=w*h*4;
  try{const c=canvas(w,h),g=c.getContext('2d');g.drawImage(meta.atlasImage,0,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
   rig.sockets.forEach((s,i)=>{const ox=i%meta.cols*meta.cellWidth,oy=Math.floor(i/meta.cols)*meta.cellHeight;g.save();g.beginPath();g.rect(ox,oy,meta.cellWidth,meta.cellHeight);g.clip();for(const [y,x,width]of s.eraseSpans)g.clearRect(ox+x,oy+y,width,1);const dh=s.height+2,dw=dh*head.rect[2]/head.rect[3];g.translate(ox+s.neckX,oy+s.neckY+2);if(s.right)g.scale(-1,1);
    if(s.collarRect){const [x,y,cw,ch]=s.collarRect,left=x-s.neckX,right=left+cw;
     g.save();if(s.right)g.scale(-1,1);g.beginPath();g.moveTo(left,5);g.quadraticCurveTo(left*.9,-3,left*.30,-6);g.lineTo(right*.30,-6);g.quadraticCurveTo(right*.9,-3,right,5);g.closePath();g.clip();
     // Undo head-facing reflection: the source body band already has its
     // authored facing. Keep its cloth/fur texture behind the new neck.
     g.drawImage(meta.atlasImage,ox+x,oy+y,cw,ch,left,-6,cw,11);g.restore();
    }
    // Portrait crops end on a curved neck/beard edge. Bridge that edge to the
    // preserved collar with matching authored texture, behind the actual head.
    if(head.neckTexture){const width=Math.max(3,dh*.24),height=Math.max(5,dh*.25);g.drawImage(source,...head.neckTexture,-width/2,-height*.72,width,height);}
    g.drawImage(source,...head.rect,-dw*head.anchorX,-dh,dw,dh);g.restore();});
   const dressed={...meta,atlasImage:c};if(cached){bytes-=cached.bytes;cache.delete(key);}if(size<=maxDecodedBytes){while(bytes+size>maxDecodedBytes&&cache.size){const first=cache.keys().next().value;bytes-=cache.get(first).bytes;cache.delete(first);}cache.set(key,{source:meta.atlasImage,meta:dressed,bytes:size});bytes+=size;}builds++;return dressed;
  }catch{return meta;}
 }
 function portrait(g,meta,value,w=64,h=64){
  g.clearRect(0,0,w,h);if(!contract||!validate(meta))return;let source,rect;
  if(value==='original'){const s=contract.rigs[meta.id].sockets[0];source=meta.atlasImage;rect=[Math.max(0,s.neckX-s.height*.65),s.neckY-s.height,Math.min(meta.cellWidth,s.height*1.2),s.height];}
  else{const head=contract.heads[raceOf(meta.id).id][normalize(meta.id,value)];if(!head)return;source=images[head.sheet];rect=head.rect;}
  const scale=Math.min((w-4)/rect[2],(h-4)/rect[3]);g.drawImage(source,...rect,(w-rect[2]*scale)/2,(h-rect[3]*scale)/2,rect[2]*scale,rect[3]*scale);
 }
 return Object.freeze({version:'1.1',preferenceKey,races,recruits,raceOf,choices,normalize,selected,save,configure,ensure,validate,dress,portrait,clear,report:()=>({ready:!!contract,error:loadError,artDecodedBytes:contract?Object.values(contract.sheets).reduce((n,s)=>n+s.width*s.height*4,0):0,builds,entries:cache.size,decodedBytes:bytes,maxDecodedBytes})});
});

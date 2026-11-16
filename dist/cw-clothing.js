/* Cosmetic wardrobe. Exact rig registration; no inventory, stats or game-save writes. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWClothing=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-clothing.js');}})(globalThis,function(root){
 'use strict';
 const preferenceKey='city_watch_lab01_clothing_v1';
 const rigs=Object.freeze(['watch-recruit','watch-recruit-dark','watch-recruit-female']);
 const slots=Object.freeze(['coat','trousers','boots','helmet','badge']);
 const definitions={
  coat:{label:'Coat',choices:{original:{label:'Original blue'},brown:{label:'Patrol brown',rgb:[107,77,52]},olive:{label:'Olive wool',rgb:[91,105,62]},wine:{label:'Oxblood cloth',rgb:[133,57,55]},ochre:{label:'Ochre cloth',rgb:[153,115,51]}}},
  trousers:{label:'Trousers',choices:{original:{label:'Original brown'},charcoal:{label:'Charcoal',rgb:[68,72,76]},sand:{label:'Worn canvas',rgb:[158,140,104]}}},
  boots:{label:'Boots',choices:{original:{label:'Original leather'},black:{label:'Blackened leather',rgb:[51,49,46]},tan:{label:'Tan leather',rgb:[153,105,60]}}},
  helmet:{label:'Helmet finish',choices:{original:{label:'Original iron'},copper:{label:'Aged copper',rgb:[165,103,65]},bronze:{label:'Aged bronze',rgb:[149,119,66]},dark:{label:'Blackened iron',rgb:[66,75,79]}}},
  badge:{label:'Coat badge',choices:{original:{label:'No added badge'},watch:{label:'Small brass badge',swatch:'#d8ba69'},copper:{label:'Copper Watch badge',swatch:'#ba784e'}}}
 };
 for(const d of Object.values(definitions)){for(const c of Object.values(d.choices)){if(c.rgb)Object.freeze(c.rgb);Object.freeze(c);}Object.freeze(d.choices);Object.freeze(d);}Object.freeze(definitions);
 const defaults=()=>Object.fromEntries(slots.map(s=>[s,'original']));
 let fitted={},modular={};
 const modularImages=new Map(),modularPending=new Map(),modularErrors=new Map();
 let modularLoad=null,modularBytes=0;
 const maxLayerBytes=24*1024*1024;
 const defaultBase=root.document?.currentScript?.src?new URL('./',root.document.currentScript.src):null;
 function configureModular(data,load){
  if(data?.version!==2||!data.profiles||typeof data.profiles!=='object')throw Error('Invalid modular wardrobe');
  for(const [id,p]of Object.entries(data.profiles)){
   if(p.id!==id||!p.race||!Array.isArray(p.layers)||!Array.isArray(p.positions)||p.positions.length!==p.frames)throw Error('Missing modular rig');
   const found=new Set();for(const layer of p.layers){if(!slots.includes(layer.slot)||!/^[a-z][a-z0-9-]{0,63}$/.test(layer.id)||Object.hasOwn(definitions[layer.slot].choices,layer.id)||found.has(layer.slot+':'+layer.id))throw Error('Invalid modular piece');found.add(layer.slot+':'+layer.id);
    const assets=layer.headAtlases?Object.values(layer.headAtlases):[layer.atlas];if(!assets.length||assets.some(a=>!a?.file?.startsWith('assets/modular-wardrobe-v2/'+id+'/')||!a.sha256||a.file.includes('..')))throw Error('Invalid modular atlas');
   }
  }
  modular=data.profiles;modularLoad=load||null;modularImages.clear();modularPending.clear();modularErrors.clear();modularBytes=0;revision++;clear();return true;
 }
 function modularFit(meta){const p=modular[meta?.id];return !!p&&registration.filter(k=>k!=='atlas').every(k=>JSON.stringify(p[k])===JSON.stringify(meta[k]));}
 function modularParts(meta,outfit,head='original'){
  if(!modularFit(meta))return [];const p=modular[meta.id],value=normalize(meta.id,outfit===true?selected(meta.id):outfit),wanted=[];
  for(const slot of slots){const piece=p.layers.find(a=>a.slot===slot&&a.id===value[slot]);if(piece)wanted.push({slot,asset:piece.headAtlases?piece.headAtlases[head]||piece.headAtlases.original:piece.atlas});}
  if(wanted.some(a=>a.slot==='coat')&&head==='original')wanted.push({slot:'headFront',asset:p.assets.headFront});return wanted;
 }
 function touchLayer(file){const im=modularImages.get(file);if(im){modularImages.delete(file);modularImages.set(file,im);}return im?.image;}
 async function ensure(meta,outfit,head='original',base){
  const dw=root.CWDrawnWardrobe?.current,dm=root.CWDrawnCharacters?.current?.entries[meta.id];if(dw?.supports(meta.id)&&dm){await root.CWDrawnCharacters.current.ensureAppearance(meta.id,{clothing:outfit===true?selected(meta.id):outfit,head},base);return true;}const coat=(outfit===true?selected(meta.id):outfit)?.coat;if(coat?.startsWith('fitted-'))await root.CWFittedEquipment?.current?.ensure(meta.id,coat.slice(7));
  const wanted=modularParts(meta,outfit,head);if(!wanted.length)return true;
  const pinned=new Set(wanted.map(a=>a.asset.file)),url=file=>new URL(file,base||defaultBase||root.document?.baseURI).href;
  await Promise.all(wanted.map(({asset})=>{
   if(touchLayer(asset.file))return true;if(modularPending.has(asset.file))return modularPending.get(asset.file);
   const pending=(async()=>{
    const im=await(modularLoad?modularLoad(asset.file):new Promise((resolve,reject)=>{const im=new root.Image(),timer=setTimeout(()=>reject(Error('Clothing image timed out')),20000);im.onload=()=>{clearTimeout(timer);resolve(im)};im.onerror=()=>{clearTimeout(timer);reject(Error('Clothing image could not load'))};im.src=url(asset.file)}));
    if((im.naturalWidth||im.width)!==meta.cellWidth*meta.cols||(im.naturalHeight||im.height)!==meta.cellHeight*meta.rows||im.complete===false)throw Error('Clothing frame grid differs');
    const bytes=meta.cellWidth*meta.cols*meta.cellHeight*meta.rows*4;modularImages.set(asset.file,{image:im,bytes});modularBytes+=bytes;modularErrors.delete(asset.file);
    for(const [file,entry]of modularImages){if(modularBytes<=maxLayerBytes)break;if(pinned.has(file))continue;modularImages.delete(file);modularBytes-=entry.bytes;}
    return true;
   })().catch(e=>{modularErrors.set(asset.file,String(e.message||e));throw e}).finally(()=>modularPending.delete(asset.file));modularPending.set(asset.file,pending);return pending;
  }));return true;
 }
 function layersReady(meta,outfit,head='original'){return modularParts(meta,outfit,head).every(a=>!!modularImages.get(a.asset.file));}
 function requestLayers(meta,outfit,head='original'){
  // Failed assets wait for an explicit studio Retry/choice. Do not retry a
  // broken transfer on every animation frame or while the browser is offline.
  if(modularParts(meta,outfit,head).some(a=>modularErrors.has(a.asset.file)))return;
  ensure(meta,outfit,head).catch(()=>{});
 }
 const registration=['atlas','cellWidth','cellHeight','cols','rows','frames','footX','footY','visibleHeight','clips','nativeFacing','frameMS','p3Full'];
 function fits(meta){const p=fitted[meta?.id];return !!p&&registration.every(k=>JSON.stringify(p[k])===JSON.stringify(meta[k]));}
 function configureFitted(data){
  if(data?.version!==1||!data.profiles||typeof data.profiles!=='object')throw Error('Invalid fitted wardrobe');
  for(const [id,p]of Object.entries(data.profiles)){
   if(!id||rigs.includes(id)||!p.atlas||!Number.isInteger(p.frames)||p.frames<1||!Array.isArray(p.poses)||p.poses.length!==p.frames)throw Error('Invalid fitted body');
   for(const slot of slots){if(!Array.isArray(p.availability?.[slot])||p.availability[slot].some(k=>!definitions[slot].choices[k]||k==='original'))throw Error('Invalid fitted choices');}
   for(const pose of p.poses){
    for(const slot of ['coat','trousers','boots'])if(!Array.isArray(pose.slots?.[slot])||pose.slots[slot].some(a=>a.length!==3||a.some(n=>!Number.isInteger(n))||a[0]<0||a[0]>=p.cellHeight||a[1]<0||a[2]<1||a[1]+a[2]>p.cellWidth))throw Error('Invalid garment mask');
    const b=pose.badge;if(!Array.isArray(b)||b.length!==5||b.slice(0,4).some(n=>!Number.isInteger(n))||b[0]<0||b[1]<0||b[2]<1||b[3]<1||b[0]+b[2]>p.cellWidth||b[1]+b[3]>p.cellHeight)throw Error('Invalid fitted badge');
   }
  }
  fitted=data.profiles;revision++;clear();return true;
 }
 function supports(id){return root.CWFittedEquipment?.supports(id)||rigs.includes(id)||Object.hasOwn(fitted,id)||Object.hasOwn(modular,id)||[...layers.values()].some(a=>a.rig===id);}
 function choices(id,slot){
  if(root.CWDrawnWardrobe?.supports(id)){const items={...definitions[slot].choices};if(slot==='coat')Object.assign(items,root.CWFittedEquipment.choices);Object.assign(items,root.CWDrawnWardrobe.choices(id,slot));return items;}
  const p=fitted[id],items=rigs.includes(id)?{...definitions[slot].choices}:{original:{label:slot==='badge'?'No added badge':'Painted '+({coat:'garment',trousers:'lower garment',boots:'footwear',helmet:'headwear'}[slot]||slot)}};
  for(const key of p?.availability[slot]||[])items[key]={...definitions[slot].choices[key],label:key==='brown'?'Brown finish':key==='olive'?'Olive finish':key==='wine'?'Oxblood finish':key==='ochre'?'Ochre finish':definitions[slot].choices[key].label};
  for(const a of layers.values())if(a.rig===id&&a.slot===slot)items[a.id]={label:a.label||a.id};
  for(const a of modular[id]?.layers||[])if(a.slot===slot)items[a.id]={label:a.label,material:a.material,modular:true,thumbnail:a.thumbnail};if(slot==='coat'&&root.CWFittedEquipment?.supports(id)){for(const old of ['watch-plate','service-mail','work-jerkin'])delete items[old];Object.assign(items,root.CWFittedEquipment.choices);}return items;
 }
 function availableSlots(id){return slots.filter(slot=>Object.keys(choices(id,slot)).length>1);}
 function normalize(id,value){const next=defaults();if(!supports(id))return next;for(const slot of slots){let chosen=value?.[slot];if(root.CWDrawnWardrobe?.supports(id))chosen=root.CWDrawnWardrobe.legacy[chosen]||chosen;if(slot==='coat'&&root.CWFittedEquipment?.supports(id)&&['watch-plate','service-mail','work-jerkin'].includes(chosen))chosen='fitted-'+chosen;if(Object.hasOwn(choices(id,slot),chosen))next[slot]=chosen;}return next;}
 function equal(a,b){return slots.every(s=>a?.[s]===b?.[s]);}
 let session=new Map();const stored=new WeakMap();
 function storage(){try{return root.localStorage||null;}catch{return null;}}
 function readAll(s){try{if(s&&stored.has(s))return stored.get(s);const a=JSON.parse(s?.getItem(preferenceKey)||'null'),value=a?.version===1&&a.outfits&&typeof a.outfits==='object'?a.outfits:{};if(s)stored.set(s,value);return value;}catch{return {};}}
 function selected(id,s){if(!s&&session.has(id))return {...session.get(id)};return normalize(id,readAll(s||storage())[id]);}
 function save(id,value,s){if(!supports(id))return false;const next=normalize(id,value);if(!s)session.set(id,next);try{const target=s||storage();if(!target)return false;const outfits={...readAll(target),[id]:next};target.setItem(preferenceKey,JSON.stringify({version:1,outfits}));stored.set(target,outfits);return true;}catch{return false;}}
 root.addEventListener?.('storage',e=>{if(e.key===preferenceKey||e.key===null){session.clear();const s=storage();if(s)stored.delete(s);}});
 // Garment atlases must use the body grid, clips, foot and native-facing contract.
 // This prevents stretched human clothing being applied to small or nonhuman rigs.
 const layers=new Map(),cache=new Map(),failed=new Set();let bytes=0,builds=0,revision=0;
 // A 32-frame rig needs three atlas passes (base, garments, foreground).
 // Keep all three resident so selecting a helmet cannot repaint every RAF.
 const maxDecodedBytes=8*1024*1024;
 function validateLayer(base,layer){
  if(!base||!layer||!slots.includes(layer.slot)||!/^[a-z][a-z0-9-]{0,63}$/.test(layer.id)||Object.hasOwn(definitions[layer.slot].choices,layer.id)||layer.rig!==base.id)throw Error('Clothing layer has an incompatible rig or slot');
  for(const k of ['cellWidth','cellHeight','cols','rows','frames','footX','footY','visibleHeight'])if(layer[k]!==base[k])throw Error('Clothing layer registration differs: '+k);
  for(const k of ['clips','nativeFacing','frameMS','p3Full'])if(JSON.stringify(layer[k])!==JSON.stringify(base[k]))throw Error('Clothing layer animation differs: '+k);
  const im=layer.atlasImage;
  if(!im||im.complete===false||(im.naturalWidth||im.width)!==base.cellWidth*base.cols||(im.naturalHeight||im.height)!==base.cellHeight*base.rows)throw Error('Clothing layer atlas dimensions differ');
  if(layer.eraseImage&&((layer.eraseImage.naturalWidth||layer.eraseImage.width)!==base.cellWidth*base.cols||(layer.eraseImage.naturalHeight||layer.eraseImage.height)!==base.cellHeight*base.rows||layer.eraseImage.complete===false))throw Error('Clothing erase mask dimensions differ');
  if(base.cellWidth*base.cols*base.cellHeight*base.rows*4>maxDecodedBytes)throw Error('Clothing layer exceeds the composition budget');
  return true;
 }
 function clear(){cache.clear();failed.clear();bytes=0;}
 function register(base,layer){validateLayer(base,layer);const key=base.id+':'+layer.slot+':'+layer.id;if(layers.has(key))throw Error('Clothing layer already registered');layers.set(key,{...layer});revision++;clear();return key;}
 // Masks are registered in the painted recruits' 128x176 source cells. The
 // source alpha and cloth colour exclude skin, shirt, belt and transparent areas.
 // The walk row has a different body and boot position from the idle row.
 function region(slot,x,y,r,g,b,walk,female){
  if(slot==='coat')return y>=59&&y<=111&&b>r*1.10&&b>g*1.01;
  if(slot==='helmet')return y>=11&&y<=34&&x>=43&&x<=82&&Math.max(r,g,b)-Math.min(r,g,b)<37;
  if(slot==='trousers')return y>=113&&y<=(walk?145:147)&&x>=(female?49:47)&&x<=83&&r>=b&&r>=g*.92;
  if(slot==='boots')return y>=(walk?146:148)&&y<168&&r>=b&&r>=g*.93;
  return false;
 }
 function tint(r,g,b,rgb){const lum=.2126*r+.7152*g+.0722*b,scale=.35+lum/170;return rgb.map(c=>Math.max(0,Math.min(255,Math.round(c*scale))));}
 function canvas(w,h){if(typeof root.OffscreenCanvas==='function')return new root.OffscreenCanvas(w,h);const c=root.document?.createElement('canvas');if(!c)throw Error('Canvas is unavailable');c.width=w;c.height=h;return c;}
 function prepare(meta,outfit){
  const choices=normalize(meta.id,outfit),w=meta.cellWidth*meta.cols,h=meta.cellHeight*meta.rows;
  const custom=slots.map(slot=>layers.get(meta.id+':'+slot+':'+choices[slot])).filter(Boolean);
  if(!supports(meta.id))return meta;
  if(fitted[meta.id]&&!fits(meta))return meta;
  const key=meta.id+':'+revision+':'+slots.map(s=>choices[s]).join('|');
  const cached=cache.get(key);if(cached&&cached.source===meta.atlasImage){cache.delete(key);cache.set(key,cached);return cached.meta;}
  if(failed.has(key))return meta;
  if(!custom.length&&slots.every(s=>choices[s]==='original'))return meta;
  try{
   if(!meta.atlasImage||meta.atlasImage.complete===false)return meta;
   const c=canvas(w,h),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(meta.atlasImage,0,0);
   if(rigs.includes(meta.id)){
    const image=g.getImageData(0,0,w,h),d=image.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;if(!d[i+3])continue;const cx=x%meta.cellWidth,cy=y%meta.cellHeight,walk=Math.floor(y/meta.cellHeight)===1;
     for(const slot of slots){const rgb=definitions[slot].choices[choices[slot]]?.rgb;
      if(rgb&&region(slot,cx,cy,d[i],d[i+1],d[i+2],walk,meta.id.endsWith('female'))){const color=tint(d[i],d[i+1],d[i+2],rgb);d[i]=color[0];d[i+1]=color[1];d[i+2]=color[2];break;}
     }
    }
    g.putImageData(image,0,0);
    if(['watch','copper'].includes(choices.badge))for(let frame=0;frame<meta.frames;frame++){
     const x=frame%meta.cols*meta.cellWidth+(frame<4?71:68),y=Math.floor(frame/meta.cols)*meta.cellHeight+81;
     g.fillStyle='#573d1e';g.fillRect(x-2,y-1,6,7);g.fillStyle=definitions.badge.choices[choices.badge].swatch;g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+2);g.lineTo(x+1,y+5);g.lineTo(x-1,y+3);g.closePath();g.fill();
    }
   }
   if(fits(meta)){
    const image=g.getImageData(0,0,w,h),d=image.data,p=fitted[meta.id];
    for(let frame=0;frame<meta.frames;frame++){
     const ox=frame%meta.cols*meta.cellWidth,oy=Math.floor(frame/meta.cols)*meta.cellHeight;
     for(const slot of ['coat','trousers','boots']){const rgb=definitions[slot].choices[choices[slot]]?.rgb;if(!rgb)continue;
      for(const [y,x,width]of p.poses[frame].slots[slot])for(let dx=0;dx<width;dx++){const i=((oy+y)*w+ox+x+dx)*4;const c=tint(d[i],d[i+1],d[i+2],rgb);d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];}
     }
    }
    g.putImageData(image,0,0);
    if(['watch','copper'].includes(choices.badge))for(let frame=0;frame<meta.frames;frame++){
     const [x,y,bw,bh]=p.poses[frame].badge,ox=frame%meta.cols*meta.cellWidth,oy=Math.floor(frame/meta.cols)*meta.cellHeight;
     g.save();g.globalCompositeOperation='source-atop';g.translate(ox+x,oy+y);
     g.fillStyle='#4d3423';g.fillRect(0,0,bw,bh);
     g.fillStyle=definitions.badge.choices[choices.badge].swatch;g.beginPath();g.moveTo(bw*.15,bh*.1);g.lineTo(bw*.85,bh*.1);g.lineTo(bw*.85,bh*.60);g.lineTo(bw*.50,bh*.94);g.lineTo(bw*.15,bh*.60);g.closePath();g.fill();
     g.strokeStyle='#f3c28d';g.lineWidth=.5;g.beginPath();g.moveTo(bw*.3,bh*.24);g.lineTo(bw*.7,bh*.24);g.stroke();g.restore();
    }
   }
   // Registered replacement layers may clear an explicitly authored covered
   // region before painting; overlays use the same cell and foot registration.
   for(const slot of slots){const layer=custom.find(a=>a.slot===slot);if(!layer)continue;
    if(layer.eraseImage){g.globalCompositeOperation='destination-out';g.drawImage(layer.eraseImage,0,0);g.globalCompositeOperation='source-over';}
    g.drawImage(layer.atlasImage,0,0);
   }
   const dressed={...meta,atlasImage:c},size=w*h*4;
   if(cached){cache.delete(key);bytes-=cached.bytes;}
   if(size<=maxDecodedBytes){while(bytes+size>maxDecodedBytes&&cache.size){const oldest=cache.keys().next().value;bytes-=cache.get(oldest).bytes;cache.delete(oldest);}cache.set(key,{source:meta.atlasImage,meta:dressed,bytes:size});bytes+=size;}
   builds++;return dressed;
  }catch{failed.add(key);return meta;}
 }
 function remember(key,source,c,meta){const size=c.width*c.height*4,old=cache.get(key);if(old){cache.delete(key);bytes-=old.bytes}if(size<=maxDecodedBytes){while(bytes+size>maxDecodedBytes&&cache.size){const first=cache.keys().next().value;bytes-=cache.get(first).bytes;cache.delete(first)}cache.set(key,{source,meta,bytes:size});bytes+=size}builds++;return meta}
 function dress(meta,outfit){
  const value=outfit===true?selected(meta.id):outfit,base=prepare(meta,value),wanted=modularParts(meta,value).filter(a=>a.slot!=='helmet'&&a.slot!=='headFront');if(!wanted.length)return base;
  if(!wanted.every(a=>!!modularImages.get(a.asset.file))){requestLayers(meta,value);return base;}
  const key='mod:'+meta.id+':'+revision+':'+JSON.stringify(value),old=cache.get(key);if(old?.source===base.atlasImage)return old.meta;
  const c=canvas(meta.cellWidth*meta.cols,meta.cellHeight*meta.rows),g=c.getContext('2d');g.drawImage(base.atlasImage,0,0);
  // Lower clothes first, then the torso; the head and helmet have their own
  // later passes. Every atlas already contains the complete pose registration.
  for(const slot of ['trousers','boots','coat']){const part=wanted.find(a=>a.slot===slot);if(part)g.drawImage(touchLayer(part.asset.file),0,0)}
  return remember(key,base.atlasImage,c,{...base,atlasImage:c});
 }
 function compose(meta,outfit,head='original'){
  const value=outfit===true?selected(meta.id):normalize(meta.id,outfit),choice=head===true?(root.CWHeads?.selected(meta.id)||'original'):head;
  const wanted=modularParts(meta,value,choice);
  if(wanted.length&&!layersReady(meta,value,choice)){requestLayers(meta,value,choice);return root.CWHeads?root.CWHeads.dress(prepare(meta,value),choice):prepare(meta,value)}
  const body=dress(meta,value),headed=root.CWHeads?root.CWHeads.dress(body,choice):body;
  const foreground=wanted.filter(a=>a.slot==='helmet'||a.slot==='headFront'),plate=wanted.some(a=>a.slot==='coat'),badge=plate&&['watch','copper'].includes(value.badge);
  if(!foreground.length&&!badge)return headed;
  const key='front:'+meta.id+':'+revision+':'+choice+':'+JSON.stringify(value),old=cache.get(key);if(old?.source===headed.atlasImage)return old.meta;
  const c=canvas(meta.cellWidth*meta.cols,meta.cellHeight*meta.rows),g=c.getContext('2d');g.drawImage(headed.atlasImage,0,0);
  for(const slot of ['headFront','helmet']){const part=foreground.find(a=>a.slot===slot);if(part)g.drawImage(touchLayer(part.asset.file),0,0)}
  if(badge){const p=modular[meta.id];for(const pose of p.positions){const [x,y,w,h]=pose.torso,bw=Math.max(2.5,Math.min(6,w*.16)),ox=pose.frame%meta.cols*meta.cellWidth,oy=Math.floor(pose.frame/meta.cols)*meta.cellHeight;g.save();g.translate(ox+x+w*.61,oy+y+h*.76);g.fillStyle='#492b19';g.fillRect(-.5,-.5,bw+1,bw+1);g.fillStyle=value.badge==='copper'?'#c7834e':'#d3b069';g.beginPath();g.moveTo(0,0);g.lineTo(bw,0);g.lineTo(bw,bw*.62);g.lineTo(bw*.5,bw);g.lineTo(0,bw*.62);g.closePath();g.fill();g.restore()}}
  return remember(key,headed.atlasImage,c,{...headed,atlasImage:c});
 }
 return Object.freeze({version:'2.0',preferenceKey,rigs,slots,definitions,defaults,supports,choices,availableSlots,normalize,equal,selected,save,validateLayer,register,configureFitted,configureModular,modularFit,ensure,layersReady,fits,dress,compose,clear,report:()=>({builds,entries:cache.size,decodedBytes:bytes,maxDecodedBytes,registeredLayers:layers.size,fittedBodies:Object.keys(fitted).length,modularBodies:Object.keys(modular).length,layerImages:modularImages.size,layerDecodedBytes:modularBytes,maxLayerBytes,pending:modularPending.size,layerErrors:[...modularErrors].map(([file,message])=>({file,message})),errors:failed.size})});
});

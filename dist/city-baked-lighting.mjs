import {createSceneryIndex} from './city-scenery-index.mjs?v=p21-b407-s039-reuse';
import {watchPanePoint,drawWatchPanes} from './city-window-pane-city.mjs?v=p21-b407-s039-reuse';
import {lightRegistration} from './city-light-registration.mjs?v=p21-b407-s039-reuse';
import {LAMP_MOODS} from './city-light-mood.mjs?v=p21-b407-s039-reuse';

// A carried candle lights nearby detail without washing out the night painting.
const PLAYER_LANTERN_LIGHT=Object.freeze({ground:.28,facades:.10,halo:.22,core:.45});

// Night bakes have only21 quantised levels. Reuse their exact byte mappings
// instead of multiplying/rounding every RGB channel on every fallback frame.
const NIGHT_RGB=new Map();
function nightRGB(level){
 if(NIGHT_RGB.has(level))return NIGHT_RGB.get(level);
 const tables=[24,41,67].map(channel=>{const gain=1+(channel/255-1)*.78*level;
  return Uint8Array.from({length:256},(_,value)=>Math.round(value*gain));});
 NIGHT_RGB.set(level,tables);return tables;
}

// Static night art and window emissions are baked at the actual display density.
// Normal depth sorting then occludes lights naturally, just like the source art.
export function createBakedLighting({createCanvas=()=>document.createElement('canvas'),anchors=null,maxCacheMiB=192,maxDensity=Infinity,staticGroundPools=false}={}){
 const registrations=new WeakMap(),cache=new Map(),fallbackCaches=new Map(),stamps=new Map(),reflections=new Map(),limit=maxCacheMiB*1048576;
 let fallbackBytes=0,fallbackCacheHits=0,fallbackCacheStores=0;
 let reflectionBytes=0,reflectionHits=0,reflectionBakes=0;let night=0,density=1,bytes=0,hits=0,bakes=0,evictions=0,sceneCoverage=null,lights=[],lantern=null,receiver=null,rg=null,facades=0,frameBakes=0,peakFrameBakes=0,viewWidth=0,viewHeight=0,viewZoom=1,viewCamera={x:0,y:0};
 const localPairs=new Map(),localPairBudget=Math.min(8*1048576,limit);
 let localPairBytes=0,localPairEvictions=0;
 function dropLocalPair(o,entry){
  entry.image.width=entry.image.height=1;
  localPairBytes-=entry.bytes;
  localPairs.delete(o);
  localPairEvictions++;
 }
 function pruneLocalPairs(objects){
  if(localPairBytes<=localPairBudget&&night)return;
  const required=new Set();
  if(night)for(const o of objects){if(o.roofHidden){required.add(o);required.add(o.roofHidden);}}
  // Keep the visible pair alive for the whole frame. Once a roof leaves
  // view, the night-baked full and hidden surfaces are reclaimable.
  for(const [o,entry] of localPairs){
   if(!required.has(o))dropLocalPair(o,entry);
   if(night&&localPairBytes<=localPairBudget)break;
  }
 }
 let playerVisibility=null,panningTiles=false,fixedPanningTiles=false;
 let viewClip=null,visibleScenery=new Set(),admissionDeferrals=0;
 let poolIndex=null,poolCandidates=0;
 let poolScene=null,poolRevision=0,poolCanvas=null,poolContext=null,poolBox=null,poolKey=null,poolBuilds=0,poolReuses=0,poolDraws=0,frameRebakes=0,deferredRebakes=0;
 let fallbackCanvas=null,fallbackContext=null,fallbackNightDraws=0,fallbackNightTiles=0,fallbackNightPixels=0;
 const reg=o=>{if(!registrations.has(o))registrations.set(o,lightRegistration(o,anchors));return registrations.get(o);};
 const point=(o,p)=>({x:o.bounds[0]+p.x*o.scale,y:o.bounds[1]+p.y*o.scale});
 // Opt-in static receivers rebuild this index through registerScene. Generic
 // callers retain live positions; no additional image buffers are allocated.
 function poolItems(objects){return objects.flatMap(o=>!o.im||!o.scale?[]:reg(o).points.filter(p=>Number.isFinite(p.gx)&&Number.isFinite(p.gy)).map(p=>({o,p,opacity:1,mood:LAMP_MOODS[o.lampMood]||LAMP_MOODS.civic})));}
 function poolBounds({o,p,mood}){const lamp=o.sceneryKind==='street-lamp',height=Math.max(0,p.gy-p.y),r=(lamp?mood.radius*.65:Math.max(42,68-height*.1))*o.scale,x=o.bounds[0]+p.gx*o.scale,y=o.bounds[1]+p.gy*o.scale;return[x-r,y-r*.5,r*2,r];}
 function stamp(colors){const key=colors.join('|');if(stamps.has(key))return stamps.get(key);const c=createCanvas();c.width=c.height=256;const g=c.getContext('2d'),f=g.createRadialGradient(128,128,0,128,128,128);f.addColorStop(0,colors[0]);f.addColorStop(.3,colors[1]);f.addColorStop(1,colors[2]);g.fillStyle=f;g.fillRect(0,0,256,256);stamps.set(key,c);return c;}
 function glow(g,x,y,r,alpha,flat=1,colors=LAMP_MOODS.civic.colors){g.save();g.translate(x,y);g.scale(1,flat);g.globalAlpha=alpha;g.drawImage(stamp(colors),-r,-r,r*2,r*2);g.restore();}
 function source(g,o){if(o.paint)o.paint(g);else g.drawImage(o.im,o.bounds[0],o.bounds[1],o.im.width*o.scale,o.im.height*o.scale);}
 function paintNightSource(g,o,w,h,textureNight){
  source(g,o);
  const pixels=g.getImageData(0,0,w,h),rgba=pixels.data,[red,green,blue]=nightRGB(textureNight);
  for(let i=0;i<rgba.length;i+=4){rgba[i]=red[rgba[i]];rgba[i+1]=green[rgba[i+1]];rgba[i+2]=blue[rgba[i+2]];}
  g.save();g.setTransform(1,0,0,1,0,0);g.putImageData(pixels,0,0);g.restore();g.globalCompositeOperation='screen';
  const mood=LAMP_MOODS[o.lampMood]||LAMP_MOODS.civic;
  for(const p of reg(o).points){if(watchPanePoint(o,p))continue;const q=point(o,p),gain=o.sceneryKind==='street-lamp'?mood.intensity:1;glow(g,q.x,q.y,Math.max(8,24*o.scale),.12*textureNight*gain,1,mood.colors);if(!o.nightEmission)glow(g,q.x,q.y,Math.max(5,12*o.scale),.65*textureNight*gain,1,mood.colors);}
  drawWatchPanes(g,o,textureNight);
  if(o.nightEmission){g.save();g.globalAlpha=textureNight;g.drawImage(o.nightEmission,...o.bounds);g.restore();}
 }
 function paintEntry(g,entry,opacity,paintBaked){
  if(paintBaked){paintBaked(g,entry.c,entry.box,opacity);return;}
  g.save();g.globalAlpha=opacity;g.drawImage(entry.c,...entry.box);g.restore();
 }
 function discardFallback(o){const entry=fallbackCaches.get(o);if(!entry)return;for(const tile of entry.tiles.values())tile.c.width=tile.c.height=1;fallbackBytes-=entry.bytes;fallbackCaches.delete(o);}
 function reclaimOffscreen(size,protectedObject=null){
  for(const [o,entry]of fallbackCaches){if(bytes+fallbackBytes+size<=limit)break;if(o!==protectedObject&&!visibleScenery.has(o))discardFallback(o);}
 }
 function paintNightFallback(g,o,opacity,paintBaked){
  fallbackNightDraws++;
  const textureNight=Math.round(night*20)/20,key=density+':'+textureNight,b=o.bounds,pad=reg(o).points.length?Math.ceil(43*o.scale):0;
  const base=[b[0]-pad,b[1]-pad,b[2]+pad*2,b[3]+pad*2],fullW=Math.max(1,Math.ceil(base[2]*density)),fullH=Math.max(1,Math.ceil(base[3]*density)),sx=fullW/base[2],sy=fullH/base[3];
  const clip=viewClip||[base[0],base[1],base[0]+base[2],base[1]+base[3]];
  const x0=Math.max(0,Math.floor((clip[0]-base[0])*sx)),y0=Math.max(0,Math.floor((clip[1]-base[1])*sy)),x1=Math.min(fullW,Math.ceil((clip[2]-base[0])*sx)),y1=Math.min(fullH,Math.ceil((clip[3]-base[1])*sy));
  if(x1<=x0||y1<=y0)return;
  let regions=[[x0,y0,x1,y1]];
  const old=cache.get(o);
  if(old?.key===key){
   // Keep the valid portion of a cropped night texture. A pan only needs the
   // newly exposed strips, rather than recolouring the whole building again.
   paintEntry(g,old,opacity,paintBaked);
   const l=Math.round((old.box[0]-base[0])*sx),t=Math.round((old.box[1]-base[1])*sy),r=Math.round((old.box[0]+old.box[2]-base[0])*sx),d=Math.round((old.box[1]+old.box[3]-base[1])*sy),ml=Math.max(x0,l),mr=Math.min(x1,r);
   regions=[[x0,y0,Math.min(x1,l),y1],[Math.max(x0,r),y0,x1,y1],[ml,y0,mr,Math.min(y1,t)],[ml,Math.max(y0,d),mr,y1]];
  }
  let retained=fallbackCaches.get(o);
  const tiles=new Map();
  function offer(x,y,w,h,clip){
   const tileKey=[key,x,y,w,h].join(':');
   let tile=tiles.get(tileKey);
   if(!tile){tile={px:x,py:y,w,h,key:tileKey,clips:[]};tiles.set(tileKey,tile);}
   tile.clips.push(clip);
  }
  // If the resident primary textures leave too little room to reuse tiles,
  // keep the original tightly cropped fallback instead of painting extra pixels.
  const uncovered=regions.reduce((sum,[l,t,r,d])=>sum+Math.max(0,r-l)*Math.max(0,d-t),0);
  const canReuseFixed=fixedPanningTiles&&!paintBaked&&uncovered*4<=limit-bytes;
  for(const [l,t,r,d]of regions){
   if(l>=r||t>=d)continue;
   if(canReuseFixed){
    if(fullW*fullH<=80*80*4&&Math.max(fullW,fullH)<=240&&(fullW+4)*(fullH+4)*4<=limit-bytes){
     offer(0,0,fullW,fullH,[l,t,r,d]);continue;
    }
    // Anchor the raster to the facade, not the moving viewport. Only the
    // destination clip follows the camera; pixels already tinted stay valid.
    const span=80;
    for(let y=Math.floor(t/span)*span;y<d;y+=span)for(let x=Math.floor(l/span)*span;x<r;x+=span){
     const w=Math.min(span,fullW-x),h=Math.min(span,fullH-y);
     offer(x,y,w,h,[Math.max(l,x),Math.max(t,y),Math.min(r,x+w),Math.min(d,y+h)]);
    }
   }else{
    const span=panningTiles?448:508,padTo=panningTiles?32:1;
    for(let y=t;y<d;y+=span)for(let x=l;x<r;x+=span){
     const right=Math.min(r,x+span),bottom=Math.min(d,y+span);
     let tx=Math.floor(x/padTo)*padTo,ty=Math.floor(y/padTo)*padTo;
     let w=Math.min(fullW,Math.ceil(right/padTo)*padTo)-tx,h=Math.min(fullH,Math.ceil(bottom/padTo)*padTo)-ty;
     const id=[key,tx,ty,w,h].join(':');
     if(panningTiles&&!retained?.tiles.has(id))for(const old of retained?.tiles.values()||[]){
      if(old.key===key&&old.x<=x&&old.y<=y&&old.x+old.w>=right&&old.y+old.h>=bottom){
       ({x:tx,y:ty,w,h}=old);break;
      }
     }
     offer(tx,ty,w,h,[x,y,right,bottom]);
    }
   }
  }
  const wanted=new Set(tiles.keys());
  // Retain only this object's current clipped pieces. A pan, density or night
  // change cannot leave obsolete fallback surfaces charged to the working set.
  if(retained)for(const [id,tile]of retained.tiles)if(!wanted.has(id)){tile.c.width=tile.c.height=1;retained.tiles.delete(id);retained.bytes-=tile.bytes;fallbackBytes-=tile.bytes;}
  for(const {px,py,w,h,key:tileKey,clips}of tiles.values()){
   // A two-pixel gutter keeps interpolation from sampling transparent tile
   // edges at fractional device densities. Clip the output to its core only.
   const rw=w+4,rh=h+4;
   let tile=retained?.tiles.get(tileKey);
   if(tile)fallbackCacheHits++;
   else{
    if(!fallbackCanvas){fallbackCanvas=createCanvas();fallbackContext=fallbackCanvas.getContext('2d');}
    if(fallbackCanvas.width!==rw)fallbackCanvas.width=rw;if(fallbackCanvas.height!==rh)fallbackCanvas.height=rh;
    const fg=fallbackContext;fg.setTransform(1,0,0,1,0,0);fg.clearRect(0,0,rw,rh);fg.globalAlpha=1;fg.globalCompositeOperation='source-over';fg.setTransform(sx,0,0,sy,-base[0]*sx-px+2,-base[1]*sy-py+2);
    paintNightSource(fg,o,rw,rh,textureNight);fallbackNightPixels+=rw*rh;
    tile={key,x:px,y:py,w,h,c:fallbackCanvas,box:[base[0]+(px-2)/sx,base[1]+(py-2)/sy,rw/sx,rh/sy],bytes:rw*rh*4};
    reclaimOffscreen(tile.bytes,o);
    if(bytes+fallbackBytes+tile.bytes<=limit){
     if(!retained){retained={tiles:new Map(),bytes:0};fallbackCaches.set(o,retained);}
     retained.tiles.set(tileKey,tile);retained.bytes+=tile.bytes;fallbackBytes+=tile.bytes;fallbackCacheStores++;
     // Transfer the actual rasterised surface, without making another copy.
     fallbackCanvas=fallbackContext=null;
    }
   }
   const m=g.getTransform();
   g.save();g.setTransform(1,0,0,1,0,0);g.beginPath();
   for(const [l,t,r,d]of clips){
    const left=Math.round((base[0]+l/sx)*m.a+m.e),top=Math.round((base[1]+t/sy)*m.d+m.f),right=Math.round((base[0]+r/sx)*m.a+m.e),bottom=Math.round((base[1]+d/sy)*m.d+m.f);
    g.rect(left,top,right-left,bottom-top);
   }
   g.clip();g.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);
   paintEntry(g,tile,opacity,paintBaked);g.restore();fallbackNightTiles++;
  }
  if(retained&&!retained.tiles.size)fallbackCaches.delete(o);
 }
 function release(entry){entry.c.width=entry.c.height=1;if(entry.lit)entry.lit.width=entry.lit.height=1;bytes-=entry.bytes;}
 function baked(o){
  const textureNight=Math.round(night*20)/20,existing=cache.get(o),key=density+':'+textureNight;
  const points=reg(o).points,pad=points.length?Math.ceil(43*o.scale):0,b=o.bounds,box=[b[0]-pad,b[1]-pad,b[2]+2*pad,b[3]+2*pad];
  const fullW=Math.max(1,Math.ceil(box[2]*density)),fullH=Math.max(1,Math.ceil(box[3]*density)),sx=fullW/box[2],sy=fullH/box[3];
  // Keep the original bake pixel grid, but store only the source rectangle and
  // actual glow extents. Interior windows do not need a43px border on every side.
  let left=b[0],top=b[1],right=b[0]+b[2],bottom=b[1]+b[3];
  for(const p of points){const q=point(o,p),r=Math.max(12,42*o.scale,7,17*o.scale);left=Math.min(left,q.x-r);top=Math.min(top,q.y-r);right=Math.max(right,q.x+r);bottom=Math.max(bottom,q.y+r);}
  let x0=Math.max(0,Math.floor((left-box[0])*sx)-2),y0=Math.max(0,Math.floor((top-box[1])*sy)-2),x1=Math.min(fullW,Math.ceil((right-box[0])*sx)+2),y1=Math.min(fullH,Math.ceil((bottom-box[1])*sy)+2);
  const tight=[box[0]+x0/sx,box[1]+y0/sy,box[0]+x1/sx,box[1]+y1/sy];
  const need=viewClip?[Math.max(tight[0],viewClip[0]),Math.max(tight[1],viewClip[1]),Math.min(tight[2],viewClip[2]),Math.min(tight[3],viewClip[3])]:tight;
  const covered=existing&&existing.box[0]<=need[0]+1e-6&&existing.box[1]<=need[1]+1e-6&&existing.box[0]+existing.box[2]>=need[2]-1e-6&&existing.box[1]+existing.box[3]>=need[3]-1e-6;
  if(existing?.key===key&&covered){discardFallback(o);hits++;cache.delete(o);cache.set(o,existing);return existing;}
  if(existing&&covered&&existing.density===density&&Math.abs(existing.night-textureNight)<=.051&&frameRebakes>=1){deferredRebakes++;hits++;cache.delete(o);cache.set(o,existing);return existing;}
  // Bound fresh AND cropped/retinted cache entries. Camera pans, density
  // changes and clock jumps must not recolour every resident facade at once.
  // A covered old entry remains drawable; otherwise use the full source
  // painting until this entry receives its turn, never a cropped-away facade.
  if(frameBakes>=1){deferredRebakes++;return null;}

  // Reuse a modest pan margin, not off-screen portions of large facades.
  if(viewClip){const margin=96/viewZoom;x0=Math.max(x0,Math.floor((viewClip[0]-margin-box[0])*sx));y0=Math.max(y0,Math.floor((viewClip[1]-margin-box[1])*sy));x1=Math.min(x1,Math.ceil((viewClip[2]+margin-box[0])*sx));y1=Math.min(y1,Math.ceil((viewClip[3]+margin-box[1])*sy));}
  if(x1<=x0||y1<=y0)return null;
  const originX=box[0],originY=box[1],w=x1-x0,h=y1-y0,size=w*h*4;box[0]+=x0/sx;box[1]+=y0/sy;box[2]=w/sx;box[3]=h/sy;
  // Giant overview assets retain their source renderer rather than allocating
  // an unbounded texture. City artwork itself is never resized or overwritten.
  if(size>limit)return null;
  // Do not cycle visible facades through a cache smaller than the viewport.
  // Keep its resident working set stable; source painting remains the existing
  // fallback for excess facades. Off-screen entries are still reclaimable.
  // Primary admission keeps its original order and working set. Fallbacks
  // consume spare capacity and yield first, including visible tiles if needed.
  let available=limit-bytes+(existing?.bytes||0);const victims=[];
  for(const [object,entry]of cache){if(available>=size)break;if(object!==o&&!visibleScenery.has(object)){victims.push(object);available+=entry.bytes;}}
  if(available<size){admissionDeferrals++;return existing&&covered?existing:null;}
  discardFallback(o);
  if(existing){frameRebakes++;release(existing);cache.delete(o);}
  for(const object of victims){release(cache.get(object));cache.delete(object);evictions++;}
  reclaimOffscreen(size);for(const object of fallbackCaches.keys()){if(bytes+fallbackBytes+size<=limit)break;discardFallback(object);}
  const c=createCanvas();c.width=w;c.height=h;const g=c.getContext('2d');g.setTransform(sx,0,0,sy,-originX*sx-x0,-originY*sy-y0);
  // Apply the night colour once to RGB only. Alpha is retained exactly,
  // including antialiased edges and the holes between roofs and chimneys.
  paintNightSource(g,o,w,h,textureNight);
  const entry={c,box,key,density,night:textureNight,fullBytes:fullW*fullH*4,bytes:size};cache.set(o,entry);bytes+=size;bakes++;frameBakes++;peakFrameBakes=Math.max(peakFrameBakes,frameBakes);return entry;
 }
 function reflection(g,o,opacity){
  if(!lantern||o.sceneryKind==='street-lamp')return;
  const b=o.bounds,x=Math.round(lantern.x/6)*6,y=Math.round((lantern.y-25)/6)*6,r=300,left=Math.max(b[0],x-r),top=Math.max(b[1],y-r),right=Math.min(b[0]+b[2],x+r),bottom=Math.min(b[1]+b[3],y+r);
  if(right<=left||bottom<=top)return;
  const key=x+':'+y+':'+density,old=reflections.get(o);
  if(old?.key===key){reflectionHits++;reflections.delete(o);reflections.set(o,old);facades++;return old;}
  if(old){reflectionBytes-=old.bytes;old.c.width=old.c.height=1;reflections.delete(o);}
  if(!receiver){receiver=createCanvas();receiver.width=receiver.height=256;rg=receiver.getContext('2d');}
  const w=right-left,h=bottom-top,ratio=Math.min(density,256/w,256/h),rw=Math.max(1,Math.floor(w*ratio)),rh=Math.max(1,Math.floor(h*ratio));
  rg.setTransform(1,0,0,1,0,0);rg.clearRect(0,0,256,256);rg.save();rg.setTransform(rw/w,0,0,rh/h,-left*rw/w,-top*rh/h);rg.globalCompositeOperation='source-over';rg.globalAlpha=1;source(rg,o);rg.globalCompositeOperation='source-atop';rg.globalAlpha=.15;rg.fillStyle='#ffe4af';rg.fillRect(left,top,w,h);rg.globalAlpha=1;rg.globalCompositeOperation='destination-in';let mask=stamps.get('lantern-falloff');if(!mask){mask=createCanvas();mask.width=mask.height=256;const mg=mask.getContext('2d'),f=mg.createRadialGradient(128,128,0,128,128,128);f.addColorStop(0,'rgba(255,255,255,.95)');f.addColorStop(.4,'rgba(255,255,255,.7)');f.addColorStop(1,'rgba(255,255,255,0)');mg.fillStyle=f;mg.fillRect(0,0,256,256);stamps.set('lantern-falloff',mask);}rg.drawImage(mask,x-r,y-r,r*2,r*2);rg.restore();
  const c=createCanvas();c.width=rw;c.height=rh;c.getContext('2d').drawImage(receiver,0,0,rw,rh,0,0,rw,rh);const size=rw*rh*4;
  while(reflectionBytes+size>8*1048576&&reflections.size){const first=reflections.keys().next().value,entry=reflections.get(first);reflectionBytes-=entry.bytes;entry.c.width=entry.c.height=1;reflections.delete(first);}
  reflections.set(o,{key,c,box:[left,top,w,h],bytes:size});reflectionBytes+=size;reflectionBakes++;
  facades++;return reflections.get(o);
 }
 return {
  registerScene(objects){poolScene=objects;poolIndex=staticGroundPools?createSceneryIndex(poolItems(objects).map(item=>({...item,bounds:poolBounds(item)}))):null;poolRevision++;poolKey=null;const counts={total:0,lit:0,unlit:0,excluded:0,unregistered:[],sourceSizeChanged:[]};for(const o of objects){const r=reg(o);if(r.status==='excluded'){counts.excluded++;continue;}counts.total++;if(r.status==='lit')counts.lit++;else if(r.status==='unlit')counts.unlit++;else if(r.status==='source-size-changed')counts.sourceSizeChanged.push(r.key);else counts.unregistered.push(r.key);}sceneCoverage=counts;return counts;},
  beginFrame(darkness,view){panningTiles=!!view.reusePanningTiles;fixedPanningTiles=!!view.fixedPanningTiles;playerVisibility=view.playerSight||null;visibleScenery=new Set(view.objects||[]);night=Math.round(Math.max(0,Math.min(1,darkness))*100)/100;pruneLocalPairs(view.objects||[]);density=Math.min((view.pixelRatio||1)*(view.zoom||1),maxDensity);viewWidth=view.width||0;viewHeight=view.height||0;viewZoom=view.zoom||1;viewCamera=view.camera||{x:0,y:0};viewClip=view.camera&&viewWidth&&viewHeight?[viewCamera.x-viewWidth/(2*viewZoom)-2/viewZoom,viewCamera.y-viewHeight/(2*viewZoom)-2/viewZoom,viewCamera.x+viewWidth/(2*viewZoom)+2/viewZoom,viewCamera.y+viewHeight/(2*viewZoom)+2/viewZoom]:null;if(viewClip&&playerVisibility){const b=playerVisibility.bounds;viewClip=[Math.max(viewClip[0],b[0]),Math.max(viewClip[1],b[1]),Math.min(viewClip[2],b[2]),Math.min(viewClip[3],b[3])];}frameBakes=facades=frameRebakes=fallbackNightDraws=fallbackNightTiles=fallbackNightPixels=0;lantern=night&&view.playerLight?{...view.playerLight,radius:300}:null;lights=[];if(!night||(poolIndex&&viewWidth&&viewHeight))return;for(const o of view.objects||[]){if(o.person||!o.im||!o.scale)continue;const opacity=view.opacities?.get(o.id)??1,mood=LAMP_MOODS[o.lampMood]||LAMP_MOODS.civic;for(const p of reg(o).points){if(!Number.isFinite(p.gx)||!Number.isFinite(p.gy))continue;lights.push({o,p,opacity,mood});}}},
  drawGround(g){
   if(!night)return;g.save();g.globalCompositeOperation='screen';
   if(viewWidth&&viewHeight){
    const z=viewZoom,c=playerVisibility?.center||viewCamera,pw=playerVisibility?Math.min(viewWidth,playerVisibility.radiusPixels*2):viewWidth,ph=playerVisibility?Math.min(viewHeight,playerVisibility.radiusPixels*2):viewHeight,viewport=[c.x-pw/(2*z),c.y-ph/(2*z),c.x+pw/(2*z),c.y+ph/(2*z)],key=[pw,ph,z,night,poolRevision].join(':');
    const fits=poolBox&&poolKey===key&&viewport[0]>=poolBox[0]&&viewport[1]>=poolBox[1]&&viewport[2]<=poolBox[0]+poolBox[2]&&viewport[3]<=poolBox[1]+poolBox[3];
    if(!fits){
     const margin=playerVisibility?96:192,w=pw+2*margin,h=ph+2*margin,ratio=Math.min(.5,Math.sqrt(2097152/(w*h)));poolBox=[c.x-w/(2*z),c.y-h/(2*z),w/z,h/z];poolKey=key;
     if(!poolCanvas){poolCanvas=createCanvas();poolContext=poolCanvas.getContext('2d');}poolCanvas.width=Math.max(1,Math.floor(w*ratio));poolCanvas.height=Math.max(1,Math.floor(h*ratio));const pg=poolContext;
     pg.setTransform(poolCanvas.width/poolBox[2],0,0,poolCanvas.height/poolBox[3],-poolBox[0]*poolCanvas.width/poolBox[2],-poolBox[1]*poolCanvas.height/poolBox[3]);pg.globalCompositeOperation='screen';poolDraws=0;
     const items=poolIndex?poolIndex.query([poolBox[0],poolBox[1],poolBox[0]+poolBox[2],poolBox[1]+poolBox[3]]):poolScene?poolItems(poolScene):lights;poolCandidates=items.length;
     for(const {o,p,opacity,mood} of items){const lamp=o.sceneryKind==='street-lamp',height=Math.max(0,p.gy-p.y),r=(lamp?mood.radius*.65:Math.max(42,68-height*.1))*o.scale,strength=lamp ? .45*mood.intensity : .12*Math.max(.5,1-height/320),x=o.bounds[0]+p.gx*o.scale,y=o.bounds[1]+p.gy*o.scale;
      if(x+r<poolBox[0]||x-r>poolBox[0]+poolBox[2]||y+r*.5<poolBox[1]||y-r*.5>poolBox[1]+poolBox[3])continue;
      glow(pg,x,y,r,strength*opacity*night,.5,mood.colors);poolDraws++;
     }poolBuilds++;
    }else poolReuses++;
    if(poolDraws)g.drawImage(poolCanvas,...poolBox);
   }else for(const {o,p,opacity,mood} of lights){const lamp=o.sceneryKind==='street-lamp',height=Math.max(0,p.gy-p.y),r=(lamp?mood.radius*.65:Math.max(42,68-height*.1))*o.scale,strength=lamp ? .45*mood.intensity : .12*Math.max(.5,1-height/320);glow(g,o.bounds[0]+p.gx*o.scale,o.bounds[1]+p.gy*o.scale,r,strength*opacity*night,.5,mood.colors);}
   if(lantern)glow(g,lantern.x,lantern.y-3,300,PLAYER_LANTERN_LIGHT.ground*night,1,['rgba(255,228,169,1)','rgba(255,198,107,.72)','rgba(255,175,69,0)']);g.restore();
  },
  stableScenery(o){
   if(!night)return {image:o.im,box:o.bounds};
   const textureNight=Math.round(night*20)/20, old=localPairs.get(o);
   if(old?.textureNight===textureNight)return old;
   // The canvas uses world units; source pixel dimensions omit placement scale.
   const pad=43,w=Math.ceil(o.bounds[2])+pad*2,h=Math.ceil(o.bounds[3])+pad*2;
   const box=[o.bounds[0]-pad,o.bounds[1]-pad,w,h];
   const image=old?.image||createCanvas();
   image.width=w;image.height=h;
   const g=image.getContext('2d');g.translate(-box[0],-box[1]);
   paintNightSource(g,o,w,h,textureNight);
   const entry={image,box,textureNight,bytes:w*h*4};
   localPairBytes+=entry.bytes-(old?.bytes||0);localPairs.set(o,entry);return entry;
  },
  drawScenery(g,o,opacity,paint,paintBaked){
   if(!night||!o.im){paint();return;}const entry=baked(o);if(!entry){paintNightFallback(g,o,opacity,paintBaked);return;}
   paintEntry(g,entry,opacity,paintBaked);
  },
  drawActor(g,paint){paint(g);},
  drawPlayerLantern(g){if(!lantern)return;const x=lantern.x+12,y=lantern.y-25;g.save();g.strokeStyle='#36251a';g.lineWidth=1.5;g.beginPath();g.moveTo(x-10,y-8);g.lineTo(x,y-6);g.stroke();g.beginPath();g.arc(x,y-6,3,Math.PI,Math.PI*2);g.stroke();g.fillStyle='#a77e38';g.fillRect(x-4,y-4,8,11);g.fillStyle='#d4aa66';g.fillRect(x-2.5,y-2,5,7);g.strokeStyle='#49321c';g.strokeRect(x-4,y-4,8,11);g.restore();glow(g,x,y+1,16,PLAYER_LANTERN_LIGHT.halo);glow(g,x,y+1,5,PLAYER_LANTERN_LIGHT.core);},
  composite(g){if(!lantern||!viewWidth||!viewHeight)return;const x=(lantern.x-viewCamera.x)*viewZoom+viewWidth/2,y=(lantern.y-25-viewCamera.y)*viewZoom+viewHeight/2;g.save();g.globalCompositeOperation='screen';glow(g,x,y,Math.max(120,230*viewZoom),PLAYER_LANTERN_LIGHT.facades*night,1,['rgba(255,228,169,.9)','rgba(255,198,107,.42)','rgba(255,175,69,0)']);g.restore();},
  dispose(){poolIndex=poolScene=null;for(const {image} of localPairs.values())image.width=image.height=1;localPairs.clear();localPairBytes=0;visibleScenery.clear();for(const o of fallbackCaches.keys())discardFallback(o);if(fallbackCanvas)fallbackCanvas.width=fallbackCanvas.height=1;fallbackCanvas=fallbackContext=null;if(poolCanvas)poolCanvas.width=poolCanvas.height=1;poolCanvas=poolContext=poolBox=poolKey=null;for(const entry of reflections.values())entry.c.width=entry.c.height=1;reflections.clear();reflectionBytes=0;for(const entry of cache.values())release(entry);cache.clear();for(const c of stamps.values())c.width=c.height=1;stamps.clear();if(receiver)receiver.width=receiver.height=1;receiver=rg=null;},
  report:()=>({version:25,panningTiles,fixedPanningTiles,fallbackNightDraws,fallbackNightTiles,fallbackNightPixels,fallbackBufferMiB:fallbackCanvas?fallbackCanvas.width*fallbackCanvas.height*4/1048576:0,fallbackCache:{MiB:fallbackBytes/1048576,objects:fallbackCaches.size,tiles:[...fallbackCaches.values()].reduce((n,e)=>n+e.tiles.size,0),hits:fallbackCacheHits,stores:fallbackCacheStores,sharesPrimaryBudget:true},maxBakesPerFrame:1,peakFrameBakes,stableVisibleWorkingSet:true,admissionDeferrals,trimmedCacheBounds:true,viewportCacheBounds:true,untrimmedCacheMiB:[...cache.values()].reduce((n,e)=>n+e.fullBytes,0)/1048576,bakedNightStep:.05,staticGroundPools:{indexed:!!poolIndex,candidates:poolCandidates,builds:poolBuilds,reuses:poolReuses,poolsInCache:poolDraws,MiB:poolCanvas?poolCanvas.width*poolCanvas.height*4/1048576:0,maxMiB:8},frameRebakes,deferredRebakes,reflectionCache:{MiB:0,maxMiB:0,hits:0,bakes:0},bakedStaticLighting:true,fullDisplayResolution:maxDensity===Infinity,maxDensity:Number.isFinite(maxDensity)?maxDensity:null,density,night,cacheMiB:(bytes+fallbackBytes)/1048576,primaryCacheMiB:bytes/1048576,maxCacheMiB,cacheEntries:cache.size,hits,bakes,frameBakes,evictions,staticLampFlicker:false,dynamicPlayerLantern:true,playerLanternMode:'single screen-space building-and-ground pass',playerLantern:lantern?{...lantern,active:true,carried:true,strength:PLAYER_LANTERN_LIGHT}:null,playerLanternFacades:'screen-space',groundPools:poolIndex&&viewWidth&&viewHeight?poolDraws:lights.length,sceneCoverage,glowStampMiB:stamps.size*.25,localRevealCache:{MiB:localPairBytes/1048576,targetMiB:localPairBudget/1048576,entries:localPairs.size,evictions:localPairEvictions},facadeReceiverMiB:0,physicalDeviceVerified:false})
 };
}

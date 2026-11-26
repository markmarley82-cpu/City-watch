// Keep authored source registration while retaining a smaller decoded copy on
// memory-constrained phones. World size, anchors and collision stay unchanged.
export function createCityImageDensity({load,loadSource=load,enabled=false,factor=.5,createCanvas=()=>document.createElement('canvas'),release=()=>{},now=()=>Date.now()}={}){
 const cache=new Map(),pending=new Map(),errors=new Map(),retries=new Map(),streamed=new Map();let sourcePixels=0,residentPixels=0,streamedPixels=0,reduced=0,deferred=0,loadedDeferred=0,catalogPixels=0,evicted=0;
 function reducedCanvas(path,sourceWidth,sourceHeight,ready){
  const width=Math.max(1,Math.round(sourceWidth*factor)),height=Math.max(1,Math.round(sourceHeight*factor)),canvas=createCanvas();
  canvas.width=width;canvas.height=height;
  Object.defineProperties(canvas,{cwDensity:{value:width/sourceWidth},cwSourceWidth:{value:sourceWidth},cwSourceHeight:{value:sourceHeight},cwPath:{value:path},cwReady:{value:ready,writable:true},cwDeferred:{value:!ready}});
  return canvas;
 }
 function remember(path,canvas){if(canvas.cwReady)residentPixels+=canvas.width*canvas.height;cache.set(path,canvas);return canvas;}
 async function image(path){
  if(!enabled)return load(path);
  if(cache.has(path))return ensure(path);
  if(pending.has(path))return pending.get(path);
  const work=(async()=>{const source=await loadSource(path);
   try{
    const sourceWidth=source.cwFullWidth||source.naturalWidth||source.width,sourceHeight=source.cwFullHeight||source.naturalHeight||source.height;
    if(!(sourceWidth>0&&sourceHeight>0))throw Error('City painting has no decoded dimensions: '+path);
    const canvas=reducedCanvas(path,sourceWidth,sourceHeight,true);
    canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
    sourcePixels+=sourceWidth*sourceHeight;reduced++;return remember(path,canvas);
   }finally{release(path,source);}})();
  pending.set(path,work);try{return await work;}finally{pending.delete(path);}
 }
 async function deferredImage(path,dimensions){
  if(!enabled)return load(path);
  if(cache.has(path))return cache.get(path);
  if(pending.has(path))return pending.get(path);
  const sourceWidth=Number(dimensions?.[0]),sourceHeight=Number(dimensions?.[1]);
  if(!(sourceWidth>0&&sourceHeight>0))return image(path);
  const canvas=remember(path,reducedCanvas(path,sourceWidth,sourceHeight,false));deferred++;catalogPixels+=sourceWidth*sourceHeight;return canvas;
 }
 async function ensure(path){
  const canvas=cache.get(path);if(!canvas||canvas.cwReady!==false)return canvas;
  if(pending.has(path))return pending.get(path);
  const work=(async()=>{let source=null;try{source=await loadSource(path);const sourceWidth=source.cwFullWidth||source.naturalWidth||source.width,sourceHeight=source.cwFullHeight||source.naturalHeight||source.height;
    if(sourceWidth!==canvas.cwSourceWidth||sourceHeight!==canvas.cwSourceHeight)throw Error('Streamed city painting dimensions differ: '+path);
    const width=Math.max(1,Math.round(sourceWidth*factor)),height=Math.max(1,Math.round(sourceHeight*factor));
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
    canvas.getContext('2d').drawImage(source,0,0,width,height);
    canvas.cwReady=true;residentPixels+=width*height;streamedPixels+=width*height;streamed.set(path,now());
    sourcePixels+=sourceWidth*sourceHeight;reduced++;loadedDeferred++;errors.delete(path);retries.delete(path);return canvas;
   }catch(error){errors.set(path,String(error?.message||error));const attempts=(retries.get(path)?.attempts||0)+1;retries.set(path,{attempts,at:now()+Math.min(60000,5000*2**Math.min(attempts-1,4))});throw error;}finally{if(source)release(path,source);}})();
  pending.set(path,work);try{return await work;}finally{pending.delete(path);}
 }
 async function prefetch(objects,{required=false,maxPending=Infinity}={}){
  if(!enabled)return [];
  if(!required){
   const slots=Math.max(0,maxPending-pending.size);
   if(!slots)return [];
   const work=[];
   for(const object of objects){
    for(const image of [object?.im,object?.nightEmission]){
     const path=image?.cwPath;
     if(!path||cache.get(path)?.cwReady!==false||pending.has(path)||(retries.get(path)?.at||0)>now())continue;
     work.push(ensure(path));
     if(work.length>=slots)return Promise.allSettled(work);
    }
   }
   return Promise.allSettled(work);
  }
  const paths=[...new Set(objects.flatMap(o=>[o?.im?.cwPath,o?.nightEmission?.cwPath]).filter(path=>path&&cache.get(path)?.cwReady===false))];
  // A registered transparent canvas is geometry, not a delivered painting.
  // Retry only failed nearby sources once, then let the existing boot UI report
  // the real source error rather than accepting an incomplete first frame.
  const first=await Promise.allSettled(paths.map(ensure)),failed=paths.filter((path,index)=>first[index].status==='rejected');
  const second=await Promise.allSettled(failed.map(ensure)),failure=second.find(result=>result.status==='rejected');
  if(failure)throw Error('Required city painting could not load: '+String(failure.reason?.message||failure.reason),{cause:failure.reason});
  return first.map((result,index)=>result.status==='rejected'?{status:'fulfilled',value:cache.get(paths[index])}:result);
 }
 // Geometry and sprite identity remain installed. Only drop the decoded
 // backing surface of streamable art outside the protected camera buffer.
 function trim(objects,{maxMiB=32,maxIdleMs=45000,minIdleMs=5000}={}){
  if(!enabled)return 0;
  const protectedPaths=new Set(objects.flatMap(o=>[o?.im?.cwPath,o?.nightEmission?.cwPath])),t=now();
  for(const path of protectedPaths)if(streamed.has(path))streamed.set(path,t);
  const outside=[...streamed].filter(([path])=>!protectedPaths.has(path)&&!pending.has(path)).sort((a,b)=>a[1]-b[1]);
  const limit=maxMiB*1048576;let freed=0;
  for(const [path,seen] of outside){
   const idle=t-seen;
   if(idle<minIdleMs)break;
   if(idle<maxIdleMs&&streamedPixels*4<=limit)break;
   const canvas=cache.get(path),pixels=canvas.width*canvas.height;
   canvas.cwReady=false;canvas.width=canvas.height=1;streamed.delete(path);
   streamedPixels-=pixels;residentPixels-=pixels;evicted++;freed+=pixels*4;
  }
  return freed;
 }
 function sprite(row){const im=row[1],density=im?.cwDensity||1;if(density===1)return row;const copy=row.slice(),anchor=copy[3];copy[3]=[anchor[0]*density,anchor[1]*density];copy[4]=(copy[4]??1)/density;return copy;}
 function annotateCopy(source,target){const density=source?.cwDensity||1;if(density===1)return target;Object.defineProperties(target,{cwDensity:{value:density},cwSourceWidth:{value:source.cwSourceWidth||source.width/density},cwSourceHeight:{value:source.cwSourceHeight||source.height/density}});return target;}
 return Object.freeze({image,deferredImage,prefetch,trim,ready:im=>im?.cwReady!==false,sprite,annotateCopy,sourceSize:im=>[im?.cwSourceWidth||im?.width||0,im?.cwSourceHeight||im?.height||0],report:()=>({enabled,factor,reduced,deferred,loadedDeferred,waitingDeferred:deferred-streamed.size,streamedMiB:streamedPixels*4/1048576,streamedRetained:streamed.size,evicted,catalogMiB:catalogPixels*4/1048576,sourceMiB:sourcePixels*4/1048576,residentMiB:residentPixels*4/1048576,pending:pending.size,cached:cache.size,errors:[...errors],retries:[...retries].map(([path,retry])=>({path,attempts:retry.attempts,afterMs:Math.max(0,retry.at-now())}))})});
}

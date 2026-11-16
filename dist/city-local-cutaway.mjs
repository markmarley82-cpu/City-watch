// Feather only the actor-local window, after static lighting has been baked.
// Scratch surfaces are reused and only cover on-screen patches, never whole roofs.
const INNER_RADIUS=.68;
const TILE=128;
const FADE=[1,.84375,.5,.15625,0];
const INNER_RADIUS_SQUARED=INNER_RADIUS*INNER_RADIUS;
const surfaces=[],rasters=new Map();
const RASTER_LIMIT=768*1024;
let rasterBytes=0;

function buffer(index,w,h){
 let canvas=surfaces[index];
 if(!canvas){
  canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(TILE,TILE):globalThis.document?.createElement('canvas');
  if(!canvas)return null;
  canvas.width=canvas.height=TILE;
  surfaces[index]=canvas;
 }
 const g=canvas.getContext('2d');
 g.setTransform(1,0,0,1,0,0);
 g.globalCompositeOperation='source-over';
 g.globalAlpha=1;
 g.clearRect(0,0,w,h);
 return g;
}

export function localCutawayContains(mask,point){
 const nearestY=Math.max(mask.y,Math.min(mask.toY??mask.y,point.y));
 const dx=(point.x-mask.x)/mask.rx,dy=(point.y-nearestY)/mask.ry;
 return dx*dx+dy*dy<=1;
}

function maskPath(path,m){
 if(!(m.toY>m.y)){path.moveTo(m.x+m.rx,m.y);path.ellipse(m.x,m.y,m.rx,m.ry,0,0,Math.PI*2);return;}
 path.moveTo(m.x+m.rx,m.y);path.lineTo(m.x+m.rx,m.toY);
 path.ellipse(m.x,m.toY,m.rx,m.ry,0,0,Math.PI);path.lineTo(m.x-m.rx,m.y);
 path.ellipse(m.x,m.y,m.rx,m.ry,0,Math.PI,Math.PI*2);path.closePath();
}

function drawHard(g,draw,box,masks,opacity,insidePaint){
 g.save();
 for(const mask of masks){
  const outside=new Path2D();outside.rect(...box);maskPath(outside,mask);
  g.clip(outside,'evenodd');
 }
 g.globalAlpha=opacity;draw(g);g.restore();
 const sorted=[...masks].sort((a,b)=>a.opacity-b.opacity);
 for(let i=0;i<sorted.length;i++){
  g.save();const m=sorted[i],inside=new Path2D();
  maskPath(inside,m);g.clip(inside);
  for(const previous of sorted.slice(0,i)){
   const outside=new Path2D();outside.rect(...box);maskPath(outside,previous);g.clip(outside,'evenodd');
  }
  g.globalAlpha=Math.min(opacity,m.opacity);(insidePaint||draw)(g);g.restore();
 }
}

function localTiles(g,box,masks,t){
 const [x,y,w,h]=box, tiles=new Map();
 const left=Math.max(0,Math.floor(x*t.a+t.e)),top=Math.max(0,Math.floor(y*t.d+t.f));
 const right=Math.min(g.canvas.width,Math.ceil((x+w)*t.a+t.e)),bottom=Math.min(g.canvas.height,Math.ceil((y+h)*t.d+t.f));
 for(const mask of masks){
  const mx=mask.x*t.a+t.e,my=mask.y*t.d+t.f,my2=Math.max(mask.y,mask.toY??mask.y)*t.d+t.f,rx=mask.rx*t.a,ry=mask.ry*t.d;
  const l=Math.max(left,Math.floor(mx-rx)),r=Math.min(right,Math.ceil(mx+rx));
  const u=Math.max(top,Math.floor(my-ry)),b=Math.min(bottom,Math.ceil(my2+ry));
  if(l>=r||u>=b)continue;
  for(let j=Math.floor(u/TILE)*TILE;j<b;j+=TILE)for(let i=Math.floor(l/TILE)*TILE;i<r;i+=TILE){
   const key=j+':'+i;
   const x=Math.max(l,i),y=Math.max(u,j),right=Math.min(r,i+TILE),bottom=Math.min(b,j+TILE);
   let tile=tiles.get(key);
   if(!tile){tile={x,y,right,bottom,masks:[]};tiles.set(key,tile);}
   else{tile.x=Math.min(tile.x,x);tile.y=Math.min(tile.y,y);tile.right=Math.max(tile.right,right);tile.bottom=Math.max(tile.bottom,bottom);}
   tile.masks.push({mx,my,my2,rx,ry,opacity:mask.opacity});
  }
 }
 return [...tiles.values()].map(({x,y,right,bottom,masks})=>({x,y,w:right-x,h:bottom-y,masks}));
}

// Day, night, and cutaway layers can use the same on-screen feather. Retain
// only its exact alpha weights (never building pixels or a quantized position).
function mixedRaster(mask,weighted,x,y,w,h,masks,opacity){
 const key=[x,y,w,h,opacity,...masks.flatMap(m=>[m.mx,m.my,m.my2,m.rx,m.ry,m.opacity])].join(':');
 const known=rasters.get(key);
 if(known){rasters.delete(key);rasters.set(key,known);return known;}
 const coverage=mask.createImageData(w,h),weight=weighted.createImageData(w,h);
 const axes=masks.map(m=>({
  dx2:Float64Array.from({length:w},(_,px)=>((x+px+.5-m.mx)/m.rx)**2),
  dy2:Float64Array.from({length:h},(_,py)=>{
   const fy=y+py+.5,nearestY=Math.max(m.my,Math.min(m.my2,fy));
   return ((fy-nearestY)/m.ry)**2;
  }),
  opacity:Math.min(opacity,m.opacity)
 }));
 for(let py=0;py<h;py++){
  // Skip masks that cannot touch this row, including between disjoint reveals.
  const row=axes.filter(m=>m.dy2[py]<1);
  if(!row.length)continue;
  for(let px=0;px<w;px++){
   let strongest=0,alpha=opacity;
   for(const m of row){
    const distance=m.dx2[px]+m.dy2[py];
    if(distance>=1)continue;
    let strength=1;
    if(distance>INNER_RADIUS_SQUARED){
     const k=(Math.sqrt(distance)-INNER_RADIUS)/(1-INNER_RADIUS);
     const segment=Math.min(3,Math.floor(k*4)),f=k*4-segment;
     strength=FADE[segment]*(1-f)+FADE[segment+1]*f;
    }
    strongest=Math.max(strongest,strength);
    alpha=Math.min(alpha,opacity*(1-strength)+m.opacity*strength);
   }
   if(!strongest)continue;
   const offset=(py*w+px)*4+3;
   coverage.data[offset]=Math.round(strongest*255);
   weight.data[offset]=Math.round(Math.max(0,alpha-opacity*(1-strongest))*255);
  }
 }
 const bytes=w*h*8,entry={coverage,weight,bytes};
 while(rasters.size&&(rasterBytes+bytes>RASTER_LIMIT||rasters.size>=24)){
  const first=rasters.keys().next().value;
  rasterBytes-=rasters.get(first).bytes;rasters.delete(first);
 }
 rasters.set(key,entry);rasterBytes+=bytes;
 return entry;
}

export function drawLocalCutaway(g,image,box,masks,opacity=1,insidePaint=null){
 const draw=typeof image==='function'?image:target=>target.drawImage(image,...box);
 if(!masks?.length){g.save();g.globalAlpha=opacity;draw(g);g.restore();return;}
 const t=g.getTransform?.();
 if(!t||t.b||t.c||t.a<=0||t.d<=0||!g.canvas?.width||!(typeof OffscreenCanvas==='function'||globalThis.document?.createElement)){
  drawHard(g,draw,box,masks,opacity,insidePaint);return;
 }
 const tiles=localTiles(g,box,masks,t);
 const outside=new Path2D();outside.rect(0,0,g.canvas.width,g.canvas.height);
 for(const tile of tiles)outside.rect(tile.x,tile.y,tile.w,tile.h);
 g.save();g.setTransform(1,0,0,1,0,0);g.clip(outside,'evenodd');
 g.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);g.globalAlpha=opacity;draw(g);g.restore();
 if(!tiles.length||opacity===0)return;
 g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
 // Keep each output tile distinct until the target has consumed it.
 let slot=3;
 for(const {x,y,w,h,masks:tileMasks} of tiles){
  const mask=buffer(0,w,h);
  const insideOpacity=Math.min(opacity,tileMasks[0].opacity);
  const mixed=tileMasks.length>1||tileMasks.some(m=>Math.min(opacity,m.opacity)!==insideOpacity);
  let weighted=null;
  if(mixed){
   weighted=buffer(2,w,h);
   const {coverage,weight}=mixedRaster(mask,weighted,x,y,w,h,tileMasks,opacity);
   mask.putImageData(coverage,0,0);weighted.putImageData(weight,0,0);
  }else for(const {mx,my,my2,rx,ry} of tileMasks){
   const cap=(cy,upper)=>{
    mask.save();mask.translate(mx-x,cy-y);mask.scale(rx,ry);
    const fade=mask.createRadialGradient(0,0,INNER_RADIUS,0,0,1);
    for(let i=0;i<=4;i++){const k=i/4;fade.addColorStop(k,'rgba(0,0,0,'+(1-k*k*(3-2*k))+')');}
    mask.fillStyle=fade;mask.fillRect(-1,upper?-1:0,2,1);mask.restore();
   };
   if(my2>my){
    cap(my,true);cap(my2,false);
    const fade=mask.createLinearGradient(mx-rx-x,0,mx+rx-x,0);
    for(let i=4;i>=0;i--){const k=i/4,r=INNER_RADIUS+(1-INNER_RADIUS)*k;fade.addColorStop((1-r)/2,'rgba(0,0,0,'+(1-k*k*(3-2*k))+')');}
    for(let i=0;i<=4;i++){const k=i/4,r=INNER_RADIUS+(1-INNER_RADIUS)*k;fade.addColorStop((1+r)/2,'rgba(0,0,0,'+(1-k*k*(3-2*k))+')');}
    mask.fillStyle=fade;mask.fillRect(mx-rx-x,my-y,rx*2,my2-my);
   }else{
    // Preserve the established ellipse path byte for byte for ordinary masks.
    mask.save();mask.translate(mx-x,my-y);mask.scale(rx,ry);
    const fade=mask.createRadialGradient(0,0,INNER_RADIUS,0,0,1);
    for(let i=0;i<=4;i++){const k=i/4;fade.addColorStop(k,'rgba(0,0,0,'+(1-k*k*(3-2*k))+')');}
    mask.fillStyle=fade;mask.fillRect(-1,-1,2,2);mask.restore();
   }
  }
  const base=buffer(slot,w,h);
  const paint=(target,painter,alpha)=>{
   target.save();target.setTransform(t.a,0,0,t.d,t.e-x,t.f-y);
   target.imageSmoothingEnabled=g.imageSmoothingEnabled;
   target.imageSmoothingQuality=g.imageSmoothingQuality;
   target.globalAlpha=alpha;painter(target);target.restore();
  };
  paint(base,draw,opacity);
  base.globalCompositeOperation='destination-out';
  base.drawImage(mask.canvas,0,0,w,h,0,0,w,h);
  // Mix premultiplied pixels without painting intact roof or lights back
  // through the centre, even when the roof-hidden image is transparent.
  const inside=buffer(1,w,h);
  paint(inside,insidePaint||draw,mixed?1:insideOpacity);
  inside.globalCompositeOperation='destination-in';
  inside.drawImage((weighted||mask).canvas,0,0,w,h,0,0,w,h);
  base.globalCompositeOperation='lighter';
  base.drawImage(inside.canvas,0,0,w,h,0,0,w,h);
  const clip=new Path2D();clip.rect(x,y,w,h);
  g.save();g.clip(clip);g.drawImage(base.canvas,x,y);g.restore();slot++;
 }
 g.restore();
}

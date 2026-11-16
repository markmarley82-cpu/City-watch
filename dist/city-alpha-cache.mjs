// Exact source alpha, loaded only where an actor actually tests a cutaway.
// A full RGBA copy of every city painting is unnecessary for point queries.
export function createAlphaCache({createCanvas=()=>document.createElement('canvas'),tileSize=64,maxTiles=512}={}){
 const sources=new WeakMap(),tiles=new Map();let surface=null,context=null,next=0,hits=0,misses=0;
 function pixels(image){
  if(sources.has(image))return sources.get(image);
  const id=next++,width=image.width,height=image.height;
  const handle={sample(x,y){
   x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=width||y>=height)return 0;
   const tx=Math.floor(x/tileSize)*tileSize,ty=Math.floor(y/tileSize)*tileSize,key=id+':'+tx+':'+ty;
   let a=tiles.get(key);
   if(a){hits++;tiles.delete(key);tiles.set(key,a);}else{
    misses++;if(!surface){surface=createCanvas();surface.width=surface.height=tileSize;context=surface.getContext('2d',{willReadFrequently:true});}
    const w=Math.min(tileSize,width-tx),h=Math.min(tileSize,height-ty);
    context.clearRect(0,0,tileSize,tileSize);context.drawImage(image,tx,ty,w,h,0,0,w,h);
    const rgba=context.getImageData(0,0,tileSize,tileSize).data,data=new Uint8Array(tileSize*tileSize);
    let opaque=true;
    for(let i=0;i<data.length;i++){data[i]=rgba[i*4+3];if(data[i]!==255)opaque=false;}
    a={data,opaque};tiles.set(key,a);
    while(tiles.size>maxTiles)tiles.delete(tiles.keys().next().value);
   }
   return a.data[(y-ty)*tileSize+x-tx]/255;
  },coversCachedOpaqueRect(left,top,right,bottom){
   // Only use alpha already read for cutaways. A cache miss leaves the actor
   // drawable and never causes a canvas readback during resident culling.
   if(left<0||top<0||right>width||bottom>height||right<=left||bottom<=top)return false;
   for(let y=Math.floor(top/tileSize)*tileSize;y<bottom;y+=tileSize)
    for(let x=Math.floor(left/tileSize)*tileSize;x<right;x+=tileSize)
     if(!tiles.get(id+':'+x+':'+y)?.opaque)return false;
   return true;
  }};sources.set(image,handle);return handle;
 }
 return {pixels,report:()=>({tiles:tiles.size,maxTiles,hits,misses,bytes:tiles.size*tileSize*tileSize,fullImageCopies:0}),dispose(){tiles.clear();if(surface)surface.width=surface.height=1;surface=context=null;}};
}

// Fit the existing Watch/Opera square, not unrelated district scenery.
export function fitWatchSquare(objects,{width,height}){
 const ids=new Set(['watch','opera','fountain']),local=objects.filter(o=>ids.has(o.id));
 if(local.length!==ids.size)throw Error('Watch square camera requires Watch, Opera and fountain');
 const minX=Math.min(...local.map(o=>o.bounds[0])),minY=Math.min(...local.map(o=>o.bounds[1])),maxX=Math.max(...local.map(o=>o.bounds[0]+o.bounds[2])),maxY=Math.max(...local.map(o=>o.bounds[1]+o.bounds[3]));
 const zoom=Math.min(.9,Math.max(1,width-24)/(maxX-minX),Math.max(1,height-95)/(maxY-minY));
 return {zoom,camera:{x:(minX+maxX)/2,y:(minY+maxY)/2-20/zoom},bounds:[minX,minY,maxX,maxY],ids:local.map(o=>o.id)};
}

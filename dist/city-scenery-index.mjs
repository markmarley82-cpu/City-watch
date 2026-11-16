// Static painted bounds only. Navigation and moving actors keep their own data.
export function createSceneryIndex(objects,{cellSize=256,maxCells=64}={}){
 const cells=new Map(),overflow=[],windows=new Map();let queries=0,lastCandidates=objects.length;
 const span=b=>[Math.floor(b[0]/cellSize),Math.floor(b[1]/cellSize),Math.floor(b[2]/cellSize),Math.floor(b[3]/cellSize)];
 objects.forEach((o,index)=>{
  const b=o.bounds;
  if(!b||!b.every(Number.isFinite)||b[2]<0||b[3]<0){overflow.push(index);return;}
  const [x0,y0,x1,y1]=span([b[0],b[1],b[0]+b[2],b[1]+b[3]]);
  if((x1-x0+1)*(y1-y0+1)>maxCells){overflow.push(index);return;}
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const key=x+','+y,list=cells.get(key)||[];list.push(index);cells.set(key,list);}
 });
 function query(bounds,margin=0){
  queries++;const box=span([bounds[0]-margin,bounds[1]-margin,bounds[2]+margin,bounds[3]+margin]),key=box.join(':');
  let result=windows.get(key);
  if(!result){
   const [x0,y0,x1,y1]=box;
   if((x1-x0+1)*(y1-y0+1)>4096)result=objects;
   else{const found=new Set(overflow);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)for(const index of cells.get(x+','+y)||[])found.add(index);
    // Preserve authored order for equal-depth paintings.
    result=[...found].sort((a,b)=>a-b).map(index=>objects[index]);}
   if(windows.size>=8)windows.delete(windows.keys().next().value);windows.set(key,result);
  }
  lastCandidates=result.length;return result;
 }
 return Object.freeze({query,report:()=>({objects:objects.length,cellSize,cells:cells.size,overflow:overflow.length,cachedWindows:windows.size,queries,lastCandidates})});
}

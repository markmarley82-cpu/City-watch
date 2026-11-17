// Mate38c9 public paving return, received on303. Existing public dry ground only; no graph/collision writes.
export const BLOCK=[70,69,102,88];
export async function createBlockCorrection({world,ground,createCanvas,texture,DOMMatrix,keepEvidence=false,budgetMS=8,pause=()=>new Promise(resolve=>setTimeout(resolve,0))}){
 const [x0,y0,x1,y1]=BLOCK,pixelBox=[28*(x0-y1),14*(x0+y0),28*(x1-y0),14*(x1+y1)],scale=1;
 const x=Math.floor(pixelBox[0]),y=Math.floor(pixelBox[1]),w=Math.ceil(pixelBox[2])-x,h=Math.ceil(pixelBox[3])-y;
 const began=performance.now();let disposed=false;
 const surface=createCanvas(w,h),g=surface.getContext('2d'),mask=createCanvas(w,h),mg=mask.getContext('2d'),pixels=mg.createImageData(w,h);
 const held=new Set(['P015','E061','E047','E049','E068']),eligible=p=>{
  if(p[0]<x0||p[0]>x1||p[1]<y0||p[1]>y1)return false;
  const ids=world.members.get(p.map(Math.round).join(','));
  if(!ids?.size||[...ids].some(id=>/^E00[1-7]$/.test(id)||held.has(id)||id.startsWith('P015-')))return false;
  return ground.clearPoint(p)&&world.waterCollision.pointClear(p,[...ids]);
 };
 let inside=0,yields=0,deadline=performance.now()+budgetMS;for(let v=0;v<h;v++){for(let u=0;u<w;u++){
  const X=x+u+.5,Y=y+v+.5,p=[X/56+Y/28,Y/28-X/56];if(!eligible(p))continue;
  // Fade the outer boundary into the retained city. Every nonzero pixel remains public/dry/clear.
  const edge=Math.min(p[0]-x0,x1-p[0],p[1]-y0,y1-p[1]);
  pixels.data[(v*w+u)*4+3]=Math.round(255*Math.min(1,edge/.9));inside++;
 }
 if(performance.now()>=deadline){yields++;await pause();deadline=performance.now()+budgetMS;}
 }
 mg.putImageData(pixels,0,0);g.save();g.translate(-x,-y);g.transform(28,14,-28,14,0,0);
 const pattern=g.createPattern(texture,'repeat');pattern.setTransform(new DOMMatrix().scale(4.8/texture.width,4.8/texture.height));g.fillStyle=pattern;g.fillRect(x0,y0,x1-x0,y1-y0);g.restore();
 g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);g.globalCompositeOperation='source-over';
 if(!keepEvidence)mask.width=mask.height=1;
 const buildMs=performance.now()-began;
 return {dispose(){disposed=true;surface.width=surface.height=1;mask.width=mask.height=1;},draw(ctx,view){if(disposed)return;if(view[0]>x+w||view[2]<x||view[1]>y+h||view[3]<y)return;ctx.drawImage(surface,x,y,w/scale,h/scale);},surface,mask:keepEvidence?mask:null,eligible,bounds:[x,y,w,h],report:()=>({id:'MATE-E042-E043-PUBLIC-GROUND-REWORK301',block:BLOCK,worldBounds:[x,y,w,h],paintedNativePixels:inside,decodedMiB:disposed?0:w*h*4/1048576,evidenceMaskMiB:keepEvidence?w*h*4/1048576:0,buildMs,yields,disposed,navigationChanged:false,waterAndSolidExcluded:true,texture:'assets/city-paving-v2/cobbles-a.webp',limit:'Visual ground correction on existing public receivers only; new lots remain unassigned.'})};
}

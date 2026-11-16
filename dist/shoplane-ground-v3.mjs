/* Native registered ground art only. No scenery, actor, navigation or save authority. */
export async function createShoplaneGround({read,load,createCanvas=()=>document.createElement('canvas')}){
 const base='assets/shoplane-ground-v3/',m=await read(base+'manifest.json?v=v31-join'),chunks=await Promise.all(m.runtime_files.map(async r=>({...r,image:await load(base+r.file+"?v=v31-join")})));
 // The west export boundary meets Small Gods at a different sett scale.
 // Fade just the outer strip onto the existing city surface. Preserve the
 // centre of the accepted painting and its original source bitmap.
 const west=m.registration.screenBox[0],blendWidth=248,margin=48;
 for(const r of chunks){
  if(r.screen_box[0]!==west||r.image.width!==r.dimensions[0]||r.image.height!==r.dimensions[1]||r.image.width<=blendWidth)continue;
  const strip=createCanvas();strip.width=blendWidth;strip.height=r.image.height;
  const g=strip.getContext('2d');
  g.drawImage(r.image,0,0,blendWidth,strip.height,0,0,blendWidth,strip.height);
  const alpha=g.createLinearGradient(0,0,blendWidth,0);
  alpha.addColorStop(0,'#0000');alpha.addColorStop(margin/blendWidth,'#0000');
  alpha.addColorStop(.37,'#0000001a');alpha.addColorStop(.61,'#00000080');
  alpha.addColorStop(.84,'#000000d9');alpha.addColorStop(1,'#000');
  g.globalCompositeOperation='destination-in';g.fillStyle=alpha;g.fillRect(0,0,blendWidth,strip.height);
  r.westBlend=strip;
 }
 return {
  draw(g,view){for(const r of chunks){
   const b=r.screen_box;if(b[0]>=view[2]||b[2]<=view[0]||b[1]>=view[3]||b[3]<=view[1])continue;
   if(!r.westBlend){g.drawImage(r.image,b[0],b[1],...r.dimensions);continue;}
   g.drawImage(r.westBlend,b[0],b[1]);
   const width=r.image.width-blendWidth,height=r.image.height;
   g.drawImage(r.image,blendWidth,0,width,height,b[0]+blendWidth,b[1],width,height);
  }},
  report:()=>({id:m.asset_id,chunks:chunks.length,ready:chunks.every(r=>r.image.width===r.dimensions[0]&&r.image.height===r.dimensions[1]),decodedMiB:chunks.reduce((n,r)=>n+r.image.width*r.image.height*4,0)/1048576,westBlendPixels:blendWidth,westBlendChunks:chunks.filter(r=>r.westBlend).length,buildingsSeparate:true,actorsSeparate:true,navigationChanged:false,previewOnly:m.previewOnly,freshCompositeBrowserVerified:m.freshCompositeBrowserVerified,physicalPhoneVerified:m.physicalPhoneVerified})
 };
}

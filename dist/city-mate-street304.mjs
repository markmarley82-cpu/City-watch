// Six unique recovered, previously uninstalled paintings. Navigation is built
// by the existing scene after these measured solid footprints are registered.
export async function createGapFrontages({objects,world,read,load,pixels,lightAnchors}){
 const root='assets/mate-street304',rows=await read(root+'/receivers.json?v=drum-large-1'),yards=await read(root+'/yards.json'),recovery=await read(root+'/recovery-cells.json'),ids=new Set(),masters=new Set();
 if(!Array.isArray(recovery.cells)||recovery.cells.some(r=>!/^[-]?\d+,[-]?\d+$/.test(r.k)||!Array.isArray(r.lost)||!r.lost.length||r.lost.some(id=>typeof id!=='string')))throw Error('Invalid street recovery cells');
 for(const r of [...rows,...yards]){
  if(ids.has(r.id)||objects.some(o=>o.id===r.id)||masters.has(r.sourceSHA256))throw Error('Duplicate gap building '+r.id);
  ids.add(r.id);masters.add(r.sourceSHA256);
  if(r.rect?.length!==4||r.rect.some(n=>!Number.isFinite(n))||r.rect[2]<=0||r.rect[3]<=0)throw Error('Invalid gap footprint');
  for(const[k]of world.members){const[x,y]=k.split(',').map(Number);if(x>=r.rect[0]-.5&&x<=r.rect[0]+r.rect[2]+.5&&y>=r.rect[1]-.5&&y<=r.rect[1]+r.rect[3]+.5)throw Error('New source route reaches reserved gap '+r.id);}
 }
 // Fitted replacements retain the legacy identifier as an adjacency alias so
 // an art swap cannot detach an already accepted joined frontage.
 const byID=new Map([...objects,...rows].flatMap(r=>[[r.id,r],...(r.retireId?[[r.retireId,r]]:[])]));
 for(const r of rows){
  const n=byID.get(r.adjoins);if(!n?.rect)throw Error('Missing adjoining street frontage '+r.id);
  const a=r.rect,b=n.rect;
  const gap=Math.hypot(Math.max(a[0]-b[0]-b[2],b[0]-a[0]-a[2],0),Math.max(a[1]-b[1]-b[3],b[1]-a[1]-a[3],0));
  const shared=Math.max(Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
  if(gap>.08||shared<2.5)throw Error('Detached street frontage '+r.id);
 }
 const prepared=await Promise.all(rows.map(async r=>{const im=await load(`${root}/${r.id}/${r.day}`),emission=await load(`${root}/${r.id}/${r.nightEmission}`);if(im.width!==r.native[0]||im.height!==r.native[1]||emission.width!==im.width||emission.height!==im.height)throw Error('Gap export size mismatch '+r.id);return{r,im,emission};}));
 const groundImages=new Map();const groundImage=url=>{if(!groundImages.has(url))groundImages.set(url,load(url));return groundImages.get(url);};
 const dressing=await Promise.all(yards.map(async r=>({r,im:await load(r.source),ground:await groundImage(r.ground.source)})));
 for(const{r,im,emission}of prepared){objects.push({id:r.id,im,nightEmission:emission,p:r.p.slice(),rect:r.rect.slice(),anchor:r.anchor.slice(),scale:1,bounds:r.bounds.slice(),sourceAsset:r.id,lightSource:r.id,alpha:pixels(im),legacyFitted:true,sceneryKind:'building',cutawayEligible:true,actorFootCutaway:{...r.actorFootCutaway}});lightAnchors[r.id]=r.lightAnchors;}
 for(const{r,im}of dressing){objects.push({id:r.id,im,p:r.p.slice(),rect:r.rect.slice(),anchor:r.anchor.slice(),scale:r.scale,bounds:r.bounds.slice(),sourceAsset:r.id,alpha:pixels(im),sceneryKind:'street-furniture',cutawayEligible:false});lightAnchors[r.id]=[];}
 return {rects:[...rows,...yards].map(r=>r.rect.slice()),recoveryRects:[...rows,...yards].map(r=>r.rect.slice()).concat(recovery.cells.map(r=>[...r.k.split(',').map(Number),0,0])),drawGround(g,view){
  for(const{r,ground}of dressing){
   const pts=r.ground.worldPolygon;g.save();g.transform(28,14,-28,14,0,0);g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();
   const pattern=g.createPattern(ground,'repeat');pattern.setTransform(new DOMMatrix().scale(r.ground.patternWorldScale/ground.width,r.ground.patternWorldScale/ground.height));
   g.globalAlpha*=r.ground.opacity;g.fillStyle=pattern;g.fill();g.globalAlpha*=.18;g.strokeStyle=pattern;g.lineWidth=.16;g.lineJoin='round';g.stroke();g.restore();
  }
 },report:()=>({id:'MATE-JOINED-STREET304',ready:true,buildings:rows.length,yardClutter:yards.length,groundCompositions:yards.length,distinctGroundOutlines:new Set(yards.map(r=>r.ground.shapeSHA256)).size,groundPlaneFlat:true,uniqueBuildingMasters:rows.length,adjoiningFrontages:rows.length,uniquePaintingHashes:masters.size,savedAliasRecoveryCells:recovery.cells.length,publicDoorsAdded:0,existingObjectsRemoved:0,originalRouteCellsOccupied:0})};
}

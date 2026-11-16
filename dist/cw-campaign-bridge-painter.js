/* Source-painted deck and vertical planes have different projections.
   This adapter never changes logical bridge paths, collision or saved positions. */
window.CWCreateCampaignBridgePainter=function(records){
 'use strict';
 const families=new Map(records.map(r=>[r.edge,{...r,layers:r.layers.map(l=>{const image=new Image();image.src=l.url;return {...l,image};})}]));
 const assignments={new:'E001',brass:'E002',contract:'E003',pons:'E004',lower:'E001'};
 function ready(b){const r=families.get(assignments[b.id]);return !!r&&r.layers.every(l=>l.image.complete&&l.image.naturalWidth>0);}
 function basis(b,xy){
  let p=xy(...b.p[0]),q=xy(...b.p.at(-1));if(q.x>p.x)[p,q]=[q,p];
  const edge=assignments[b.id],length={E001:32,E002:31,E003:33,E004:32}[edge];
  const dx=q.x-p.x,dy=q.y-p.y,wx=dx/56+dy/28,wy=dy/28-dx/56,len=Math.hypot(wx,wy);
  let nx=-wy/len,ny=wx/len;if(nx+ny<0){nx=-nx;ny=-ny;}
  // Source deck is four cells wide; fit its independent width to the real route.
  const width=b.w/4,S={x:dx/length,y:dy/length},T={x:(nx-ny)*28*width,y:(nx+ny)*14*width};
  return{p,q,S,T,length,edge};
 }
 function draw(ctx,b,part,xy){
  if(!ready(b))return false;
  const {p,S,T,edge,length}=basis(b,xy),family=families.get(edge);
  for(const l of family.layers){
   if(part==='back'&&l.role==='front'||part==='front'&&l.role!=='front')continue;
   const [ax,ay]=l.anchor;
   ctx.save();
   if(l.originalFile.includes('hippo_')){
    // Statues are upright silhouettes, not flattened pieces of the deck.
    const footX=-ax+l.size[0]/2,footY=-ay+l.size[1],t=l.role==='front'?2:-2,s=(28*t-footX)/28,h=14*s+14*t-footY;
    ctx.drawImage(l.image,p.x+S.x*s+T.x*t-l.size[0]/2,p.y+S.y*s+T.y*t-h-l.size[1]);
   }else if(l.role==='deck'){
    ctx.transform((-S.x+T.x)/56,(-S.y+T.y)/56,(S.x+T.x)/28,(S.y+T.y)/28,p.x,p.y);
    ctx.drawImage(l.image,-ax,-ay);
   }else{
    const t=l.role==='back'?-2:2,lo=-28*length+28*t,hi=28*t;
    const plane=(matrix,left,right)=>{ctx.save();ctx.transform(...matrix);ctx.beginPath();ctx.rect(left,-5000,right-left,10000);ctx.clip();ctx.drawImage(l.image,-ax,-ay);ctx.restore();};
    // The two end faces run across the deck, so they need the transverse
    // projection. Applying the long-side matrix to them creates tall spikes.
    plane([-S.x/28,(14-S.y)/28,0,1,p.x+(S.x+T.x)*t,p.y+(S.y+T.y-28)*t],lo,hi);
    plane([T.x/28,(T.y-14)/28,0,1,p.x+(S.x+T.x)*length,p.y+(S.y+T.y-28)*length],-5000,lo);
    plane([T.x/28,(T.y-14)/28,0,1,p.x,p.y],hi,5000);
   }
   ctx.restore();
  }
  return true;
 }
 return Object.freeze({ready,draw,basis,report:()=>({version:'CAMPAIGN-BRIDGE-PLANES-1',assignments:{...assignments},sourceLayers:records.reduce((n,r)=>n+r.layers.length,0),lowerBroadWay:'Shared New Bridge masonry kit, not a new approved bridge family',ready:[...families].filter(([,r])=>r.layers.every(l=>l.image.naturalWidth)).map(([id])=>id)})});
};

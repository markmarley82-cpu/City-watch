// Travel-driven sprite playback. No timer, actor movement, state or save writes.
const headings=['right','down-right','down','down-left','left','up-left','up','up-right'];
export function cartScreenHeading(worldHeading){
 if(!Number.isFinite(worldHeading))throw Error('Finite world heading required');
 const dx=Math.cos(worldHeading),dy=Math.sin(worldHeading);
 const projected=Math.atan2(14*(dx+dy),28*(dx-dy));
 return headings[(Math.round(projected/(Math.PI/4))+8)%8];
}
export function createCartAnimator({clip,strideLength}){
 if(!Number.isFinite(strideLength)||strideLength<=0)throw Error('Measured stride length required');
 if(!clip?.id||!Array.isArray(clip.rows)||clip.rows.length!==8)throw Error('Eight directional rows required');
 const rows=new Map(clip.rows.map(row=>[row.heading,row]));
 for(const heading of headings){const row=rows.get(heading);if(!row||row.frames?.length!==4||!Array.isArray(row.anchor)||row.anchor.length!==2||row.anchor.some(x=>!Number.isFinite(x)))throw Error('Four phases and fixed row anchor required');
  if(row.frameAnchors&&(row.frameAnchors.length!==4||row.frameAnchors.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x)))))throw Error('Four finite frame anchors required');
  for(const f of row.frames)if(!Array.isArray(f)||f.length!==4||f.some(x=>!Number.isFinite(x))||f[2]<=0||f[3]<=0)throw Error('Valid atlas source rectangle required');
 }
 let lastTravel=0,phase=0;
 function select(cart){
  if(!Number.isFinite(cart?.travel)||cart.travel<0)throw Error('Finite accumulated travel required');
  const row=rows.get(cartScreenHeading(cart.pose?.heading));
  if(cart.travel<lastTravel)phase=0; // new journey/reused renderer
  if(cart.state==='moving')phase=Math.floor(cart.travel/strideLength*4+1e-9)%4;
  lastTravel=cart.travel;
  return {clipId:clip.id,heading:row.heading,phase,source:row.frames[phase].slice(),anchor:(row.frameAnchors?.[phase]||row.anchor).slice(),alpha:cart.alpha??1};
 }
 return {select,reset(){lastTravel=0;phase=0;}};
}

// Explicit weighted roster selection, so callers can vary drivers without
// resizing/recolouring a rig or repeatedly showing the first catalogue entry.
export function chooseCartVariant(roster,unitRandom){
 if(!Array.isArray(roster)||!roster.length||!Number.isFinite(unitRandom)||unitRandom<0||unitRandom>=1)throw Error('Roster and [0,1) draw required');
 let total=0;const ids=new Set();
 for(const v of roster){if(!v.id||ids.has(v.id)||!Number.isFinite(v.weight)||v.weight<=0)throw Error('Unique weighted variants required');ids.add(v.id);total+=v.weight;}
 let draw=unitRandom*total;
 for(const v of roster){draw-=v.weight;if(draw<0)return v.id;}
 return roster.at(-1).id;
}

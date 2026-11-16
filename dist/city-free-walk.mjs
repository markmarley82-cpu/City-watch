import {manualNeighbour} from './city-core.mjs?v=p21-b407-s039-reuse';
export const footProbeOffsets=Object.freeze([[0,0],[-.12,-.12],[-.12,.12],[.12,-.12],[.12,.12]].map(Object.freeze));
// This short portal is one city cell wide. Preserve a primarily along-lane
// thumb drag without letting shallow cross-axis drift peel into the yards.
export function palacePassageDrag(foot,vector){
 const [x,y,edge]=foot,[dx,dy]=vector;
 if((edge==='E010'||edge==='E028')&&x>=157.85&&x<=162.15&&Math.abs(y-212)<=.35&&dx&&Math.abs(dy)<=Math.abs(dx)*.5)return [dx,0];
 return vector;
}
// Continuous foot motion; integer anchors remain the interaction/save contract.
export function createFreeWalk(world,{stepMS=160,screenSpeed=false,maxFrameDeltaMs=80,occupied=()=>false,onCell=()=>{},onStep=()=>{},clearPoint=()=>true,steer=(foot,v)=>v}={}){
 let anchor=null,foot=null,last=null,moving=false,direction=[0,0],distanceTravelled=0;
 let probes=new Map();
 const rounded=p=>[Math.round(p[0]),Math.round(p[1])];
 const bridge=id=>['BRIDGE','CUT'].includes(world.edges.get(id)?.kind);
 function stateAt(p,from){const q=rounded(p),dx=q[0]-from[0],dy=q[1]-from[1],wet=!!world.wet?.(p);
  if(!dx&&!dy){if(wet&&!bridge(from[2]))return world.neighbours(from).find(s=>s[0]===q[0]&&s[1]===q[1]&&bridge(s[2]))||from.slice();return from.slice();}
  if(Math.max(Math.abs(dx),Math.abs(dy))>1)return null;const k=from.join(',')+':'+q.join(',')+':'+wet;
  if(!probes.has(k)){let next=manualNeighbour(world,from,dx,dy,occupied);if(wet&&next&&!bridge(next[2])&&!bridge(from[2]))next=world.neighbours(from).find(s=>s[0]===q[0]&&s[1]===q[1]&&bridge(s[2])&&!occupied(s))||next;probes.set(k,next);}return probes.get(k);
 }
 function safePoint(p,from){if(!clearPoint(p))return false;const state=stateAt(p,from);if(!state)return false;if(world.waterCollision)return world.waterCollision.pointClear(p,[state[2],from[2]]);return !world.wet?.(p)||bridge(state[2])||bridge(from[2]);}
 function fits(p,from){for(const[dx,dy]of footProbeOffsets)if(!safePoint([p[0]+dx,p[1]+dy],from))return false;return true;}

 function reset(p,visual=p,now=0){probes.clear();if(!Array.isArray(visual)||visual.length!==3||!visual.slice(0,2).every(Number.isFinite))visual=p;anchor=p.slice();foot=p.slice();const q=rounded(visual),state=world.members.get(q.join(','))?.has(p[2])?[...q,p[2]]:manualNeighbour(world,p,q[0]-p[0],q[1]-p[1],occupied);if(state&&Math.hypot(visual[0]-p[0],visual[1]-p[1])<=1.5&&fits(visual,state)){anchor=state.slice();foot=[visual[0],visual[1],state[2]];}last=now;moving=false;direction=[0,0];return foot.slice();}
 function advance(now,vector=direction){probes.clear();if(!foot)return null;if(last!==null&&now<last)return foot.slice();const elapsed=Math.max(0,Math.min(maxFrameDeltaMs,now-(last??now)));last=now;direction=vector.slice();vector=steer(foot,vector);const length=Math.hypot(...vector);if(!length){moving=false;return foot.slice();}if(!elapsed)return foot.slice();moving=false;
  const screenLength=Math.hypot(28*(vector[0]-vector[1]),14*(vector[0]+vector[1]));
  const travel=elapsed/stepMS*(screenSpeed?Math.hypot(28,14)*length/screenLength:1),dx=vector[0]/length*travel,dy=vector[1]/length*travel,n=Math.max(1,Math.ceil(travel/.06));
  for(let i=0;i<n;i++){let p=[foot[0]+dx/n,foot[1]+dy/n];if(!fits(p,anchor)){const options=Math.abs(dx)>=Math.abs(dy)?[[foot[0]+dx/n,foot[1]],[foot[0],foot[1]+dy/n]]:[[foot[0],foot[1]+dy/n],[foot[0]+dx/n,foot[1]]];p=options.find(q=>Math.hypot(q[0]-foot[0],q[1]-foot[1])>1e-9&&fits(q,anchor));if(!p)break;}
   const next=stateAt(p,anchor),changed=next.join(',')!==anchor.join(',');const before=Math.floor(distanceTravelled+1e-8);distanceTravelled+=Math.hypot(p[0]-foot[0],p[1]-foot[1]);const count=Math.floor(distanceTravelled+1e-8)-before;if(count)onStep(count);moving=true;anchor=next.slice();foot=[p[0],p[1],anchor[2]];if(changed)onCell(anchor.slice());
  }return foot.slice();
 }
 return {reset,advance,drive(vector,now){if(!foot)return null;advance(now,direction);direction=vector.slice();if(!Math.hypot(...direction))moving=false;return foot.slice();},stop(now){advance(now);direction=[0,0];moving=false;return foot?.slice();},clear(){anchor=foot=last=null;direction=[0,0];moving=false;},foot:()=>foot?.slice(),anchor:()=>anchor?.slice(),moving:()=>moving,report:()=>({mode:'continuous',active:!!foot,moving,anchor:anchor?.slice(),foot:foot?.slice(),queued:0,distanceTravelled,maxFrameDeltaMs})};
}

// Only diagonal bridge-end handoffs need a continuous completion check. Streets and
// deck interiors retain their existing cheap graph predicate.
const roundedCell=p=>[Math.round(p[0]),Math.round(p[1])].join(',');
export function bridgeCornerClear(world,from,to,{occupied=()=>false}={}){
 if(from[0]===to[0]||from[1]===to[1])return true;
 const ids=new Set([from[2],to[2],...(world.members.get(roundedCell(from))||[]),...(world.members.get(roundedCell(to))||[])]);
 const nearEnd=[...ids].some(id=>{const e=world.edges.get(id);return ['BRIDGE','CUT'].includes(e?.kind)&&[e.points[0],e.points.at(-1)].some(p=>Math.min(Math.hypot(from[0]-p[0],from[1]-p[1]),Math.hypot(to[0]-p[0],to[1]-p[1]))<=(e.width_cells||1)/2+2);});
 if(!nearEnd)return true;
 const corners=[[from[0],from[1]],[from[0],to[1]],[to[0],from[1]],[to[0],to[1]]];
 if([...ids].some(id=>['BRIDGE','CUT'].includes(world.edges.get(id)?.kind)&&corners.every(p=>world.members.get(p.join(','))?.has(id)&&!occupied([...p,id]))))return true;
 const walk=createFreeWalk(world,{occupied});walk.reset(from);
 for(let n=1;n<=100;n++){const p=walk.foot();if(Math.hypot(p[0]-to[0],p[1]-to[1])<=.06)return true;walk.advance(n*8,[to[0]-p[0],to[1]-p[1]]);}
 const p=walk.foot();return Math.hypot(p[0]-to[0],p[1]-to[1])<=.06;
}

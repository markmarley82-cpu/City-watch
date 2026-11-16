import '../cw-locomotion.js?v=p21-b407-s039-reuse';
const L=globalThis.CWLocomotion;
export const GRID=[144,96];
export function inside(p,polygon){let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;}
export function canStand(room,p,margin=.008){if(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))return false;for(const [dx,dy]of [[0,0],[margin,0],[-margin,0],[0,margin],[0,-margin]]){const q=[p[0]+dx,p[1]+dy];if(!inside(q,room.floor)||room.obstacles.some(o=>inside(q,o.polygon)))return false;}return true;}
export function graph(room){const [cols,rows]=GRID,nodes=new Map();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p=[(x+.5)/cols,(y+.5)/rows];if(canStand(room,p))nodes.set(y*cols+x,p);}return {nodes,cols,rows};}
export function nearest(g,p,limit=.035,room=null){let best=null,d=limit;for(const [id,q]of g.nodes){const n=Math.hypot(q[0]-p[0],q[1]-p[1]);if(n<d&&(!room||segmentClear(room,p,q))){d=n;best=id;}}return best;}
export function segmentClear(room,a,b){const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.003));for(let i=0;i<=steps;i++){const t=i/steps;if(!canStand(room,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;}return true;}
export function pathfind(room,start,end,g=graph(room)){
 if(!canStand(room,start)||!canStand(room,end))return null;const from=nearest(g,start,.035,room),to=nearest(g,end,.035,room);if(from===null||to===null)return null;const queue=[from],previous=new Map([[from,null]]);for(let i=0;i<queue.length&&!previous.has(to);i++){const a=queue[i],x=a%g.cols,y=Math.floor(a/g.cols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,b=ny*g.cols+nx;if(nx<0||nx>=g.cols||ny<0||ny>=g.rows||!g.nodes.has(b)||previous.has(b))continue;if(dx&&dy&&(!g.nodes.has(y*g.cols+nx)||!g.nodes.has(ny*g.cols+x)))continue;const p=g.nodes.get(a),q=g.nodes.get(b);if(!segmentClear(room,p,q))continue;previous.set(b,a);queue.push(b);}}
 if(!previous.has(to))return null;const out=[];for(let id=to;id!==null;id=previous.get(id))out.push(g.nodes.get(id));out.reverse();out.push(end.slice());return out;
}
export function createRoomSession(room,{saved,onSave=()=>{},onExit=()=>{},onSaveError=()=>{}}={}){
 if(saved&&saved.schema!==1)throw Error('Unsupported room save; retained without modification');const g=graph(room);if(!canStand(room,room.entry))throw Error('Unsafe room entry');let p=saved?.room===room.id&&canStand(room,saved.position)?saved.position.slice():room.entry.slice(),route=[],exitRequested=false,closed=false,facing=-1,walking=false,manualActive=false,saveError=null,pendingSave=false;const visited=new Set(Array.isArray(saved?.examined)?saved.examined.filter(id=>room.hotspots.some(h=>h.id===id)):[]);
 const snapshot=()=>({schema:1,room:room.id,position:p.slice(),examined:[...visited]});
 const scale=[1536,1024],speed=L.pixelsPerMS(room.actorHeight||L.profile.referenceHeight);let lastManualSave=0,manualDirty=false;
 const manual=L.createDrive({read:()=>p,write:q=>{facing=q[0]>p[0]?1:q[0]<p[0]?-1:facing;p=q;manualDirty=true;},options:()=>({scale,speed,clear:(a,b)=>segmentClear(room,a,b),segment:6})});
 function persist(){pendingSave=true;try{onSave(snapshot());pendingSave=false;saveError=null;manualDirty=false;return true;}catch(error){saveError=error;route=[];walking=false;manualActive=false;manual.reset();onSaveError(error);return false;}}
 function completeExit(){if(exitRequested&&!route.length&&!pendingSave){closed=true;walking=false;onExit({room:room.id});}}
 function retrySave(){if(!pendingSave)return true;if(!persist())return false;completeExit();return true;}
 function moveTo(q){if(closed||pendingSave)return false;const next=pathfind(room,p,q,g);if(!next)return false;manual.reset();route=next;manualActive=false;exitRequested=false;return true;}
 function moveBy(dx,dy,amount=.024){if(closed||pendingSave||!Number.isFinite(dx)||!Number.isFinite(dy))return false;const length=Math.hypot(dx,dy);if(!length)return false;const q=[p[0]+dx/length*amount,p[1]+dy/length*amount];if(!segmentClear(room,p,q))return false;route=[];exitRequested=false;manualActive=true;walking=true;facing=dx>0?1:dx<0?-1:facing;p=q;return persist();}
 function drive(vector,now){if(closed||pendingSave)return false;route=[];exitRequested=false;manualActive=!!Math.hypot(...vector);manual.drive(vector,now);walking=manual.moving();return true;}
 function advance(now){if(closed||pendingSave)return false;walking=manual.sample(now);if(walking&&now-lastManualSave>=500){lastManualSave=now;persist();}return walking;}
 function step(ms,now=performance.now()){if(closed||pendingSave)return;if(manual.active()){advance(now);return;}let remaining=L.elapsed(ms)*speed;walking=false;while(route.length&&remaining>0){const q=route[0],dx=q[0]-p[0],dy=q[1]-p[1],distance=L.metric(p,q,scale);if(distance<.000001){p=q.slice();route.shift();continue;}facing=dx>0?1:dx<0?-1:facing;walking=true;if(remaining>=distance){p=q.slice();route.shift();remaining-=distance;}else{p=[p[0]+dx/distance*remaining,p[1]+dy/distance*remaining];remaining=0;}}
  if(!route.length&&walking&&!exitRequested)persist();if(exitRequested&&!route.length){if(persist())completeExit();}
 }
 function nearestHotspot(){return room.hotspots.filter(h=>Math.hypot(h.stand[0]-p[0],h.stand[1]-p[1])<=(h.radius||.065)).sort((a,b)=>Math.hypot(a.stand[0]-p[0],a.stand[1]-p[1])-Math.hypot(b.stand[0]-p[0],b.stand[1]-p[1]))[0]||null;}
 function examine(id){const h=room.hotspots.find(x=>x.id===id);if(closed||pendingSave||!h||Math.hypot(h.stand[0]-p[0],h.stand[1]-p[1])>(h.radius||.065))return null;if(!visited.has(id)){visited.add(id);if(!persist())return null;}return {...h};}
 function requestExit(){if(closed||pendingSave)return false;const next=pathfind(room,p,room.entry,g);if(!next)return false;manual.reset();route=next;manualActive=false;exitRequested=true;return true;}
 function stop(now){const active=route.length||manualActive||manualDirty;manual.stop(now);if(active){route=[];walking=false;manualActive=false;exitRequested=false;persist();}}
 return Object.freeze({retrySave,stop,moveTo,moveBy,drive,advance,step,nearestHotspot,examine,requestExit,snapshot,view:()=>({position:p.slice(),moving:walking&&(manualActive||!!route.length),facing,closed,saveError:saveError?.message||null,pendingSave,route:route.map(q=>q.slice()),exitRequested}),graph:g});
}

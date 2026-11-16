import {cellKey,rectCells,compilePrecinct,pathBetween,validSave,project,unproject} from './layout-core.mjs?v=p21-b407-s039-reuse';
const $=id=>document.getElementById(id),KEY='city_watch_rc1_precinct_v01_patrol';
const [data,atlas,recruit,colon]=await Promise.all(['precinct-rc1.json','atlas-v032.json','watch-recruit.json','colon.json'].map(n=>fetch('assets/team-v05/'+n).then(r=>{if(!r.ok)throw Error('Missing layout asset: '+n);return r.json();}))).catch(e=>{$('message').textContent='The layout could not load. Return to the campaign and retry. '+e.message;throw e;});
const {solid,walk}=compilePrecinct(data),canvas=$('layout-scene'),ctx=canvas.getContext('2d');
let player=[0,0],route=[],steps=0,visited=new Set(),following=true,zoom=.9,fade=true,sound=false,cam={x:0,y:0},lastMove=0,lastNPC=0,npc=[-5,3],npcRoute=[],npcIndex=0,blockedMoves=0,entered=false;
let saveProblem='';try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(validSave(v,walk)){player=v.position;visited=new Set(v.visited);steps=Number.isSafeInteger(v.steps)&&v.steps>=0?v.steps:0;}}catch{saveProblem='Storage is unavailable; this patrol can still be played.';}
const targets=[{id:'watch',p:[0,0],name:'Watch entrance'},{id:'opera',p:[0,8],name:'Opera approach'},{id:'fountain',p:[1,5],name:'Fountain ring'},{id:'west',p:[-8,3],name:'West city connection'},{id:'east',p:[11,3],name:'East city connection'}];
const assets={};await Promise.all(['watch-recruit','colon','mate-paving-v21'].map(id=>new Promise(resolve=>{const im=new Image();im.onload=()=>{assets[id]=im;resolve();};im.onerror=resolve;im.src='assets/team-v05/'+id+'.webp';})));
function tell(text){$('message').textContent=text;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,position:player.slice(),visited:[...visited],steps}));return true;}catch{tell('Patrol could not be saved. Your current walk remains available.');return false;}}
function update(){
 const near=targets.find(t=>cellKey(t.p)===cellKey(player));if(near)visited.add(near.id);
 $('location').textContent=near?.name||'Pseudopolis Yard';
 $('position').textContent=`Approach-relative position ${player[0]}, ${player[1]} · ${steps} steps · ${route.length?'Walking…':'Ready'}`;
 $('patrol-progress').textContent=visited.size===5?'All five patrol points visited. Save this patrol when ready.':`Patrol points ${visited.size}/5 · Watch, Opera, fountain and two city connections`;
 $('use').textContent=player[0]===0&&player[1]===0?'Enter Watch House':player[0]===0&&player[1]===8?'Examine Opera':'Go to Watch entrance';
 canvas.dataset.position=cellKey(player);canvas.dataset.walkCells=String(walk.size);canvas.dataset.blockedMoves=String(blockedMoves);canvas.dataset.npc=cellKey(npc);
}
function step(dx,dy){route=[];const q=[player[0]+dx,player[1]+dy];if(!walk.has(cellKey(q))){blockedMoves++;tell('That footprint is solid. Walk around it on the paving.');update();return false;}player=q;steps++;update();return true;}
function go(p){const path=pathBetween(walk,player,p);if(path===null){blockedMoves++;tell('That point is outside the clear paving or occupied. Try a clear tile.');update();return false;}route=path;tell('Walking along the clear paving.');update();return true;}
function size(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!following)whole();}
function whole(){following=false;const r=canvas.getBoundingClientRect();const pts=[...walk].flatMap(k=>corners([...k.split(',').map(Number),1,1]));for(const [rect,height] of [[data.watch.solid_cell_rect,150],[data.opera.solid_cell_rect,180],...data.unnamed_frontage_reservations.map(p=>[p.solid_cell_rect,110])])pts.push(...corners(rect),...corners(rect,height));const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);zoom=Math.max(.1,Math.min((r.width-36)/(maxX-minX),(r.height-110)/(maxY-minY)));cam={x:(minX+maxX)/2,y:(minY+maxY)/2+(r.height*.06-12)/zoom};}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}
function corners(r,height=0){const [x,y,w,h]=r;return [[x-.5,y-.5],[x+w-.5,y-.5],[x+w-.5,y+h-.5],[x-.5,y+h-.5]].map(p=>project(p,height));}
function building(rect,height,name,color){const ground=corners(rect),roof=corners(rect,height);const p=project(player);const minX=Math.min(...ground.map(p=>p.x)),maxX=Math.max(...ground.map(p=>p.x));const behind=player[0]+player[1]<rect[0]+rect[1]+rect[2]+rect[3]-2;const overlaps=p.x>minX-18&&p.x<maxX+18&&p.y>Math.min(...roof.map(p=>p.y))&&p.y<Math.max(...ground.map(p=>p.y));ctx.save();if(fade&&behind&&overlaps)ctx.globalAlpha=.28;polygon([ground[1],ground[2],roof[2],roof[1]],'#655b4e','#2b2d2a');polygon([ground[2],ground[3],roof[3],roof[2]],'#857762','#2b2d2a');polygon(roof,color,'#b6a58a');if(name==='WATCH HOUSE'){const d=project([0,-.5]);ctx.fillStyle='#172329';ctx.fillRect(d.x-13,d.y-60,26,60);ctx.strokeStyle='#c2ae7f';ctx.lineWidth=2;ctx.strokeRect(d.x-13,d.y-60,26,60);}ctx.fillStyle='#f6e5bf';ctx.font='bold 14px system-ui';ctx.textAlign='center';const center=project([rect[0]+(rect[2]-1)/2,rect[1]+(rect[3]-1)/2],height);ctx.fillText(name,center.x,center.y);ctx.restore();}
function person(p,id,meta,moving=false){const at=project(p);ctx.fillStyle='#080f1460';ctx.beginPath();ctx.ellipse(at.x,at.y,13,5,0,0,Math.PI*2);ctx.fill();const im=assets[id];if(im){const f=moving?meta.walk[Math.floor(performance.now()/150)%meta.walk.length]:0,s=60/meta.visibleHeight;ctx.drawImage(im,(f%meta.cols)*meta.cellWidth,Math.floor(f/meta.cols)*meta.cellHeight,meta.cellWidth,meta.cellHeight,at.x-meta.footX*s,at.y-meta.footY*s,meta.cellWidth*s,meta.cellHeight*s);}else{ctx.fillStyle='#d0b36c';ctx.fillRect(at.x-7,at.y-45,14,45);}}
function frame(now){
 requestAnimationFrame(frame);if(document.hidden)return;
 const modal=$('atlas-dialog').open||$('door-dialog').open;
 if(!modal&&now-lastMove>140&&route.length){player=route.shift();steps++;lastMove=now;update();}
 if(!modal&&now-lastNPC>420){lastNPC=now;if(!npcRoute.length){const stops=[[9,3],[9,4],[-5,4],[-5,3]];npcRoute=pathBetween(walk,npc,stops[npcIndex++%stops.length])||[];}if(npcRoute.length)npc=npcRoute.shift();canvas.dataset.npc=cellKey(npc);}
 const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.save();ctx.translate(r.width/2,r.height*.56);ctx.scale(zoom,zoom);if(following)cam={x:project(player).x,y:project(player).y-45};ctx.translate(-cam.x,-cam.y);
 const visible=[...walk].map(k=>k.split(',').map(Number));
 for(const p of visible)polygon(corners([...p,1,1]),'#8d897a','#555d57');
 if(assets['mate-paving-v21']){ctx.save();ctx.beginPath();for(const p of visible){const c=corners([...p,1,1]);ctx.moveTo(c[0].x,c[0].y);c.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.closePath();}ctx.clip();ctx.globalAlpha=.6;ctx.drawImage(assets['mate-paving-v21'],-520,-280,1040,780);ctx.restore();}
 for(const p of visible)polygon(corners([...p,1,1]),null,'#b6b19a30');
 for(const t of targets){const q=project(t.p);ctx.fillStyle=visited.has(t.id)?'#729a6e':'#dfbb68';ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();}
 if(route.length){ctx.strokeStyle='#f4d279';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();[player,...route].map(p=>project(p)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}
 const objects=[{z:player[0]+player[1],draw:()=>person(player,'watch-recruit',recruit,!!route.length)},{z:npc[0]+npc[1],draw:()=>person(npc,'colon',colon,true)},
 {z:-1,draw:()=>building(data.watch.solid_cell_rect,150,'WATCH HOUSE','#4d6268')},
 {z:18,draw:()=>building(data.opera.solid_cell_rect,180,'OPERA','#534d60')},
 ...data.unnamed_frontage_reservations.map(f=>({z:f.solid_cell_rect[0]+f.solid_cell_rect[1]+f.solid_cell_rect[2]+f.solid_cell_rect[3]-2,draw:()=>building(f.solid_cell_rect,110,'','#5b645b')})),
 ...data.prop_reservations.map(p=>({z:p.cell_rect[0]+p.cell_rect[1]+2,draw:()=>building(p.cell_rect,16,'','#766043')})),
 {z:8.1,draw:()=>{polygon(corners(data.fountain.proposed_solid_cell_rect,8),'#658689','#a9b7a5');const p=project(data.fountain.ground_contact_centre);ctx.fillStyle='#a5a18a';ctx.fillRect(p.x-9,p.y-63,18,55);ctx.fillStyle='#c4b68d';ctx.beginPath();ctx.arc(p.x,p.y-66,12,0,Math.PI*2);ctx.fill();}}];
 objects.sort((a,b)=>a.z-b.z).forEach(o=>o.draw());
 ctx.restore();
}
canvas.addEventListener('pointerdown',e=>{if($('atlas-dialog').open||$('door-dialog').open)return;const r=canvas.getBoundingClientRect();go(unproject({x:(e.clientX-r.left-r.width/2)/zoom+cam.x,y:(e.clientY-r.top-r.height*.56)/zoom+cam.y}));canvas.focus();});
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>step(...b.dataset.step.split(',').map(Number))));
document.addEventListener('keydown',e=>{if($('atlas-dialog').open||$('door-dialog').open||e.target.closest('input,textarea,select'))return;const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(d){e.preventDefault();step(...d);}if(e.key===' '){e.preventDefault();$('use').click();}});
$('follow').onclick=()=>{following=true;zoom=.9;};$('whole').onclick=whole;
$('fade').onclick=()=>{fade=!fade;$('fade').textContent='Fade roofs: '+(fade?'ON':'OFF');$('fade').setAttribute('aria-pressed',String(fade));};
$('save').onclick=()=>{route=[];if(save())tell('Separate layout patrol saved on this device.');update();};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent='Sound '+(sound?'ON':'OFF');$('sound').setAttribute('aria-pressed',String(sound));window.CWTeamAudio.setEnabled(sound);};
$('use').onclick=()=>{route=[];if(cellKey(player)==='0,0'){entered=true;window.CWTeamAudio.cue('door-open');$('door-dialog').showModal();}else if(cellKey(player)==='0,8')tell('Opera approach reached. No Opera interior is part of this layout test.');else go([0,0]);};
$('door-exit').onclick=()=>{$('door-dialog').close();window.CWTeamAudio.cue('door-close');tell('Returned to the Watch entrance.');update();canvas.focus();};
$('door-dialog').addEventListener('cancel',()=>{tell('Returned to the Watch entrance.');});
for(const p of atlas.landmarks){const o=document.createElement('option');o.value=p.lf_id;o.textContent=p.lf_id+' · '+p.name;$('place-list').appendChild(o);}
function placeDetail(){const p=atlas.landmarks.find(p=>p.lf_id===$('place-list').value);$('place-detail').textContent=(p.location_copy_provenance?.proposal_location_note||'Original measured placement; not a verified canonical parcel.')+' Proposed footprint '+p.footprint_xywh[2]+' × '+p.footprint_xywh[3]+' design cells. Approach ['+p.approach_xy.join(', ')+']; facing '+p.facing+'.';}
$('place-list').onchange=placeDetail;placeDetail();$('atlas-open').onclick=()=>{route=[];$('atlas-dialog').showModal();};$('atlas-close').onclick=()=>$('atlas-dialog').close();
addEventListener('resize',size);new ResizeObserver(size).observe(canvas);size();update();tell(saveProblem||'Walk the measured square. Tap paving or use the direction buttons.');requestAnimationFrame(frame);

import './cw-joystick.js?v=p21-b407-s039-reuse';
import {bridgeWalk,project,unproject,cellKey,pathBetween,validBridgeSave,cutawayOpacity} from './bridge-core.mjs?v=p21-b407-s039-reuse';
import {createActorPainter} from './character-actors.mjs?v=recruit-art-v2-r3';
const $=id=>document.getElementById(id),KEY='city_watch_lab01_v06_bridge',walk=bridgeWalk();
await window.CW_LAB.prepare();
const characterPainter=await createActorPainter({stepMS:140});
const canvas=$('bridge-scene'),ctx=canvas.getContext('2d');
const [art,recruit,colon]=await Promise.all(['assets/misbegot/manifest.json','assets/team-v05/watch-recruit.json','assets/team-v05/colon.json'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error('Bridge source missing: '+p);return r.json();}))).catch(e=>{$('bridge-message').textContent=e.message;throw e;});
let player=[.5,.5],npc=[46.5,-.5],route=[],npcRoute=[],steps=0,blocked=0,visits=new Set(),met=false,following=true,zoom=.9,cam={x:0,y:0},fade=true,lastMove=0,lastNPC=0,npcEnd=.5,sound=false;
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(validBridgeSave(v,walk)){player=v.position;steps=v.steps;visits=new Set((v.visits||[]).filter(x=>['ankh','morpork'].includes(x)));met=!!v.met;}}catch{}
if(cellKey(player)===cellKey(npc))npc=[46.5,1.5];
const assets=new Map();
await Promise.all(art.files.filter(f=>/^(runtime_1x|\.\.\/river-bridges-v1)\//.test(f.file)&&f.mode==='RGBA').map(f=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{if(im.naturalWidth!==f.dimensions[0]||im.naturalHeight!==f.dimensions[1]){reject(Error('Bridge dimensions mismatch: '+f.file));return;}const a={im,...f};if(/house_/.test(f.file)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);a.alpha=cx.getImageData(0,0,im.width,im.height).data;}assets.set(f.file.split('/').pop().replace(/(\.exact)?\.(webp|png)$/,''),a);resolve();};im.onerror=()=>reject(Error('Bridge image could not load: '+f.file));im.src='assets/misbegot/'+f.file;})));
const people={};await Promise.all(['watch-recruit','colon'].map(id=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{people[id]=im;resolve();};im.onerror=reject;im.src='assets/team-v05/'+id+'.webp';})));
const layer=id=>assets.get('misbegot_'+id+'_RGBA');
const houses=art.houses_art_only.map(h=>{const id=h.template.replace(/^house_/,'');const a=layer('house_'+id);if(!a)throw Error('Missing house template '+id);return {...h,a,front:h.t<0,p:project([h.s,h.t])};});
const fronts=houses.filter(h=>h.front),rears=houses.filter(h=>!h.front);
$('bridge-art-credit').textContent=art.id+' · '+houses.length+' individually authored houses · Mate / original art proposals. Not final creative acceptance.';
function tell(t){$('bridge-message').textContent=t;}
function modal(){return !!window.CW_P20_INPUT_BLOCKED||!!document.querySelector('dialog[open]');}
function update(){
 if(player[0]<=1)visits.add('ankh');if(player[0]>=46)visits.add('morpork');
 if(Math.hypot(player[0]-npc[0],player[1]-npc[1])<=2.2)met=true;
 if(visits.size===2&&met)window.dispatchEvent(new CustomEvent('cw:review-step',{detail:'bridge'}));
 $('bridge-location').textContent=player[0]<=1?'Ankh-side landing':player[0]>=46?'Morpork-side landing':'Misbegot · inhabited span';
 $('bridge-position').textContent=`Span ${Math.floor(player[0])+1}/47 · lane ${player[1]+2.5}/4 · ${steps} steps${route.length?' · Walking…':''}`;
 $('bridge-route').textContent=player[0]<23.5?'Walk to far landing':'Walk to near landing';
 canvas.dataset.position=cellKey(player);canvas.dataset.npc=cellKey(npc);canvas.dataset.walkCells=String(walk.size);canvas.dataset.steps=String(steps);canvas.dataset.blocked=String(blocked);canvas.dataset.houses=String(houses.length);canvas.dataset.met=String(met);canvas.dataset.visits=[...visits].join(',');
}
function nav(exclude){const v=new Set(walk);v.delete(cellKey(exclude));return v;}
function step(ds,dt){if(modal())return;route=[];const q=[player[0]+ds,player[1]+dt];if(!walk.has(cellKey(q))||(ds&&dt&&(!walk.has(cellKey([player[0]+ds,player[1]]))||!walk.has(cellKey([player[0],player[1]+dt]))||cellKey([player[0]+ds,player[1]])===cellKey(npc)||cellKey([player[0],player[1]+dt])===cellKey(npc)))){blocked++;tell('The parapet and river edge are solid. Stay on the deck.');update();return;}if(cellKey(q)===cellKey(npc)){tell('Let the patrol pass, or take another lane.');return;}player=q;steps++;update();}
function go(p){if(modal())return;const v=pathBetween(nav(npc),player,p);if(v===null){blocked++;tell('That point is outside the clear deck. Tap the paving.');update();return;}route=v;tell('Walking along the bridge. Touch the movement circle to stop.');update();}
function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);if(!following)whole();}
function whole(){following=false;const r=canvas.getBoundingClientRect(),bounds=[];for(const a of assets.values())if(!/house_/.test(a.file))bounds.push([-a.native_anchor_px[0],-a.native_anchor_px[1],a.dimensions[0],a.dimensions[1]]);for(const h of houses)bounds.push([h.p.x-h.a.native_anchor_px[0],h.p.y-h.a.native_anchor_px[1],...h.a.dimensions]);const minX=Math.min(...bounds.map(b=>b[0])),maxX=Math.max(...bounds.map(b=>b[0]+b[2])),minY=Math.min(...bounds.map(b=>b[1])),maxY=Math.max(...bounds.map(b=>b[1]+b[3]));zoom=Math.min((r.width-24)/(maxX-minX),(r.height-110)/(maxY-minY));cam={x:(minX+maxX)/2,y:(minY+maxY)/2+(r.height*.06-10)/zoom};}
function draw(a,p={x:0,y:0},opacity=1){if(!a)return;ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(a.im,p.x-a.native_anchor_px[0],p.y-a.native_anchor_px[1]);ctx.restore();}
function alphaAt(h,p){const x=Math.floor(p.x-h.p.x+h.a.native_anchor_px[0]),y=Math.floor(p.y-h.p.y+h.a.native_anchor_px[1]);return x>=0&&y>=0&&x<h.a.dimensions[0]&&y<h.a.dimensions[1]?h.a.alpha[(y*h.a.dimensions[0]+x)*4+3]/255:0;}
function cutaways(renderPlayer=player,renderNPC=npc){const opacities=new Map(fronts.map(h=>[h.id,1]));let maximum=0;const samples=[renderPlayer,renderNPC].map(p=>{const q=project(p),s=[],h=p===renderPlayer?window.CWCharacters.height(characterPainter.playerMeta,characterPainter.playerKey):58;for(const dx of [-7,0,7])for(const dy of [-.9,-.7,-.5,-.3])s.push({x:q.x+dx,y:q.y+dy*h});return s;});if(fade)for(const points of samples){const overlaps=fronts.filter(h=>points.some(p=>alphaAt(h,p)>.02));maximum=Math.max(maximum,overlaps.length);const opacity=cutawayOpacity(overlaps.length);for(const h of overlaps)opacities.set(h.id,Math.min(opacities.get(h.id),opacity));}let minimum=1;for(const points of samples)for(const p of points){let tr=1;for(const h of fronts)tr*=1-opacities.get(h.id)*alphaAt(h,p);minimum=Math.min(minimum,tr);}canvas.dataset.occluders=String(maximum);canvas.dataset.transmission=minimum.toFixed(5);canvas.dataset.faded=[...opacities].filter(([,v])=>v<1).map(([id])=>id).join(',');return opacities;}
function person(p,id,now){characterPainter.draw(ctx,p,id==='watch-recruit'?'player':'colon',project,now);}
function frame(now){requestAnimationFrame(frame);if(document.hidden||document.querySelector('#character-studio[open]'))return;
 if(!modal()){
  if(route.length&&now-lastMove>140){lastMove=now;if(cellKey(route[0])===cellKey(npc)){route=pathBetween(nav(npc),player,route.at(-1))||[];}if(route.length){player=route.shift();steps++;update();}}
  if(now-lastNPC>250){lastNPC=now;if(!npcRoute.length){const target=[npcEnd,-.5];npcRoute=pathBetween(nav(player),npc,target)||[];if(!npcRoute.length&&cellKey(npc)===cellKey(target))npcEnd=npcEnd<1?46.5:.5;}if(npcRoute.length){if(cellKey(npcRoute[0])===cellKey(player))npcRoute=[];else npc=npcRoute.shift();}update();}
 }
 const paused=modal(),renderPlayer=characterPainter.position(player,'player',now,paused),renderNPC=characterPainter.position(npc,'colon',now,paused);
 const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.fillStyle='#263f42';ctx.fillRect(0,0,r.width,r.height);ctx.save();ctx.translate(r.width/2,r.height*.56);ctx.scale(zoom,zoom);if(following){const p=project(renderPlayer);cam={x:p.x,y:p.y-75};}ctx.translate(-cam.x,-cam.y);
 ctx.strokeStyle='#79908525';ctx.lineWidth=2;for(let y=-500;y<1450;y+=28){ctx.beginPath();ctx.moveTo(-2100,y);ctx.lineTo(500,y-45);ctx.stroke();}
 draw(layer('masonry'));draw(layer('deck'));draw(layer('contact_shadow'));draw(layer('parapet_rear'));for(const h of rears)draw(h.a,h.p);
 if(route.length){ctx.strokeStyle='#f0cf77';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();[renderPlayer,...route].map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}
 const op=cutaways(renderPlayer,renderNPC);for(const a of [{p:renderPlayer,id:'watch-recruit'},{p:renderNPC,id:'colon'}].sort((a,b)=>(a.p[0]-a.p[1])-(b.p[0]-b.p[1])))person(a.p,a.id,now);
 draw(layer('parapet_front'));for(const h of fronts)draw(h.a,h.p,op.get(h.id));ctx.restore();canvas.dataset.characters=JSON.stringify(characterPainter.report());
}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();go(unproject({x:(e.clientX-r.left-r.width/2)/zoom+cam.x,y:(e.clientY-r.top-r.height*.56)/zoom+cam.y}));canvas.focus();});
// STRIDE circular controller: bridge projection keeps drag direction on screen.
const bridgeJoystick=window.CWJoystick.mount({element:document.querySelector('.bridge-movement > div'),buttons:[...document.querySelectorAll('[data-bridge-step]')],host:window,document,step,stepMS:140,projection:'bridge',keyMap:{ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[1,0],ArrowRight:[-1,0],w:[0,1],s:[0,-1],a:[1,0],d:[-1,0]},blocked:()=>document.hidden||modal(),onEngage:()=>{route=[];},onStop:()=>{route=[];}});
window.CW_MOVEMENT_JOYSTICK=bridgeJoystick;
$('bridge-follow').onclick=()=>{following=true;zoom=.9;};$('bridge-whole').onclick=whole;
$('bridge-fade').onclick=()=>{fade=!fade;$('bridge-fade').textContent='Cutaway '+(fade?'ON':'OFF');$('bridge-fade').setAttribute('aria-pressed',String(fade));};
$('bridge-appearance').onclick=()=>characterPainter.openStudio().catch(e=>tell('Appearance could not open: '+e.message));
$('bridge-route').onclick=()=>go([player[0]<23.5?46.5:.5,player[1]]);
$('bridge-save').onclick=()=>{route=[];try{localStorage.setItem(KEY,JSON.stringify({version:1,position:player.slice(),steps,visits:[...visits],met}));tell('Bridge patrol saved separately. Campaign progress is unchanged.');}catch{tell('Bridge patrol could not be saved. You can continue walking.');}update();};
$('bridge-sound').onclick=()=>{sound=!sound;window.CWTeamAudio.setEnabled(sound);$('bridge-sound').textContent='Sound '+(sound?'ON':'OFF');$('bridge-sound').setAttribute('aria-pressed',String(sound));};
addEventListener('resize',size);new ResizeObserver(size).observe(canvas);size();update();tell('Walk between the two landings. Pass the Watch patrol and compare the cutaway.');requestAnimationFrame(frame);

window.CW_PATROL_DESCRIPTION=()=>({location:$('bridge-location').textContent,position:'Span '+(Math.floor(player[0])+1)+' of 47; lane '+(player[1]+2.5)+' of 4',objective:'Objective: reach both landings and pass the Watch patrol',stats:steps+' steps; '+visits.size+' of 2 landings visited',nearby:['Watch patrol at span '+(Math.floor(npc[0])+1)+', lane '+(npc[1]+2.5)],moves:[['Toward Ankh',-1,0],['Toward rear parapet',0,1],['Toward front parapet',0,-1],['Toward Morpork',1,0]].map(([n,x,y])=>n+': '+(walk.has(cellKey([player[0]+x,player[1]+y]))&&cellKey([player[0]+x,player[1]+y])!==cellKey(npc)?'open':'blocked')).join('; '),actions:[{id:'bridge-route',label:$('bridge-route').textContent},{id:'bridge-save',label:'Save bridge patrol'}]});

window.CW_AUDIO_CONTEXT=()=>({sceneKey:'misbegot-bridge',inside:false,room:null,position:player.slice(),weather:'none',
 fountainGain:0,hearthGain:0,waterGain:0.65,woodenInterior:false});

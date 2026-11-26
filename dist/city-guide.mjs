// Where-to-go guide (Mark, 25 Nov 2026: "you don't get a clear view of where you're supposed to go").
// A few warm lantern glows along the route to the current assignment, drawn softly above the
// buildings (a route behind houses would otherwise vanish), and an arrow at the screen edge with the place name
// and distance when the destination is off screen. The target comes from the same choice as
// Duty → "Walk to current assignment"; nothing here moves the player or changes the save.
const CSS=`#city-guide-arrow{position:absolute;left:0;top:0;z-index:4;pointer-events:none;width:0;height:0}
#city-guide-arrow .cw-guide-point{position:absolute;left:0;top:0;width:26px;height:26px;background:#f5d891;clip-path:polygon(0 8%,100% 50%,0 92%,22% 50%);filter:drop-shadow(0 1px 3px #000a)}
#city-guide-arrow .cw-guide-label{position:absolute;left:0;top:14px;transform:translateX(-50%);white-space:nowrap;padding:3px 8px;border:1px solid #c9a55c;border-radius:4px;background:#1d1610e6;color:#f3e2bd;font:bold 12px/1.3 Georgia,serif}
#city-guide-arrow .cw-guide-label[data-side=above]{top:auto;bottom:14px}
#city-guide-arrow .cw-guide-label[data-edge=right]{transform:translateX(-100%)}
#city-guide-arrow .cw-guide-label[data-edge=left]{transform:none}`;
export function createCityGuide({world,streetPath,project,getPlayer,getTarget,canvas,doc=document,enabled=true}){
 let drawn=0,target=null,path=null,from=null,lastCheck=-Infinity,lastRoute=-Infinity,arrow=null,hidden=!enabled;
 const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2];
 function ensureArrow(){
  if(arrow)return arrow;
  if(!doc.getElementById('city-guide-style')){const st=doc.createElement('style');st.id='city-guide-style';st.textContent=CSS;doc.head.append(st);}
  arrow=doc.createElement('div');arrow.id='city-guide-arrow';arrow.setAttribute('aria-hidden','true');arrow.hidden=true;
  arrow.innerHTML='<span class="cw-guide-point"></span><span class="cw-guide-label"></span>';
  (canvas.parentElement||doc.body).append(arrow);return arrow;
 }
 function update(now){
  if(hidden)return;
  if(now-lastCheck<900)return;lastCheck=now;
  let next=null;try{next=getTarget();}catch{next=null;}
  const p=getPlayer();
  if(!next){target=null;path=null;return;}
  const moved=!from||Math.hypot(p[0]-from[0],p[1]-from[1])>=2;
  if(!same(next.at,target?.at)||moved&&now-lastRoute>2500){
   target=next;from=p.slice();lastRoute=now;
   try{path=streetPath(world,p,next.at.slice(0,2),next.at[2])||null;}catch{path=null;}
  }
 }
 // Ground glows: from the next step on, every second step, fading out over about thirty steps.
 function drawGround(ctx,zoom){
  if(hidden||!path||path.length<4)return;
  drawn++;const p=getPlayer();
  let start=1,best=Infinity;for(let i=0;i<Math.min(path.length,40);i++){const d=Math.hypot(path[i][0]-p[0],path[i][1]-p[1]);if(d<best){best=d;start=i+1;}}
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.filter='none';ctx.shadowBlur=0;
  for(let i=start,n=0;i<path.length&&n<14;i++,n++){
   const q=project(path[i]),a=Math.max(.25,1-n/15),R=20;
   const g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,R);
   g.addColorStop(0,`rgba(255,230,160,${.7*a})`);g.addColorStop(.3,`rgba(255,180,80,${.38*a})`);g.addColorStop(1,'rgba(255,150,50,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R/2,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 // Edge arrow in screen space, shown only while the destination is off screen.
 function drawArrow(cam,zoom,width,height){
  const el=ensureArrow();
  if(hidden||!target||!path){el.hidden=true;return;}
  const q=project(target.at),x=(q.x-cam.x)*zoom+width/2,y=(q.y-cam.y)*zoom+height/2;
  const top=140,bottom=height-110,left=34,right=width-34;
  if(x>=left&&x<=right&&y>=top&&y<=bottom){el.hidden=true;return;}
  const cx=width/2,cy=height/2,ang=Math.atan2(y-cy,x-cx),dx=Math.cos(ang),dy=Math.sin(ang);
  let k=Infinity;if(dx>0)k=Math.min(k,(right-cx)/dx);if(dx<0)k=Math.min(k,(left-cx)/dx);if(dy>0)k=Math.min(k,(bottom-cy)/dy);if(dy<0)k=Math.min(k,(top-cy)/dy);
  const ex=cx+dx*k,ey=cy+dy*k;
  el.hidden=false;el.style.transform=`translate(${Math.round(ex)}px,${Math.round(ey)}px)`;
  el.firstChild.style.transform=`translate(-50%,-50%) rotate(${ang}rad)`;el.firstChild.style.transformOrigin='50% 50%';
  const steps=Math.max(1,path.length-1),label=el.lastChild,text=target.name+' · '+steps+(steps===1?' step':' steps');
  if(label.textContent!==text)label.textContent=text;
  label.dataset.side=dy>.35?'above':'below';label.dataset.edge=dx>.5?'right':dx<-.5?'left':'mid';
 }
 // For the map: the current destination and its street route (fresh if the cached one is stale).
 function route(){
  if(hidden)return null;
  let next=null;try{next=getTarget();}catch{next=null;}
  if(!next)return null;
  const p=getPlayer();
  if(!same(next.at,target?.at)||!from||Math.hypot(p[0]-from[0],p[1]-from[1])>=2){target=next;from=p.slice();lastRoute=performance.now();try{path=streetPath(world,p,next.at.slice(0,2),next.at[2])||null;}catch{path=null;}}
  return path?{name:target.name,at:target.at,path:path.slice()}:null;
 }
 return Object.freeze({update,drawGround,drawArrow,route,
  setEnabled(on){hidden=!on;if(hidden&&arrow)arrow.hidden=true;},
  report:()=>({drawn,enabled:!hidden,target:target&&{name:target.name,at:target.at},steps:path?path.length-1:null})});
}

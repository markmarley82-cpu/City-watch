import {createReservation} from './city-e045-reservation.mjs';
import {footProbeOffsets} from './city-free-walk.mjs';
import {streetPath} from './city-movement.mjs';

const premises=[
 {id:'treacle:joinery',name:'Unnamed joinery',rect:[47,228,3,4],door:[48,227],height:124,rise:42,wall:'#967957',side:'#655340',roof:'#474e52',trim:'#3e332b',doorWidth:23},
 {id:'treacle:dyer',name:'Unnamed dye workshop',rect:[51,228,3,4],door:[50,227],height:99,rise:24,wall:'#9d735d',side:'#745842',roof:'#6a473a',trim:'#4d4235',doorWidth:35}
];
const expected='47,228 47,229 47,230 47,231 48,228 48,229 48,230 48,231 49,228 49,229 49,230 49,231 51,231'.split(' ').sort();
const outline=([x,y,w,h])=>[[x-.5,y-.5],[x+w-.5,y-.5],[x+w-.5,y+h-.5],[x-.5,y+h-.5]];
const approachNames=Object.freeze({'treacle:joinery':'Joinery','treacle:dyer':'Dye workshop'});
// These are walking-camera wayfinding labels for closed premises. Keep the
// physical landings as their anchors and let Examine replace the active cue.
export function treacleApproachLabels({world,player,activeDoor,project,camera,width,height,zoom}){
 if(!['E045','E046'].includes(player[2])||zoom<.4)return [];
 if(Math.abs(player[1]-227)>7||player[0]<41||player[0]>57)return [];
 const labels=[],padding=6;
 for(const [id,name] of Object.entries(approachNames)){
  const door=world.doors.get(id);
  if(!door||door.held||door.edge!=='E046'||activeDoor?.game_id===id)continue;
  const [x,y]=door.position;
  if(Math.hypot(x-player[0],y-player[1])>7||!world.members.get(x+','+y)?.has(door.edge))continue;
  const p=project(door.position),sx=width/2+(p.x-camera.x)*zoom,sy=height/2+(p.y-camera.y)*zoom;
  const boxWidth=name==='Joinery'?57:94, side=id==='treacle:joinery'?-1:1;
  if(width<boxWidth+padding*2||sx<padding||sx>width-padding||sy<padding||sy+30>height-padding)continue;
  const cx=Math.max(padding+boxWidth/2,Math.min(width-padding-boxWidth/2,sx+side*(boxWidth/2+8)));
  if(labels.some(l=>Math.abs(cx-l.cx)<(boxWidth+l.boxWidth)/2+4&&Math.abs(sy-l.sy)<19))continue;
  labels.push({id,name,sx,sy,cx,boxWidth});
 }
 return labels;
}
export function drawTreacleApproachLabels(ctx,view){
 const labels=treacleApproachLabels(view);
 if(!labels.length)return;
 ctx.save();
 // The caller is in world coordinates; convert once to CSS screen pixels.
 ctx.translate(view.camera.x-view.width/(2*view.zoom),view.camera.y-view.height/(2*view.zoom));
 ctx.scale(1/view.zoom,1/view.zoom);
 ctx.font='600 12px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const {name,sx,sy,cx,boxWidth} of labels){
  ctx.strokeStyle='#d6b782';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy+2);ctx.lineTo(sx,sy+9);ctx.lineTo(cx,sy+12);ctx.stroke();
  ctx.fillStyle='#25251e';ctx.fillRect(cx-boxWidth/2,sy+12,boxWidth,18);
  ctx.strokeRect(cx-boxWidth/2+.5,sy+12.5,boxWidth-1,17);
  ctx.fillStyle='#f4dfb5';ctx.fillText(name,cx,sy+21);
 }
 ctx.restore();
}
// Keep a small opening over the boots on the joined workshop footway. The
// survey found the first roof overlap at x=42 on this same public footway.
// Roofs still occlude normally beyond the officer's local walking window.
export function revealTreacleFootway({player,world,ground,objects,project,alphaAt,masks,join}){
 const [x,y,edge]=player;
 if(edge!=='E046')return;
 let gate=Math.min(1,(x-41.6)*5,(50.45-x)*5,(y-226.45)*5,(227.45-y)*5);
 if(join){
  const [a,b,c,d]=join,t=(y-a[1])/(d[1]-a[1]);
  if(t>=0&&t<=1){
   const l=a[0]+(d[0]-a[0])*t,r=b[0]+(c[0]-b[0])*t;
   gate=Math.max(gate,Math.min(1,(x-l)*6,(r-x)*6,(y-a[1])*5));
  }
 }
 if(gate<=0)return;
 if(!footProbeOffsets.every(([dx,dy])=>{
  const p=[x+dx,y+dy],key=p.map(Math.round).join(',');
  return world.members.get(key)?.has(edge)&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[edge]);
 }))return;
 const q=project(player);
 for(const o of objects){
  const own=masks.get(o.id);
  if(!own||!premises.some(p=>p.id===o.id)||![-7,0,7].some(dx=>alphaAt(o,{x:q.x+dx,y:q.y})>.02))continue;
  own.push({x:q.x,y:q.y-11,toY:q.y+13,rx:27,ry:31,opacity:1-.94*gate,groundOnly:true});
 }
}
function paintings(p,canvas,texture){
 const make=()=>{const c=canvas();c.width=250;c.height=305;return c;};
 const body=make(),roof=make(),glow=make(),anchors=[];
 const H=p.height,R=p.rise;
 const q=(x,y,z=0)=>[168+28*(x-y),216+14*(x+y)-z];
 const poly=(g,pts,fill,stroke)=>{g.beginPath();pts.forEach((v,i)=>g[i?'lineTo':'moveTo'](...v));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}};
 // Ground origin is the middle of the street-facing wall.
 // Both plans have a real return; their roof form, openings and floor count differ.
 const a=-1.5,b=1.5,d=4;
 // Deterministic stone and slate marks follow the actual planes.
 let seed=H;
 const random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const grain=(ctx,plane,bounds,count)=>{
  ctx.save();ctx.beginPath();plane.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](...v));ctx.closePath();ctx.clip();
  const [x,y,w,h]=bounds;
  for(let i=0;i<count;i++){
   ctx.fillStyle=random()>.47?'#f1d6a317':'#231a2024';
   ctx.fillRect(x+random()*w,y+random()*h,1+random()*5,1+random()*2);
  }
  ctx.restore();
 };
 const masonry=(ctx,point,length,height,brick)=>{
  const base=brick?[145,107,84]:[145,128,99];
  for(let z=3,row=0;z<height;z+=8,row++){
   for(let u=-(row%2)*.37;u<length;){
    const end=u+.47+random()*.5,f=Math.max(0,u),t=Math.min(length,end)-.025;
    if(t>f){
     const n=(random()-.51)*42,damp=17*Math.exp(-z/23);
     const rgb=base.map((v,i)=>Math.round(v+n-damp-i*2));
     const h=Math.min(z+7.25,height-.6);
     poly(ctx,[point(f,z),point(t,z),point(t,h),point(f,h)],'rgb('+rgb.join(',')+')');
     ctx.strokeStyle='#ead4a03f';ctx.beginPath();ctx.moveTo(...point(f,h));ctx.lineTo(...point(t,h));ctx.stroke();
    }
    u=end;
   }
  }
 };
 // Project the paint from each material square onto the same plane as the
 // masonry, before trim and glazing. No change to the structural outlines.
 const material=(ctx,index,point,length,height,strength,shade=0)=>{
  if(!texture)return;
  const n=Math.floor(texture.width/2),m=Math.floor(texture.height/2),inset=8;
  const a=point(0,0),b=point(length,0),c=point(0,height);
  ctx.save();
  ctx.beginPath();[a,b,point(length,height),c].forEach((v,i)=>ctx[i?'lineTo':'moveTo'](...v));ctx.closePath();ctx.clip();
  ctx.globalAlpha=strength;
  ctx.setTransform((b[0]-a[0])/n,(b[1]-a[1])/n,(a[0]-c[0])/m,(a[1]-c[1])/m,c[0],c[1]);
  ctx.drawImage(texture,n*(index%2)+inset,m*Math.floor(index/2)+inset,n-2*inset,m-2*inset,0,0,n,m);
  ctx.restore();
  if(shade)poly(ctx,[a,b,point(length,height),c],'rgba(37,27,24,'+shade+')');
 };
 const g=body.getContext('2d'),r=roof.getContext('2d');
 poly(g,[q(a,0),q(b,0),q(b,0,H),q(a,0,H)],p.wall,'#483b2f');
 poly(g,[q(b,0),q(b,d),q(b,d,H),q(b,0,H)],p.side,'#423729');
 const lines=(ctx,x0,x1,y,z,dx=0)=>{ctx.beginPath();ctx.moveTo(...q(x0,y,z));ctx.lineTo(...q(x1,y+dx,z));ctx.stroke();};
 g.strokeStyle='#493c2e52';
 for(let z=8;z<H;z+=9){lines(g,a,b,0,z);lines(g,b,b,0,z,d);}
 poly(g,[q(a,0,5),q(b,0,5),q(b,0),q(a,0)],'#5d5348');
 grain(g,[q(a,0),q(b,0),q(b,0,H),q(a,0,H)],[0,0,250,305],3700);
 grain(g,[q(b,0),q(b,d),q(b,d,H),q(b,0,H)],[0,0,250,305],3800);
 masonry(g,(u,z)=>q(a+u,0,z),3,H,H<110);
 masonry(g,(u,z)=>q(b,u,z),d,H,H<110);
 material(g,H>110?0:1,(u,z)=>q(a+u,0,z),3,H,.77,.05);
 material(g,H>110?0:1,(u,z)=>q(b,u,z),d,H,.72,.23);
 // Footing is part of the building plane; it adds no collision outside
 // the surveyed rectangle. Break the otherwise straight wall-to-cobbles seam.
 const footing=(point,length,side)=>{
  poly(g,[point(0,0),point(length,0),point(length,9),point(0,9)],side?'#51473a':'#6e6250');
  for(let left=0;left<length;){
   const right=Math.min(length,left+.29+random()*.32),h=6+random()*4;
   poly(g,[point(left,1),point(right-.021,1),point(right-.021,h),point(left,h)],random()>.55?'#8e8069':'#776a55','#514638');
   left=right;
  }
 };
 footing((u,z)=>q(a+u,0,z),3,false);
 footing((u,z)=>q(b,u,z),d,true);
 const dye=p.id.endsWith('dyer'), doorX=dye?-1.5:0,w=p.doorWidth/56;
 const portal=(u,z)=>dye?q(doorX,u+.58,z):q(doorX+u,0,z);
 if(dye){poly(g,[q(a,0),q(a,d),q(a,d,H),q(a,0,H)],p.side,'#423729');masonry(g,(u,z)=>q(a,u,z),d,H,true);material(g,1,(u,z)=>q(a,u,z),d,H,.75,.21);}
 poly(g,[portal(-w,0),portal(w,0),portal(w,62),portal(-w,62)],'#504337','#30271f');
 poly(g,[portal(-w+.08,4),portal(w-.08,4),portal(w-.08,57),portal(-w+.08,57)],p.trim,'#252320');
 g.strokeStyle='#c09b7060';
 for(let i=1;i<6;i++){const u=-w+i*(2*w/6);g.beginPath();g.moveTo(...portal(u,4));g.lineTo(...portal(u,57));g.stroke();}
 for(const z of [16,42])poly(g,[portal(-w+.08,z),portal(w-.08,z),portal(w-.08,z+3),portal(-w+.08,z+3)],'#6b5340');
 poly(g,[portal(-w-.10,0),portal(w+.10,0),portal(w+.10,4),portal(-w-.10,4)],'#a99779');
 const window=(x,z,w,h)=>{
  const pts=[q(x,0,z),q(x+w,0,z),q(x+w,0,z+h),q(x,0,z+h)];
  anchors.push(q(x+w/2,0,z+h/2));poly(g,pts,'#3b3730','#aa9271');poly(glow.getContext('2d'),pts,'#efbd70');
  g.strokeStyle=p.trim;lines(g,x,x+w,0,z+h/2);
 };
 if(H>110){window(.25,30,.76,28);window(-1.05,82,.65,27);window(.26,82,.65,27);}
 else{window(-1.22,42,.56,24);window(.85,55,.38,15);}
 // The near return closes the solid envelope on the side facing the camera.
 poly(g,[q(a,d),q(b,d),q(b,d,H),q(a,d,H)],p.wall,'#483b2f');
 g.strokeStyle='#493c2e70';
 for(let z=8;z<H;z+=9){
  g.beginPath();g.moveTo(...q(a,d,z));g.lineTo(...q(b,d,z));g.stroke();
  for(let x=a+((z/9)%2)*.35;x<b;x+=.7){if(x<=a)continue;g.beginPath();g.moveTo(...q(x,d,z-8));g.lineTo(...q(x,d,z));g.stroke();}
 }
 poly(g,[q(a,d,8),q(b,d,8),q(b,d),q(a,d)],'#635644');
 grain(g,[q(a,d),q(b,d),q(b,d,H),q(a,d,H)],[0,0,250,305],3400);
 for(const x of H>110?[-1.45,-.04,1.45]:[-1.44,1.43]){
  poly(g,[q(x-.06,d,8),q(x+.06,d,8),q(x+.06,d,H),q(x-.06,d,H)],p.trim);
 }
 masonry(g,(u,z)=>q(a+u,d,z),3,H,H<110);
 material(g,H>110?0:1,(u,z)=>q(a+u,d,z),3,H,.82,.08);
 footing((u,z)=>q(a+u,d,z),3,false);
 for(const x of H>110?[-1.45,-.04,1.45]:[-1.44,1.43]){
  poly(g,[q(x-.065,d,4),q(x+.065,d,4),q(x+.065,d,H),q(x-.065,d,H)],p.trim,'#3a2b23');
 }
 if(H>110){
  poly(g,[q(a,d,64),q(b,d,64),q(b,d,72),q(a,d,72)],'#514031','#352921');
  for(const [x,x2] of [[a,-.06],[.05,b]])poly(g,[q(x,d,73),q(x+.09,d,73),q(x2,d,112),q(x2-.09,d,112)],'#574637');
 }
 // Visible return: a joinery work window and a dye-house drying grille.
 const bay=H>110?[-1.08,.88,37,35]:[-1.05,.12,37,30];
 const [l,h,z,k]=bay, pane=(x,v)=>q(x,d,v);
 poly(g,[pane(l-.11,z-4),pane(h+.11,z-4),pane(h+.11,z+k+5),pane(l-.11,z+k+5)],'#b19a79','#5b4935');
 poly(g,[pane(l,z),pane(h,z),pane(h,z+k),pane(l,z+k)],'#35332f','#49392a');
 const bars=H>110?4:6;
 for(let j=0;j<bars;j++){
  const x=l+(h-l)*j/bars,next=l+(h-l)*(j+1)/bars;
  poly(g,[pane(x+.034,z+3),pane(next-.034,z+3),pane(next-.034,z+k-3),pane(x+.034,z+k-3)],H>110?(j%2?'#887454':'#77674e'):'#625145');
  if(H>110)poly(glow.getContext('2d'),[pane(x+.034,z+3),pane(next-.034,z+3),pane(next-.034,z+k-3),pane(x+.034,z+k-3)],'#dba657');
 }
 poly(g,[pane(l-.15,z-6),pane(h+.15,z-6),pane(h+.15,z-2),pane(l-.15,z-2)],'#aa967b','#4e3f32');
 if(H>110)anchors.push(pane((l+h)/2,z+k/2));
 if(H<110){
  poly(g,[pane(.44,14),pane(1.22,14),pane(1.22,40),pane(.44,40)],'#695544','#42352a');
  for(const y of [19,25,31,37]){g.strokeStyle='#bea07b77';g.beginPath();g.moveTo(...pane(.48,y));g.lineTo(...pane(1.18,y-2));g.stroke();}
 }
 // Break the flat return with a recessed lintel and a short canopy.
 // Its feet retain the exact structural envelope.
 const lintel=(x,y,z)=>q(x,d+y,z);
 const lift=H>110?76:73,lo=H>110?-1.27:-1.19,hi=H>110?1.07:.29;
 poly(g,[lintel(lo,0,lift-13),lintel(hi,0,lift-13),lintel(hi,0,lift),lintel(lo,0,lift)],'#30292065');
 poly(g,[lintel(lo,0,lift+7),lintel(hi,0,lift+7),lintel(hi,.30,lift),lintel(lo,.30,lift)],H>110?'#777268':'#83644f','#483c31');
 poly(g,[lintel(lo,.30,lift),lintel(hi,.30,lift),lintel(hi,.30,lift-3),lintel(lo,.30,lift-3)],'#43372d');
 g.strokeStyle='#c1a67b82';g.beginPath();g.moveTo(...lintel(lo,.30,lift+.5));g.lineTo(...lintel(hi,.30,lift+.5));g.stroke();
 for(const x of [lo+.12,hi-.12])poly(g,[lintel(x,0,lift-12),lintel(x+.08,0,lift-12),lintel(x+.08,.26,lift-2),lintel(x,.26,lift-2)],'#4c3b2f','#3a3026');
 const wx=H>110?-.65:.35, wz=H>110?77:48;
 const returnGlass=[q(wx,d,wz),q(wx+.58,d,wz),q(wx+.58,d,wz+24),q(wx,d,wz+24)];
 anchors.push(q(wx+.29,d,wz+12));poly(g,returnGlass,'#403b32','#b39777');
 poly(glow.getContext('2d'),returnGlass,'#efbd70');
 const ridge=p.id.endsWith('joinery')?1.7:2.55;
 poly(r,[q(a-.14,-.16,H),q(b+.14,-.16,H),q(b+.14,ridge,H+R),q(a-.14,ridge,H+R)],p.roof,'#393330');
 poly(r,[q(a-.14,ridge,H+R),q(b+.14,ridge,H+R),q(b+.14,d+.15,H),q(a-.14,d+.15,H)],p.trim,'#393330');
 poly(r,[q(b+.14,-.16,H),q(b+.14,ridge,H+R),q(b+.14,d+.15,H)],p.side,'#393330');
 r.strokeStyle='#ddd1a827';for(let i=1;i<9;i++)lines(r,a-.14,b+.14,ridge*i/9,H+R*i/9);
 for(const plane of [
  [q(a-.14,-.16,H),q(b+.14,-.16,H),q(b+.14,ridge,H+R),q(a-.14,ridge,H+R)],
  [q(a-.14,ridge,H+R),q(b+.14,ridge,H+R),q(b+.14,d+.15,H),q(a-.14,d+.15,H)]
 ])grain(r,plane,[0,0,250,305],2900);
 const tiles=(start,end,highAtStart,shade)=>{
  const zs=y=>H+R*(highAtStart?(end-y)/(end-start):(y-start)/(end-start));
  for(let row=0;row<9;row++){
   const y=start+(end-start)*row/9,yy=start+(end-start)*(row+.94)/9;
   for(let x=a-.14-(row%2)*.20;x<b+.14;x+=.42){
    const left=Math.max(a-.14,x),right=Math.min(b+.14,x+.397);
    if(right<=left)continue;
    const n=(random()-.5)*26;
    const tones=(H>110?[76,85,88]:[110,72,56]).map(v=>Math.round(v+n+shade));
    poly(r,[q(left,y,zs(y)),q(right,y,zs(y)),q(right,yy,zs(yy)),q(left,yy,zs(yy))],'rgb('+tones.join(',')+')');
    r.strokeStyle='#dabfa133';r.beginPath();r.moveTo(...q(left,yy,zs(yy)));r.lineTo(...q(right,yy,zs(yy)));r.stroke();
   }
  }
 };
 tiles(-.16,ridge,false,4);tiles(ridge,d+.15,true,-16);
 const slope=(start,end,back)=>material(r,H>110?2:3,(x,t)=>q(a-.14+x,start+(end-start)*t,H+R*(back?1-t:t)),3.28,1,.84,back?.24:.09);
 slope(-.16,ridge,false);slope(ridge,d+.15,true);
 r.strokeStyle='#2b2525aa';r.lineWidth=2;
 for(const y of [-.15,d+.14]){r.beginPath();r.moveTo(...q(a-.14,y,H));r.lineTo(...q(b+.14,y,H));r.stroke();}
 r.strokeStyle='#978575';r.beginPath();r.moveTo(...q(a-.14,ridge,H+R));r.lineTo(...q(b+.14,ridge,H+R));r.stroke();r.lineWidth=1;
 const stack=H>110?[-.67,1.24,39]:[.91,2.99,28];
 const [sx,sy,sh]=stack,at=H+R*(sy<=ridge?sy/ridge:(d-sy)/(d-ridge));
 poly(r,[q(sx,sy,at),q(sx+.4,sy,at),q(sx+.4,sy,at+sh),q(sx,sy,at+sh)],'#795b4a','#463631');
 poly(r,[q(sx+.4,sy,at),q(sx+.4,sy+.33,at),q(sx+.4,sy+.33,at+sh),q(sx+.4,sy,at+sh)],'#574335','#463631');
 poly(r,[q(sx-.05,sy-.05,at+sh),q(sx+.45,sy-.05,at+sh),q(sx+.45,sy+.38,at+sh),q(sx-.05,sy+.38,at+sh)],'#a98e6d','#463631');
 // Add weathering at the eave and canted edge, inside the roof plane.
 for(let i=0;i<75;i++){
  const x=a+random()*3,y=d-.08-random()*.31,h=H+R*(d+.15-y)/(d+.15-ridge);
  const [px,py]=q(x,y,h);
  r.fillStyle=i%3?'#352b2346':'#bfa57c60';r.fillRect(px,py,1+random()*3,1);
 }
 // Keep frames readable after the emission pass, as on neighbouring shops.
 const emission=glow.getContext('2d');emission.globalCompositeOperation='destination-out';
 for(const [x,y] of anchors){emission.fillStyle='#000b';emission.fillRect(x-1,y-15,2,30);emission.fillRect(x-14,y,28,2);}
 emission.globalCompositeOperation='source-over';
 // Mount each lantern on the plane that actually contains its door. Their
 // brackets project out of opposite walls toward their existing landings.
 const mount=dye?q(a,1.5,73):q(-.69,0,73);
 const crown=dye?q(a-.24,1.5,72):q(-.69,-.27,72);
 const pool=dye?q(-2,-.5):q(0,-.5);
 const [lx,ly]=crown,[mx,my]=mount,span=dye?5.5:4.5;
 g.lineCap='round';
 g.strokeStyle='#332c25';g.lineWidth=4;
 g.beginPath();g.moveTo(mx,my+7);g.lineTo(mx,my-2);g.quadraticCurveTo(mx,ly-4,lx,ly);g.stroke();
 g.strokeStyle='#907b62';g.lineWidth=1;
 g.beginPath();g.moveTo(mx,my+4);g.lineTo(mx,my-2);g.quadraticCurveTo(mx,ly-5,lx,ly-1);g.stroke();
 g.lineWidth=1;g.lineCap='butt';
 poly(g,[[lx-span,ly+3],[lx,ly-1],[lx+span,ly+3],[lx+3,ly+13],[lx-3,ly+13]],'#393027','#281f1a');
 const glass=[[lx-span+1.5,ly+5],[lx+span-1.5,ly+5],[lx+2,ly+11],[lx-2,ly+11]];
 poly(g,glass,dye?'#8a775a':'#978365');
 poly(emission,glass,dye?'#e9a760':'#f1be72');
 g.fillStyle='#3d3228';g.fillRect(lx,ly+5,1,7);
 anchors.push([lx,ly+8,...pool]);
 const full=make();full.getContext('2d').drawImage(body,0,0);full.getContext('2d').drawImage(roof,0,0);
 return {body,full,glow,anchors};
}
export function stageTreacleFrontage({world,ground,objects,addSprites,lightAnchors,texture,store,Chase,createCanvas=()=>document.createElement('canvas')}){
 const reservation=createReservation({id:'treacle-frontage',schema:1,scope:{edgeID:'E046'},boundary:{epsilonWorldUnits:1e-7},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:1.5},regions:premises.map(p=>({id:p.id,worldPolygon:outline(p.rect)}))});
 const protectedCells=new Map([...world.members].filter(([k,ids])=>[...ids].some(id=>world.edges.get(id)?.band?.has(k))));
 const plan=reservation.membershipPlan(world.members,protectedCells),removed=[...plan.centres,...plan.footOnly];
 if(plan.originalConflicts.length||removed.map(o=>o.key).sort().join(' ')!==expected.join(' ')||removed.some(o=>o.edges.join()!=='E046'))throw Error('Treacle protected footprint changed');
 const priorPoint=ground.clearPoint,prior=world.canTraverse;
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:(a,b)=>!prior||prior(a,b)});
 const point=p=>gates.canStand(p)&&world.waterCollision.standClear(p,'E046')&&world.waterCollision.pointClear(p,['E046']);
 const changed=[];const sprites=[];
 try{
  for(const {key} of removed){changed.push({key,members:world.members.get(key),extra:ground.extra.get(key),blocked:ground.blocked.has(key)});world.members.delete(key);ground.extra.delete(key);ground.blocked.add(key);}
  ground.clearPoint=gates.pointClear;
  world.canTraverse=(a,b)=>Math.max(a[0],b[0])<46||Math.min(a[0],b[0])>55||Math.max(a[1],b[1])<227||Math.min(a[1],b[1])>233?(!prior||prior(a,b)):gates.canTraverse(a,b);
  const origin=[52,225,'E046'];
  for(const p of premises)if(!world.members.get(p.door.join(','))?.has('E046')||!point(p.door)||!streetPath(world,origin,p.door,'E046')?.every(point))throw Error('Treacle landing not connected '+p.id);
  const reached=new Set(),todo=[origin];
  for(let i=0;i<todo.length;i++){const p=todo[i],key=p.join(',');if(reached.has(key))continue;reached.add(key);for(const q of world.neighbours(p))if(q[2]==='E046'&&!reached.has(q.join(',')))todo.push(q);}
  const candidates=todo.filter(p=>point(p));
  const recover=record=>reservation.proposeRecovery(record,candidates,{isValidState:p=>world.members.get(p.slice(0,2).join(','))?.has(p[2]),basePointClear:p=>priorPoint(p)&&world.waterCollision.pointClear(p,['E046']),reachable:p=>reached.has(p.join(','))});
  for(const {key} of removed){const p=[...key.split(',').map(Number),'E046'];if(!recover({position:p})?.position)throw Error('Treacle save recovery missing '+key);}
  const layers=premises.map(p=>paintings(p,createCanvas,texture));
  sprites.push(...addSprites(premises.map((p,i)=>[p.id,layers[i].full,[p.rect[0]+1,p.rect[1]-.5],[168,216],1,p.rect,{sceneryKind:'building',sourceAsset:p.id,uniquePremise:true,nightEmission:layers[i].glow}])));
  for(let i=0;i<sprites.length;i++){
   const p=premises[i],o=sprites[i];o.roofHidden={...o,im:layers[i].body};o.actorFootCutaway={groundOnly:true,width:48,heightFactor:1.15,centerHeight:.25,walkingLimit:{rx:30,ry:45,opacityFloor:.42}};
   objects.push(o);lightAnchors[p.id]=layers[i].anchors;
   world.doors.set(p.id,{game_id:p.id,lf_id:'ORIGINAL INFILL',name:p.name,position:p.door,threshold:p.id.endsWith('dyer')?[50.5,228.08]:[48,227.5],edge:'E046',held:false,case_function_preserved:'The workshop is closed to the public.'});
  }
  // Commit only after the reservations, both doors and both render layers fit.
  // Keep the patrol, pending encounter origin and pursuit in one save revision.
  let recovery=null;
  if(store){
   const next=store.read(),patrol=recover(next);
   if(patrol?.blocked)throw Error(patrol.reason);
   if(patrol){next.position=patrol.position;next.cityFoot=patrol.cityFoot;}
   let pendingMoved=false,chaseMoved=false;
   const pending=next.pending,c=pending?.chase;
   if(pending){
    const origin=recover({position:pending.position});
    if(origin?.blocked)throw Error(origin.reason);
    if(origin){pending.position=origin.position;pendingMoved=true;}
    if(c&&!Chase.terminal(c)&&(pendingMoved||c.route.some(p=>recover({position:p}))||recover({position:c.lastSeen}))){
     const route=Chase.route(world,pending.position,pending.binding);
     if(!route?.length||route.some((p,i)=>i&&!world.canTraverse(route[i-1],p)))throw Error('No safe Treacle pursuit route');
     const index=Math.min(c.index,route.length-1);
     pending.chase={...c,route,index,lastSeen:route[index].slice()};
     if(!Chase.valid(pending.chase))throw Error('Invalid recovered Treacle pursuit');
     chaseMoved=true;
    }
   }
   if(patrol||pendingMoved||chaseMoved){
    if(!store.replaceRecord(next,next.revision))throw Error('Patrol changed during Treacle save recovery');
    recovery=store.read();
   }
  }
  return {removed,recover,recovery,doors:premises.map(p=>p.id)};
 }catch(e){
  for(const o of sprites){const i=objects.indexOf(o);if(i!==-1)objects.splice(i,1);delete lightAnchors[o.id];world.doors.delete(o.id);}
  ground.clearPoint=priorPoint;world.canTraverse=prior;
  for(const {key,members,extra,blocked} of changed){world.members.set(key,members);if(extra!==undefined)ground.extra.set(key,extra);if(!blocked)ground.blocked.delete(key);}
  throw e;
 }
}

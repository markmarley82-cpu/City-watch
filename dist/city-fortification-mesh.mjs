// Measured isometric solids with world-scale masonry, coping, deck and oak materials.
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
const P=([x,y,z=0])=>project([x,y],z);
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;};
const palette=['#aca18c','#b0aa98','#b5aa96','#a29b8b','#a49886','#9e9b90','#b5ac9b','#a69d8c','#9d9e94'];
const patternSets=new WeakMap();
export function createFortificationMaterials(atlas){
 const result={};for(const[name,x,y,pw,ph]of[['masonry',0,0,224,192],['coping',1,0,184,184],['deck',0,1,184,184],['timber',1,1,148,288]]){
  const w=atlas.width/2,h=atlas.height/2,c=canvas(pw,ph);c.getContext('2d').drawImage(atlas,x*w+2,y*h+2,w-4,h-4,0,0,c.width,c.height);result[name]=c;
 }
 const g=canvas(1,1).getContext('2d');patternSets.set(result,new Map(Object.entries(result).map(([k,v])=>[k,g.createPattern(v,'repeat')])));
 return result;
}
const metric=(a,b)=>Math.hypot((b[0]-a[0])*28,(b[1]-a[1])*28,(b[2]-a[2]));
function builder(materials,seed){
 const faces=[],lights=[],points=[];
 function face(v,color,{material='masonry',shade=0,depth=0,uv=null}={}){faces.push({v,color,material,shade,depth,uv});points.push(...v);}
 function box(x,y,w,d,z0,z1,color=palette[seed%9],material='masonry',topMaterial='deck'){
  const b=[x+w,y,z0],c=[x+w,y+d,z0],e=[x,y+d,z0],A=[x,y,z1],B=[x+w,y,z1],C=[x+w,y+d,z1],E=[x,y+d,z1];
  face([b,c,C,B],color,{material,shade:.23});face([c,e,E,C],color,{material,shade:.055});face([A,B,C,E],color,{material:topMaterial,shade:.015,depth:.01});
 }
 function finish(){
  const s=points.map(P),left=Math.floor(Math.min(...s.map(p=>p.x)))-2,top=Math.floor(Math.min(...s.map(p=>p.y)))-2,right=Math.ceil(Math.max(...s.map(p=>p.x)))+2,bottom=Math.ceil(Math.max(...s.map(p=>p.y)))+2;
  const c=canvas(right-left,bottom-top),g=c.getContext('2d'),patterns=patternSets.get(materials);
  faces.sort((a,b)=>a.v.reduce((n,p)=>n+p[0]+p[1],0)/a.v.length-b.v.reduce((n,p)=>n+p[0]+p[1],0)/b.v.length+a.depth-b.depth);
  for(const f of faces){const v=f.v.map(P);g.save();g.translate(-left,-top);g.beginPath();g.moveTo(v[0].x,v[0].y);for(const p of v.slice(1))g.lineTo(p.x,p.y);g.closePath();g.clip();g.fillStyle=f.color;g.fill();
   if(f.material&&v.length>=4){const [A,B,D]=f.uv||[f.v[0],f.v[1],f.v.at(-1)],[a,b,d]=[A,B,D].map(P),w=metric(A,B),h=metric(A,D),pattern=patterns.get(f.material);if(w&&h&&pattern){
    const offsetU=((A[0]*28)*(B[0]-A[0])*28+(A[1]*28)*(B[1]-A[1])*28+A[2]*(B[2]-A[2]))/w;
    const offsetV=((A[0]*28)*(D[0]-A[0])*28+(A[1]*28)*(D[1]-A[1])*28+A[2]*(D[2]-A[2]))/h;
    g.save();g.transform((b.x-a.x)/w,(b.y-a.y)/w,(d.x-a.x)/h,(d.y-a.y)/h,a.x,a.y);g.translate(-offsetU,-offsetV);g.scale(.5,.5);g.fillStyle=pattern;g.fillRect((offsetU-512)*2,(offsetV-512)*2,(w+1024)*2,(h+1024)*2);g.globalCompositeOperation='multiply';g.globalAlpha=.07;g.fillStyle=f.color;g.fillRect((offsetU-512)*2,(offsetV-512)*2,(w+1024)*2,(h+1024)*2);g.restore();
   }}
   if(f.shade){g.fillStyle='#172025';g.globalAlpha=f.shade;g.fill();g.globalAlpha=1;}g.restore();g.save();g.translate(-left,-top);g.beginPath();g.moveTo(v[0].x,v[0].y);for(const p of v.slice(1))g.lineTo(p.x,p.y);g.closePath();g.strokeStyle='#332e2545';g.lineWidth=.55;g.stroke();g.restore();
  }
  return {im:c,box:[left,top,c.width,c.height],lights:lights.map(([p,q])=>{const a=P(p),b=P(q);return [a.x-left,a.y-top,b.x-left,b.y-top];})};
 }
 return {face,box,lights,finish};
}
export function renderCurtain(materials,a,b,{width=.9,height=126,seed=0}={}){
 const m=builder(materials,seed),x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),dx=Math.abs(a[0]-b[0]),dy=Math.abs(a[1]-b[1]);
 const r=dx?[x,y-width/2,dx,width]:[x-width/2,y,width,dy];m.box(...r,0,height,palette[seed%9]);
 const length=dx||dy,count=Math.max(1,Math.floor(length/.95));
 for(let i=0;i<count;i++){const u=(i+.18)*length/count,span=length/count*.55;if(dx)m.box(x+u,y+width/2-.32,span,.32,height,height+16,palette[seed%9],'masonry','coping');else m.box(x+width/2-.32,y+u,.32,span,height,height+16,palette[seed%9],'masonry','coping');}
 return {...m.finish(),physicalRect:r};
}
export function renderGate(materials,gate,index){
 const m=builder(materials,index),c=gate.center,n=gate.outwardNormal,t=[-n[1],n[0]],world=(u,v,z=0)=>[c[0]+t[0]*u+n[0]*v,c[1]+t[1]*u+n[1]*v,z];
 const heights=[[218,218],[178,178],[202,214],[188,155],[184,202],[162,222],[196,196],[146,156],[207,184]][index];
 const spring=index===7?62:78,rise=index===7?42:48,beam=spring+rise+18,depth=2.75;
 function localBox(u,v,w,d,z0,z1,color=palette[index],material='masonry',topMaterial='deck'){
  const corners=[world(u,v),world(u+w,v),world(u+w,v+d),world(u,v+d)],xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);m.box(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),z0,z1,color,material,topMaterial);
 }
 function panel(u,v,z,w,h,color,material=null){m.face([world(u-w/2,v,z),world(u+w/2,v,z),world(u+w/2,v,z+h),world(u-w/2,v,z+h)],color,{material,depth:.04});}
 const visibleV=n[0]+n[1]>0?depth:0;
 for(const[side,u]of[[-1,-8],[1,3]]){
  const h=heights[side===-1?0:1];localBox(u,0,5,depth,0,h);
  localBox(u-.1,-.08,5.2,depth+.16,h,h+8,'#b8b19f','coping','deck');
  for(let i=0;i<4;i++){localBox(u+i*1.25,.08,.7,.4,h+8,h+24,palette[index],'masonry','coping');localBox(u+i*1.25,depth-.48,.7,.4,h+8,h+24,palette[index],'masonry','coping');}
  for(let i=0;i<2;i++){const v=.7+i*(depth-1.4);localBox(u+.08,v,.4,.55,h+8,h+24,palette[index],'masonry','coping');localBox(u+4.52,v,.4,.55,h+8,h+24,palette[index],'masonry','coping');}
  for(const z of [52,113].filter(z=>z<h-35)){const v=visibleV+(visibleV?.012:-.012);panel(u+2.5,v,z,.72,29,'#242821');panel(u+2.5,v+(visibleV?.006:-.006),z+3,.48,22,'#8f8357');panel(u+2.5,v+(visibleV?.01:-.01),z+3,.07,22,'#37362c');}
 }
 localBox(-3,0,6,depth,beam,beam+36);
 localBox(-3.12,-.08,6.24,depth+.16,beam+36,beam+44,'#b5ae9c','coping','deck');
 for(let i=0;i<6;i++)localBox(-2.8+i,.08,.55,.4,beam+44,beam+58,palette[index],'masonry','coping');
 // Stone arch mouths, filled spandrels and a textured vaulted intrados.
 for(let i=0;i<14;i++){
  const a=i*Math.PI/14,b=(i+1)*Math.PI/14,inner=q=>[3*Math.cos(q),spring+rise*Math.sin(q)],outer=q=>[3.55*Math.cos(q),spring+(rise+17)*Math.sin(q)],A=inner(a),B=inner(b),C=outer(b),D=outer(a);
  for(const v of [0,depth]){
   m.face([world(A[0],v,A[1]),world(B[0],v,B[1]),world(C[0],v,C[1]),world(D[0],v,D[1])],['#b2aa96','#aba390','#bdb5a2'][(i+index)%3],{material:'coping',depth:.02});
   m.face([world(D[0],v,D[1]),world(C[0],v,C[1]),world(C[0],v,beam+.2),world(D[0],v,beam+.2)],palette[index],{material:'masonry',shade:.06,depth:.01,uv:[world(0,v,0),world(1,v,0),world(0,v,1)]});
  }
  m.face([world(A[0],0,A[1]),world(A[0],depth,A[1]),world(B[0],depth,B[1]),world(B[0],0,B[1])],'#848174',{material:'masonry',shade:.24});
 }
 for(const u of [-2.98,2.98])m.face([world(u,.25,0),world(u,depth-.3,0),world(u,depth-.3,73),world(u,.25,73)],'#665442',{material:'timber',shade:.12});
 for(const u of [-3.8,3.8]){const v=visibleV+(visibleV?.1:-.1);panel(u,v,83,.5,19,'#483f2e');panel(u,v,86,.35,12,'#cdb16c');m.lights.push([world(u,v,92),world(u,v,0)]);}
 return {...m.finish(),footprintDepth:depth,clearWidth:6,heights,uniformGeometry:true};
}

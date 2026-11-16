import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const DIMWELL=Object.freeze({id:'DIMWELL-001',gameId:'scenic:dimwell-cobbler',name:'Dimwell cobbler workshop',locationLabel:'Dimwell · cobbler workshop frontage',building:[67,63,5,6],yard:[64,63,3,5],landing:[73,66],edge:'APRON:crypt',wallHeight:142,roofRise:76,doorHeight:77,actorHeight:60,retiredParcels:[517],retainedLegacyParcels:[],retirementNote:'Parcel 517 is retired by DIMWELL-001; nearby parcels 540, 539, 541 and 518 are independently replaced by E043-INFILL-001 through E043-INFILL-004.'});
const intersects=(a,b)=>a[0]-.5<b[0]+b[2]-.5&&a[0]+a[2]-.5>b[0]-.5&&a[1]-.5<b[1]+b[3]-.5&&a[1]+a[3]-.5>b[1]-.5;
const p=(x,y,z=0)=>project([x,y],z);
export async function createDimwellWorkshop({load,addSprites}){
 const [front,side,slate,yard]=await Promise.all(['front','side','roof','yard'].map(n=>load('assets/dimwell-001/'+n+'.webp'))),rows=[];
 function bake(id,points,rect,paint,kind='wall',lightSource=null,lightQuad=null){
  const minX=Math.floor(Math.min(...points.map(p=>p.x)))-3,minY=Math.floor(Math.min(...points.map(p=>p.y)))-3,maxX=Math.ceil(Math.max(...points.map(p=>p.x)))+3,maxY=Math.ceil(Math.max(...points.map(p=>p.y)))+3;
  const c=document.createElement('canvas');c.width=maxX-minX;c.height=maxY-minY;const g=c.getContext('2d');g.translate(-minX,-minY);paint(g);const at=[67,63],q=project(at);rows.push(['dimwell:'+id,c,at,[q.x-minX,q.y-minY],1,rect,{dimwellWorkshop:true,sceneryKind:kind,sourceAsset:'DIMWELL-001:'+id,lightSource,lightTransform:lightQuad?{quad:lightQuad.map(p=>[p.x-minX,p.y-minY])}:null}]);
 }
 function poly(g,points,colour,stroke){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(colour){g.fillStyle=colour;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1.5;g.stroke();}}
 function texture(g,im,v){g.save();poly(g,v);g.clip();const a=v[0],b=v[1],d=v[3];g.transform((b.x-a.x)/im.width,(b.y-a.y)/im.width,(d.x-a.x)/im.height,(d.y-a.y)/im.height,a.x,a.y);g.drawImage(im,0,0);g.restore();}
 const x=66.5,X=71.5,y=62.5,Y=68.5,H=DIMWELL.wallHeight,R=H+DIMWELL.roofRise,m=(x+X)/2;
 const frontFace=[p(x,Y,H),p(X,Y,H),p(X,Y),p(x,Y)],sideFace=[p(X,Y,H),p(X,y,H),p(X,y),p(X,Y)];
 // All four walls are individually sortable; the roof is a separate occluding object.
 const rear=[p(X,y,H),p(x,y,H),p(x,y),p(X,y)],back=[p(x,y,H),p(x,Y,H),p(x,Y),p(x,y)];
 bake('rear-wall',rear,[67,63,5,0],g=>texture(g,front,rear),'wall','dimwell-source:front',rear);bake('back-wall',back,[67,63,0,6],g=>texture(g,side,back),'wall','dimwell-source:side',back);
 bake('shopfront',frontFace,[67,69,5,0],g=>texture(g,front,frontFace),'wall','dimwell-source:front',frontFace);bake('door-wall',sideFace,[72,63,0,6],g=>texture(g,side,sideFace),'wall','dimwell-source:side',sideFace);
 const gable=[p(x,Y,H),p(X,Y,H),p(m,Y,R)];
 bake('gable',gable,[67,69,5,0],g=>{g.save();poly(g,gable);g.clip();const a=gable[0],b=gable[1];g.transform((b.x-a.x)/180,(b.y-a.y)/180,0,1,a.x,a.y-76);g.drawImage(front,45*front.width/768,40*front.height/768,130*front.width/768,280*front.height/768,0,0,180,76);g.restore();poly(g,gable,null,'#4c3727');g.strokeStyle='#4c3727';g.lineWidth=5;g.beginPath();g.moveTo(gable[2].x,gable[2].y);const c=p(m,Y,H);g.lineTo(c.x,c.y);g.stroke();});
 const oa=p(x-.25,Y+.25,H),ob=p(X+.25,Y+.25,H),oc=p(X+.25,y-.25,H),od=p(x-.25,y-.25,H),rf=p(m,Y+.25,R),rb=p(m,y-.25,R),roofPoints=[oa,ob,oc,od,rf,rb];
 bake('roof',roofPoints,DIMWELL.building,g=>{texture(g,slate,[oa,rf,rb,od]);texture(g,slate,[rf,ob,oc,rb]);g.strokeStyle='#43392f';g.lineWidth=4;g.lineJoin='round';for(const v of [[oa,rf,ob],[od,rb,oc],[rf,rb]]){g.beginPath();v.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();}},'roof');
 // Narrow chimney, separately sorted and textured from the new stone facade.
 const ca=[p(70.4,63.3,250),p(71.2,63.3,250),p(71.2,63.3,183),p(70.4,63.3,183)],cb=[p(71.2,63.3,250),p(71.2,62.5,250),p(71.2,62.5,183),p(71.2,63.3,183)];
 const stone=document.createElement('canvas');stone.width=100;stone.height=240;stone.getContext('2d').drawImage(front,690*front.width/768,400*front.height/768,70*front.width/768,350*front.height/768,0,0,100,240);
 bake('chimney',[...ca,...cb],[70.4,62.5,.8,.8],g=>{texture(g,stone,ca);texture(g,stone,cb);poly(g,[ca[0],ca[1],cb[1],p(70.4,62.5,250)],'#66513b','#3c3025');},'roof');
 // Upright two-plane registration fits the yard's measured stone contacts to its lot.
 const sw=yard.width/1536,sh=yard.height/1024,A=[60*sw,588*sh],B=[975*sw,998*sh],C=[1511*sw,700*sh],ta=p(63.5,67.5),tb=p(66.5,67.5),tc=p(66.5,62.5),vertical=.14/sh;
 const maps=[[0,B[0],(tb.x-ta.x)/(B[0]-A[0]),(tb.y-ta.y-vertical*(B[1]-A[1]))/(B[0]-A[0])],[B[0],yard.width,(tc.x-tb.x)/(C[0]-B[0]),(tc.y-tb.y-vertical*(C[1]-B[1]))/(C[0]-B[0])]].map(([start,end,a,b])=>({start,end,a,b,c:tb.x-a*B[0],f:tb.y-b*B[0]-vertical*B[1]}));
 const corners=maps.flatMap(m=>[[m.start,0],[m.end,0],[m.end,yard.height],[m.start,yard.height]].map(([x,y])=>({x:m.a*x+m.c,y:m.b*x+vertical*y+m.f})));
 bake('working-yard',corners,DIMWELL.yard,g=>{for(const m of maps){g.save();g.transform(m.a,m.b,0,vertical,m.c,m.f);g.beginPath();g.rect(m.start,0,m.end-m.start,yard.height);g.clip();g.drawImage(yard,0,0);g.restore();}},'private-yard');
 const steps=[p(71.5,66.2),p(72.5,66.2),p(72.5,67),p(71.5,67)];
 bake('door-step',steps,[72,66.2,1,.8],g=>{poly(g,steps,'#b7aa87','#736952');},'ground-contact');
 const group=addSprites(rows),boxes=group.map(o=>o.bounds),bounds=[Math.min(...boxes.map(b=>b[0]))-60,Math.min(...boxes.map(b=>b[1]))-25,Math.max(...boxes.map(b=>b[0]+b[2]))+80,Math.max(...boxes.map(b=>b[1]+b[3]))+100];
 return {gameId:DIMWELL.gameId,name:DIMWELL.name,locationLabel:DIMWELL.locationLabel,landing:DIMWELL.landing,edge:DIMWELL.edge,bounds,replaces:r=>intersects(r,DIMWELL.building)||intersects(r,DIMWELL.yard),report:()=>({...DIMWELL,ready:true,parts:group.length,uniqueBuildingCount:1,geometry:'independent walls, gable, pitched roof, chimney, registered private yard and doorstep',newNavigation:false,creativeAcceptance:false})};
}

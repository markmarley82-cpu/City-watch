// Local Palace exterior refit. All architectural lines originate in world
// coordinates; heights are projected vertically in source pixels.
export function drawPalaceGridExterior({paint,emission,q,roofVisible,materials}){
 const polygon=(g,polygon,fill,stroke)=>{
  g.beginPath();polygon.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();
  g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}
 };
 let seed=4613;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const grain=(pts,count)=>{
  const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1]));
  const w=Math.max(...pts.map(p=>p[0]))-x,h=Math.max(...pts.map(p=>p[1]))-y;
  paint.save();paint.beginPath();pts.forEach((p,i)=>i?paint.lineTo(...p):paint.moveTo(...p));paint.closePath();paint.clip();
  for(let n=0;n<count;n++){
   paint.fillStyle=rand()<.54?'#29262920':'#e2cf9f20';
   paint.fillRect(x+rand()*w,y+rand()*h,1+rand()*3,.5+rand()*1.5);
  }
  paint.restore();
 };
 // Transfer only surface colour and grain from the accepted Palace art.
 // The quad, all joints and the coverage of the night mask still come from q.
 const material=(quad,source,alpha)=>{
  if(!source)return;
  const [a,b,,d]=quad,[image,bx,by,w,h]=source;
  paint.save();paint.globalAlpha=alpha;
  paint.transform((b[0]-a[0])/w,(b[1]-a[1])/w,(d[0]-a[0])/h,(d[1]-a[1])/h,a[0],a[1]);
  paint.drawImage(image,bx,by,w,h,0,0,w,h);paint.restore();
 };
 const occlude=quad=>{
  emission.save();emission.globalCompositeOperation='destination-out';
  polygon(emission,quad,'#000');emission.restore();
 };
 // Map the original wall panels (and their exact emission) onto individual
 // grid-facing planes. Unlike a whole-sprite shear, roof pitches and tower
 // silhouettes do not inherit the source image's conflicting angles.
 const projectPaint=(quad,[[ax,ay],[bx,by],[dx,dy]])=>{
  const [a,b]=quad,d=quad.at(-1),sx=bx-ax,sy=by-ay,tx=dx-ax,ty=dy-ay,det=sx*ty-sy*tx;
  const ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-a[0],vy=d[1]-a[1];
  const m=[(ux*ty-vx*sy)/det,(uy*ty-vy*sy)/det,(vx*sx-ux*tx)/det,(vy*sx-uy*tx)/det];
  const draw=(g,im)=>{
   g.save();g.beginPath();quad.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip();
   g.transform(...m,a[0]-m[0]*ax-m[2]*ay,a[1]-m[1]*ax-m[3]*ay);
   g.drawImage(im,0,0);g.restore();
  };
  return draw;
 };
 const panel=(f,len,height,spec)=>{
  const [base,top,left,right]=spec.fit;
  const quad=[f(left,base),f(len-right,base),f(len-right,height-top),f(left,height-top)];
  const draw=projectPaint(quad,spec.source);
  draw(paint,materials.panels.paint);draw(emission,materials.panels.emission);
 };
 const wall=(f,len,height,near,windows,door=-1,art=null)=>{
  const tone=near?['#b6a890','#aa9b81','#a69a84','#b09f85']:['#9d917d','#988975','#a69a86','#908573'];
  const face=[f(0,0),f(len,0),f(len,height),f(0,height)];
  occlude(face);
  polygon(paint,face,tone[0],'#514b40');
  for(let z=3,row=0;z<height-1;z+=7,row++)for(let a=-.37*(row%2),i=0;a<len;a+=.76,i++){
   const left=Math.max(0,a),right=Math.min(len,a+.745),top=Math.min(height-.5,z+6);
   if(right>left&&top>z){
    const block=[f(left,z),f(right,z),f(right,top),f(left,top)];
    polygon(paint,block,tone[((i*11+row*7)%tone.length)],'#675b473a');
    material(block,materials?.stone[(i+row)%2],near?.32:.24);
   }
  }
  grain([f(0,0),f(len,0),f(len,height),f(0,height)],Math.round(len*200));
  if(art)panel(f,len,height,art);
  for(const z of [2,height-4])polygon(paint,[f(0,z),f(len,z),f(len,z+3),f(0,z+3)],near?'#bfb196':'#ad9d81','#675b4b88');
  const opening=(u,z,span,high,isDoor)=>{
   const shape=(d,t)=>[f(u-span+d,z+d*18),f(u+span-d,z+d*18),f(u+span-d,z+high-9),f(u,z+high+t),f(u-span+d,z+high-9)];
   polygon(paint,shape(0,0),'#d0bea1','#6d624e');
   polygon(paint,shape(.095,-5),isDoor?'#49392c':'#30373c','#635441');
   if(!isDoor){
    polygon(emission,shape(.12,-7),'#e7ae61');
    for(const v of [-.08,.08])polygon(paint,[f(u+v-.019,z+2),f(u+v+.019,z+2),f(u+v+.019,z+high-9),f(u+v-.019,z+high-9)],'#5d5140');
    polygon(paint,[f(u-span+.1,z+high*.38),f(u+span-.1,z+high*.38),f(u+span-.1,z+high*.38+2),f(u-span+.1,z+high*.38+2)],'#695742');
   }
  };
  // Deepen the eaves shadow in short bands tied to the actual wall plane.
  for(let j=0;j<6;j++){
   const z=height-4-j*2;
   polygon(paint,[f(0,z-2),f(len,z-2),f(len,z),f(0,z)],`rgba(38,32,30,${.28-j*.039})`);
  }
  if(art)return;
  for(const x of windows)opening(x,height*.25,.25,28,false);
  if(door>0)opening(door,0,.43,Math.min(65,height-15),true);
 };
 const roof=(x,y,w,d,z,r)=>{
  const ridge=y+d*.49, ridgeZ=z+r;
  const level=(s,a)=>[x+s,a<1?y+(ridge-y)*a:ridge+(y+d-ridge)*(a-1),a<=1?z+r*a:ridgeZ-r*(a-1)];
  const qroof=(s,a)=>q(...level(s,a));
  for(let side=0;side<2;side++){
   const slope=[qroof(-.13,side),qroof(w+.13,side),qroof(w+.13,side+1),qroof(-.13,side+1)];
   occlude(slope);polygon(paint,slope,side?'#535f66':'#65717a','#323d42');
   for(let u=-.13;u<w+.13;u+=1.5){
    const v=Math.min(u+1.5,w+.13);
    material([qroof(u,side),qroof(v,side),qroof(v,side+1),qroof(u,side+1)],materials?.slate,side?.52:.64);
   }
   // A larger section of original hand-painted slate gives each roof its
   // broad tonal variation; the slate remains clipped to the new pitch.
   if(side===1&&materials?.panels){
    paint.save();paint.globalAlpha=.72;
    projectPaint(slope,[[203,39],[370,76],[172,96]])(paint,materials.panels.paint);
    paint.restore();
   }
   for(let j=0;j<10;j++)for(let i=-1;i<Math.ceil(w/.29);i++){
    const s=Math.max(-.13,i*.29+(j%2)*.14),t=Math.min(w+.13,(i+1)*.29+(j%2)*.14);
    if(t<=s)continue;const v=side+j/10,s1=v+.094;
    const colors=side?['#4d5a62','#59646b','#525d64']:['#66727b','#5e6a74','#69747b'];
    polygon(paint,[qroof(s,v),qroof(t,v),qroof(t,s1),qroof(s,s1)],colors[((i+1)*7+j*5)%3]+'56','#38444b68');
   }
   grain([qroof(-.13,side),qroof(w+.13,side),qroof(w+.13,side+1),qroof(-.13,side+1)],Math.round(w*260));
  }
  const gable=[q(w,y,z),q(w,y+d,z),q(w,ridge,ridgeZ)];
  occlude(gable);polygon(paint,gable,'#ae9e83','#6b614d');
  if(materials?.panels){
   const draw=projectPaint(gable,[[436,132],[369,126],[397,65]]);
   draw(paint,materials.panels.paint);draw(emission,materials.panels.emission);
  }
  // Pale coping over a darker bargeboard, with the cut following the ridge.
  const verge=[q(w+.04,y-.02,z-2),q(w+.04,ridge,ridgeZ-3),q(w+.04,y+d+.02,z-2)];
  paint.beginPath();verge.forEach((p,i)=>i?paint.lineTo(...p):paint.moveTo(...p));
  paint.strokeStyle='#6a5c4c';paint.lineWidth=3;paint.stroke();
  paint.beginPath();[q(w+.05,y-.02,z),q(w+.05,ridge,ridgeZ),q(w+.05,y+d+.02,z)].forEach((p,i)=>i?paint.lineTo(...p):paint.moveTo(...p));
  paint.strokeStyle='#b9ab91';paint.lineWidth=1.25;paint.stroke();paint.lineWidth=1;
  const edge=[qroof(-.13,1),qroof(w+.13,1)];
  paint.beginPath();paint.moveTo(...edge[0]);paint.lineTo(...edge[1]);paint.strokeStyle='#adb1ab';paint.lineWidth=1.6;paint.stroke();paint.lineWidth=1;
 };
 const panelSpecs={
  street:{source:[[37,264],[325,326],[37,179]],fit:[3,5,.03,.03]},
  return:{source:[[403,320],[501,273],[403,246]],fit:[4,4,.02,.02]},
  upperReturn:{source:[[403,320],[501,273],[403,246]],fit:[25,8,.07,.07]},
  upper:{source:[[168,155],[324,190],[168,109]],fit:[74,5,.07,.07]},
 };
 const range=(x,y,w,d,eaves,rise,windows,door,upper=false)=>{
  wall((u,z)=>q(x+w,y+u,z),d,eaves,false,Array.from({length:Math.max(1,Math.floor(d/1.5))},(_,i)=>d*(i+.5)/Math.max(1,Math.floor(d/1.5))),-1,upper?panelSpecs.upperReturn:panelSpecs.return);
  wall((u,z)=>q(x+u,y+d,z),w,eaves,true,windows,door,upper?panelSpecs.upper:panelSpecs.street);
  if(roofVisible){
   roof(x,y,w,d,eaves,rise);
   // Boxed eaves with a coloured fascia and a shaded underside.
   for(const side of [-1,1]){
    const v=side<0?y-.13:y+d+.13;
    const band=[q(x-.13,v,eaves-4),q(x+w+.13,v,eaves-4),q(x+w+.13,v,eaves+.7),q(x-.13,v,eaves+.7)];
    occlude(band);polygon(paint,band,side>0?'#62594e':'#7c7060','#393b37');
   }
   if(!upper){
    const ridge=y+d*.49;
    for(const u of [x+1.1,x+3.18,x+6.1]){
     const v=y+d*.81,z=eaves+rise*(y+d-v)/(y+d-ridge),a=q(u-.30,v,z),b=q(u+.30,v,z);
     const peak=q(u,v,z+26);
     const sideFace=[b,q(u+.30,v-.62,z+10),q(u,v-.62,z+36),peak];
     occlude(sideFace);polygon(paint,sideFace,'#384654','#2b363d');
     const gable=[a,b,q(u+.30,v,z+12),peak,q(u-.30,v,z+12)];
     occlude(gable);polygon(paint,gable,'#c1af90','#6a5e4d');
     polygon(paint,[q(u-.12,v,z+3),q(u+.12,v,z+3),q(u+.12,v,z+11),q(u,v,z+17),q(u-.12,v,z+11)],'#373837','#8d8069');
     polygon(emission,[q(u-.09,v,z+5),q(u+.09,v,z+5),q(u+.09,v,z+10),q(u,v,z+14),q(u-.09,v,z+10)],'#b98248');
    }
   }
   for(const u of [x+.7,x+w-.85]){
    const v=y+d*.50,z=eaves+rise-6,top=z+25;
    polygon(paint,[q(u,v,z),q(u+.36,v,z),q(u+.36,v,top),q(u,v,top)],'#a1927b','#625849');
    polygon(paint,[q(u+.36,v,z),q(u+.36,v+.27,z),q(u+.36,v+.27,top),q(u+.36,v,top)],'#82735d','#5d5245');
    polygon(paint,[q(u-.04,v-.05,top),q(u+.39,v-.05,top),q(u+.39,v+.3,top),q(u-.04,v+.3,top)],'#c0ae90','#695e50');
   }
  }
  for(const u of [.06,w*.23,w*.55,w*.76,w-.13]){
   const v=y+d,z=eaves-11;
   polygon(paint,[q(x+u+.09,v,1),q(x+u+.38,v,1),q(x+u+.38,v,z),q(x+u+.07,v,z)],'#362a202d');
   polygon(paint,[q(x+u-.13,v,0),q(x+u+.14,v,0),q(x+u+.1,v,z),q(x+u-.09,v,z)],'#baaa8f','#7a6a55');
   polygon(paint,[q(x+u+.14,v,0),q(x+u+.14,v+.17,0),q(x+u+.1,v+.17,z-8),q(x+u+.10,v,z)],'#8a7c65','#675b4a');
  }
 };
 range(.38,.38,8.55,4.45,125,38,[1,2.4,4,5.35,6.75,7.85],-1,true);
 range(.82,4.58,7.80,4.13,86,26,[.72,2.0,3.08,5.1,6.45,7.15],4.06);
 // Return the corner turret to an eight-sided silhouette. The walls,
 // roof and limestone rim share exactly the same projected ring.
 const t={x:8.43,y:7.79,rx:.78,ry:.94,z:117};
 const oct=[[-.42,-1],[.42,-1],[1,-.42],[1,.42],[.42,1],[-.42,1],[-1,.42],[-1,-.42]];
 const at=(v,z,k=1)=>q(t.x+t.rx*v[0]*k,t.y+t.ry*v[1]*k,z);
 for(const i of [1,5,2,4,3]){
  const a=oct[i],b=oct[(i+1)%8],len=Math.hypot((a[0]-b[0])*t.rx,(a[1]-b[1])*t.ry);
  const f=(u,z)=>at([a[0]+(b[0]-a[0])*u/len,a[1]+(b[1]-a[1])*u/len],z);
  const windows=i===2||i===3||i===4?[len/2]:[];
  wall(f,len,t.z,i>=3,windows);
  for(const z of [16,48,82,108]){
   const strip=[at(a,z,1.035),at(b,z,1.035),at(b,z+3,1.035),at(a,z+3,1.035)];
   occlude(strip);polygon(paint,strip,i>=3?'#c0af92':'#a3947e','#6d604d');
  }
  const rim=[at(a,t.z-3,1.045),at(b,t.z-3,1.045),at(b,t.z+2,1.045),at(a,t.z+2,1.045)];
  occlude(rim);polygon(paint,rim,i>=3?'#c6b597':'#a29681','#62584b');
 }
 if(roofVisible){
  const peak=q(t.x,t.y,t.z+46);
  for(const i of [0,7,6,1,5,2,4,3]){
   const a=oct[i],b=oct[(i+1)%8],pts=[at(a,t.z+2,1.055),at(b,t.z+2,1.055),peak];
   occlude(pts);polygon(paint,pts,['#535e67','#64727b','#4e5a61','#56616d'][i%4],'#38424a');grain(pts,135);
  }
  polygon(paint,[q(t.x-.055,t.y,t.z+45),q(t.x+.055,t.y,t.z+45),q(t.x+.045,t.y,t.z+55),q(t.x-.045,t.y,t.z+55)],'#a49173','#574c3f');
 }
}

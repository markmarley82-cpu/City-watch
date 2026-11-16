(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QuillNPCMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TAU=Math.PI*2;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 function point(u,v,t,rig,mode='work'){
  // Coordinates in the visible source bounds. The entire lower leg/foot band is rigid.
  if(v>=.79||mode==='still')return [u,v];
  const seed=rig.phase||0,breath=Math.sin(TAU*t/6+seed),envelope=1-smooth((v-.58)/.21);
  const activity=mode==='work'?(1-Math.cos(TAU*t/12+seed))/2:0;
  const head=Math.exp(-Math.pow((u-.49)/.28,2)-Math.pow((v-.16)/.2,2));
  const torso=Math.exp(-Math.pow((u-.5)/.4,2)-Math.pow((v-.4)/.3,2));
  const hand=rig.hand||[.37,.44],held=Math.exp(-Math.pow((u-hand[0])/.23,2)-Math.pow((v-hand[1])/.19,2));
  const pin=rig.lockHand?1-held:1;
  const du=pin*envelope*(breath*.0015*torso+activity*(rig.lean||.003)*head+activity*(rig.handDX||.002)*held);
  const dv=pin*envelope*(-breath*.0017*torso-activity*(rig.nod||.002)*head-activity*(rig.lift||.005)*held);
  return [u+du,v+dv];
 }
 let makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const imageCache=new WeakMap();
 function configureCanvasFactory(factory){makeCanvas=factory;}
 function texture(image,rig,W,H){
  let sizes=imageCache.get(image);if(!sizes){sizes=new Map();imageCache.set(image,sizes);}const key=W+'x'+H;
  if(sizes.has(key))return sizes.get(key);
  const c=makeCanvas(W,H),ctx=c.getContext('2d'),[x0,y0,x1,y1]=rig.bounds;ctx.drawImage(image,x0,y0,x1-x0,y1-y0,0,0,W,H);
  const source=ctx.getImageData(0,0,W,H).data,premul=new Float32Array(source.length),bU=new Float32Array(W*H),bV=new Float32Array(W*H),aU=new Float32Array(W*H),aV=new Float32Array(W*H);
  for(let k=0;k<source.length;k+=4){const alpha=source[k+3]/255;premul[k]=source[k]*alpha;premul[k+1]=source[k+1]*alpha;premul[k+2]=source[k+2]*alpha;premul[k+3]=source[k+3];}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const k=y*W+x,u=x/(W-1),v=y/(H-1);if(v>=.79)continue;
   const envelope=1-smooth((v-.58)/.21),head=Math.exp(-Math.pow((u-.49)/.28,2)-Math.pow((v-.16)/.2,2)),torso=Math.exp(-Math.pow((u-.5)/.4,2)-Math.pow((v-.4)/.3,2)),hand=rig.hand||[.37,.44],held=Math.exp(-Math.pow((u-hand[0])/.23,2)-Math.pow((v-hand[1])/.19,2));
   const pin=rig.lockHand?1-held:1;
   bU[k]=pin*envelope*.0015*torso*W;bV[k]=-pin*envelope*.0017*torso*H;
   aU[k]=pin*envelope*((rig.lean||.003)*head+(rig.handDX||.002)*held)*W;
   aV[k]=pin*envelope*(-(rig.nod||.002)*head-(rig.lift||.005)*held)*H;
  }
  const result={c,ctx,premul,bU,bV,aU,aV,frame:ctx.createImageData(W,H),W,H};sizes.clear();sizes.set(key,result);return result;
 }
 function drawNPC(ctx,image,rig,placement,t,mode='work'){
  const [x0,y0,x1,y1]=rig.bounds,h=y1-y0,H=placement.height,W=H*(x1-x0)/h,ox=placement.x-W*rig.footU,oy=placement.y-H;
  ctx.save();ctx.fillStyle='rgba(8,7,4,.23)';ctx.beginPath();ctx.ellipse(placement.x,placement.y+1,W*.24,H*.018,0,0,TAU);ctx.fill();ctx.restore();
  if(mode==='still'){ctx.drawImage(image,x0,y0,x1-x0,h,ox,oy,W,H);return;}
  // A single premultiplied-alpha inverse sampling pass avoids triangle seams and overlapping alpha.
  const rw=Math.max(8,Math.ceil(W)),rh=Math.max(8,Math.ceil(H)),tex=texture(image,rig,rw,rh),out=tex.frame.data,p=tex.premul;
  const breath=Math.sin(TAU*t/6+(rig.phase||0)),activity=mode==='work'?(1-Math.cos(TAU*t/12+(rig.phase||0)))/2:0;
  for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){
   const k=y*rw+x,z=k*4,sx=clamp(x-tex.bU[k]*breath-tex.aU[k]*activity,0,rw-1),sy=clamp(y-tex.bV[k]*breath-tex.aV[k]*activity,0,rh-1),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const indices=[(iy*rw+ix)*4,(iy*rw+Math.min(ix+1,rw-1))*4,(Math.min(iy+1,rh-1)*rw+ix)*4,(Math.min(iy+1,rh-1)*rw+Math.min(ix+1,rw-1))*4],weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
   const values=[0,0,0,0];for(let j=0;j<4;j++)for(let channel=0;channel<4;channel++)values[channel]+=p[indices[j]+channel]*weights[j];
   const alpha=values[3];out[z]=alpha?values[0]*255/alpha:0;out[z+1]=alpha?values[1]*255/alpha:0;out[z+2]=alpha?values[2]*255/alpha:0;out[z+3]=alpha;
  }
  tex.ctx.putImageData(tex.frame,0,0);ctx.drawImage(tex.c,ox,oy,W,H);
 }
 function renderScene(ctx,room,actors,width,height,t,mode='work'){
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#29332f';ctx.fillRect(0,0,width,height);
  ctx.drawImage(room,0,0,width,height);
  [...actors].sort((a,b)=>a.placement.y-b.placement.y).forEach(a=>drawNPC(ctx,mode==='work'&&a.workImage?a.workImage:a.image,mode==='work'&&a.workRig?a.workRig:a.rig,{x:a.placement.x*width,y:a.placement.y*height,height:a.placement.height*height},t,mode));
 }
 function createClock(){let elapsed=0,last=null;return {tick(now,paused=false){if(last!==null&&!paused)elapsed+=clamp((now-last)/1000,0,.05);last=now;return elapsed;},reset(){elapsed=0;last=null;}};}
 return {point,drawNPC,renderScene,createClock,configureCanvasFactory};
});

/* One reversible presentation coordinate system; original paths and saves stay logical. */
(function(global){
 'use strict';
 global.CWCampaignRiverLayout=function(data,controls){
  const C=[81,64],TAU=Math.PI*2,cache=new Map();
  controls=controls.map(c=>({...c}));
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function radius(poly,u,inner){
   const hits=[];
   for(let i=0;i<poly.length;i++){
    const a=[poly[i][0]-C[0],poly[i][1]-C[1]],b=poly[(i+1)%poly.length],v=[b[0]-poly[i][0],b[1]-poly[i][1]],den=cross(u,v);
    if(Math.abs(den)<1e-10)continue;
    const t=cross(a,v)/den,s=cross(a,u)/den;
    if(t>=0&&s>=-1e-9&&s<=1+1e-9&&(inner===undefined||t>inner+1e-7))hits.push(t);
   }
   return hits.length?(inner===undefined?Math.max(...hits):Math.min(...hits)):null;
  }
  function profile(angle){
   for(let i=0;i<controls.length;i++){
    const a=controls[i],b=controls[(i+1)%controls.length];let end=b.angle,x=angle;
    if(end<=a.angle)end+=TAU;if(x<a.angle)x+=TAU;
    if(x<=end)return a.extra+(b.extra-a.extra)*(x-a.angle)/(end-a.angle);
   }
   return 0;
  }
  function map(x,y,back){
   const dx=x-C[0],dy=y-C[1],r=Math.hypot(dx,dy);if(!r)return[x,y];
   const u=[dx/r,dy/r],ri=radius(data.island,u),ro=ri===null?null:ri+12;
   if(ri===null||ro===null||r<=ri+1e-9)return[x,y];
   const ex=profile((Math.atan2(dy,dx)+TAU)%TAU);
   const rr=back?(r<=ro+ex?ri+(r-ri)/(1+ex/(ro-ri)):r-ex):r+ex*Math.min(1,(r-ri)/(ro-ri));
   return[C[0]+u[0]*rr,C[1]+u[1]*rr];
  }
  // A continuous twelve-cell transition avoids the concave-bank ray jumps in the
  // offline diagnostic. Calibrate each bridge's outer landing to its authored span.
  for(const c of controls){
   let lo=0,hi=200;for(let i=0;i<50;i++){c.extra=(lo+hi)/2;const out=map(...c.oldOuter,false);if(Math.hypot(out[0]-c.oldInner[0],out[1]-c.oldInner[1])<c.targetSpan)lo=c.extra;else hi=c.extra;}c.extra=(lo+hi)/2;
  }
  const crossings=data.bridges.map(b=>{const p=b.p[0],q=b.p[1],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);return{...b,dx,dy,length,u:[dx/length,dy/length],start:map(...p,false),end:map(...q,false)};});
  function raw(x,y){
   let out=map(x,y,false);
   for(const b of crossings){
    const dx=x-b.p[0][0],dy=y-b.p[0][1],t=(dx*b.u[0]+dy*b.u[1])/b.length,dist=Math.abs(dx*b.u[1]-dy*b.u[0]);
    if(t<0||t>1||dist>8)continue;
    const weight=dist<2?1:Math.max(0,1-(dist-2)/6),cur=map(b.p[0][0]+b.dx*t,b.p[0][1]+b.dy*t,false);
    out=out.map((n,i)=>n+(b.start[i]+(b.end[i]-b.start[i])*t-cur[i])*weight);
   }
   return out;
  }
  function forward(x,y){
   if(Number.isInteger(x*2)&&Number.isInteger(y*2)){
    const key=x+','+y;if(cache.has(key))return cache.get(key);const p=raw(x,y);cache.set(key,p);return p;
   }
   return raw(x,y);
  }
  function inverse(x,y){
   let q=map(x,y,true);
   for(let i=0;i<80;i++){
    const p=raw(...q),ex=x-p[0],ey=y-p[1],error=Math.hypot(ex,ey);if(error<1e-7)return q;
    const h=.001,px=raw(q[0]+h,q[1]),py=raw(q[0],q[1]+h),aa=(px[0]-p[0])/h,bb=(py[0]-p[0])/h,cc=(px[1]-p[1])/h,dd=(py[1]-p[1])/h,det=aa*dd-bb*cc;
    if(Math.abs(det)<1e-9)break;
    const sx=(dd*ex-bb*ey)/det,sy=(-cc*ex+aa*ey)/det;let rate=Math.min(1,2/Math.hypot(sx,sy));
    for(let k=0;k<14;k++){const qq=[q[0]+sx*rate,q[1]+sy*rate],ff=raw(...qq);if(Math.hypot(x-ff[0],y-ff[1])<error){q=qq;break;}rate*=.5;}
   }
   return q;
  }
  return{forward,inverse,profile,crossings,logicalBounds:[data.W,data.H],version:'OUTWARD-RIVER-RUNTIME-2'};
 };

})(typeof window==='undefined'?globalThis:window);

(window.CW_R2_PARTS=window.CW_R2_PARTS||[]).push('cw-campaign-river-layout.js');

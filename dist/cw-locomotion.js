/* Shared movement timing and swept floor motion. Scene geometry remains local. */
(function(root,factory){const api=factory();root.CWLocomotion=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(){
 'use strict';
 const referenceHeight=137+(648-580)*.038;
 const referencePixelsPerMS=205/1000;
 const profile=Object.freeze({stepMS:160,maxDeltaMS:70,startZone:.23,stopZone:.17,keyboardSpace:'screen',reference:'watch-house',referenceHeight,referencePixelsPerMS,cityStepMS:400});
 const elapsed=ms=>Math.max(0,Math.min(profile.maxDeltaMS,Number(ms)||0));
 // Watch House remains unchanged. The other scenes use a slower calibrated
 // body-relative pace after Mark's "too fast" correction.
 const pixelsPerMS=height=>Math.hypot(28,14)/profile.cityStepMS*(height/60);
 const metric=(a,b,scale=[1,1])=>Math.hypot((b[0]-a[0])*scale[0],(b[1]-a[1])*scale[1]);
 function advance(position,vector,ms,{scale=[1,1],speed=1/profile.stepMS,clear=()=>true,segment=6,slide=true,projectVector=null}={}){
  const distance=elapsed(ms)*speed,length=Math.hypot(...(projectVector?projectVector(vector):vector));let p=position.slice(),travelled=0;
  if(!length||!distance)return {position:p,moving:false,distance:0};
  const dx=vector[0]/length*distance/scale[0],dy=vector[1]/length*distance/scale[1],parts=Math.max(1,Math.ceil(distance/segment));
  for(let i=0;i<parts;i++){
   let q=[p[0]+dx/parts,p[1]+dy/parts];
   if(!clear(p,q)){
    if(!slide)break;
    const options=Math.abs(dx*scale[0])>=Math.abs(dy*scale[1])?[[q[0],p[1]],[p[0],q[1]]]:[[p[0],q[1]],[q[0],p[1]]];
    q=options.find(v=>metric(p,v,scale)>1e-9&&clear(p,v));if(!q)break;
   }
   travelled+=metric(p,q,scale);p=q;
  }
  return {position:p,moving:travelled>1e-9,distance:travelled};
 }
 function createDrive({read,write,options=()=>({})}){
  let direction=[0,0],last=null,moving=false;
  function sample(now){if(!Number.isFinite(now))return false;if(last!==null&&now<last)return moving;const dt=last===null?0:now-last;last=now;const result=advance(read(),direction,dt,options());moving=result.moving;if(moving)write(result.position,result.distance);return moving;}
  return Object.freeze({drive(vector,now){sample(now);direction=vector.slice();if(!Math.hypot(...direction))moving=false;},sample,stop(now){sample(now);direction=[0,0];moving=false;last=null;},reset(){direction=[0,0];last=null;moving=false;},active:()=>!!Math.hypot(...direction),moving:()=>moving,report:()=>({profile:'shared-160',direction:direction.slice(),last,moving})});
 }
 return Object.freeze({profile,elapsed,pixelsPerMS,metric,advance,createDrive});
});

import {BUILDING_LIGHTS} from './city-light-registrations.mjs?v=p21-b407-s039-reuse';
export function lightRegistration(o,overrides=null){
 if(!o.im||o.bridgePart||o.person||o.lightingExcluded||['roof','ground-contact','private-yard'].includes(o.sceneryKind)||/^(fountain|bench|flowers|door-flowers|market|noticeboard|barrels|dimwell:(gable|chimney|roof))/.test(o.id))return{status:'excluded',points:[]};
 const key=o.lightSource||o.sourceAsset||o.id;
 const density=o.im.cwDensity||1,sourceSize=[o.im.cwSourceWidth||o.im.width,o.im.cwSourceHeight||o.im.height];
 const custom=overrides&&(overrides[key]||overrides[o.id]);
 const entry=custom?{size:sourceSize,points:custom,status:custom.length?'lit':'unlit'}:BUILDING_LIGHTS[key];
 if(!entry)return{status:'unregistered',key,points:[]};
 const t=o.lightTransform;
 if(!t&&(entry.size[0]!==sourceSize[0]||entry.size[1]!==sourceSize[1]))return{status:'source-size-changed',key,points:[]};
 function map(x,y){
  if(t?.maps){const m=t.maps.find(m=>x>=m.start&&x<m.end)||t.maps.at(-1);return[m.a*x+m.c+t.anchor[0],m.b*x+m.v*y+m.f+t.anchor[1]];}
  if(t?.quad){const[a,b,,d]=t.quad,u=x/entry.size[0],v=y/entry.size[1];return[a[0]+(b[0]-a[0])*u+(d[0]-a[0])*v,a[1]+(b[1]-a[1])*u+(d[1]-a[1])*v];}
  return[o.lightMirror?sourceSize[0]-x:x,y];
 }
 return{status:entry.status,key,points:entry.points.map(([x,y,gx,gy])=>{const[a,b]=map(x,y),p={x:a*density,y:b*density,authored:true};if(Number.isFinite(gx)&&Number.isFinite(gy)){const[q,r]=map(gx,gy);[p.gx,p.gy]=[q*density,r*density];}return p;})};
}

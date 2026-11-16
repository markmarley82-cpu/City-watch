/* Upright painted houses: all three ground controls match the chosen world lot.
 * Door-height scaling is independent of plot width; no screen-size spawn scaling. */
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export function registerHouse(template,w,h,mirror=false){
 const [A,B,C]=template.contacts,v=template.doorHeight/template.doorSourceHeight;
 const near=project([w-.5,h-.5]),left=project([-.5,h-.5]),right=project([w-.5,-.5]);
 const ta=mirror?right:left,tb=near,tc=mirror?left:right;
 const maps=[[0,B[0],A,ta],[B[0],template.size[0],C,tc]].map(([start,end,s,t])=>{
  const a=(t.x-tb.x)/(s[0]-B[0]),b=(t.y-tb.y-v*(s[1]-B[1]))/(s[0]-B[0]);
  return {start,end,a,b,v,c:tb.x-a*B[0],f:tb.y-b*B[0]-v*B[1]};
 });
 const transformed=maps.flatMap(m=>[[m.start,0],[m.end,0],[m.end,template.size[1]],[m.start,template.size[1]]].map(([x,y])=>({x:m.a*x+m.c,y:m.b*x+m.v*y+m.f})));
 const x=Math.floor(Math.min(...transformed.map(p=>p.x)))-2,y=Math.floor(Math.min(...transformed.map(p=>p.y)))-2;
 const width=Math.ceil(Math.max(...transformed.map(p=>p.x)))-x+2,height=Math.ceil(Math.max(...transformed.map(p=>p.y)))-y+2;
 return {maps,anchor:[-x,-y],width,height,targets:[ta,tb,tc],doorHeight:v*template.doorSourceHeight};
}
export function transformControl(m,p){return {x:m.a*p[0]+m.c,y:m.b*p[0]+m.v*p[1]+m.f};}

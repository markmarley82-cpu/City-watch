// Source-bound exterior treatments. These never add walk cells or entrances.
export const OPERA_STEPS=Object.freeze({id:'OPERA-PUBLIC-STEPS-001',approach:[126,140],threshold:[126,140.5],width:2.4,run:1.6,risers:4,rise:2.5});
export const E045_APPROACH_COURT=Object.freeze([[38.7,199.8],[43.5,197.5],[58.9,198.3],[60.2,207.2],[59.2,218],[49,219],[43.3,211.4]]);
const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
export const operaApproachContains=p=>Array.isArray(p)&&Math.abs(p[0]-OPERA_STEPS.approach[0])<=3&&p[1]>=137&&p[1]<=140.5;
export function fullBodyPublicApproach(p){return Array.isArray(p)&&(operaApproachContains(p)||inside(p,E045_APPROACH_COURT));}

// World-registered textured source geometry rises into the existing threshold.
// Its modest decorative rise does not introduce a movement/elevation mechanic.
export function createOperaPublicSteps({project,createCanvas,texture}){
 const s=OPERA_STEPS,half=s.width/2,depth=s.run/s.risers,faces=[];
 for(let i=0;i<s.risers;i++){
  const near=s.threshold[1]-s.run+i*depth,far=near+depth,z=(i+1)*s.rise;
  const q=(x,y,h)=>project([x,y],h),left=s.threshold[0]-half,right=s.threshold[0]+half;
  faces.push({kind:'riser',points:[q(left,near,z-s.rise),q(right,near,z-s.rise),q(right,near,z),q(left,near,z)]});
  faces.push({kind:'tread',course:i,points:[q(left,near,z),q(right,near,z),q(right,far,z),q(left,far,z)]});
  faces.push({kind:'return',points:[q(right,near,0),q(right,far,0),q(right,far,z),q(right,near,z)]});
 }
 const pts=faces.flatMap(f=>f.points),x=Math.floor(Math.min(...pts.map(p=>p.x)))-2,y=Math.floor(Math.min(...pts.map(p=>p.y)))-2;
 const w=Math.ceil(Math.max(...pts.map(p=>p.x)))-x+2,h=Math.ceil(Math.max(...pts.map(p=>p.y)))-y+2;
 const canvas=createCanvas(w,h),g=canvas.getContext('2d');g.translate(-x,-y);
 const pattern=g.createPattern(texture,'repeat');
 for(const face of faces){
  g.save();g.beginPath();face.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();
  g.fillStyle=pattern;g.fillRect(x,y,w,h);
  g.fillStyle=face.kind==='tread'?'#b6aa8738':face.kind==='riser'?'#3e392d65':'#34312685';g.fillRect(x,y,w,h);g.restore();
  if(face.kind==='tread'){
   const[a,b,,c]=face.points;g.strokeStyle='#e0d4b991';g.lineWidth=.75;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();
   const f=.24+face.course*.17,d=face.points[2];g.strokeStyle='#3e382c55';g.lineWidth=.6;g.beginPath();g.moveTo(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);g.lineTo(c.x+(d.x-c.x)*f,c.y+(d.y-c.y)*f);g.stroke();
  }
 }
 return {canvas,box:[x,y,w,h],
  draw(g,view){if(!view||x+w>=view[0]&&x<=view[2]&&y+h>=view[1]&&y<=view[3])g.drawImage(canvas,x,y);},
  dispose(){canvas.width=canvas.height=1;},report:()=>({...s,source:'registered Canvas architecture with retained flagstone material',nativeSize:[w,h],cacheBytes:w*h*4,drawCallsPerVisibleFrame:1,navigationChanged:false,solidsChanged:false,newDoors:false,interior:false,elevationMechanic:false})};
}

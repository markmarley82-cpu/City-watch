/* Existing painted quay masonry fitted to the visible channel boundaries.
 * Presentation only: no walk cells, bridge anchors, collision or saves change. */
import {project,pointIn} from './city-core.mjs?v=p21-b407-s039-reuse';
const EPS=1e-6,RAISE=18,DROP=34,WIDTH=.32;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const at=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const rectangle=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function cut(a,b,c,d){
  const u=[b[0]-a[0],b[1]-a[1]],v=[d[0]-c[0],d[1]-c[1]],den=cross(u,v);
  if(Math.abs(den)<EPS)return null;
  const w=[c[0]-a[0],c[1]-a[1]],t=cross(w,v)/den,s=cross(w,u)/den;
  return t>EPS&&t<1-EPS&&s>=-EPS&&s<=1+EPS?t:null;
}
export function bridgeOpening(p,b,padding=.4){
  return p[0]>=b.anchor[0]-b.width/2-padding-EPS&&p[0]<=b.anchor[0]+b.width/2+padding+EPS&&
    p[1]>=b.anchor[1]-3&&p[1]<=b.anchor[1]+b.length+3;
}
export function wetAt(contract,p){
  return contract.surfaces.some(s=>pointIn(p,s.engine_polygon))&&
    !contract.dryReceivers.some(r=>p[0]>r[0]&&p[0]<r[0]+r[2]&&p[1]>r[1]&&p[1]<r[1]+r[3]);
}
export function compileQuayWalls(contract){
  const polygons=contract.surfaces.map(s=>({id:s.id,p:s.engine_polygon,channel:true}));
  contract.dryReceivers.forEach((r,i)=>polygons.push({id:'dry:'+i,p:rectangle(r)}));
  const openings=contract.crossings.map(b=>({id:b.edge,p:rectangle([b.anchor[0]-b.width/2-.4,b.anchor[1]-3,b.width+.8,b.length+6])}));
  const all=[...polygons,...openings],walls=[];
  for(const polygon of polygons)for(let i=0;i<polygon.p.length;i++){
    // Artificial map-edge caps are river exits, not embankments.
    if(polygon.channel&&(i===polygon.p.length/2-1||i===polygon.p.length-1))continue;
    const a=polygon.p[i],b=polygon.p[(i+1)%polygon.p.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<EPS)continue;
    const ts=[0,1];
    for(const other of all)for(let j=0;j<other.p.length;j++){
      const t=cut(a,b,other.p[j],other.p[(j+1)%other.p.length]);if(t!==null)ts.push(t);
    }
    const sorted=[...new Set(ts.map(t=>Math.round(t*1e9)/1e9))].sort((a,b)=>a-b);
    for(let j=1;j<sorted.length;j++){
      const lo=sorted[j-1],hi=sorted[j];if(hi-lo<EPS)continue;
      const mid=at(a,b,(lo+hi)/2),n=[-(b[1]-a[1])/length,(b[0]-a[0])/length];
      const left=wetAt(contract,[mid[0]+n[0]*.002,mid[1]+n[1]*.002]),right=wetAt(contract,[mid[0]-n[0]*.002,mid[1]-n[1]*.002]);
      if(left===right||contract.crossings.some(b=>bridgeOpening(mid,b)))continue;
      const start=at(a,b,lo),end=at(a,b,hi),wetNormal=left?n:n.map(v=>-v),pa=project(start),pb=project(end);
      walls.push({id:polygon.id+':'+i+':'+j,channel:polygon.id,a:start,b:end,wetNormal,
        frontFacing:project(wetNormal).y>0,
        bounds:[Math.min(pa.x,pb.x)-18,Math.min(pa.y,pb.y)-RAISE-12,Math.max(pa.x,pb.x)+18,Math.max(pa.y,pb.y)+DROP+6]});
    }
  }
  return {id:'CW-RIVER-QUAY-WALLS-v1',walls,raisedCoping:RAISE,retainingDrop:DROP,wallWidth:WIDTH,bridgeOpenings:contract.crossings.map(b=>b.edge)};
}

export function extractQuayStrip(image,{x,width,height}){
  const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
  const g=source.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  const rgba=g.getImageData(0,0,source.width,source.height).data;
  const out=document.createElement('canvas');out.width=width;out.height=height;
  const target=out.getContext('2d'),result=target.createImageData(width,height);
  for(let i=0;i<width;i++){
    const sx=x+i;let bottom=source.height-1;
    while(bottom>height&&rgba[(bottom*source.width+sx)*4+3]<220)bottom--;
    for(let y=0;y<height;y++){const from=((bottom-height+1+y)*source.width+sx)*4,to=(y*width+i)*4;result.data.set(rgba.subarray(from,from+4),to);}
  }
  target.putImageData(result,0,0);source.width=source.height=1;return out;
}
export function createQuayWallPainter(contract,{face,coping}){
  const geometry=compileQuayWalls(contract),faceStrip=extractQuayStrip(face,{x:900,width:256,height:24}),capStrip=extractQuayStrip(coping,{x:900,width:256,height:6});
  const patterns=new WeakMap();let visible=0;
  const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
  function fillFace(g,pattern,a,b,height,shade){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.01||Math.abs(dx)<.01)return;
    g.save();g.transform(dx/len,dy/len,0,1,a.x,a.y-RAISE);g.fillStyle=pattern;g.fillRect(0,0,len,height);
    const shadow=g.createLinearGradient(0,0,0,height);shadow.addColorStop(0,'#171d1700');shadow.addColorStop(1,shade);
    g.fillStyle=shadow;g.fillRect(0,0,len,height);g.restore();
  }
  return {
    draw(g,view){
      let p=patterns.get(g);
      if(!p){p={face:g.createPattern(faceStrip,'repeat'),cap:g.createPattern(capStrip,'repeat')};p.face.setTransform(new DOMMatrix().scale(1,(RAISE+DROP)/24));patterns.set(g,p);}
      const walls=geometry.walls.filter(w=>overlaps(w.bounds,view)).sort((a,b)=>(a.a[0]+a.a[1]+a.b[0]+a.b[1])-(b.a[0]+b.a[1]+b.b[0]+b.b[1]));visible=walls.length;
      for(const wall of walls){
        const a=project(wall.a),b=project(wall.b),dry=project(wall.wetNormal.map(n=>-n*WIDTH)),landA={x:a.x+dry.x,y:a.y+dry.y},landB={x:b.x+dry.x,y:b.y+dry.y};
        if(wall.frontFacing)fillFace(g,p.face,a,b,RAISE+DROP,'#15201bc0');
        else fillFace(g,p.face,landA,landB,RAISE,'#343a2a35');
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
        g.save();g.transform(dx/len,dy/len,dry.x/6,dry.y/6,a.x,a.y-RAISE);g.fillStyle=p.cap;g.fillRect(0,0,len,6);g.restore();
        // The restrained wet seam grounds the vertical masonry in the river.
        if(wall.frontFacing){g.save();g.strokeStyle='#17251c8c';g.lineWidth=1.5;g.beginPath();g.moveTo(a.x,a.y+DROP);g.lineTo(b.x,b.y+DROP);g.stroke();g.restore();}
      }
    },
    report:()=>({id:geometry.id,segments:geometry.walls.length,visible,channels:['River_Ankh','The_Cut'],bridgeOpenings:geometry.bridgeOpenings,raisedCoping:RAISE,retainingDrop:DROP,
      source:'Retained Mate v1.2 painted quay masonry and coping',navigationChanged:false,collisionChanged:false})
  };
}

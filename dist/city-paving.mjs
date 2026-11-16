/* Continuous source-art city land and detailed street receivers.
 * Registered paintings stay above this visual layer; navigation is never extended. */
import {project,engine} from './city-core.mjs?v=p21-b407-s039-reuse';
export const CITY_LAND_FINISH=Object.freeze({landBaseColor:'#665c49',landOpacity:.5});

export function cityLandBoundary(grid) {
  const [x,y,X,Y]=grid.dimensions_inclusive;
  return [[x-.5,y-.5],[X+.5,y-.5],[X+.5,Y+.5],[x-.5,Y+.5]].map(engine);
}

export function pavingBoundary(receivers){
  const cells=new Set(receivers.map(r=>r.p.join(','))),edges=[];
  for(const {p:[x,y]} of receivers)for(const [dx,dy,a,b] of [[0,-1,[x-.5,y-.5],[x+.5,y-.5]],[1,0,[x+.5,y-.5],[x+.5,y+.5]],[0,1,[x+.5,y+.5],[x-.5,y+.5]],[-1,0,[x-.5,y+.5],[x-.5,y-.5]]])if(!cells.has([x+dx,y+dy].join(',')))edges.push([a,b]);
  return edges;
}

export function pavingReceivers(world, privateCourts = []) {
  const cells = new Map();
  const unpaved = new Set([...world.unpaved.values()].flatMap(area=>[...area.cells]));
  for (const [key, ids] of world.members) {
    if (unpaved.has(key)) continue;
    if ([...ids].every(id => /^E00[1-7]$/.test(id))) continue;
    cells.set(key, {p:key.split(',').map(Number), material:[...ids].some(id=>id.startsWith('APRON:'))?'flags':'cobbles'});
  }
  for (const {rect:[x,y,w,h]} of privateCourts)
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)
      cells.set(xx+','+yy,{p:[xx,yy],material:'cobbles'});
  return [...cells.values()];
}

// Adjacent cells have identical material and pattern coordinates. Merge them
// before building the clip instead of submitting thousands of shared edges.
export function pavingRegions(receivers) {
  const result=[];
  for(const material of ['cobbles','flags']) {
    const rows=new Map(),active=new Map();
    for(const {p:[x,y],material:kind} of receivers)if(kind===material){if(!rows.has(y))rows.set(y,[]);rows.get(y).push(x);}
    for(const [y,xs] of [...rows].sort((a,b)=>a[0]-b[0])){
      xs.sort((a,b)=>a-b);
      const spans=[];let first=xs[0],last=first;
      for(const x of xs.slice(1)){if(x===last+1){last=x;continue;}spans.push([first,last]);first=last=x;}spans.push([first,last]);
      for(const [a,b] of spans){const key=a+':'+b,prior=active.get(key);if(prior&&prior.rect[1]+prior.rect[3]===y-.5)prior.rect[3]++;else{const region={material,rect:[a-.5,y-.5,b-a+1,1]};result.push(region);active.set(key,region);}}
    }
  }
  return result;
}

export function createPavingUnderlay(world, privateCourts, materials, {grid=null,footprints=[],sharedCourtFootprints=[]}={}) {
  const sharedCourtKeys=new Set(sharedCourtFootprints.map(r=>r.join(',')));
  const contactFootprints=footprints.filter(r=>!sharedCourtKeys.has(r.join(',')));
  const receivers=pavingReceivers(world,privateCourts),regions=pavingRegions(receivers),paths={},patterns={};
  const projected=regions.map(({rect:[x,y,w,h],material})=>{
    const points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(project);
    return {material,rect:[x,y,w,h],points,bounds:[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))]};
  });
  const append=(path,points)=>{points.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();};
  const land=grid?cityLandBoundary(grid):null,landPath=land?new Path2D():null;
  if(land)append(landPath,land.map(project));
  function pattern(ctx,kind){
    if(!patterns[kind]){const im=materials[kind],repeat=kind==='worn'?24:kind==='flags'?5:6.2;patterns[kind]=ctx.createPattern(im,'repeat');patterns[kind].setTransform(new DOMMatrix().scale(repeat/im.width,repeat/im.height));}
    return patterns[kind];
  }
  const screenBounds=points=>{
    const bounds=[Infinity,Infinity,-Infinity,-Infinity];
    for(const point of points){
      const {x,y}=project(point);
      bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);
      bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);
    }
    return bounds;
  };
  const streetStrokes=[[2,.02],[1,.035],[.2,.08],[-.5,.2],[-1,.5],[-1.4,1]];
  const bands=[...world.edges.values()].filter(e=>e.points?.length>1&&!/^E00[1-7]$/.test(e.id)).map(e=>{
    const path=new Path2D(),width=e.width_cells||1.8;
    e.points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));
    const [x,y,X,Y]=screenBounds(e.points);
    // Project the widest round cap/join, including the outer feather stroke.
    const radius=Math.max(.45,width+streetStrokes[0][0])/2;
    const mx=Math.hypot(28,28)*radius,my=Math.hypot(14,14)*radius;
    return {path,width,bounds:[x-mx,y-my,X+mx,Y+my]};
  });
  const maskRect=(x,y,w,h)=>({x,y,w,h,bounds:screenBounds([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])});
  const square=pavingRegions(receivers.filter(r=>world.rc1?.has(r.p.join(','))||r.material==='flags'));
  const maskRects=[
    ...square.map(({rect:[x,y,w,h]})=>maskRect(x-.12,y-.12,w+.24,h+.24)),
    ...privateCourts.map(({rect:[x,y,w,h]})=>maskRect(x-.5,y-.5,w,h))
  ];
  let streetSurface=null,streetMask=null,streetMaskKey=null;
  for(const material of ['cobbles','flags']) {
    const path=new Path2D();
    for(const {points,material:kind} of projected)if(kind===material)append(path,points);
    paths[material]=path;
  }
  return {
    streets(ctx,view,paint){
      if(!streetSurface)streetSurface=document.createElement('canvas');
      const {width,height}=ctx.canvas;if(streetSurface.width!==width)streetSurface.width=width;if(streetSurface.height!==height)streetSurface.height=height;
      const transform=ctx.getTransform();
      const g=streetSurface.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,width,height);g.setTransform(transform);paint(g);
      if(!streetMask)streetMask=document.createElement('canvas');
      // Streaming can repaint the terrain on the same pixel grid. The road
      // mask is independent of streamed images, so keep its existing pixels.
      const {a,b,c,d,e,f}=transform;
      const maskKey=[width,height,a,b,c,d,e,f,...(view||[])];
      if(!streetMaskKey||maskKey.length!==streetMaskKey.length||maskKey.some((v,i)=>v!==streetMaskKey[i])){
        streetMaskKey=null;
        if(streetMask.width!==width)streetMask.width=width;
        if(streetMask.height!==height)streetMask.height=height;
        const m=streetMask.getContext('2d');
        m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,width,height);
        m.setTransform(transform);m.transform(28,14,-28,14,0,0);
        m.strokeStyle='#fff';m.fillStyle='#fff';m.lineCap='round';m.lineJoin='round';
        // Keep two device pixels around the paint bounds for antialiasing.
        const pad=a?2/Math.abs(a):Infinity;
        const visible=([x,y,X,Y])=>!view||x<=view[2]+pad&&X>=view[0]-pad&&y<=view[3]+pad&&Y>=view[1]-pad;
        for(const {path,width,bounds} of bands){
          if(!visible(bounds))continue;
          for(const [extra,alpha] of streetStrokes){m.lineWidth=Math.max(.45,width+extra);m.globalAlpha=alpha;m.stroke(path);}
        }
        m.globalAlpha=1;
        for(const {x,y,w,h,bounds} of maskRects)if(visible(bounds))m.fillRect(x,y,w,h);
        streetMaskKey=maskKey;
      }
      g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';g.drawImage(streetMask,0,0);g.restore();
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(streetSurface,0,0);ctx.restore();
    },
    dispose(){for(const c of [streetSurface,streetMask])if(c)c.width=c.height=1;streetSurface=streetMask=streetMaskKey=null;},
    // Continuous visual land includes building plots and spaces between roads.
    // Streets, private courts and river water are painted over this base; it
    // deliberately does not add a single navigation or collision cell.
    drawLand(ctx,view){
      if(!land)return;
      const x=Math.min(...land.map(p=>p[0])),y=Math.min(...land.map(p=>p[1])),X=Math.max(...land.map(p=>p[0])),Y=Math.max(...land.map(p=>p[1]));
      ctx.save();ctx.clip(landPath);ctx.transform(28,14,-28,14,0,0);if(materials.landBaseColor){ctx.fillStyle=materials.landBaseColor;ctx.fillRect(x,y,X-x,Y-y);}const landAlpha=ctx.globalAlpha;ctx.globalAlpha=landAlpha*(materials.landOpacity??1);ctx.fillStyle=pattern(ctx,materials.worn?'worn':'cobbles');ctx.fillRect(x,y,X-x,Y-y);ctx.globalAlpha=landAlpha;
      if(materials.worn){
        for(const [a,b,w,h] of contactFootprints){const q=project([a+w/2,b+h/2]);if(view&&(q.x<view[0]-250||q.x>view[2]+250||q.y<view[1]-250||q.y>view[3]+250))continue;const contact=new Path2D();append(contact,[[a-.5,b-.5],[a+w-.5,b-.5],[a+w-.5,b+h-.5],[a-.5,b+h-.5]].map(([x,y])=>({x,y})));ctx.strokeStyle='#342c2418';for(const width of [1.8,.8,.25]){ctx.lineWidth=width;ctx.stroke(contact);}}
      }
      ctx.restore();
      if(materials.decals?.length)for(let i=0;i<footprints.length;i++){if(i%7)continue;const [a,b,w,h]=footprints[i],q=project([a+w-.3,b+h+.3]);if(view&&(q.x<view[0]-80||q.x>view[2]+80||q.y<view[1]-80||q.y>view[3]+80))continue;const d=materials.decals[(i/7)%materials.decals.length];ctx.save();ctx.globalAlpha=.22;ctx.drawImage(d.image,q.x-d.anchor[0]*d.scale,q.y-d.anchor[1]*d.scale,d.image.width*d.scale,d.image.height*d.scale);ctx.restore();}
    },
    draw(ctx,view) {
      for(const kind of ['cobbles','flags']){
        let path=paths[kind];
        if(view){const visible=projected.filter(r=>r.material===kind&&r.bounds[0]<=view[2]&&r.bounds[2]>=view[0]&&r.bounds[1]<=view[3]&&r.bounds[3]>=view[1]);if(!visible.length)continue;path=new Path2D();for(const r of visible)append(path,r.points);}
        ctx.save();ctx.clip(path);ctx.transform(28,14,-28,14,0,0);
        ctx.fillStyle=pattern(ctx,kind);ctx.fillRect(-512,-512,1024,1024);ctx.restore();
      }
    },
    report:()=>({id:'P21-PAVING-COVERAGE-1',cells:receivers.length,flagstoneCells:receivers.filter(r=>r.material==='flags').length,clipRegions:regions.length,continuousLand:!!land,landBoundary:land,featheredStreetEdges:true,landStyle:materials.landLabel||(materials.worn?'Retained painted worn setts with blended road courses, foundation contacts and source decals':'cobbles'),sharedCourtFootings:footprints.length-contactFootprints.length,geometryChanged:false})
  };
}

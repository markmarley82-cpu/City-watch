// Isolated Path A candidate. Existing source materials, unchanged navigation.
// Buddy intake: trim unused cache bounds and enforce exact per-pixel legal ground.
// Existing walking-graph loop from the court, around the rear dwelling, and
// back to its public doorway. Surface registration only; no navigation added.
export const COURT_REAR_COURSE=Object.freeze([[46,203],[47,202],[48,202],[49,202],[50,202],[51,202],[52,202],[52,201],[52,200],[52,199],[52,198],[52,199],[53,200],[53,201],[53,202],[54,202],[55,202],[56,203]]);
export const SECTION = Object.freeze({
  id:'E045-EAST-COURT-COHERENCE-001', bounds:[34,195,69,227],
  premises:[613,590,591,568,569,570],
  // Open apron; these are surface controls, never collision/property lines.
  apron:[[38.7,199.8],[43.5,197.5],[58.9,198.3],[60.2,207.2],
    [59.2,218.0],[49.0,219.0],[43.3,211.4]],
  // Continue the existing court course to its actual southern junction.
  joins:[[[46.8,217],[52,225],2.8],...COURT_REAR_COURSE.slice(1).map((b,i)=>[COURT_REAR_COURSE[i],b,1.8])],
  materials:['cobbles-a','cobbles-b','flags-a','flags-b'],
  newSolids:false,newDoors:false,newRoutes:false,newLights:false,
});
// Worn flag course follows the accepted public path around the cooper, never through it.
export const COURT_WALK_COURSE=Object.freeze([[39,203],[56,203],[56,213],[57,214],[57,215],[55,215],[53,217],[52,217],[51,218],[50,218],[49,219],[50,220],[50,221],[51,222],[51,224],[52,225]]);
// The existing east-west court crossing meets the N568 public contact.
// This is a surface band, not a kerb, wall, collision width or new walkway.
export const COURT_FRONTAGE_BAND=Object.freeze({start:[43,203],end:[56,203],width:1.7});
export const COURT_PATCHES=Object.freeze([[45.4,203.7,2.1,.7],[52.6,204.0,2.5,.9],[54.4,209.7,1.8,.8]]);
export const COURT_LINES=Object.freeze([[[40.8,201.5],[45.0,207.4],[48.8,213.3]],[[58.5,202.2],[58.8,207.1],[57.9,214.6]]]);
const inside=(p,poly)=>{let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],c=poly[j];if((a[1]>p[1])!==(c[1]>p[1])&&p[0]<(c[0]-a[0])*(p[1]-a[1])/(c[1]-a[1])+a[0])b=!b;
}return b;};
const inSolid=(p,rects)=>rects.some(([x,y,w,h])=>p[0]>=x-.04&&p[0]<=x+w+.04&&p[1]>=y-.04&&p[1]<=y+h+.04);
const project=([x,y])=>({x:28*(x-y),y:14*(x+y)});
const lineDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);};

export function createCourtSurface({world,clearPoint,footprints,images,createCanvas,Path2D,DOMMatrix}){
  // Source rects use cell centres; match openPublicGround's half-cell bounds.
  const [x0,y0,x1,y1]=SECTION.bounds,step=.25,half=step/2,rects=footprints.map(([x,y,w,h])=>[x-.5,y-.5,w,h]).filter(r=>r[0]<x1&&r[1]<y1&&r[0]+r[2]>x0&&r[1]+r[3]>y0);
  // Index padded footprint bounds in the same integer cells as the walking mask.
  // The exact rectangle predicate still decides each sample at cell boundaries.
  const byCell=new Map();
  for(const r of rects){
    const [x,y,w,h]=r;
    for(let cy=Math.round(y-.04);cy<=Math.round(y+h+.04);cy++){
      for(let cx=Math.round(x-.04);cx<=Math.round(x+w+.04);cx++){
        const k=cx+','+cy;
        if(!byCell.has(k))byCell.set(k,[]);
        byCell.get(k).push(r);
      }
    }
  }
  const empty=[];
  // This court finish is painted after the generic public-cell paving. Keep
  // every named street's full-width course, gutter and kerb above its own
  // source, with a short feather into the shared court rather than a slab seam.
  const streets=[...world.edges.values()].filter(e=>e.a&&e.points?.length>1).flatMap(e=>
    e.points.slice(1).map((b,i)=>({a:e.points[i],b,half:(e.width_cells||2)/2}))).filter(s=>
    Math.max(s.a[0],s.b[0])+s.half+.35>=x0&&Math.min(s.a[0],s.b[0])-s.half-.35<=x1&&
    Math.max(s.a[1],s.b[1])+s.half+.35>=y0&&Math.min(s.a[1],s.b[1])-s.half-.35<=y1);
  const courtWeight=p=>{
    let clearance=Infinity;
    for(const street of streets)clearance=Math.min(clearance,lineDistance(p,street.a,street.b)-street.half);
    const t=Math.max(0,Math.min(1,clearance/.35));
    return t*t*(3-2*t);
  };
  const legal=p=>{
    const k=Math.round(p[0])+','+Math.round(p[1]);
    return world.members.has(k)&&clearPoint(p)&&!inSolid(p,byCell.get(k)||empty);
  };
  const cells=[];let rejected=0;
  for(let y=y0+half;y<y1;y+=step)for(let x=x0+half;x<x1;x+=step){
    if(!inside([x,y],SECTION.apron)&&!SECTION.joins.some(([a,b,w])=>lineDistance([x,y],a,b)<w/2))continue;
    const samples=[[x,y],[x-half,y-half],[x+half,y-half],[x+half,y+half],[x-half,y+half]];
    if(samples.every(legal))cells.push([x,y]);else rejected++;
  }
  if(!cells.length)throw Error('E045 surface has no legal receivers');
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const [x,y]of cells)for(const dx of [-half,half])for(const dy of [-half,half]){
    const p=project([x+dx,y+dy]);left=Math.min(left,p.x);top=Math.min(top,p.y);right=Math.max(right,p.x);bottom=Math.max(bottom,p.y);
  }
  left=Math.floor(left)-2;top=Math.floor(top)-2;right=Math.ceil(right)+2;bottom=Math.ceil(bottom)+2;
  const canvas=createCanvas(right-left,bottom-top),g=canvas.getContext('2d');
  g.translate(-left,-top);g.transform(28,14,-28,14,0,0);
  const texture=name=>{const im=images[name],p=g.createPattern(im,'repeat');p.setTransform(new DOMMatrix().scale(4.8/im.width,4.8/im.height));return p;};
  // One world-registered course across the court, not a separate base per house.
  g.fillStyle=texture('cobbles-b');g.fillRect(x0,y0,x1-x0,y1-y0);
  // One quiet, connected walking course uses the retained flag texture. The
  // final exact legal-ground mask and named-street feather remain authoritative.
  g.save();g.strokeStyle=texture('flags-b');g.globalAlpha=.32;g.lineWidth=1.1;
  g.lineCap='round';g.lineJoin='round';
  for(const course of [COURT_WALK_COURSE,COURT_REAR_COURSE]){
    // Give the rear bend a readable run of flags between the houses.
    // The exact legal mask still clips the finish at each solid and street.
    g.globalAlpha=course===COURT_REAR_COURSE?.68:.32;
    g.beginPath();course.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();
  }
  // Pick out the existing turn off the west street inside the court mask.
  // The same flags continue into the court; no new surface is admitted.
  g.globalAlpha=.9;
  g.strokeStyle=texture('flags-a');g.lineWidth=1.65;
  g.beginPath();
  g.moveTo(43,206);g.lineTo(43,204);g.quadraticCurveTo(43,203,44,203);g.lineTo(46,203);
  g.stroke();
  g.restore();
  // Tie the front doors to the court with a continuous worn flagstone course.
  // Feather the ends along the existing walk line, before the original legal
  // and named-street masks. Adjacent aprons keep their quieter material.
  const {start,end,width}=COURT_FRONTAGE_BAND;
  const band=createCanvas(canvas.width,canvas.height),bg=band.getContext('2d');
  bg.translate(-left,-top);bg.transform(28,14,-28,14,0,0);
  bg.fillStyle=texture('flags-a');
  bg.fillRect(start[0],start[1]-width/2,end[0]-start[0],width);
  bg.globalCompositeOperation='destination-in';
  const weight=bg.createLinearGradient(start[0],0,end[0],0);
  for(const [at,alpha] of [[0,0],[.18,.69],[.82,.69],[1,0]])weight.addColorStop(at,'rgba(255,255,255,'+alpha+')');
  bg.fillStyle=weight;bg.fillRect(start[0],start[1]-width/2,end[0]-start[0],width);
  g.save();g.resetTransform();g.drawImage(band,0,0);g.restore();
  band.width=band.height=1;
  // Keeping
  // thousands of cells in a Canvas clip made a native build take31seconds;
  // the final small rectangle mask provides the same permitted coverage.
  // Quiet wear joins and patches: no kerb/wall/gate is added to open ground.
  for(const [cx,cy,rx,ry]of COURT_PATCHES){
    g.save();g.beginPath();g.ellipse(cx,cy,rx,ry,-.2,0,Math.PI*2);g.clip();g.globalAlpha=.28;g.fillStyle=texture('flags-b');g.fillRect(x0,y0,x1-x0,y1-y0);g.restore();
  }
  g.strokeStyle='#40382b30';g.lineWidth=.055;g.lineCap='round';
  for(const points of COURT_LINES){
    g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();
  }
  // Fade inward from the surveyed mask. Multiplication cannot add pixels
  // outside that mask or advertise a new surface across a reservation.
  // A continuous per-pixel feather avoids antialias seams where separately
  // rasterised quarter-cell diamonds touch. The surveyed cells are still the
  // hard coverage envelope; the feather only changes opacity inside it.
  const coverage=new Set(cells.map(([x,y])=>Math.floor(x/step)+','+Math.floor(y/step)));
  const pixels=canvas.getContext('2d');pixels.resetTransform();
  const rgba=pixels.getImageData(0,0,canvas.width,canvas.height);
  let clearedPixels=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const n=(y*canvas.width+x)*4;
    if(!rgba.data[n+3])continue;
    const px=x+left+.5,py=y+top+.5;
    const point=[px/56+py/28,py/28-px/56];
    const [u,v]=point;
    const key=Math.round(u)+','+Math.round(v);
    if(!coverage.has(Math.floor(u/step)+','+Math.floor(v/step))||!legal(point)||
      world.wet(point)||!world.waterCollision.pointClear(point,[...world.members.get(key)])){
      rgba.data[n+3]=0;clearedPixels++;continue;
    }
    // Named street paint has priority. Avoid the geometry sweep where it
    // would multiply the court paint by zero anyway.
    const weight=courtWeight(point);
    if(!weight){rgba.data[n+3]=0;continue;}
    let apronEdge=Infinity;
    for(let i=0;i<SECTION.apron.length;i++)apronEdge=Math.min(apronEdge,lineDistance(point,SECTION.apron[i],SECTION.apron[(i+1)%SECTION.apron.length]));
    let edge=inside(point,SECTION.apron)?apronEdge:-apronEdge;
    for(const [a,b,w] of SECTION.joins){
      if(edge>=.65)break;
      edge=Math.max(edge,w/2-lineDistance(point,a,b));
    }
    // Any foundation farther than the feather radius on either axis
    // cannot change the output alpha; keep the exact distance near walls.
    let solid=.22;
    for(const [a,b,w,h] of rects){
      const dx=Math.max(a-u,0,u-a-w),dy=Math.max(b-v,0,v-b-h);
      if(dx<solid&&dy<solid)solid=Math.min(solid,Math.hypot(dx,dy));
    }
    rgba.data[n+3]=Math.round(rgba.data[n+3]*Math.max(0,Math.min(1,edge/.65,solid/.22))*weight);
  }
  pixels.putImageData(rgba,0,0);
  let draws=0;
  return {
    canvas,box:[left,top,right,bottom],cells,dispose(){canvas.width=canvas.height=1;},
    draw(ctx,view){if(view&&(view[2]<left||view[0]>right||view[3]<top||view[1]>bottom))return;ctx.drawImage(canvas,left,top);draws++;},
    report:()=>({id:SECTION.id,acceptedQuarterCells:cells.length,rejectedQuarterCells:rejected,
      cachedPixels:canvas.width*canvas.height,cacheMiB:canvas.width*canvas.height*4/1048576,
      drawCallsPerFrame:1,draws,grid:step,sourceMaterialReuse:true,clearedPixels,exactPixelGroundCheck:true,continuousPixelFeather:true,physicalWaterCheck:true,navigationChanged:false,
      solidsChanged:false,newWalls:false,newInteractiveDoors:false,newAuthoredLights:false,
      frontageBand:COURT_FRONTAGE_BAND,namedStreetCoursesPreserved:true,courtFinishAfterPublicPaving:true,streetFeatherWorldUnits:.35,
      limit:'Integrated ground component only; source legality checked per painted pixel. Full section, phone and creative acceptance remain open.'}),
  };
}

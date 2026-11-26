import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const file = name => new URL(name, import.meta.url);
const projection = ([x,y,z=0]) => [56*(x-y),28*(x+y)-2*z];
const atlas = await loadImage(await readFile(file('materials.webp')));
const stock = await loadImage(await readFile(file('../../dist/assets/city-walls300/painted-materials.webp')));
const layout = JSON.parse(await readFile(file('../../dist/assets/city-walls296/layout.json')));
const palette = {
  day: {side:'#332d26',shade:'#211e1b',moss:'#515637',shadow:'#302921',highlight:'#e3c7a0'},
  night: {side:'#20293b',shade:'#151d2a',moss:'#2b3d36',shadow:'#19212c',highlight:'#8c9aab'}
};
const guides = {
  north:{axis:'x', outside:-1}, south:{axis:'x', outside:1},
  west:{axis:'y', outside:-1}, east:{axis:'y', outside:1}
};
const parts = [];
const visibility = {x:.13,y:.30,top:.02};
await mkdir(file('sprites/'), {recursive:true});

function swatch(image, index, width, height) {
  const c=createCanvas(width,height), g=c.getContext('2d');
  const w=image.width/2,h=image.height/2;
  g.drawImage(image,(index%2)*w+8,Math.floor(index/2)*h+8,w-16,h-16,0,0,width,height);
  return c;
}
const tex = {
  rubble:swatch(atlas,0,392,312), brick:swatch(atlas,1,198,144),
  walk:swatch(atlas,2,260,248), coping:swatch(atlas,3,256,198),
  old:swatch(stock,0,410,325)
};

function polygon(g, points) {
  g.beginPath();
  points.forEach(([x,y],i)=> i ? g.lineTo(x,y) : g.moveTo(x,y));
  g.closePath();
}

function mesh() {
  const surfaces=[], details=[];
  function surface(points, material, face, tint=0, mark=0) {
    surfaces.push({points,material,face,tint,mark});
  }
  function box([x,y,w,d],lo,hi,material,top='walk',tint=0) {
    const X=x+w,Y=y+d;
    surface([[X,y,lo],[X,Y,lo],[X,Y,hi],[X,y,hi]],material,'x',tint);
    surface([[x,Y,lo],[X,Y,lo],[X,Y,hi],[x,Y,hi]],material,'y',tint);
    surface([[x,y,hi],[X,y,hi],[X,Y,hi],[x,Y,hi]],top,'top',tint);
  }
  function paint(g,shift,mode) {
    const [ox,oy]=shift, p=palette[mode];
    const patterns=Object.fromEntries(Object.entries(tex).map(([k,v])=>[k,g.createPattern(v,'repeat')]));
    const screen=point=>{const [x,y]=projection(point);return [x+ox,y+oy];};
    for(const {points,material,face,tint,mark} of surfaces) {
      const coords=points.map(screen), [a,b,,d]=coords;
      polygon(g,coords);
      g.save();g.clip();
      if(patterns[material]) {
        // UV distances are in output pixels and phase follows each local world axis.
        const A=points[0],B=points[1],D=points[3];
        const uv=v=>face==='x'?[v[1]*56,-2*v[2]]:face==='y'?[v[0]*56,-2*v[2]]:[v[0]*56,v[1]*56];
        const [u,v]=uv(A), [bu,bv]=uv(B), [du,dv]=uv(D);
        const U=bu-u,V=dv-v;
        assert(U && V && bv===v && du===u);
        g.save();
        g.transform((b[0]-a[0])/U,(b[1]-a[1])/U,(d[0]-a[0])/V,(d[1]-a[1])/V,a[0],a[1]);
        g.translate(-u,-v);
        g.fillStyle=patterns[material];
        g.fillRect(u-1024,v-1024,2048,2048);
        g.restore();
      } else {
        g.fillStyle=material;g.fill();
      }
      const shade=visibility[face]+tint;
      if(shade>0){g.globalAlpha=Math.min(.75,shade);g.fillStyle=p.side;g.fill();}
      if(mode==='night'){
        g.globalAlpha=.55;
        g.fillStyle=p.shade;g.fill();
      }
      if(mark){g.globalAlpha=.46;g.fillStyle=p.shadow;g.fill();}
      g.restore();
      // Only the top edge. A vertical outline at a modular end would show as a seam.
      if(face!=='top' && !mark) {
        g.beginPath();g.moveTo(...coords[2]);g.lineTo(...coords[3]);
        g.strokeStyle=mode==='day'?'#29251d77':'#1117229e';g.lineWidth=1;g.stroke();
      }
    }
    for(const {points,col,alpha} of details) {
      polygon(g, points.map(screen));g.save();g.globalAlpha=alpha;
      g.fillStyle=col[mode];g.fill();g.restore();
    }
  }
  return {box,surface,details,paint,surfaces};
}

function footprint(side,length,width=.9) {
  const {axis,outside}=guides[side];
  const start=outside>0?-.45:.45-width;
  return axis==='x'?[0,start,length,width]:[start,0,width,length];
}

function wall(side, variant, tower=false) {
  const m=mesh();
  const {axis,outside}=guides[side];
  const length=tower?3:5;
  const W=tower?1.70:.9,H=tower?200:136;
  const r=footprint(side,length,W);
  const u=(l,lo,span,depth)=> {
    const at=(outside>0?-.45:.45)+outside*lo;
    const f=outside>0?at:at-depth;
    return axis==='x'?[l,f,span,depth]:[f,l,depth,span];
  };
  const v=(l,lo,z)=> {
    const ax=(outside>0?-.45:.45)+outside*lo;
    return axis==='x'?[l,ax,z]:[ax,l,z];
  };
  const visibleSide=outside>0?W:.09;
  const face=axis==='x'?'y':'x';
  const foot=variant===1?'old':'rubble';
  // Two output pixels of overlap seal anti-aliased diagonal ends between sprites.
  const bleed=.038;
  const run=(lo,depth)=>u(-bleed,lo,length+2*bleed,depth);
  m.box(outside>0?run(0,W):run(.09,W-.09),0,H-8,foot);
  // Brick repairs on the exposed face. Different silhouettes and z bands break repetition.
  const patch=(a,b,z,h,material,tint=.05)=> {
    const lo=visibleSide+(outside>0?.002:-.002);
    m.surface([v(a,lo,z),v(b,lo,z),v(b,lo,h),v(a,lo,h)],material,face,tint);
  };
  if(variant===0) {
    patch(.48,1.89,40,67,'brick');patch(.69,1.42,33,40,'brick');
    patch(length-1.1,length-.4,65,93,'old');
  } else if(variant===1) {
    patch(length*.37,length*.84,47,82,'rubble');
    patch(length*.42,length*.69,82,92,'rubble');
    patch(.30,.97,14,37,'brick');
  } else {
    patch(1.13,Math.min(length-.16,2.51),19,42,'brick');
    patch(1.32,Math.min(length-.26,2.22),42,51,'brick');
    patch(.26,.91,73,102,'old');
  }
  const lo=visibleSide+(outside>0?.004:-.004);
  // Contact grime and irregular rain streaks follow the face plane, never the lane.
  for(let i=0;i<19;i++){
    const a=.12+(i*97%101)/101*(length-.25), span=.08+(i%4)*.044;
    m.surface([v(a,lo,2),v(Math.min(length-.07,a+span),lo,2),
      v(Math.min(length-.08,a+span*.55),lo,9+(i*5%24)),v(a,lo,6+(i*7%12))],
      i%3?'#5b583a':'#6a6c3c',face,.11);
  }
  const stations=tower?[.15,length-.55]:variant===2?[.9,3.54]:[.68,3.08];
  for(const a of stations) {
    // Inner pilasters reach the registered facade. Outer buttresses project into countryside.
    const base=outside>0?W-.29:0;
    const footDepth=outside>0?.48:.25;
    const capDepth=outside>0?.35:.20;
    m.box(u(a,base,.40,footDepth),0,tower?104:57,'old','coping',.02);
    m.box(u(a+.03,base,.34,capDepth),tower?104:57,tower?114:67,'coping','coping',.02);
  }
  // Coping projects over the outer face. The recessed dark course gives it a shadow line.
  m.box(run(0,W+.12),H-11,H-6,'#443a2b','coping',.09);
  m.box(run(0,W+.18),H-6,H,'coping','walk');
  const outer=()=> {
    m.box(run(W-.29,.42),H,H+12,'rubble','coping');
    const count=tower?3:5;
    for(let i=0;i<count;i++) {
      const a=(i+.21)*length/count;
      m.box(u(a,W-.28,length/count*.48,.40),H+12,H+(tower?38:29),i%3===1?'old':'rubble','coping');
      m.box(u(a-.018,W-.30,length/count*.52,.45),H+(tower?38:29),H+(tower?42:33),'coping','coping');
    }
  };
  const inner=()=> {
    m.box(run(0,.159),H,H+12,'rubble','coping');
    m.box(run(0,.190),H+12,H+16,'coping','coping');
  };
  if(outside>0) {inner();outer();} else {outer();inner();}
  if(tower){
    for(const l of [.87,2.1]){
      m.details.push({points:[v(l,lo,99),v(l+.18,lo,99),v(l+.16,lo,140),v(l+.04,lo,140)],col:{day:'#332b21',night:'#30232b'},alpha:1});
      m.details.push({points:[v(l+.04,lo,102),v(l+.145,lo,102),v(l+.132,lo,131),v(l+.062,lo,132)],col:{day:'#665640',night:'#e9b66b'},alpha:.93});
    }
  }
  return {mesh:m,rect:r,height:H,side,tower,length,sockets:axis==='x'?[[0,0],[length,0]]:[[0,0],[0,length]]};
}

function corner(name,ix,iy) {
  const m=mesh(), W=1.93, H=208;
  const x=ix>0?.45-W:-.45, y=iy>0?.45-W:-.45;
  const r=[x,y,W,W];
  m.box(r,0,H-12,'old','walk');
  const [X,Y]=[x+W,y+W];
  m.surface([[X,y+.2,45],[X,y+1.06,45],[X,y+1.06,72],[X,y+.2,72]],name==='northwest'?'old':'brick','x',.07);
  m.surface([[x+.64,Y,91],[x+1.47,Y,91],[x+1.47,Y,111],[x+.64,Y,111]],'rubble','y',.05);
  const ledge=[x-(ix>0?.08:0),y-(iy>0?.08:0),W+.08,W+.08];
  m.box(ledge,H-13,H-7,'#3c3228','coping',.13);
  m.box(ledge,H-7,H,'coping','walk');
  const ring=(axis,inside,front)=>{
    const width=inside?.18:.30, high=inside?14:18;
    const coord=axis==='x'?(front?Y-width:y):(front?X-width:x);
    const strip=axis==='x'?[x,coord,W,width]:[coord,y,width,W];
    m.box(strip,H,H+high,'old','coping');
    if(!inside)for(const off of [.12,.78,1.44]) {
      const q=axis==='x'?[x+off,coord,.35,width]:[coord,y+off,width,.35];
      m.box(q,H+high,H+34,'rubble','coping');
    }
  };
  ring('x',iy<0,false);ring('y',ix<0,false);
  ring('x',iy>0,true);ring('y',ix>0,true);
  for(const q of [[X-.16,y+.57],[x+.51,Y-.16]]){
    const slit=q[0]>X-.2?[[X,q[1],104],[X,q[1]+.14,104],[X,q[1]+.13,141],[X,q[1]+.026,141]]:
      [[q[0],Y,105],[q[0]+.14,Y,105],[q[0]+.13,Y,141],[q[0]+.026,Y,141]];
    m.details.push({points:slit,col:{day:'#383227',night:'#d89851'},alpha:.9});
  }
  return {mesh:m,rect:r,height:H,corner:name,sockets:[[ix*.45,0],[0,iy*.45]],tower:true};
}

function render(spec,mode) {
  const points=spec.mesh.surfaces.flatMap(face=>face.points).map(projection);
  const x=Math.floor(Math.min(...points.map(p=>p[0])))-4,y=Math.floor(Math.min(...points.map(p=>p[1])))-4;
  const X=Math.ceil(Math.max(...points.map(p=>p[0])))+4,Y=Math.ceil(Math.max(...points.map(p=>p[1])))+4;
  const im=createCanvas(X-x,Y-y);
  spec.mesh.paint(im.getContext('2d'),[-x,-y],mode);
  return {im,origin:[-x,-y]};
}

async function add(id,spec) {
  const day=render(spec,'day'), night=render(spec,'night');
  const [x,y,w,d]=spec.rect;
  const front=[x+w,y+d];
  const pixel=projection(front).map((p,i)=>+(p+day.origin[i]).toFixed(4));
  const path='sprites/'+id;
  const meta={id,type:spec.corner?'corner-tower':spec.tower?'interval-tower':'straight',
    side:spec.side,corner:spec.corner,axis:spec.side?guides[spec.side].axis:undefined,
    dimensions:[day.im.width,day.im.height],footprint:spec.rect.map(x=>+x.toFixed(4)),
    wallThickness:spec.tower?undefined:.9,length:spec.length,wallWalkHeightPx:spec.height,
    frontCornerCells:front.map(x=>+x.toFixed(4)),anchor:pixel,anchorKind:'front ground corner',
    originPixel:day.origin,joinSockets:spec.sockets,file:path+'.webp',nightFile:path+'-night.webp'};
  assert(pixel[0]>=0 && pixel[0]<day.im.width && pixel[1]>=0 && pixel[1]<day.im.height,id);
  await writeFile(file(meta.file),day.im.toBuffer('image/webp',89));
  await writeFile(file(meta.nightFile),night.im.toBuffer('image/webp',88));
  parts.push(meta);
}

for(const side of Object.keys(guides)) {
  for(let n=0;n<3;n++)await add(side+'-straight-'+(n+1),wall(side,n));
  await add(side+'-interval-tower',wall(side,2,true));
}
for(const [name,x,y] of [['northwest',1,1],['northeast',-1,1],['southwest',1,-1],['southeast',-1,-1]])await add(name+'-corner-tower',corner(name,x,y));

const manifest={
  schema:'city-watch-wall-kit-v1', artworkScale:2, cellPixels:[112,56],
  gameCellPixels:[56,28],wallBounds:layout.envelope.bounds,wallFootprintDepth:.9,
  groundPosition:'Place the front-corner anchor at projection(placementOrigin + frontCornerCells).',
  collision:'Straight footprint is 0.9 cells deep. Tower footprints and outer buttresses are art depths. No collision or gate layout changes.',
  gates:layout.gates.map(g=>({id:g.id,position:g.center,width:g.clearWidth,keepExisting:true,towerRects:g.towerRects})),
  riverOpenings:layout.riverInterfaces.map(r=>({id:r.id,interface:r.interface,keepExisting:true})),
  sprites:parts
};
assert.equal(parts.length,20);
assert.equal(manifest.gates.length,9);
await writeFile(file('manifest.json'), JSON.stringify(manifest,null,2)+'\n');

function scene(cornerName) {
  const placements=[[`${cornerName}-corner-tower`,0,0]];
  if(cornerName==='northwest') placements.push(
    ['north-straight-1',.45,0],['north-straight-3',5.45,0],
    ['north-interval-tower',10.45,0],['north-straight-2',13.45,0],
    ['west-straight-2',0,.45],['west-straight-1',0,5.45]);
  else placements.push(
    ['south-straight-3',-5.45,0],['south-straight-1',-10.45,0],
    ['south-interval-tower',-13.45,0],['south-straight-2',-18.45,0],
    ['east-straight-2',0,-5.45],['east-interval-tower',0,-8.45],['east-straight-1',0,-13.45]);
  return placements.map(([id,x,y])=>({meta:parts.find(p=>p.id===id),x,y})).sort((a,b)=>a.x+a.y-b.x-b.y);
}

async function contact(mode) {
  const canvas=createCanvas(1250,1260),g=canvas.getContext('2d');
  g.fillStyle=mode==='day'?'#39382e':'#202632';g.fillRect(0,0,1250,1260);
  g.fillStyle='#e9dbbb';g.font='bold 28px serif';g.fillText('CITY WATCH  /  WALLS AND TOWERS',36,46);
  g.font='16px sans-serif';g.fillText(mode.toUpperCase()+'  ·  ASSEMBLIES AT GAME SCALE  ·  56 × 28 GRID',37,74);
  for(const [name,ox,oy,top,label] of [
    ['northwest',405,381,96,'NORTH / WEST  ·  INNER FACES'],
    ['southeast',689,1134,676,'SOUTH / EAST  ·  OUTER FACES']
  ]){
    g.fillStyle=mode==='day'?'#6b6653':'#343d4d';g.fillRect(24,top,1202,552);
    g.save();g.beginPath();g.rect(24,top,1202,552);g.clip();
    g.translate(ox,oy);g.scale(.5,.5);
    for(let i=-21;i<=21;i++)for(let j=-21;j<=21;j++){
      const inCity=name==='northwest'?i>=0&&j>=0:i<0&&j<0;
      const points=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(projection);
      polygon(g,points);
      g.fillStyle=inCity?(mode==='day'?'#79715f':'#454a52'):(mode==='day'?'#646441':'#343e3f');g.fill();
      g.strokeStyle=mode==='day'?'#d1c39e28':'#a1b1c831';g.lineWidth=1;g.stroke();
    }
    for(const {meta,x,y} of scene(name)){
      const im=await loadImage(await readFile(file(mode==='day'?meta.file:meta.nightFile)));
      const [px,py]=projection([x,y]);
      g.drawImage(im,px-meta.originPixel[0],py-meta.originPixel[1]);
    }
    g.restore();g.fillStyle='#e9dbbb';g.font='bold 16px sans-serif';g.fillText(label,40,top+25);
  }
  await writeFile(file('contact-'+mode+'.webp'),canvas.toBuffer('image/webp',88));
}
async function verifyExports() {
  for(const meta of parts){
    assert.equal(meta.anchorKind,'front ground corner');
    for(const name of [meta.file,meta.nightFile]){
      const im=await loadImage(await readFile(file(name)));
      assert.deepEqual([im.width,im.height],meta.dimensions);
      const g=createCanvas(im.width,im.height).getContext('2d');
      g.drawImage(im,0,0);
      const pixels=g.getImageData(0,0,im.width,im.height).data;
      assert.equal(pixels[3],0,name+' transparent border');
      let opacity=0;
      for(let i=3;i<pixels.length;i+=4) if(pixels[i]===255)opacity++;
      assert(opacity>im.width*im.height*.23,name+' opaque masonry');
    }
  }
  let joins=0;
  for(const [side,{axis,outside}] of Object.entries(guides)){
    const straight=parts.filter(p=>p.side===side && p.type==='straight');
    const tower=parts.find(p=>p.side===side && p.type==='interval-tower');
    for(const left of straight) for(const right of [...straight,tower]) for(const mode of ['day','night']){
      const c=createCanvas(1500,1100),g=c.getContext('2d'),anchor=[750,520];
      const delta=axis==='x'?[5,0]:[0,5];
      for(const [meta,start] of [[left,[0,0]],[right,delta]]){
        const im=await loadImage(await readFile(file(mode==='day'?meta.file:meta.nightFile)));
        const p=projection(start);
        g.drawImage(im,anchor[0]+p[0]-meta.originPixel[0],anchor[1]+p[1]-meta.originPixel[1]);
      }
      // Sample both sides and the seam itself inside the common stone silhouette.
      for(const l of [4.89,4.96,5,5.04,5.11])for(const h of [20,54,100]){
        const plane=outside>0?.40:.33;
        const world=axis==='x'?[l,plane,h]:[plane,l,h];
        const [x,y]=projection(world).map((v,i)=>Math.floor(v+anchor[i]));
        assert(g.getImageData(x,y,1,1).data[3]>245,JSON.stringify({side,left:left.id,right:right.id,l,h,mode}));
      }
      joins++;
    }
  }
  const briefCentres={traitors:[35,4.5],rimwards:[80,4.5],least:[196,4.5],deosil:[7.5,64],
    shambling:[7.5,285],trading:[241.5,275],limping:[241.5,320],onion:[82,342.5],hubwards:[174,342.5]};
  for(const gate of manifest.gates){
    const name=gate.id.split(':')[1];
    const [x,y]=briefCentres[name];
    assert(Math.hypot(gate.position[0]-x,gate.position[1]-y)<.5, name);
    assert.equal(gate.width,6);
  }
  const anchors={northwest:[7.5,4.5],southeast:[241.5,342.5]};
  for(const [corner,[bx,by]] of Object.entries(anchors))for(const {meta,x,y} of scene(corner)){
    const [lx,ly,w,d]=meta.footprint;
    const bounds=[bx+x+lx,by+y+ly,bx+x+lx+w,by+y+ly+d];
    for(const gate of manifest.gates)for(const [gx,gy,gw,gd] of gate.towerRects){
      assert(bounds[2]<=gx || bounds[0]>=gx+gw || bounds[3]<=gy || bounds[1]>=gy+gd,meta.id+' overlaps '+gate.id);
    }
  }
  await writeFile(file('verification.json'),JSON.stringify({
    passed:true,daySprites:20,nightSprites:20,joinChecks:joins,gateOpenings:9,
    reviewAssemblies:2,joinSample:'Five longitudinal positions and three heights through each stone seam.'
  },null,2)+'\n');
  console.log('PASS',joins,'day/night straight and interval-tower join checks, 40 transparent exports and nine preserved gate openings');
}
await verifyExports();
await contact('day');
await contact('night');
console.log('Exported and registered 20 day and 20 night sprites. Preserved nine gate and river-opening registrations.');

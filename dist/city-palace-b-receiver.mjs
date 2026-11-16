import {drawPalaceGridExterior} from './city-palace-grid-exterior.mjs';
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
const base='assets/palace-b-candidate/';
export async function loadPalaceBReceiver({read,load,createCanvas}){
  const [r,homes]=await Promise.all([read(base+'receiver.json'),read(base+'homes.json?v=palace-rear-store-drag')]);
  const court=homes.instances.find(o=>o.id==='uu18:000:court_homes');
  if(court?.rect.join(',')!=='210.5,203.5,10.5,11'||r.foundation.join(',')!=='149.25,212.75,9.5,9.25'||r.solePublicDoor.join(',')!=='144,231'||r.parts.length!==5||r.lightPoints.length!==13)throw Error('Invalid paired Palace B receiver');
  const [layers,receivers]=await Promise.all([
    Promise.all(r.parts.map(file=>load(base+file))),
    Promise.all(r.parts.map(file=>load(base+file.replace(/\.png$/,'-night-receiver.png'))))
  ]);
  if([...layers,...receivers].some(im=>im.width!==532||im.height!==355))throw Error('Invalid Palace B plane dimensions');
  const planes=r.parts.map((file,i)=>({id:file.slice(0,-4),paint:layers[i],emission:receivers[i]}));
  if(planes.map(p=>p.id).join(',')!=='back-wall,roof,front-wall,foundation,foreground-occlusion')throw Error('Invalid Palace B plane order');
  const [x,y,w,h]=r.foundation, pad=12, anchor=[r.anchor[0]+pad,r.anchor[1]];
  const pivot=project(r.reviewArtPivot);
  const q=(u,v,z=0)=>{
    const p=project([x+u,y+v],z);
    return [p.x-pivot.x+anchor[0],p.y-pivot.y+anchor[1]];
  };
  // Ground contacts sampled from the original painted elevations: west
  // corner, near tower foot, east corner. Register each face onto the same
  // 2:1 world projection as its neighbouring buildings; keep uprights vertical.
  const contacts=[[22,272],[365,348],[512,273]];
  const targets=[q(0,h),q(w,h),q(w,0)];
  const faces=[0,1].map(i=>{
    const [u,v]=contacts[i],[uu,vv]=contacts[i+1],[a,b]=targets[i],[aa,bb]=targets[i+1];
    const scale=(aa-a)/(uu-u),shear=((bb-b)-(vv-v))/(uu-u);
    return {left:i===0?0:u,right:i===0?uu:532,scale,shear,x:a-u*scale,y:b-v-u*shear};
  });
  function register(g,image){
    for(const f of faces){
      g.save();
      g.transform(f.scale,f.shear,0,1,f.x,f.y);
      g.drawImage(image,f.left,0,f.right-f.left,355,f.left,0,f.right-f.left,355);
      g.restore();
    }
  }
  const lightPoints=r.lightPoints.map(([u,v])=>{
    const f=faces[u<contacts[1][0]?0:1];
    return [u*f.scale+f.x,v+u*f.shear+f.y];
  });
  // Seat the approved painting on the actual reserved foundation. Its raster
  // ends short of the projected corner; the masonry must reach that corner
  // visually without shifting Palace geometry or suggesting another entrance.
  function paintPlinth(g){
    const poly=(points,fill,stroke)=>{
      g.beginPath();for(const [i,p] of points.entries())g[i?'lineTo':'moveTo'](...p);
      g.closePath();g.fillStyle=fill;g.fill();
      if(stroke){g.strokeStyle=stroke;g.stroke();}
    };
    const z=13;
    const front=(u,v)=>q(u,h,v),side=(u,v)=>q(w,u,v);
    const wall=(f,l,base,shade)=>{
      poly([f(0,0),f(l,0),f(l,z),f(0,z)],base,'#3d3529');
      for(let u=0,i=0;u<l;u+=.72,i++){
        const v=Math.min(u+.70,l);
        poly([f(u,2),f(v,2),f(v,9),f(u,9)],shade[i%shade.length]);
      }
    };
    poly([q(0,0,z),q(w,0,z),q(w,h,z),q(0,h,z)],'#877b63','#514a3c');
    for(let v=.22;v<h-.10;v+=.54)for(let u=.18;u<w-.15;u+=.70){
      const a=Math.min(w-.13,u+.67),b=Math.min(h-.12,v+.51);
      if(a<=u||b<=v)continue;
      const t=(Math.round(u*43)+Math.round(v*17))%4;
      poly([q(u,v,z),q(a,v,z),q(a,b,z),q(u,b,z)],['#a29376','#938368','#9b8c70','#897c64'][t]);
    }
    wall(front,w,'#72634e',['#89785d','#806f55','#8b7b61']);
    wall(side,h,'#645948',['#766752','#70634d','#7f705a']);
    g.lineWidth=2;g.strokeStyle='#b0a082';g.beginPath();
    g.moveTo(...q(0,h,z));g.lineTo(...q(w,h,z));g.lineTo(...q(w,0,z));g.stroke();g.lineWidth=1;
  }
  const geometric=!new URLSearchParams(globalThis.location?.search||'').has('palace-original');
  const panelSource=geometric?(()=>{
    const canvas=()=>{const c=createCanvas();c.width=532;c.height=355;return c;};
    const paint=canvas(),emission=canvas(),pg=paint.getContext('2d'),eg=emission.getContext('2d');
    for(const p of planes){pg.drawImage(p.paint,0,0);eg.drawImage(p.emission,0,0);}
    return {paint,emission};
  })():null;
  function compose(roofVisible){
    const canvas=()=>{const c=createCanvas();c.width=596;c.height=440;return c;};
    const im=canvas(),nightEmission=canvas(),paint=im.getContext('2d'),emission=nightEmission.getContext('2d');
    paintPlinth(paint);
    if(geometric)drawPalaceGridExterior({paint,emission,q,roofVisible,materials:{
      panels:panelSource,
      slate:[layers[1],277,93,45,34],
      stone:[[layers[3],203,300,28,10],[layers[3],185,296,28,10]]
    }});
    else for(const p of planes){
      if(p.id==='roof'&&!roofVisible)continue;
      register(paint,p.paint);
      register(emission,p.emission);
    }
    emission.globalCompositeOperation='source-in';
    emission.fillStyle='#ffcf7d';
    emission.fillRect(0,0,596,440);
    emission.globalCompositeOperation='source-over';
    return {im,nightEmission};
  }
  return {...compose(true),roofHidden:compose(false),homes,receivers:r.receivers,anchors:geometric?[]:lightPoints,p:r.reviewArtPivot,anchor,rect:[x+.5,y+.5,w,h]};
}

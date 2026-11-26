// Sto Plains countryside outside the city wall (art/countryside-v1, Mark 26 Nov 2026).
// Ground: 78 painted 16x16-cell tiles at 2x, loaded only when near the camera, shrunk to game size
// (half again on phones) and released when far away. Raised farms, mills, trees and hedges are
// scenery sprites. Nothing here is walkable or changes the city.
import {project} from './city-core.mjs?v=junction-continuity-v3';
const BASE='assets/countryside-v1/';
export async function createCountryside({read,load,addSprites,lowMemory=false,keep=lowMemory?8:16}){
 const m=await read(BASE+'manifest.json?v=1');
 const k=1/m.artScale,density=lowMemory?.5:1;
 const tiles=m.tiles.map(t=>{const q=project(t.position),w=t.dimensions[0]*k,h=t.dimensions[1]*k,x=q.x-t.anchor[0]*k,y=q.y-t.anchor[1]*k;return {...t,box:[x,y,x+w,y+h],surface:null,pending:null,used:0};});
 let revision=0,resident=0;const errors=new Map();
 function want(t){
  if(t.surface||t.pending||errors.has(t.id))return;
  t.pending=load(BASE+t.file).then(im=>{
   const c=document.createElement('canvas');c.width=Math.round((im.naturalWidth||im.width)*k*density);c.height=Math.round((im.naturalHeight||im.height)*k*density);
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);t.surface=c;resident++;revision++;
  }).catch(e=>{errors.set(t.id,String(e?.message||e));}).finally(()=>{t.pending=null;});
 }
 let visible=[];
 const painter={
  get revision(){return revision;},errors,pump(){if(errors.size){errors.clear();revision++;}},
  update(view){
   const pad=448;visible=tiles.filter(t=>t.box[2]>=view[0]-pad&&t.box[0]<=view[2]+pad&&t.box[3]>=view[1]-pad&&t.box[1]<=view[3]+pad);
   const now=performance.now();for(const t of visible){t.used=now;want(t);}
   const loaded=tiles.filter(t=>t.surface).sort((a,b)=>a.used-b.used);
   while(loaded.length>keep){const t=loaded.shift();if(visible.includes(t))break;t.surface.width=t.surface.height=0;t.surface=null;resident--;}
  },
  draw(g){for(const t of visible)if(t.surface)g.drawImage(t.surface,t.box[0],t.box[1],t.box[2]-t.box[0],t.box[3]-t.box[1]);},
  report:()=>({tiles:tiles.length,resident,visible:visible.length,errors:[...errors]})
 };
 const types=new Map();
 await Promise.all([...new Set(m.sprites.map(s=>s.file))].map(async f=>types.set(f,await load(BASE+f))));
 const objects=addSprites(m.sprites.map(s=>{const [x0,y0,x1,y1]=s.bounds;return ['countryside:'+s.id,types.get(s.file),s.position,s.anchor,k,[x0,y0,x1-x0,y1-y0],{sceneryKind:'street-furniture',sourceAsset:'countryside-v1:'+s.type,countryside:true}];}));
 return Object.freeze({painter,objects,report:()=>({...painter.report(),sprites:objects.length})});
}

// Shared presentation for civic rooms; their authored movement, people and save ledgers stay in their hosts.
import {roomMarkup} from './room-markup.mjs?v=civic-v2';
const styles=new WeakMap();
export function civicRoomMarkup(prefix){
 return roomMarkup.replace('<main id="interior-app">','<main id="interior-app" class="room-v2">')
  .replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`)
  .replace(/aria-labelledby="([^"]+)"/g,(_,id)=>`aria-labelledby="${prefix}-${id}"`);
}
export function loadCivicRoomStyles(doc){
 if(styles.has(doc))return styles.get(doc);
 const promise=new Promise(resolve=>{const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('civic-room-view.css?v=1',import.meta.url).href;
  link.onload=()=>resolve(true);link.onerror=()=>{link.remove();styles.delete(doc);resolve(false);};doc.head.append(link);
 });styles.set(doc,promise);return promise;
}
const EXIT=Object.freeze({id:'exit',kind:'exit',title:'Exit'});
export function createCivicRoomView(room){
 const xs=room.floor.map(p=>p[0]*1536),ys=room.floor.map(p=>p[1]*1024);
 const content={x0:Math.max(0,Math.min(...xs)-40),x1:Math.min(1536,Math.max(...xs)+40),y0:Math.max(0,Math.min(...ys)-300),y1:Math.min(1024,Math.max(...ys)+40)};
 const spots=[...room.hotspots,EXIT],at=h=>h===EXIT?room.entry:h.stand;
 function camera(w,h,p,follow=true){
  if(!follow){const scale=Math.min(w/1536,h/1024);return{scale,x:(w-1536*scale)/2,y:(h-1024*scale)/2};}
  const cw=content.x1-content.x0,ch=content.y1-content.y0;
  const scale=Math.max(w/cw,Math.min(h/ch,w/(cw*.58)));
  const cx=cw*scale<=w?(content.x0+content.x1)/2:Math.min(Math.max(p[0]*1536,content.x0+w/2/scale),content.x1-w/2/scale);
  const cy=ch*scale<=h?(content.y0+content.y1)/2:Math.min(Math.max(p[1]*1024-40,content.y0+h/2/scale),content.y1-h/2/scale);
  return{scale,x:w/2-cx*scale,y:h/2-cy*scale};
 }
 function point(h,c){const p=at(h);return[p[0]*1536*c.scale+c.x,p[1]*1024*c.scale+c.y];}
 function hit(x,y,c){let chosen=null,best=34;for(const h of spots){const [px,py]=point(h,c);for(const dy of [0,-22]){const d=Math.hypot(x-px,y-py-dy);if(d<best){chosen=h;best=d;}}}return chosen;}
 function markers(g,c,view,active,width,height){
  if(view.closed)return;
  g.save();g.textAlign='center';g.textBaseline='middle';
  const label=(text,x,y,size,color)=>{g.font='600 '+size+'px Georgia,serif';const half=g.measureText(text).width/2+6;if(half*2>width-12)return;
   x=Math.max(half,Math.min(width-half,x));y=Math.max(14,Math.min(height-14,y));g.lineWidth=3;g.strokeStyle='#000d';g.strokeText(text,x,y);g.fillStyle=color;g.fillText(text,x,y);
  };
  for(const h of spots){const [x,y]=point(h,c);if(x<-34||x>width+34||y<-34||y>height+34)continue;const selected=h.id===active?.id,color=selected?'#f3d58a':'#fff';g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.ellipse(x,y,15,6.5,0,0,Math.PI*2);g.stroke();label(h===EXIT?'↩':h.kind==='talk'?'…':'◆',x,y-22,16,color);if(h===EXIT||selected)label(h===EXIT?'EXIT':h.title,x,y+(h===EXIT?17:-42),13,color);}
  label('YOU',view.position[0]*1536*c.scale+c.x,(view.position[1]*1024-room.actorHeight-12)*c.scale+c.y,12,'#fff');g.restore();
 }
 return Object.freeze({camera,hit,markers});
}

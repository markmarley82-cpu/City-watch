import {CONTACTS} from './contact-contract.mjs';

// Floor art uses a tighter interior scale than the exterior actors.
// Keep species and prop proportions: only human/civilian sprite height changes.
export const universityActorHeight=height=>height*.72;
const images={
 porter:['porter.webp',40],ponder:['ponder.webp',60],
 'stores-assistant':['assistant-idle.webp',55],
 'crate-records':['../assets/graphics-p17/shades/sprites/props/small_closed_storage_crate.exact.webp',24],
 open:['crate-open.svg',28],talk:['assistant-talk.webp',55]
};

export function createCaseScene({ctx,pr}){
 const loaded=new Map();
 for(const [key,[file,height]] of Object.entries(images)){
  const im=new Image();im.decoding='async';im.src=new URL(file,key==='crate-records'?import.meta.url:new URL('./art/',import.meta.url));
  loaded.set(key,{im,height});
 }
 let recovered=false,talkUntil=0;
 function update(value){recovered=value?.recovered===true;if(value?.assistantSpeaking===true)talkUntil=performance.now()+2600;}
 function draw(floor,player,now,drawPlayer){
  const rows=CONTACTS.filter(c=>c.position[0]===floor).map(c=>({key:c.id,x:c.position[1],y:c.position[2]}));
  rows.push({key:'player',x:player[0],y:player[1]});rows.sort((a,b)=>a.x+a.y-b.x-b.y);
  for(const a of rows){
   if(a.key==='player'){drawPlayer();continue;}
   const prop=a.key==='crate-records',entry=loaded.get(prop&&recovered?'open':a.key==='stores-assistant'&&now<talkUntil?'talk':a.key);
   if(!entry?.im.naturalWidth)continue;
   const {im}=entry,height=prop?entry.height:universityActorHeight(entry.height),[px,py]=pr(a.x+.5,a.y+.5);
   const w=im.naturalWidth/im.naturalHeight*height;
   ctx.save();
   ctx.fillStyle='rgba(20,14,11,.34)';ctx.beginPath();ctx.ellipse(px,py,w*.29,prop?4:2.8,0,0,Math.PI*2);ctx.fill();
   ctx.translate(px,py);
   if(!prop&&Math.hypot(a.x-player[0],a.y-player[1])<4&&pr(player[0]+.5,player[1]+.5)[0]>px)ctx.scale(-1,1);
   ctx.drawImage(im,-w/2,-height,w,height);
   ctx.restore();
  }
 }
 return Object.freeze({draw,update});
}

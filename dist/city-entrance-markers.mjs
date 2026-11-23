import {createSceneryIndex} from './city-scenery-index.mjs?v=p21-b407-s039-reuse';
import {distance} from './city-core.mjs?v=p21-b468-palace-street';

// Index positions once. Status and hit priority still follow the live city.
export function createDoorMarkerIndex(doors,project){
 const entries=[...doors.values()].map(door=>{
  const point=project(door.position);
  return {door,point,bounds:[point.x,point.y,0,0]};
 });
 return createSceneryIndex(entries);
}
export function visibleEntranceMarkers(index,{camera,zoom,width,height,player,canEnter}){
 const halfW=(width/2+40)/zoom,halfH=(height/2+50)/zoom;
 const candidates=index.query([camera.x-halfW,camera.y-halfH,camera.x+halfW,camera.y+halfH],1);
 const markers=[];
 for(const {door,point} of candidates){
  if(Math.abs((point.x-camera.x)*zoom)>width/2+40||Math.abs((point.y-camera.y)*zoom)>height/2+50)continue;
  const steps=distance(player,door.position);
  if((zoom<.35&&steps>8)||entranceStatus(door,canEnter)!=='enter')continue;
  const near=steps<3,screenY=(point.y-camera.y)*zoom+height/2;
  // Keep signs clear of the top panel and bottom buttons on small screens.
  if(!near&&(screenY>height-118||screenY<150))continue;
  markers.push({door,point,near});
 }
 return markers;
}
// Only registered playable entrances receive a sign. Coordinates stay canonical.
export function entranceStatus(door,canEnter){
 if(door?.held)return 'closed';
 return door&&canEnter(door)?'enter':'exterior';
}
export function entranceLabel(door,canEnter){return {enter:'Enter',exterior:'Exterior only',closed:'Closed'}[entranceStatus(door,canEnter)];}
export function drawEntranceSign(ctx,p,zoom,{near=false}={}){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(1/zoom,1/zoom);
 // Near a doorway the officer occupies this same screen space. Use a small
 // transparent outline to the side, within the original 60x44 hit region.
 if(near){
  ctx.strokeStyle='#f5d891';ctx.lineWidth=1.5;
  ctx.strokeRect(17,-23,10,15);ctx.fillStyle='#fff0c0';ctx.fillRect(23,-16,2,2);
  ctx.restore();return;
 }
 ctx.fillStyle='#17251e';ctx.strokeStyle='#f5d891';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(-29,-43);ctx.lineTo(29,-43);ctx.lineTo(29,-10);ctx.lineTo(5,-10);ctx.lineTo(0,-3);ctx.lineTo(-5,-10);ctx.lineTo(-29,-10);ctx.closePath();ctx.fill();ctx.stroke();
 // Door glyph plus a word: this cue does not rely on colour alone.
 ctx.strokeRect(-5,-39,10,12);ctx.fillStyle='#fff0c0';ctx.fillRect(1,-33,2,2);
 ctx.font=(near?'bold ':'')+'11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ENTER',0,-18);
 ctx.restore();
}
export function entranceHit(doors,point,project,zoom,canEnter){
 return [...doors].filter(d=>entranceStatus(d,canEnter)==='enter').map(d=>({d,p:project(d.position)})).filter(({p})=>Math.abs((point.x-p.x)*zoom)<=30&&(point.y-p.y)*zoom>=-44&&(point.y-p.y)*zoom<=0).sort((a,b)=>Math.hypot(point.x-a.p.x,point.y-a.p.y)-Math.hypot(point.x-b.p.x,point.y-b.p.y))[0]?.d;
}

/* Shared scenery adapter. Captures existing map context; never changes navigation or combat rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BastionLocations=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const locations=Object.freeze([
 ['tavern','Tavern yard','courtyard'],['shades','The Shades','shades'],['docks','Riverside warehouses','docks'],['market','Market square','market'],
 ['university','Unseen University','sceneUniversity'],['watch','Watch and Opera precinct','sceneWatch'],['temple','Small Gods forecourt','sceneTemple'],['palace','Palace approach','scenePalace'],['guild','Guild offices and archives','sceneGuild'],['crypt','Old crypt','sceneCrypt'],['street','Residential and artisan streets','sceneStreet'],['bridge','Bridge landing','sceneBridge'],['river','River Ankh quay','sceneRiver']
 ].map(([id,label,asset])=>Object.freeze({id,label,asset,file:id+'.webp',cropTop:{university:.25,palace:.35,river:.25}[id]||0})));
 const defaults={'taproom':'tavern','last-orders':'shades','quiet-word':'market','witness-escort':'shades','stop-runner':'docks','recover-property':'market','separate-crowd':'market'};
 const places=Object.freeze({watch:'watch',opera:'watch',outpost:'watch',temple:'temple',shrine:'temple',palace:'palace',university:'university',archives:'guild',warehouse:'docks',drum:'tavern',market:'market',crypt:'crypt',shades:'shades',lantern:'street',books:'street',bakery:'street',alley:'street',net:'river',store:'river'});
 const aliases=Object.freeze({'unseen-university':'university','unseen university':'university','wizards-quarter':'university','pseudopolis-yard':'watch','watch-house':'watch','opera-house':'watch','small-gods':'temple','temple-of-small-gods':'temple','guild-quarter':'guild','guild-archives':'guild','patricians-palace':'palace','riverbank':'river','river-ankh':'river','residential':'street','dimwell':'street','cattle-market':'market','mended-drum':'tavern'});
 const get=id=>locations.find(l=>l.id===id);
 function normalized(value){if(typeof value!=='string')return null;const key=value.toLowerCase().replace(/^place:/,'');return get(key)?.id||aliases[key]||places[key]||null;}
 function resolve(state={}){const value=state.location;const district=typeof value==='string'?normalized(value):normalized(value?.district)||normalized(value?.placeId);return get(district)||get(defaults[state.patrol?.id])||locations[0];}
 function relationScene(edge){const n=edge?.name||'';if(['BRIDGE','CUT'].includes(edge?.kind))return 'bridge';if(/University/i.test(n))return 'university';if(/Palace/i.test(n))return 'palace';if(/guild/i.test(n))return 'guild';if(/Small Gods|temple|shrine/i.test(n))return 'temple';if(/Shades/i.test(n))return 'shades';if(/dock|Wharfinger/i.test(n))return 'docks';if(/Cattle.?market|trading streets/i.test(n))return 'market';if(/Yard|Watch|Opera/i.test(n))return 'watch';return 'street';}
 function fromWorld(position,world={}){
  const p=Array.isArray(position)&&Number.isFinite(position[0])&&Number.isFinite(position[1])?position.slice(0,3):[0,0,''];const edgeId=typeof p[2]==='string'?p[2]:'';
  const doors=world.doors instanceof Map?[...world.doors.values()]:Array.isArray(world.landmarks)?world.landmarks:[];
  const edges=world.edges instanceof Map?world.edges: new Map((world.relations||[]).map(e=>[e.edge_id,e]));const edge=edges.get(edgeId);
  // Mark 28 Nov 2026: map-data edge names ("… perimeter ARC (source shape not …") must never reach the screen.
  const nice=v=>typeof v==='string'&&v&&!/[()]|\bARC\b|source|perimeter|\b[A-Z]\d{2,}\b/i.test(v)?v:null;
  const snapshot=(district,place=null)=>({version:1,district,placeId:place?.game_id||null,placeLabel:nice(place?.name)||nice(edge?.name)||get(district).label,edge:edgeId,position:p.slice(0,2)});
  const apron=edgeId.startsWith('APRON:')?edgeId.slice(6):null;if(apron&&places[apron])return snapshot(places[apron],doors.find(d=>d.game_id===apron));
  if(edgeId==='RC1')return snapshot('watch',doors.find(d=>d.game_id==='watch'));
  if(['BRIDGE','CUT'].includes(edge?.kind))return snapshot('bridge');
  const university=doors.find(d=>d.game_id==='university'),rect=university?.campus_world?.rect;
  if(rect&&p[0]>=rect[0]&&p[1]>=rect[1]&&p[0]<=rect[0]+rect[2]&&p[1]<=rect[1]+rect[3])return snapshot('university',university);
  const near=doors.filter(d=>!d.held&&places[d.game_id]).map(d=>{const at=d.position||d.engine_approach_xy;return {d,dist:at?Math.hypot(p[0]-at[0],p[1]-at[1]):Infinity};}).filter(x=>x.dist<=7).sort((a,b)=>a.dist-b.dist)[0];if(near)return snapshot(places[near.d.game_id],near.d);
  return snapshot(relationScene(edge));
 }
 function valid(snapshot){return !!snapshot&&snapshot.version===1&&!!get(snapshot.district)&&Array.isArray(snapshot.position)&&snapshot.position.length===2&&snapshot.position.every(Number.isFinite)&&typeof snapshot.edge==='string'&&snapshot.edge.length<120&&typeof snapshot.placeLabel==='string'&&snapshot.placeLabel.length<200&&(snapshot.placeId===null||Object.prototype.hasOwnProperty.call(places,snapshot.placeId));}
 function lightingCopy(value){
  if(!value||value.version!==1||!['Day','Dawn','Dusk','Night'].includes(value.phase)||!Number.isFinite(value.darkness)||value.darkness<0||value.darkness>1||typeof value.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)||!['Device local time','Lighting review only'].includes(value.basis))return null;
  return {version:1,phase:value.phase,darkness:value.darkness,time:value.time,basis:value.basis,...(value.preview===true?{preview:true}:{})};
 }
 function withLighting(snapshot,clock){const result=copy(snapshot);if(!result)return null;const light=lightingCopy({...clock,version:1});if(light)result.lighting=light;return result;}
 function shadeBackground(ctx,width,height,snapshot){const light=lightingCopy(snapshot?.lighting);if(!light||light.darkness<=0)return false;ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.45*light.darkness;ctx.fillStyle='#182943';ctx.fillRect(0,0,width,height);ctx.restore();return true;}
 // One bounded offscreen scenery bake; actors, target markers and UI are drawn afterwards.
 function createBackdropPainter(createCanvas){let cached=null,key=null,image=null,bakes=0,reuses=0;return {paint(ctx,im,w,h,snapshot,cropTop=0,density=1){const night=lightingCopy(snapshot?.lighting)?.darkness||0,d=Math.min(2,density,Math.sqrt((3*1024*1024-4096)/(w*h))),next=[w,h,night,cropTop,d].join('|');if(!cached||image!==im||key!==next){if(!cached)cached=createCanvas();cached.width=Math.max(1,Math.round(w*d));cached.height=Math.max(1,Math.round(h*d));const g=cached.getContext('2d');g.setTransform(d,0,0,d,0,0);const sy=im.height*cropTop,sh=im.height-sy,cover=Math.max(w/im.width,h/sh),dw=im.width*cover,dh=sh*cover;g.drawImage(im,0,sy,im.width,sh,(w-dw)/2,(h-dh)*.35,dw,dh);shadeBackground(g,w,h,snapshot);if(night>0){g.save();g.globalCompositeOperation='screen';g.translate(w*.5,h*.69);g.scale(1,.48);const r=Math.max(w,h)*.62,light=g.createRadialGradient(0,0,0,0,0,r);light.addColorStop(0,'rgba(255,213,153,'+(.14*night)+')');light.addColorStop(.5,'rgba(255,213,153,'+(.055*night)+')');light.addColorStop(1,'rgba(255,213,153,0)');g.fillStyle=light;g.fillRect(-r,-r,r*2,r*2);g.restore();}key=next;image=im;bakes++;}else reuses++;ctx.drawImage(cached,0,0,cached.width,cached.height,0,0,w,h);return {bakes,reuses,MiB:cached.width*cached.height*4/1048576,night};}};}
 function copy(snapshot){if(!valid(snapshot))return null;return {version:1,district:snapshot.district,placeId:snapshot.placeId,placeLabel:snapshot.placeLabel,edge:snapshot.edge,position:snapshot.position.slice(),...(lightingCopy(snapshot.lighting)?{lighting:lightingCopy(snapshot.lighting)}:{})};}
 return {locations,places,resolve,normalized,fromWorld,valid,copy,lightingCopy,withLighting,shadeBackground,createBackdropPainter};
});

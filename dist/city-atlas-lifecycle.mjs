import {placeAtlasLabels} from './city-atlas-labels.mjs?v=1';
import {surveyGeometry,planPoint,normalizedPoint,rectPolygon} from './city-survey.mjs?v=p21-b471-atlas-parity';
export {surveyGeometry,planPoint,normalizedPoint,rectPolygon} from './city-survey.mjs?v=p21-b471-atlas-parity';
// Display anchors for districts and major playable areas, not boundary claims.
export const ATLAS_AREAS=Object.freeze([
 ['watch','Watch Quarter','yard_watch_front'],
 ['isle','Isle of Gods','polestaff'],
 ['shades','The Shades','shades'],
 ['docks','Morpork Docks','morpork_docks'],
 ['dimwell','Dimwell','dimwell'],
 ['prouts','Prouts','park_ln'],
 ['small-gods','Small Gods','street_small'],
 ['palace','Palace District','palace_forecourt'],
 ['guild','Guild Quarter','guild_st'],
 ['university','University Quarter','university_st'],
 ['park','Hide Park','hide_park'],
 ['market','Cattle Market','cattle']
]);
// These two overlaps are one physical spot. Show an annotation only while
// the current graph still has overlapping road states but no direct handoff.
export function shortOverlapCells(network){
 if(!network)return [];
 const points=[];
 for(let x=107;x<=113;x++)for(let y=255;y<=260;y++){
  const p=[x,y],members=network.members.get(p.join(','));
  if(!members?.has('E064'))continue;
  const others=['E053','E058'].filter(id=>members.has(id));
  if(!others.length||others.some(id=>network.neighbours([...p,id]).some(q=>q[2]==='E064')||network.neighbours([...p,'E064']).some(q=>q[2]===id)))continue;
  points.push(p);
 }
 return points;
}
// Capture an absolute map point at the beginning of a pinch. Every move
// solves against that fixed point, including when a zoom limit is reached.
export function atlasPinchStart(points,scroll,offset,size,zoom){
 const [a,b]=points;
 const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 return {distance:Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])),zoom,
  point:mid.map((v,i)=>(scroll[i]+v-offset[i])/(size[i]*zoom))};
}
export function atlasPinchPosition(gesture,points,offset,size){
 const [a,b]=points;
 const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const zoom=Math.max(1,Math.min(8,gesture.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/gesture.distance));
 return {zoom,scroll:mid.map((v,i)=>offset[i]+gesture.point[i]*size[i]*zoom-v)};
}
export function bindCityAtlas(dialog,{getNetwork=()=>null,getStreetLanes=()=>[],getWalkableExclusions=()=>undefined,getParcels=()=>[],getCourses=()=>[],getPlayer=()=>null,getBeatStop=()=>null,getDestinations=()=>[],getSelected=()=>null,getRoute=()=>null,getGuide=()=>null}={}){
 const object=dialog.querySelector('object');if(!object)throw Error('City map surface is unavailable');
 const doc=dialog.ownerDocument,viewport=object.parentElement,page=viewport.parentElement,select=dialog.querySelector('#city-destination'),visit=dialog.querySelector('#city-visit');
 const node=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const button=(text,action,cls)=>{const b=node('button',cls,text);b.type='button';b.onclick=action;return b;};
 dialog.classList.remove('atlas-engraved-chart');dialog.classList.add('atlas-patrol-map','atlas-survey');dialog.querySelector('h2').textContent='Map';
 const content=node('div','atlas-map-content'),plane=node('div','atlas-map-plane');object.remove();content.append(plane);viewport.append(content);viewport.classList.add('atlas-zoom-enabled');viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Street map of the playable city. Drag to pan; plus and minus to zoom.');
 const cartouche=node('div','atlas-map-cartouche');cartouche.append(node('strong',null,'ANKH–MORPORK'),node('small',null,'Gold streets · pale walking ground'));
 const controls=node('div','atlas-map-controls');controls.setAttribute('role','group');controls.setAttribute('aria-label','Map controls');
 const out=button('−',()=>scale(zoom/1.5)),inside=button('+',()=>scale(zoom*1.5)),here=button('Here',()=>{refreshPlayer();center(normalizedPoint(getPlayer(),survey.bounds));});out.setAttribute('aria-label','Zoom map out');inside.setAttribute('aria-label','Zoom map in');here.setAttribute('aria-label','Centre map on you');const beat=button('Beat',focusStop,'atlas-beat-focus');
 beat.setAttribute('aria-label','Centre map on next beat stop');beat.hidden=true;const goal=button('Goal',()=>{drawGuide();fitGuide();});goal.setAttribute('aria-label','Show you and your next stop');goal.hidden=true;controls.append(here,goal,beat,out,inside);
 const summary=node('section','atlas-map-summary atlas-place-index'),label=node('label',null,'Destination'),availability=node('span'),actions=node('div','atlas-map-actions');summary.id='atlas-place-index';label.htmlFor=select.id;select.setAttribute('aria-label','Destination');
 const index=button('Places',()=>toggleIndex(summary.hidden),'atlas-index-toggle');index.setAttribute('aria-controls',summary.id);index.setAttribute('aria-expanded','false');const dismiss=button('×',()=>toggleIndex(false));dismiss.setAttribute('aria-label','Close destination index');visit.textContent='Walk here';actions.append(visit,dismiss);summary.append(label,select,availability,actions);summary.hidden=true;
 const retained=node('div','atlas-retained-controls');retained.hidden=true;for(const n of [...page.children].filter(n=>n!==viewport))retained.append(n);page.replaceChildren(viewport,cartouche,controls,index,summary,retained);
 const areas=node('select','atlas-area-picker');
 areas.setAttribute('aria-label','Districts and areas');
 areas.append(new Option('Districts & areas',''));
 areas.onchange=()=>{const p=getNetwork()?.nodes?.get(areas.value);if(!p)return;zoom=Math.max(zoom,2.5);layout();center(normalizedPoint(p,survey.bounds));areas.value='';};
 page.append(areas);
 const mapStatus=node('output','atlas-map-status');mapStatus.setAttribute('aria-live','polite');viewport.append(mapStatus);
 let zoom=1,baseWidth=1,baseHeight=1,offsetX=0,offsetY=0,survey={bounds:[0,0,350,250]},places=[],pins=[],active=false,routeLine=null;
 const playerPin=node('span','atlas-player-pin','You');playerPin.setAttribute('aria-label','You are here');plane.append(playerPin);
 const beatPin=node('span','atlas-beat-pin');beatPin.hidden=true;plane.append(beatPin);
 // Where to go (26 Nov 2026): the same gold route and destination as the street trail.
 const guidePin=node('span','atlas-guide-pin');guidePin.hidden=true;plane.append(guidePin);let guideLine=null,guide=null;
 function drawGuide(){
  guide=getGuide();
  goal.hidden=!guide;beat.hidden=beat.hidden||!!guide;if(guide)beatPin.hidden=true;
  if(!guide||!guideLine){guideLine?.removeAttribute('points');guideLine?.casing?.removeAttribute('points');guidePin.hidden=true;viewport.dataset.guide='';return;}
  const points=[getPlayer(),...guide.path].filter(p=>p&&planPoint(p));
  guideLine.setAttribute('points',pts(points));guideLine.casing.setAttribute('points',pts(points));
  guidePin.textContent=guide.name;position(guidePin,normalizedPoint(guide.at,survey.bounds));
  viewport.dataset.guide=guide.name+' · '+(guide.path.length-1);
 }
 function fitGuide(){
  if(!guide)return false;
  const a=normalizedPoint(getPlayer(),survey.bounds),b=normalizedPoint(guide.at,survey.bounds);if(!a||!b)return false;
  const pad=.06,w=Math.max(Math.abs(a[0]-b[0])+pad*2,.02),h=Math.max(Math.abs(a[1]-b[1])+pad*2,.02);
  const room=[viewport.clientWidth,Math.max(200,viewport.clientHeight-220)];
  zoom=Math.max(1.3,Math.min(5,room[0]/(w*baseWidth),room[1]/(h*baseHeight)));layout();
  center([(a[0]+b[0])/2,(a[1]+b[1])/2]);return true;
 }
 const ns='http://www.w3.org/2000/svg',svgNode=(tag,attrs)=>{const n=doc.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
 const pts=points=>points.map(planPoint).map(p=>p.join(',')).join(' ');
 function position(n,p){n.hidden=!p;if(p){n.style.left=p[0]*100+'%';n.style.top=p[1]*100+'%';}}
 function refreshPlayer(){const p=getPlayer();position(playerPin,normalizedPoint(p,survey.bounds));playerPin.dataset.position=JSON.stringify(p?.slice(0,2)||null);}
 function paint(){
  plane.querySelector('svg')?.remove();plane.querySelectorAll('.atlas-street-name,.atlas-area-name').forEach(n=>n.remove());survey=surveyGeometry(getNetwork(),getParcels(),places,getStreetLanes(),getWalkableExclusions());
  const svg=svgNode('svg',{viewBox:survey.bounds.join(' '),class:'atlas-map-plan',role:'img','aria-label':'Actual walkable streets, alleys, courtyards, river, bridges and structural footprints'}),defs=svgNode('defs',{}),roof=svgNode('pattern',{id:'survey-roof',patternUnits:'userSpaceOnUse',width:1,height:1}),water=svgNode('pattern',{id:'survey-water',patternUnits:'userSpaceOnUse',width:2,height:1});
  roof.append(svgNode('rect',{width:1,height:1,fill:'#ae9672'}),svgNode('path',{d:'M-1 1L1 -1 M0 1L1 0 M0 2L2 0',stroke:'#655236','stroke-width':.055}));water.append(svgNode('rect',{width:2,height:1,fill:'#a3b09a'}),svgNode('path',{d:'M0 .3Q.5 .1 1 .3T2 .3 M0 .8H2',fill:'none',stroke:'#69775e','stroke-width':.05}));defs.append(roof,water);svg.append(defs);
  for(const polygon of survey.water)svg.append(svgNode('polygon',{points:pts(polygon),fill:'url(#survey-water)',stroke:'#697354','stroke-width':.2}));

  for(const r of survey.buildings)svg.append(svgNode('polygon',{points:pts(rectPolygon(r)),fill:'url(#survey-roof)',stroke:'#5e492e','stroke-width':.14}));
  // Paint only admitted walking cells over plot rectangles: actual alleys,
  // courtyards and structural openings are retained instead of hidden by lots.
  svg.append(svgNode('path',{class:'atlas-walkable-ground',d:survey.walkable.fillPath,fill:'#fff8e5','data-cell-count':survey.walkable.cellCount}),svgNode('path',{class:'atlas-named-road-ground',d:survey.roadGround.fillPath,fill:'#e6cd99','data-cell-count':survey.roadGround.cellCount}),svgNode('path',{class:'atlas-walkable-outline',d:survey.walkable.outlinePath,fill:'none',stroke:'#8b7453','stroke-width':.13,'stroke-linejoin':'round'}));
  const courses=getCourses(),coursePath=key=>courses.map(s=>s[key].map(planPoint).map((q,i)=>(i?'L':'M')+q.join(',')).join('')+'Z').join('');if(courses.length)svg.append(svgNode('path',{d:coursePath('outer'),fill:'#d7c39b','data-public-courses':courses.length}),svgNode('path',{d:coursePath('inner'),fill:'#f7e8bf'}));
  for(const road of survey.roads)if(road.bridge)svg.append(svgNode('polyline',{points:pts(road.points),fill:'none',stroke:'#6e5839','stroke-width':.16,'stroke-dasharray':'.25 .8'}));
  const laneGroups=new Map();for(const lane of survey.lanes){const k=lane.width;laneGroups.set(k,(laneGroups.get(k)||'')+'M'+planPoint(lane.a).join(',')+'L'+planPoint(lane.b).join(','));}
  for(const[width,d]of laneGroups)svg.append(svgNode('path',{class:'atlas-paved-lanes',d,fill:'none',stroke:'#8b7453','stroke-width':width+.12,'stroke-linecap':'round','stroke-linejoin':'round'}),svgNode('path',{class:'atlas-paved-lanes',d,fill:'none',stroke:'#e6cd99','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'}));
  const overlap=shortOverlapCells(getNetwork());
  if(overlap.length){
   const layer=svgNode('g',{class:'atlas-short-overlap','data-cells':overlap.length,role:'img','aria-label':'No direct crossing to the Shades road here. Follow the mapped route.'});
   layer.append(svgNode('title',{}));layer.firstChild.textContent='No direct crossing to the Shades road here. Follow the mapped route.';
   for(const p of overlap){const [cx,cy]=planPoint(p);layer.append(svgNode('circle',{cx,cy,r:.22,fill:'#884d3a'}));}
   svg.append(layer);
   cartouche.lastChild.textContent='Gold streets · pale walking ground · rust dots: no direct crossing';
  }
  const guideCasing=svgNode('polyline',{class:'atlas-guide-casing',fill:'none',stroke:'#5a2f0f','stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.85});guideLine=svgNode('polyline',{class:'atlas-guide-line',fill:'none',stroke:'#f0b23e','stroke-width':1.4,'stroke-linecap':'round','stroke-linejoin':'round'});guideLine.casing=guideCasing;svg.append(guideCasing,guideLine);
  routeLine=svgNode('polyline',{class:'atlas-route-line',fill:'none',stroke:'#a03f2a','stroke-width':1.1,'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'1.5 .65'});svg.append(routeLine);plane.prepend(svg);
  // Use named graph junctions for places; an approach can mention a distant destination.
  const network=getNetwork();
  areas.replaceChildren(new Option('Districts & areas',''));
  for(const [id,name,anchor] of ATLAS_AREAS){
   const p=network?.nodes?.get(anchor);if(!p)continue;
   const label=node('span','atlas-area-name',name);
   label.dataset.anchor=id;position(label,normalizedPoint(p,survey.bounds));plane.append(label);
   areas.append(new Option(name,anchor));
  }
  for(const [id,name] of [['treacle','Treacle Mine Road junction'],['park_ln','Park Lane'],['wharfinger','Wharfinger Street'],['salis_st','Salis Street']]){
   const p=network?.nodes?.get(id);if(!p)continue;
   const label=node('span','atlas-street-name',name);label.dataset.anchor=id;
   position(label,normalizedPoint(p,survey.bounds));label.style.setProperty('--street-angle','0deg');plane.append(label);
  }
  for(const [id,name] of [['E009','Upper Broad Way'],['E011','Lower Broad Way']]){
   const road=survey.roads.find(r=>r.id===id);if(!road)continue;
   const i=Math.floor((road.points.length-1)/2),a=road.points[i],b=road.points[i+1],pa=planPoint(a),pb=planPoint(b);
   let angle=Math.atan2(pb[1]-pa[1],pb[0]-pa[0])*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;
   const label=node('span','atlas-street-name',name);label.dataset.anchor=id;
   position(label,normalizedPoint([(a[0]+b[0])/2,(a[1]+b[1])/2],survey.bounds));label.style.setProperty('--street-angle',angle+'deg');plane.append(label);
  }
  Object.assign(viewport.dataset,{publicCourses:String(courses.length),pavedLaneSegments:String(survey.lanes.length),housingLaneSegments:String(survey.lanes.filter(s=>s.housingLane).length),walkableCells:String(survey.walkable.cellCount),namedRoadCells:String(survey.roadGround.cellCount),walkableRuns:String(survey.walkable.runs.length),loaded:'true',projection:'linear-engine-survey',roads:String(survey.roads.length),parcels:String(survey.buildings.length),water:String(survey.water.length),bounds:JSON.stringify(survey.bounds)});
 }
 // Batch geometry reads/writes only while the map is open, including pan and pinch.
 let labelFrame=0;
 function scheduleLabels(){if(!labelFrame&&dialog.open)labelFrame=requestAnimationFrame(()=>{labelFrame=0;layoutLabels();});}
 function layoutLabels(){
  if(!dialog.open)return;
  // Keep the district picker above the destination sheet when it is open.
  areas.style.bottom=summary.hidden?'':Math.ceil(summary.getBoundingClientRect().height+20)+'px';
  const nodes=[...plane.querySelectorAll('.atlas-pin-label,.atlas-area-name,.atlas-street-name')];
  for(const n of nodes){n.style.visibility='';n.style.setProperty('--atlas-label-shift','0px');}
  const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
  const obstacles=[playerPin,beatPin,guidePin,cartouche,controls,index,summary,areas,dialog.querySelector('#atlas-close')].filter(n=>n&&!n.hidden&&n.getClientRects().length).map(rect);
  const labels=nodes.filter(n=>n.getClientRects().length).map(n=>{const pin=n.closest('.atlas-place-pin'),focused=pin===doc.activeElement,selected=pin?.classList.contains('is-selected');return{id:n,...rect(n),priority:focused?500:selected?400:pin?300:n.classList.contains('atlas-area-name')?200:100};});
  const placed=placeAtlasLabels(labels,{bounds:rect(viewport),obstacles});
  for(const n of nodes){const shift=placed.get(n);n.style.visibility=shift===undefined?'hidden':'';n.style.setProperty('--atlas-label-shift',(shift||0)+'px');}
  plane.dataset.labelsPlaced=String(placed.size);
 }
 viewport.addEventListener('scroll',scheduleLabels,{passive:true});
 viewport.addEventListener('focusin',scheduleLabels);viewport.addEventListener('focusout',scheduleLabels);
 doc.fonts?.ready.then(scheduleLabels);
 function metrics(){const ratio=survey.bounds[2]/survey.bounds[3];baseWidth=Math.min(viewport.clientWidth||1,(viewport.clientHeight||1)*ratio);baseHeight=baseWidth/ratio;}
 function layout(){const w=baseWidth*zoom,h=baseHeight*zoom;offsetX=viewport.clientWidth/2;offsetY=viewport.clientHeight/2;content.style.width=(w+viewport.clientWidth)+'px';content.style.height=(h+viewport.clientHeight)+'px';Object.assign(plane.style,{width:w+'px',height:h+'px',left:offsetX+'px',top:offsetY+'px'});out.disabled=zoom<=1;inside.disabled=zoom>=8;viewport.dataset.zoom=zoom.toFixed(2);plane.dataset.detail=String(zoom>=2);scheduleLabels();}
 function focusStop(){
  const stop=getBeatStop();if(!stop)return;
  if(stop.caseObjective&&zoom<5){zoom=5;layout();}
  center(normalizedPoint(stop.position,survey.bounds));
 }
 function center(p){if(p){viewport.scrollLeft=offsetX+p[0]*baseWidth*zoom-viewport.clientWidth/2;viewport.scrollTop=offsetY+p[1]*baseHeight*zoom-viewport.clientHeight/2;}}
 function scale(next,anchor=[viewport.clientWidth/2,viewport.clientHeight/2]){const p=[(viewport.scrollLeft+anchor[0]-offsetX)/(baseWidth*zoom),(viewport.scrollTop+anchor[1]-offsetY)/(baseHeight*zoom)];zoom=Math.max(1,Math.min(8,next));layout();viewport.scrollLeft=offsetX+p[0]*baseWidth*zoom-anchor[0];viewport.scrollTop=offsetY+p[1]*baseHeight*zoom-anchor[1];if(zoom===1)center([.5,.5]);}
 function sync(){scheduleLabels();const d=getSelected();refreshPlayer();visit.disabled=!d||!!d.held;routeLine?.removeAttribute('points');viewport.dataset.route='[]';availability.textContent=d?.held?'Closed':'';availability.hidden=!d?.held;
  pins.forEach(({pin,d:item})=>{const chosen=active&&d?.game_id===item.game_id;pin.classList.toggle('is-selected',chosen);pin.setAttribute('aria-pressed',String(chosen));});
  if(active&&d&&!d.held){const path=getRoute(d);if(Array.isArray(path)){const points=[getPlayer(),...path].filter(p=>planPoint(p));routeLine.setAttribute('points',pts(points));viewport.dataset.route=JSON.stringify(points);availability.textContent=path.length?'Marked walking route':'You are at the approach';}else availability.textContent='Route blocked right now';availability.hidden=false;}
 }
 function focusSelection(){const points=JSON.parse(viewport.dataset.route||'[]').map(p=>normalizedPoint(p,survey.bounds)).filter(Boolean);if(!points.length)return;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);const topMargin=Math.max(90,cartouche.offsetHeight+40),bottomMargin=summary.hidden?60:summary.offsetHeight+38,availableHeight=Math.max(70,viewport.clientHeight-topMargin-bottomMargin);zoom=Math.max(1,Math.min(3,(viewport.clientWidth-90)/(Math.max(.03,right-left)*baseWidth),availableHeight/(Math.max(.03,bottom-top)*baseHeight)));layout();center([(left+right)/2,(top+bottom)/2]);viewport.scrollTop+=(bottomMargin-topMargin)/2;}
 function toggleIndex(open){summary.hidden=!open;index.hidden=open;index.setAttribute('aria-expanded',String(open));if(open){active=true;sync();focusSelection();select.focus({preventScroll:true});}else if(dialog.open)index.focus({preventScroll:true});scheduleLabels();}
 function choose(id){select.value=id;active=true;summary.hidden=false;index.hidden=true;index.setAttribute('aria-expanded','true');select.dispatchEvent(new Event('change',{bubbles:true}));select.focus({preventScroll:true});}
 select.addEventListener('change',()=>{active=true;sync();focusSelection();});
 viewport.addEventListener('click',e=>{const hit=e.target.closest('.atlas-place-pin');if(!hit)return;let chosen=pins.find(p=>p.pin===hit);if(e.detail>0){const r=plane.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const nearest=pins.filter(p=>zoom>=2||p.pin.classList.contains('is-primary')||p.pin.classList.contains('is-selected')).map(p=>{const q=normalizedPoint(p.d.position,survey.bounds);return {...p,distance:Math.hypot(q[0]*r.width-x,q[1]*r.height-y)};}).sort((a,b)=>a.distance-b.distance)[0];if(nearest?.distance<=22)chosen=nearest;}if(chosen){e.preventDefault();e.stopImmediatePropagation();choose(chosen.d.game_id);}},true);
 const pointers=new Map();let gesture=null;
 function anchor(e){const r=viewport.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
 const scroll=()=>[viewport.scrollLeft,viewport.scrollTop],offset=()=>[offsetX,offsetY],size=()=>[baseWidth,baseHeight];
 function rebase(){const p=[...pointers.values()];gesture=p.length===2?atlasPinchStart(p,scroll(),offset(),size(),zoom):null;}
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointers.set(e.pointerId,anchor(e));viewport.setPointerCapture(e.pointerId);rebase();});
 viewport.addEventListener('pointermove',e=>{
  const previous=pointers.get(e.pointerId);if(!previous)return;
  const current=anchor(e);pointers.set(e.pointerId,current);
  if(pointers.size===1){viewport.scrollLeft-=current[0]-previous[0];viewport.scrollTop-=current[1]-previous[1];}
  else if(pointers.size===2&&gesture){
   const next=atlasPinchPosition(gesture,[...pointers.values()],offset(),size());
   zoom=next.zoom;layout();[viewport.scrollLeft,viewport.scrollTop]=next.scroll;
  }
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,e=>{if(pointers.delete(e.pointerId))rebase();});
 viewport.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)scale(zoom*Math.exp(-e.deltaY*.005),anchor(e));else{viewport.scrollLeft+=e.deltaX;viewport.scrollTop+=e.deltaY;}},{passive:false});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const d={ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]}[e.key];if(d){e.preventDefault();viewport.scrollLeft+=d[0];viewport.scrollTop+=d[1];}else if(e.key==='+'||e.key==='='){e.preventDefault();scale(zoom*1.5);}else if(e.key==='-'){e.preventDefault();scale(zoom/1.5);}});
 const resize=new ResizeObserver(()=>{if(!dialog.open)return;const p=[(viewport.scrollLeft+viewport.clientWidth/2-offsetX)/(baseWidth*zoom),(viewport.scrollTop+viewport.clientHeight/2-offsetY)/(baseHeight*zoom)];metrics();layout();center(p);});resize.observe(viewport);
 dialog.addEventListener('close',()=>{cancelAnimationFrame(labelFrame);labelFrame=0;pointers.clear();gesture=null;active=false;toggleIndex(false);});
 return {open(){
  places=getDestinations().filter(d=>d&&planPoint(d.position));const destinations=new Map(places.map(d=>[d.game_id,d]));for(const option of select.options){const d=destinations.get(option.value);if(d)option.textContent=d.name+(d.held?' · Closed':'');}
  paint();pins.forEach(({pin})=>pin.remove());pins=[];const primary=new Set(['watch','opera','palace','university','drum','shades','warehouse']);
  for(const d of places){const pin=button('',()=>choose(d.game_id),'atlas-place-pin');pin.setAttribute('aria-label',d.name+(d.held?' · Closed':''));const name=node('span','atlas-pin-label',d.name);name.setAttribute('aria-hidden','true');pin.append(name);pin.dataset.placeId=d.game_id;pin.dataset.label=d.name;pin.dataset.position=JSON.stringify(d.position.slice(0,2));pin.title=d.name;pin.classList.toggle('is-primary',primary.has(d.game_id)||d.overviewPin===true);position(pin,normalizedPoint(d.position,survey.bounds));plane.append(pin);pins.push({pin,d});}
  const stop=getBeatStop();beat.hidden=!stop;beatPin.textContent=stop?.name||'';
  beat.textContent=stop?.caseObjective?'Case':'Beat';
  beat.setAttribute('aria-label',stop?.caseObjective?'Centre map on case objective':'Centre map on next beat stop');
  position(beatPin,normalizedPoint(stop?.position,survey.bounds));plane.append(beatPin,guidePin,playerPin);active=false;toggleIndex(false);metrics();zoom=Math.min(2.2,Math.max(1.3,750/baseWidth));layout();drawGuide();if(!fitGuide())center(normalizedPoint(getPlayer(),survey.bounds)||[.5,.5]);sync();
 }};
}

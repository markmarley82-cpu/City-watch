
// Living City P7 — deterministic simulation clock, needs and work routines.
// Simulation data is separate from the player's quest save.
window.CW_LIVING_P7 = (() => {
 window.CW_LAB.assertReady();
 const jobs = [
  ['Dockworker',[29,79],[20,70],[61,99],6,16,'docks'],
  ['Market trader',[124,85],[126,85],[61,99],7,18,'market'],
  ['Watch constable',[69,63],[70,64],[62,99],18,6,'watch'],
  ['Archivist',[90,28],[92,34],[62,99],8,17,'archive'],
  ['Street cleaner',[124,44],[131,49],[61,99],5,13,'shades'],
  ['Baker',[111,98],[113,98],[61,99],4,13,'market'],
  ['University scholar',[103,33],[108,35],[61,99],9,19,'archive'],
  ['Dock porter',[32,80],[28,76],[61,99],5,15,'docks'],
  ['Market vendor',[130,86],[122,85],[61,99],8,18,'market'],
  ['Night watch',[77,63],[70,65],[61,99],20,7,'watch'],
  ['Fish seller',[25,74],[24,77],[61,99],6,14,'docks'],
  ['Inn worker',[62,100],[60,100],[61,99],15,2,'tavern'],
 ];
 const agents=jobs.map((j,i)=>({id:i,job:j[0],home:j[1],work:j[2],tavern:j[3],start:j[4],end:j[5],group:j[6],hunger:12+(i*13)%35,thirst:9+(i*11)%30,energy:75+(i*7)%25,coins:5+(i%6),state:'home',x:j[1][0],y:j[1][1],target:j[1],path:[],pathAt:0,worked:0,meals:0,drinks:0}));
 let elapsed=0,day=1,minute=6*60,last=0,paused=false,saveClock=0,moveAccumulator=0;
 const events=[];const subscribers=new Set();
 function emit(type,actor,detail={}){
  const event={type,actor,day,minute,detail};
  events.push(event);if(events.length>80)events.shift();
  for(const fn of subscribers){try{fn(event);}catch(e){}}
 }
 const SAVE=window.CW_LAB.keys.living;
 try {const d=JSON.parse(window.CW_LAB.storage.getItem(SAVE)||'null');
  if(d&&d.version===8&&Array.isArray(d.agents)){day=d.day||1;minute=d.minute??360;
   d.agents.forEach((v,i)=>{if(!agents[i]||!v)return;
    for(const k of ['x','y','hunger','thirst','energy','coins','worked','meals','drinks'])
     if(Number.isFinite(v[k]))agents[i][k]=v[k];
    if(typeof v.state==='string')agents[i].state=v.state;
   });
  }
 }catch(e){} 
 function persist(){try{window.CW_LAB.storage.setItem(SAVE,JSON.stringify({version:8,day,minute,agents:agents.map(a=>({x:a.x,y:a.y,hunger:a.hunger,thirst:a.thirst,energy:a.energy,coins:a.coins,worked:a.worked,meals:a.meals,drinks:a.drinks,state:a.state}))}));}catch(e){}}
 const clamp=(v)=>Math.max(0,Math.min(100,v));
 const inShift=(a,h)=>a.start<a.end?h>=a.start&&h<a.end:h>=a.start||h<a.end;
 const dist=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
 const location=(a,s)=>s==='work'?a.work:s==='eat'?a.group==='docks'?[26,76]:a.group==='archive'?[91,34]:[125,85]:s==='drink'?a.group==='shades'?[129,49]:[62,100]:s==='sleep'||s==='home'?a.home:s==='social'?[62,100]:a.work;
 function step(a,h,walkable,routeFn){
  const shift=inShift(a,h);
  let state=shift?'work':'home';
  if(a.energy<17)state='sleep';
  else if(a.thirst>77)state='drink';
  else if(a.hunger>76)state='eat';
  else if(!shift&&a.energy<72)state='sleep';
  else if(!shift&&a.coins>1&&h>=17&&h<23&&a.id%3===0)state='social';
  if(state!==a.state){const previous=a.state;a.state=state;a.path=[];a.pathAt=0;emit('routine-change',a.id,{from:previous,to:state});}
  const destination=location(a,state);
  a.target=destination;
  if(state==='sleep'&&dist([a.x,a.y],destination)<2){a.energy=clamp(a.energy+1.6);a.hunger=clamp(a.hunger+.08);a.thirst=clamp(a.thirst+.1);}
  if(dist([a.x,a.y],destination)<2){
   if(state==='eat'&&a.coins>=1){a.hunger=clamp(a.hunger-44);a.coins--;a.meals++;emit('meal',a.id);}
   if(state==='drink'&&a.coins>=1){a.thirst=clamp(a.thirst-54);a.coins--;a.drinks++;emit('drink',a.id);}
   if(state==='work'){a.worked++;if(a.worked%50===0){a.coins+=3;emit('wage',a.id,{amount:3});}}
   if(state==='social'){a.energy=clamp(a.energy+.12);a.thirst=clamp(a.thirst+.08);}
   return;
  }
  if(!a.path.length){
   let path=routeFn&&routeFn(Math.round(a.x),Math.round(a.y),destination[0],destination[1]);
   if(!Array.isArray(path)||!path.length){
    const dx=Math.sign(destination[0]-a.x),dy=Math.sign(destination[1]-a.y);
    const opts=[[a.x+dx,a.y],[a.x,a.y+dy],[a.x-dx,a.y],[a.x,a.y-dy]];
    const candidate=opts.find(p=>walkable(Math.round(p[0]),Math.round(p[1]))&&dist(p,destination)<dist([a.x,a.y],destination));
    path=candidate?[candidate]:[];
   }
   a.path=path.slice(0,120);a.pathAt=0;
  }
  if(a.path.length){const p=a.path.shift();if(Array.isArray(p)&&walkable(p[0],p[1])){a.x=p[0];a.y=p[1];}else a.path=[];}
 }
 function update(timestamp,walkable,routeFn){
  if(!last){last=timestamp;return;}
  const dt=Math.min(250,Math.max(0,timestamp-last));last=timestamp;
  if(paused)return;
  elapsed+=dt;moveAccumulator+=dt;saveClock+=dt;if(saveClock>12000){saveClock=0;persist();}
  // 1 real second = 1 in-game minute. Cap catch-up after tab suspension.
  while(elapsed>=1000){elapsed-=1000;minute++;if(minute>=1440){minute=0;day++;emit('new-day',null,{day});}
   for(const a of agents){
    a.hunger=clamp(a.hunger+.085);a.thirst=clamp(a.thirst+.13);
    if(a.state==='work')a.energy=clamp(a.energy-.17);
    else if(a.state!=='sleep')a.energy=clamp(a.energy-.055);
   }
  }
  // Fixed simulation step, independent of frame rate. Prevent pathfinding every render.
  if(moveAccumulator>=800){
   moveAccumulator%=800;
   for(const a of agents)step(a,Math.floor(minute/60),walkable,routeFn);
  }
 }
 const state=()=>({day,time:String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),agents:agents.map(a=>({id:a.id,job:a.job,x:a.x,y:a.y,state:a.state,hunger:Math.round(a.hunger),thirst:Math.round(a.thirst),energy:Math.round(a.energy),coins:a.coins}))});
 function activity(a){
  const moving=dist([a.x,a.y],a.target)>1;
  if(moving)return {icon:'·',label:'Walking to '+a.state};
  if(a.state==='sleep')return {icon:'Z',label:'Sleeping'};
  if(a.state==='eat')return {icon:'●',label:'Eating'};
  if(a.state==='drink')return {icon:'♨',label:'Drinking'};
  if(a.state==='social')return {icon:'♫',label:'Chatting'};
  if(a.state==='work'){
   const icons={docks:'▣',market:'▤',watch:'⚜',archive:'▦',shades:'✧',tavern:'☕'};
   const verbs={'Dockworker':'Moving cargo','Market trader':'Serving customers','Watch constable':'Patrolling','Archivist':'Sorting records','Street cleaner':'Sweeping','Baker':'Baking bread','University scholar':'Studying','Dock porter':'Loading crates','Market vendor':'Selling produce','Night watch':'Keeping watch','Fish seller':'Preparing fish','Inn worker':'Serving drinks'};
   return {icon:icons[a.group]||'⚒',label:verbs[a.job]||'Working'};
  }
  return {icon:'⌂',label:'At home'};
 }
 return {agents,update,state,activity,persist,
  events,subscribe:fn=>{subscribers.add(fn);return ()=>subscribers.delete(fn);},
  inspect:id=>{const a=agents.find(a=>a.id===id);return a?{...a,activity:activity(a),day,minute}:null;},
  setPaused:v=>{paused=!!v;last=0;},
  diagnostics:()=>({day,minute,agents:agents.length,events:events.length,paused})};
})();

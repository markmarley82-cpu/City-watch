import {acceptStreetStep,createStreetSearch} from './city-movement.mjs?v=p21-b407-s039-reuse';
// Generic residents circulate on existing public streets; no campaign/save actors.
export function createStreetLife({world,painter,player,random=Math.random,contacts=()=>[],blocked=()=>false,inView=null,limit=12,homeMembers=world.members}){
 const roles=[['p3_human_01','Shopper','Prices have gone up again.'],['p3_human_02','Errand runner','Coming through. Late already!'],['p3_dwarf_01','Craftsperson','A proper day’s work, then home.'],['p3_human_01','Porter','Mind your feet, officer.'],['p3_dwarf_02','Trader','Honest weights. Ask anyone.'],['p3_human_02','Neighbour','Quiet shift, I hope.']];
 const appearances=['p3_human_01','p3_human_02','p3_dwarf_01','p3_dwarf_02','scholar','tavern-worker','townswoman','farmer'];
 const doors=[...world.doors.values()].map(d=>d.position),residents=[],buckets=new Map();let active=[],seeded=false,lastTick=null,moves=0,journeys=0,planned=0,plansThisFrame=0,cursor=0;
 const cell=p=>p.slice(0,2).join(','),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const visible=p=>inView?inView(p):dist(p,player())<28;
 // Door locations are fixed after city setup. Keep the exact distance guard,
 // but inspect only neighbouring door buckets during bounded route searches.
 const doorBuckets=new Map(),residentBuckets=new Map(),homeBuckets=new Map(),residentOrder=new Map(),residentKeys=new Map();
 const bucket=(p,size)=>Math.floor(p[0]/size)+','+Math.floor(p[1]/size);
 for(const p of doors){const k=bucket(p,4),list=doorBuckets.get(k)||[];list.push(p);doorBuckets.set(k,list);}
 function nearDoor(p){const x=Math.floor(p[0]/4),y=Math.floor(p[1]/4);for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)for(const d of doorBuckets.get(xx+','+yy)||[])if(dist(d,p)<1.4)return true;return false;}
 const safe=p=>world.members.get(cell(p))?.has(p[2])&&!world.solid.has(cell(p))&&!world.wet(p)&&!nearDoor(p);
 function indexResident(a){const k=bucket(a.p,24),old=residentKeys.get(a);if(old===k)return;if(old!==undefined)residentBuckets.get(old).delete(a);let list=residentBuckets.get(k);if(!list)residentBuckets.set(k,list=new Set());list.add(a);residentKeys.set(a,k);}
 function nearbyBuckets(p,buckets,reach){const x=Math.floor(p[0]/24),y=Math.floor(p[1]/24),result=[];for(let yy=y-reach;yy<=y+reach;yy++)for(let xx=x-reach;xx<=x+reach;xx++)for(const a of buckets.get(xx+','+yy)||[])result.push(a);return result;}
 const seedPoint=player(),seedContacts=contacts();
 const candidates=[...homeMembers].map(([xy,edges])=>[...xy.split(',').map(Number),[...edges][0]]).filter(p=>safe(p)&&dist(p,seedPoint)>1.5&&!seedContacts.some(q=>dist(p,q)<1.2)).sort((a,b)=>dist(a,seedPoint)-dist(b,seedPoint));
 for(const p of candidates){const k=Math.floor(p[0]/5)+','+Math.floor(p[1]/5);if(buckets.has(k)||residents.some(a=>dist(a.home,p)<4))continue;const role=roles[residents.length%roles.length],a={id:'street-resident-'+residents.length,key:role[0],name:role[1],line:role[2],p:p.slice(),home:p.slice(),from:p.slice(),to:null,start:0,duration:520,next:0,steps:0,route:[],goal:null,previous:null,search:null,expanded:0,attempt:0,journeys:0,waitSince:null,maxFromHome:0};residents.push(a);buckets.set(k,a);}
 for(let i=0;i<residents.length;i++){const a=residents[i],near=residents.slice(0,i).sort((b,c)=>dist(b.home,a.home)-dist(c.home,a.home)),used=new Set(near.slice(0,appearances.length-1).map(b=>b.key));a.key=appearances.map((_,offset)=>appearances[(i+offset)%appearances.length]).find(key=>!used.has(key));}
 for(const [index,a] of residents.entries()){residentOrder.set(a,index);indexResident(a);const k=bucket(a.home,24),homes=homeBuckets.get(k)||[];homes.push(a);homeBuckets.set(k,homes);}
 const occupied=(a,p)=>blocked(p)||dist(p,player())<1.2||contacts().some(b=>dist(b,p)<1)||active.some(b=>b!==a&&(dist(b.p,p)<.8||b.to&&dist(b.to,p)<.8));
 function clearSearch(a){a.search?.cancel();a.search=null;a.expanded=0;}
 function makeSearch(a,dynamic=false){const origin=a.p.slice(),people=dynamic?[player().slice(),...contacts().map(p=>p.slice()),...active.filter(b=>b!==a).flatMap(b=>[b.p.slice(),...(b.to?[b.to.slice()]:[])])]:[];a.expanded=0;return createStreetSearch(world,origin,a.goal.slice(),a.goal[2],{occupied:p=>!safe(p)||dist(p,origin)>42||people.some(q=>dist(p,q)<.9)});}
 function beginJourney(a){
  const prior=cell(a.previous||a.p);
  const choices=nearbyBuckets(a.p,homeBuckets,2).filter(b=>{const d=dist(a.p,b.home);return d>=12&&d<=28&&cell(b.home)!==prior;}).sort((a,b)=>residentOrder.get(a)-residentOrder.get(b));
  if(!choices.length){a.next=lastTick+1000;return;}
  // Different role/attempt offsets spread destinations without inventing shops/cases.
  const index=(Number(a.id.split('-').at(-1))*7+a.attempt++ +Math.floor(random()*choices.length))%choices.length;
  a.goal=choices[index].home.slice();a.search=makeSearch(a);
 }
 function plan(a){
  if(!a.search||plansThisFrame>=64)return;
  const before=a.expanded,result=a.search.advance(Math.min(16,64-plansThisFrame));a.expanded=result.pops;plansThisFrame+=result.pops-before;
  if(result.status==='complete'){a.search=null;if(result.path?.length){a.route=result.path;planned++;}else{a.goal=null;a.next=lastTick+250;}return;}
  if(a.expanded>=1536){clearSearch(a);a.goal=null;a.next=lastTick+250;}
 }
 function tick(now,{paused=false,night=false}={}){
  if(paused){lastTick=null;return;}
  const elapsed=lastTick===null?0:Math.min(100,Math.max(0,now-lastTick));lastTick=now;plansThisFrame=0;
  const point=player(),wanted=night?Math.min(6,Math.ceil(limit/2)):limit;
  // Keep residents already visible, even when their journey leaves the old home radius.
  const keep=active.filter(a=>visible(a.p)||dist(a.p,point)<22);
  // Once the initial population is seeded, new residents must enter from outside
  // the full actor-body view. Keep existing visible actors and their journeys.
  const slots=Math.max(0,wanted-keep.length),nearby=slots?nearbyBuckets(point,residentBuckets,1).filter(a=>!keep.includes(a)&&dist(a.p,point)<24&&(!inView||!seeded||!visible(a.p))).sort((a,b)=>dist(a.p,point)-dist(b.p,point)||residentOrder.get(a)-residentOrder.get(b)):[];
  const previousActive=active;active=[...keep,...nearby.slice(0,Math.max(0,wanted-keep.length))].slice(0,limit);seeded=true;for(const a of previousActive)if(!active.includes(a)&&a.search){clearSearch(a);a.goal=null;}
  if(active.length)cursor=(cursor+1)%active.length;
  const order=[...active.slice(cursor),...active.slice(0,cursor)];
  for(const a of order){painter.register(a.id,a.key);let waiting=false;
   if(a.to){if(occupied(a,a.to)){waiting=true;}else{a.start+=elapsed;const t=Math.min(1,a.start/a.duration);a.p=[a.from[0]+(a.to[0]-a.from[0])*t,a.from[1]+(a.to[1]-a.from[1])*t,a.from[2]];if(t===1){a.p=a.to;a.to=null;a.steps++;moves++;a.maxFromHome=Math.max(a.maxFromHome,dist(a.p,a.home));}}}
   if(!a.to&&now>=a.next){
    if(a.goal&&!a.search&&!a.route.length){a.previous=a.goal;a.goal=null;a.journeys++;journeys++;a.next=now+750+random()*1750;}
    if(!a.goal&&!a.search&&now>=a.next)beginJourney(a);
    plan(a);
    // Continuous route: no artificial per-step or every-five-step rest.
    for(let transfer=0;!a.to&&a.route.length&&transfer<4;transfer++){
     const next=a.route[0],move=acceptStreetStep(world,a.p,next,{occupied:p=>!safe(p)||occupied(a,p),stepMS:520});
     if(!move){waiting=true;a.waitSince??=now;if(now-a.waitSince>=1200){a.route=[];clearSearch(a);a.search=makeSearch(a,true);a.waitSince=null;}break;}
     a.waitSince=null;a.route.shift();if(move.duration===0){a.p=move.position.slice();continue;}
     a.from=a.p.slice();a.to=move.position.slice();a.duration=Math.max(300,move.duration);a.start=0;
    }
   }
   indexResident(a);a.waiting=waiting;painter.place(a.p,a.id,now,!!a.to&&!waiting);
  }
 }
 // Use the existing bounded decode queue
 // and ambient compact rows; resolve to a scalar so the promise retains no atlases.
 let opening=null;
 function ready(){painter.retain?.(appearances);return opening||(opening=Promise.all(appearances.map(key=>painter.library.ensure(key,{motionOnly:true}))).then(()=>true).catch(error=>{opening=null;throw error;}));}
 return {ready,tick,actors:()=>active.map(a=>({id:a.id,p:a.p,person:true,streetLife:true})),report:()=>({residents:residents.length,active:active.length,moves,journeys,plannedRoutes:planned,planningStepsThisFrame:plansThisFrame,planningBudget:64,journeyRange:[12,28],limit,actors:active.map(a=>({id:a.id,key:a.key,name:a.name,position:a.p.slice(),home:a.home.slice(),destination:a.goal?.slice()||null,remaining:a.route.length,moving:!!a.to&&!a.waiting,waiting:!!a.waiting,planning:!!a.search,steps:a.steps,journeys:a.journeys,maxFromHome:a.maxFromHome}))})};
}

// Optional residents must never hold the loading screen or render with missing
// motion sheets. Begin after the first draw and permit one delayed retry.
export function createStreetLifeWarmup(life,{onError=()=>{},retryMs=8000}={}){
 let state='waiting',tries=0,next=0;
 return {
  afterDraw(now){
   if(state!=='waiting'||now<next)return;
   state='loading';tries++;
   Promise.resolve().then(()=>life.ready()).then(()=>{state='ready';},error=>{
    state=tries>=2?'unavailable':'waiting';next=now+retryMs;onError(error);
   });
  },
  tick(now,options){if(state==='ready')life.tick(now,options);},
  state:()=>state
 };
}

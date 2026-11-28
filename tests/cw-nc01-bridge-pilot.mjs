import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import State from '../dist/cw-p21-state.js';
import {compileCity} from '../dist/city-core.mjs';
import {streetPath} from '../dist/city-movement.mjs';
import {FLAG, STOPS, apply, canOffer, options, resolveStops, startPrologue, corner, observe} from '../dist/cases/bridge-closure.mjs';
import {BRIDGE_CASE, BRIDGE_REPORT, bridgeReportPublished, withBridgeEdition} from '../dist/newspapers/bridge-closure-edition.mjs';
import {createNewspapers} from '../dist/newspapers/newspapers.mjs';
const read=(path,fixture)=>JSON.parse(readFileSync(new URL(process.env.CW_PILOT_EXTRACT?'../'+fixture:'../dist/'+path,import.meta.url)));
const world=compileCity(read('assets/city-v07/city-design.json','map.json'),read('assets/team-v05/precinct-rc1.json','precinct.json'));
assert.equal(resolveStops(world,(a,b)=>streetPath(world,a,b.slice(0,2),b[2])),STOPS);
const sides=Object.entries(STOPS);
const distances=Object.fromEntries(sides.map(([n,a])=>[n,Object.fromEntries(sides.filter(([m])=>m!==n).map(([m,b])=>[m,streetPath(world,a,b.slice(0,2),b[2]).length]))]));
const papers=createNewspapers(withBridgeEdition(read('newspapers/newspapers.json','newspapers.json')));
const articles=s=>papers.issue('inquirer',bridgeReportPublished(s)?{closedCases:[BRIDGE_CASE],publicReports:[BRIDGE_REPORT]}:{}).filter(a=>a.caseId===BRIDGE_CASE);
function setup(){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},store=()=>State.create(storage);
 const initial=store().read();
 assert.equal(canOffer(initial,'WATCH-04'),false);
 initial.state.flags.p21PatrolRounds={reports:[{routeId:'watch-square-purse'}]};
 assert.equal(store().replaceRecord(initial,initial.revision),true);
 return {store,data};
}
const expectNone=(record,id,partner,position)=>assert.equal(apply(record,{id,mentor:partner,position}),null);
function run(partner,steps,outcome){
 const {store,data}=setup();let merit;
 assert.equal(canOffer(store().read(),'WATCH-06'),false);
 assert.equal(canOffer({...store().read(),pending:{id:'other'}},partner),false);
 const perform=(id,point)=>{
  const st=store(),before=st.read(),position=STOPS[point];
  const transition=apply(before,{id,mentor:partner,position});
  assert.ok(transition,id);
  assert.deepEqual(st.read(),before);
  assert.equal(st.replaceRecord(transition.next,before.revision),true);
  assert.equal(store().replaceRecord(transition.next,before.revision),false);
  return store().read();
 };
 expectNone(store().read(),'accept',partner,STOPS.bridge);
 perform('accept','watch');
 for(const [id,point] of steps)perform(id,point);
 const filed=store().read();
 assert.equal(filed.state.flags[FLAG].outcome,outcome);
 merit=filed.state.flags[FLAG].merit;
 assert.equal(filed.state.merit,merit);
 assert.equal(filed.state.flags[FLAG].partner,partner);
 expectNone(filed,'file-relief',partner,STOPS.watch);
 expectNone(filed,'copy',partner,STOPS.copy);
 assert.deepEqual(articles(filed.state),[]);
 const next=store().read();next.state.night++;
 assert.equal(store().replaceRecord(next,next.revision),true);
 const printed=articles(store().read().state);
 assert.equal(printed.length,1);
 assert.equal(printed[0].headline,'WHO REALLY OWNS THE BRIDGES?');
 assert.equal(printed[0].evidence,false);
 assert.equal(printed[0].lead,null);
 perform('copy','copy');
 assert.equal(store().read().state.merit,merit);
 assert.equal(store().read().state.flags[FLAG].followup.observed,true);
 expectNone(store().read(),'copy',partner,STOPS.copy);
 assert.deepEqual(articles(store().read().state),printed);
 assert.deepEqual([...data.keys()],[State.KEY]);
}
run('WATCH-04',[['tally','clerk'],['notice','bridge'],['observe','bridge'],['collector','bridge'],['order','bridge'],['reopen','bridge'],['confront','bridge'],['arrest','bridge'],['file-proved','watch']],'organiser-proved');
run('WATCH-03',[['notice','bridge'],['clear','bridge'],['tally','clerk'],['declaration','clerk'],['confront','bridge'],['repay','bridge'],['file-proved','bridge']],'organiser-proved');
run('WATCH-03',[['notice','bridge'],['clear','bridge'],['file-relief','watch']],'passage-reopened');
run('WATCH-04',[['notice','bridge'],['observe','bridge'],['collector','bridge'],['reopen','bridge'],['file-relief','watch']],'collector-observed');
const {store}=setup();
const before=store().read(), active=apply(before,{id:'accept',mentor:'WATCH-04',position:STOPS.watch}).next;
assert.deepEqual(options(active,'WATCH-03',STOPS.watch).map(a=>a.id),['stand-down']);
expectNone(active,'file-proved','WATCH-04',STOPS.watch);
assert.equal(apply(active,{id:'stand-down',mentor:'WATCH-03',position:STOPS.watch}).next.state.flags[FLAG],undefined);
console.log(JSON.stringify({routes:distances,provedBranches:2,partialBranches:2,saveReload:true,deduplicated:true,publicArticleNextEdition:true,followingLead:true}));

// The opening (28 Nov 2026): alarm, carter, chase, fight with the lookout, then the case proper.
{
 const {store}=setup();const go=(rec,id,at)=>{const t=apply(rec,{id,mentor:'WATCH-04',position:at});assert.ok(t,id);return t;};
 let r=startPrologue(store().read(),'WATCH-04');assert.equal(r.state.flags[FLAG].stage,'alarm');
 assert.equal(startPrologue(r,'WATCH-04'),null);
 r=go(r,'alarm',STOPS.watch).next;assert.equal(r.state.flags[FLAG].stage,'robbery');
 assert.equal(apply(r,{id:'carter',mentor:'WATCH-04',position:STOPS.watch}),null);
 const t=go(r,'carter',STOPS.bridge);assert.equal(t.chase,true);r=t.next;
 r=corner(r,STOPS.alley);assert.equal(r.state.flags[FLAG].stage,'cornered');
 const f=go(r,'collar',STOPS.alley);assert.equal(f.fight,'opening-lookout');r=f.next;
 assert.equal(observe(r),null);
 r={...r,encounters:[{binding:'opening-lookout',subjectStatus:'arrested'}]};r=observe(r);assert.equal(r.state.flags[FLAG].stage,'fought');
 r=go(r,'paid',STOPS.alley).next;const c=r.state.flags[FLAG];assert.equal(c.status,'active');assert.deepEqual(c.evidence,['lookout']);
 assert.ok(options(r,'WATCH-04',STOPS.bridge).some(a=>a.id==='notice'));
}
console.log('opening prologue ok');

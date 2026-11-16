// CW-NC-01 pilot. Case state is stored in the existing revisioned campaign record.
export const FLAG='bridgeClosurePilot';
export const TITLE='The Bridge That Was Closed';
export const STOPS=Object.freeze({
  watch:Object.freeze([121,134,'RC1']),
  bridge:Object.freeze([133,163,'E011']),
  clerk:Object.freeze([125,164,'APRON:outpost']),
  copy:Object.freeze([107,162,'E030'])
});
const roster=Object.freeze({'WATCH-04':'Nobby','WATCH-03':'Colon'});
const find=(record)=>record.state.flags[FLAG];
export function closedOpening(record){
  const rounds=record.state.flags.p21PatrolRounds;
  return record.state.chapter>0||rounds?.creditedRoutes?.includes('watch-square-purse')||
    (rounds?.reports||[]).some(r=>r.routeId==='watch-square-purse');
}
export function canOffer(record,mentor){
  return !!find(record)||closedOpening(record)&&Object.hasOwn(roster,mentor)&&!record.pending&&!record.state.flags.p21PatrolRounds?.active;
}
export function standsAt(position,target){
  return Array.isArray(position)&&position[2]===target[2]&&Math.hypot(position[0]-target[0],position[1]-target[1])<1.6;
}
export function validStop(world,target){
  const key=target.slice(0,2).join(',');
  return world.members.get(key)?.has(target[2])&&!world.solid.has(key)&&!world.wet(target);
}
// Runs only when the player asks for this case, never during city startup.
export function resolveStops(world,path){
  const points=Object.values(STOPS);
  return points.every(p=>validStop(world,p))&&points.every((a,i)=>points.every((b,j)=>i===j||path(a,b)?.length>0))?STOPS:null;
}
const LEADS=Object.freeze({
  notice:'The notice carries an upside-down Watch stamp. It diverts carts but names no officer or end time.',
  tally:'The dispatch clerk’s tally shows one trader’s carts arriving early on both mornings when others were diverted.',
  collector:'You saw the collector take money for directions. The payer’s identity was not visible.',
  order:'When the collector returned, they handed back a signed route order. Its trader’s mark matches the tally.',
  public:'The waiting drivers confirm that the passage is open and that the notice was removed.',
  declaration:'A driver who saw Colon reopen the passage returned with a written order carrying the trader’s mark. The clerk matched it to the tally.',
  copy:'The crease across the stamp is printed in ink. This notice is a copy of another sheet, not evidence that the same person hung it.'
});
export const evidenceText=id=>LEADS[id];
const there=(p,s)=>standsAt(p,STOPS[s]);
const action=(id,label,stop)=>({id,label,stop});
export function options(record,mentor,position){
  const c=find(record);
  if(!c)return canOffer(record,mentor)?[action('accept','Take the bridge enquiry','watch')]:[];
  if(record.pending||record.state.flags.p21PatrolRounds?.active)return [];
  if(c.status==='filed')return !c.followup&&record.state.night>c.publicReport?.night?[action('copy','Inspect the second notice','copy')]:[];
  if(c.partner!==mentor)return [action('stand-down','Stand down the enquiry','watch')];
  const result=[];
  if(!c.evidence.includes('notice'))result.push(action('notice','Inspect the alleged closure notice','bridge'));
  if(!c.evidence.includes('tally'))result.push(action('tally','Ask the dispatch clerk about the diverted carts','clerk'));
  if(c.evidence.includes('notice')&&!c.choice){
    result.push(action('clear',mentor==='WATCH-03'?'Ask Colon to keep the lane clear; remove the notice':'Remove the notice and let the drivers through','bridge'));
    result.push(action('observe',mentor==='WATCH-04'?'Ask Nobby to blend into the queue; keep watching':'Watch from the side while Colon stays with you','bridge'));
  }
  if(c.choice==='observe'&&!c.evidence.includes('collector'))
    result.push(action('collector','Watch the collector return','bridge'));
  if(c.choice==='observe'&&mentor==='WATCH-04'&&c.evidence.includes('collector')&&!c.evidence.includes('order'))
    result.push(action('order','Watch for the signed route order','bridge'));
  if(c.choice==='observe'&&!c.reopened)
    result.push(action('reopen','End the watch and reopen the passage','bridge'));
  if(mentor==='WATCH-03'&&c.reopened&&c.evidence.includes('public')&&c.evidence.includes('tally')&&!c.evidence.includes('declaration'))
    result.push(action('declaration','Take the driver’s declaration with Colon','clerk'));
  const proof=c.evidence.includes('tally')&&['order','declaration'].some(key=>c.evidence.includes(key));
  if(c.reopened){
    result.push(action('file-relief',c.evidence.includes('collector')?'File the reopening and witnessed collection':'File the reopening; organiser unproved','watch'));
    if(proof)result.push(action('file-proved','File the signed order and corroborating tally','watch'));
  }
  result.push(action('stand-down','Stand down the enquiry','watch'));
  return result.map(a=>({...a,here:there(position,a.stop)}));
}
// Pure transition: the adapter commits the returned record with compare-and-swap.
export function apply(record,{id,mentor,position}){
  const offer=options(record,mentor,position).find(a=>a.id===id);
  if(!offer||!there(position,offer.stop))return null;
  const next=JSON.parse(JSON.stringify(record)), flags=next.state.flags;
  if(id==='accept'){
    flags[FLAG]={status:'active',partner:mentor,choice:null,evidence:[],reopened:false};
    return {next,message:'Inspect the bridge notice or ask the dispatch clerk first. Choose either lead in Duty.'};
  }
  const c=flags[FLAG];
  if(id==='copy'){c.followup={observed:true,night:next.state.night};return {next,message:LEADS.copy};}
  if(id==='stand-down'){
    delete flags[FLAG];return {next,message:'Enquiry stood down. You can take it again from Watch Square.'};
  }
  if(id==='notice'||id==='tally'||id==='collector'||id==='order'||id==='declaration'){
    c.evidence.push(id);return {next,message:LEADS[id]};
  }
  if(id==='clear'||id==='reopen'){
    if(id==='clear')c.choice='clear';
    c.reopened=true;
    if(id==='clear'&&mentor==='WATCH-03')c.evidence.push('public');
    return {next,message:'The notice is down and the waiting drivers can pass. Report to the Watch when ready.'};
  }
  if(id==='observe'){
    c.choice='observe';
    return {next,message:mentor==='WATCH-04'?'Nobby joins the waiting drivers. You can watch the collector or reopen the crossing.':'Colon stays beside you while the queue waits. Watch the collector, or call it off and reopen.'};
  }
  const proved=id==='file-proved';
  c.status='filed';c.outcome=proved?'organiser-proved':c.evidence.includes('collector')?'collector-observed':'passage-reopened';
  c.merit=proved?4:2;
  next.state.merit+=c.merit;
  // A future Inquirer edition can rely on these facts alone; no private evidence or name.
  c.publicReport={caseId:'CW-NC-01',passageReopened:true,watchObserved:c.choice==='observe',night:next.state.night};
  return {next,message:proved?'Report filed: the signed order and tally identify who benefited and directed the diversion. 4 merit.':'Report filed: the passage is open. The organiser remains unproved. 2 merit.'};
}

export function createBridgeClosure({city,dialog,box,makeStore,partner,findPath,onChange,showDuty,doc=document}){
  let routes;
  function open(){
    routes=routes||resolveStops(city.world,findPath);
    if(!routes){city.tell('The bridge enquiry is unavailable: a public route could not be verified.');return false;}
    render();return true;
  }
  function render(){
    const store=makeStore(), record=store.read(), mentor=partner(record), c=find(record), pos=city.footPosition?.()||city.position();
    box.replaceChildren();
    const line=(tag,value)=>{const el=doc.createElement(tag);el.textContent=value;box.append(el);};
    const button=(label,handler)=>{const el=doc.createElement('button');el.type='button';el.textContent=label;el.onclick=handler;box.append(el);};
    line('h3',TITLE);
    if(!c)line('p','Drivers say the Watch has diverted them away from Brass Bridge. The Watch has no closure on record. Try the bridge notice or the dispatch clerk on Lower Broad Way first.');
    else if(c.status==='filed'){
      line('p',c.outcome==='organiser-proved'?'Filed: the organiser was identified from the written order and the tally.':'Filed: the passage reopened. The organiser was not proved.');
      if(c.followup)line('p',LEADS.copy);
      else if(record.state.night>c.publicReport?.night)line('p','A driver heard that a second notice appeared by Contract Bridge. The Inquirer is asking questions too. You can check it without buying a paper.');
    }
    else {
      line('p',roster[c.partner]+' · '+(c.choice==='observe'&&!c.reopened?'Drivers are still waiting while you observe.':c.reopened?'The passage is open. You can file your report.':'Check either lead before deciding what to do about the notice.'));
      if(c.evidence.length){const list=doc.createElement('ul');for(const id of c.evidence){const item=doc.createElement('li');item.textContent=evidenceText(id);list.append(item);}box.append(list);}
      if(record.pending||record.state.flags.p21PatrolRounds?.active)line('p','Finish or stand down the current patrol before returning to this enquiry.');
      else if(c.partner!==mentor)line('p','Return with '+roster[c.partner]+', or stand down the enquiry at Watch Square.');
    }
    for(const a of options(record,mentor,pos)){
      if(!standsAt(pos,STOPS[a.stop])){
        const place=a.stop==='watch'?'Watch Square':a.stop==='bridge'?'Brass Bridge approach':a.stop==='copy'?'Contract Bridge approach':'Lower Broad Way dispatch contact';
        if(box.querySelector('[data-case-stop="'+a.stop+'"]'))continue;
        button('Walk to '+place,()=>{
          dialog.close();if(!city.nav(STOPS[a.stop].slice(0,2),STOPS[a.stop][2]))city.tell('The route is blocked. Try from nearby public ground.');else city.tell('On arrival, open Duty → '+TITLE+' to act.');
        });box.lastElementChild.dataset.caseStop=a.stop;continue;
      }
      button(a.label,()=>{
        const current=makeStore(), latest=current.read();
        const result=apply(latest,{id:a.id,mentor:partner(latest),position:city.footPosition?.()||city.position()});
        if(!result||!current.replaceRecord(result.next,latest.revision)){city.tell('Your patrol changed. Reopen Duty and try again.');render();return;}
        onChange(result.message);render();line('p',result.message);
      });
    }
    button('Back to Duty',showDuty);
    if(!dialog.open)dialog.showModal();
  }
  return {open};
}

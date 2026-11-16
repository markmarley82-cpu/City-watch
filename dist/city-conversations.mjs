import {textSHA256} from './conversation-fingerprint.mjs?v=p21-b407-s039-reuse';
import {createConversationSelector} from './city-conversation-selector.mjs?v=p21-b407-s039-reuse';
import {createEditorial} from './newspapers/editions.mjs?v=p21-b407-s039-reuse';
import {campaignNewspaperContext} from './newspapers/campaign-leads.mjs?v=p21-b407-s039-reuse';
import {editionFor} from './newspapers/purchases.mjs?v=p21-b407-s039-reuse';

export const CONVERSATION_SAVE_KEY='city_watch_lab01_v01_conversations_v1';
export const contextSignature=cx=>['availableCases','closedCases','publicTips','publicReports']
  .map(k=>[...(cx[k]||[])].sort().join(',')).join('|');
export const articleFingerprint=async article=>{const text=article.headline+'\n'+article.body;return globalThis.crypto?.subtle?[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join(''):textSHA256(text);};

// Actor IDs are explicit: an unnamed street urchin is not the bank's market witness.
export function conversationIdentity(actor,member){
  if(actor.id==='patrol-partner')return member.key;
  return ['colon','vimes','carrot','igor','palm','dibbler'].includes(actor.id)?actor.id:null;
}

export async function createPatrolConversations({city,actors,state,member,contacts,urgent,document:doc=document,storage=localStorage,clock=()=>performance.now()}){
  const read=async name=>{const r=await fetch(new URL(name,import.meta.url));if(!r.ok)throw Error('Conversation data unavailable');return r.json();};
  const bank=async()=>{const response=await fetch(new URL('patrol-conversations.bin?v=street-dialogue-3',import.meta.url));if(!response.ok)throw Error('Conversation bank unavailable');const stream=response.body.pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());};
  const [data,editorialData]=await Promise.all([bank(),read('newspapers/editorial.json?v=p21-b407-s039-reuse')]);
  if(data.schema!==1||!Array.isArray(data.entries))throw Error('Unsupported conversation bank');
  const editorial=createEditorial(editorialData),fingerprints=new Map();
  await Promise.all(['times','inquirer'].flatMap(paper=>editorialData.news[paper].map(async article=>fingerprints.set(paper+'/'+article.id,await articleFingerprint(article)))));
  let memory={};
  try{const saved=JSON.parse(storage.getItem(CONVERSATION_SAVE_KEY)||'null');if(saved?.version===1&&saved.seen&&saved.knowledge&&Array.isArray(saved.publications))memory=saved;}catch{}
  memory.version=1;memory.seen||={};memory.knowledge||={};memory.publications||=[];
  const selector=createConversationSelector(data.entries,{getMemory:()=>memory});
  const host=doc.createElement('div');host.id='city-conversation-bubbles';host.dataset.ready='true';host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','true');
  const bubble=doc.createElement('div');bubble.className='city-conversation-bubble';bubble.hidden=true;
  const name=doc.createElement('strong'),text=doc.createElement('span');bubble.append(name,text);host.append(bubble);doc.querySelector('.city-view').append(host);
  const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('city-conversations.css?v=p21-b407-s039-reuse',import.meta.url).href;doc.head.append(style);
  let pending=null;
  if(typeof memory.hintsEnabled!=='boolean')memory.hintsEnabled=true;
  let playback=null,lastContextCheck=-Infinity,nextAmbient=clock()+12000,played=0,last=null,view=null,cached=null;
  function persist(){try{storage.setItem(CONVERSATION_SAVE_KEY,JSON.stringify(memory));}catch{/* Chatter must never interrupt a patrol when storage is unavailable. */}}
  const distance=(a,b)=>a?.[2]===b?.[2]?Math.hypot(a[0]-b[0],a[1]-b[1]):Infinity;
  function nearby(){
    const p=city.position(),m=member(),result=new Map([['player',{id:'player',name:'You',p}]]);
    for(const actor of actors){
      if(actor.stoodDown||!actor.p||distance(p,actor.p)>7)continue;
      const id=conversationIdentity(actor,m);if(!id)continue;
      const previous=result.get(id);if(!previous||distance(p,actor.p)<distance(p,previous.p))result.set(id,actor);
    }
    return result;
  }
  function publications(record){
    const cx={...campaignNewspaperContext(record.state),editionKey:editionFor(record.state)},signature=contextSignature(cx);
    return memory.publications.filter(pub=>pub.editionKey===cx.editionKey&&pub.signature===signature&&
      editorial.edition(pub.paper,cx,pub.slot).news.some(article=>article.id===pub.id&&fingerprints.get(pub.paper+'/'+article.id)===pub.fingerprint));
  }
  function context({direct=false,target=null}={}){
    const record=state(),people=nearby(),modal=doc.querySelector('dialog[open]');
    const ownModal=direct&&['cw-player-contacts','cw-dibbler'].includes(modal?.id);
    const blocked=!!record.pending||!!globalThis.CWRecruitmentPending||doc.hidden||!!doc.querySelector('.cw-phone-loading:not([hidden])')||
      (!!modal&&!ownModal)||(!ownModal&&!!globalThis.CW_P20_INPUT_BLOCKED)||!!doc.querySelector('.cw-oath,#watch-notebook.open');
    const caseBusy=!!urgent(record),quiet=!blocked&&!caseBusy,food=actors.find(a=>a.id==='dibbler');
    const foodAvailable=!!food&&!food.stoodDown&&distance(city.position(),food.p)<=7&&globalThis.CWDibblerGoods?.stock(record.state,'sausage')>0;
    const facts={all_speakers_present:true,not_in_combat:!record.pending,no_urgent_case_dialogue:!caseBusy,
      ordinary_patrol_pause:quiet,speaker_is_patrol_partner:true,night_shift:quiet&&city.clock().phase==='Night',no_active_incident:!record.pending,
      angua_human_form:member().key==='angua'&&people.has('angua'),safe_to_pause_and_listen:quiet,
      food_available:foodAvailable,dibbler_available_for_sales:foodAvailable,no_transaction_started:direct&&target==='dibbler',
      no_emergency:quiet,no_purchase:direct&&target==='dibbler',dibbler_available:!!food&&quiet,
      no_departure_deadline:direct&&target==='dibbler',
      both_have_read_or_heard_this_public_article:true,article_published_in_current_visible_edition_slot:true,
      article_headline_body_fingerprint_matches:true,edition_key_matches_current_watch_night:true,not_archived_clipping:true,
      not_accusing_named_trader:true,no_ownership_decision:true,no_current_witness_claim_created:true,
      dibbler_not_assumed_to_be_unnamed_vendor:true};
    const p=city.position();
    return {blocked,kind:direct?'player_npc':null,ambient:!direct,sceneKey:p[2]+':'+Math.floor(p[0]/12)+':'+Math.floor(p[1]/12),
      editionKey:editionFor(record.state),present:[...people.keys()],facts,publications:publications(record),knowledge:memory.knowledge,people};
  }
  function entryContext(entry,options){
    const cx=context(options),people=entry.cast.map(id=>cx.people.get(id));
    if(people.some(a=>!a)||people.some(a=>distance(people[0]?.p,a?.p)>4))cx.blocked=true;
    if(options?.direct&&distance(city.position(),cx.people.get(options.target)?.p)>3)cx.blocked=true;
    // Staging is disabled until the renderer has the corresponding gesture/prop.
    if(entry.staging?.length)cx.blocked=true;
    if(entry.kind==='partner_comment'&&entry.cast[0]!==member().key)cx.blocked=true;
    return cx;
  }
  function candidates(options){return selector.candidates(context(options)).filter(entry=>
    (options?.direct||['npc_npc','partner_comment'].includes(entry.kind)||(entry.ambient===true&&entry.cast.includes(member().key)))&&(!options?.target||entry.cast.includes(options.target))&&selector.isEligible(entry,entryContext(entry,options)));}
  function choose(options){const list=candidates(options),news=list.filter(e=>e.news_reference),exchanges=list.filter(e=>e.ambient===true),pool=news.length?news:exchanges.length?exchanges:list;return pool[Math.floor(Math.random()*pool.length)]||null;}
  function cancel(){pending=null;playback=null;bubble.className='city-conversation-bubble';bubble.hidden=true;name.textContent='';text.textContent='';}
  function presentLine(){
    const line=playback.entry.lines[playback.at],actor=nearby().get(line.speaker);
    if(!actor){cancel();return;}
    bubble.className='city-conversation-bubble';name.textContent=actor.name||line.speaker;text.textContent=line.text;bubble.hidden=false;
    playback.until=clock()+Math.min(8000,Math.max(3200,line.text.split(/\s+/).length*400));
  }
  function begin(entry,options={}){
    const cx=entryContext(entry,options);if(!selector.commit(entry,cx))return false;
    persist();played++;last=entry.id;host.dataset.last=last;playback={entry,options,at:0,until:0,editionKey:cx.editionKey};presentLine();return true;
  }
  function prepare(entry,now){
    const partner=nearby().get(member().key);
    if(!memory.hintsEnabled||!partner||!entry.cast.includes(member().key))return begin(entry);
    pending={entry,actor:partner,until:now+1500};
    bubble.className='city-conversation-bubble city-conversation-hint';name.textContent=partner.name;text.textContent='•••';bubble.hidden=false;return true;
  }
  function setHints(enabled){memory.hintsEnabled=!!enabled;persist();if(pending){const entry=pending.entry;cancel();if(!enabled)begin(entry);}return memory.hintsEnabled;}
  function hasTalk(id){const target=id==='patrol-partner'?member().key:id;return candidates({direct:true,target}).length>0;}
  function talk(id){
    if(playback)return true;
    const target=id==='patrol-partner'?member().key:id,options={direct:true,target},entry=choose(options);if(!entry)return false;
    if(pending)cancel();
    if(!begin(entry,options))return false;
    // Optional menu access returns to the street; casual speech never opens a modal.
    contacts.dismiss?.();return true;
  }
  function frame(v){
    view=v;const now=v.now;
    if(doc.hidden||v.paused||doc.querySelector('dialog[open],.cw-oath,#watch-notebook.open,.cw-phone-loading:not([hidden])')){if(playback||pending)cancel();return;}
    if(now-lastContextCheck>=750){lastContextCheck=now;cached=context();host.dataset.status=JSON.stringify({blocked:cached.blocked,urgent:!cached.facts.no_urgent_case_dialogue,played,last,cast:cached.present});
      if(playback&&(!selector.isEligible(playback.entry,entryContext(playback.entry,playback.options))||playback.editionKey!==cached.editionKey))cancel();
      if(pending&&!selector.isEligible(pending.entry,entryContext(pending.entry)))cancel();
      if(!playback&&!pending&&now>=nextAmbient){nextAmbient=now+4000;const entry=choose();if(entry)prepare(entry,now);}
    }
    if(pending&&now>=pending.until){const entry=pending.entry;cancel();begin(entry);}
    if(!playback&&!pending)return;
    if(playback&&now>=playback.until){playback.at++;if(playback.at>=playback.entry.lines.length){cancel();return;}presentLine();}
    if(!playback&&!pending)return;
    const castActor=pending?pending.actor:nearby().get(playback.entry.lines[playback.at].speaker);
    const drawn=v.actors.find(a=>a.person&&a.id===castActor?.id);
    if(!drawn){bubble.hidden=true;return;}
    const q=v.project(drawn.p),x=(q.x-v.camera.x)*v.zoom+v.width/2,y=(q.y-v.camera.y)*v.zoom+v.height/2-72*v.zoom;
    const w=pending?44:Math.min(208,v.width-24),h=bubble.offsetHeight||100;
    bubble.style.width=w+'px';bubble.style.left=Math.max(12+w/2,Math.min(v.width-12-w/2,x))+'px';
    bubble.style.top=Math.max(h+8,Math.min(v.height-18,y))+'px';bubble.hidden=false;
  }
  // The reader emits only actually displayed city-news cards, including their real page slot.
  function rememberEdition(event){
    const d=event.detail,record=state(),cx={...campaignNewspaperContext(record.state),editionKey:editionFor(record.state)};
    if(!d||!['times','inquirer'].includes(d.paper)||d.editionKey!==cx.editionKey||d.signature!==contextSignature(cx))return;
    const issue=editorial.edition(d.paper,cx,d.slot);
    memory.publications=memory.publications.filter(pub=>pub.paper!==d.paper&&pub.editionKey===cx.editionKey);
    for(const article of issue.news)memory.publications.push({paper:d.paper,id:article.id,headline:article.headline,slot:d.slot,
      editionKey:cx.editionKey,signature:d.signature,fingerprint:fingerprints.get(d.paper+'/'+article.id),current:true,
      key:[cx.editionKey,d.signature,d.paper,d.slot,article.id].join('|')});
    const currentKeys=new Set(memory.publications.map(pub=>pub.key));
    for(const speaker of Object.keys(memory.knowledge))memory.knowledge[speaker]=memory.knowledge[speaker].filter(k=>currentKeys.has(k));
    persist();
  }
  function mention(event){
    const d=event.detail,pub=publications(state()).find(p=>p.paper===d?.paper&&p.id===d?.articleId&&p.slot===d?.slot);
    const people=[...nearby()].filter(([id,a])=>id!=='player'&&distance(city.position(),a.p)<=4);
    if(!pub||!people.length||state().pending)return;
    for(const [speaker]of [['player'],...people])memory.knowledge[speaker]=[...new Set([...(memory.knowledge[speaker]||[]),pub.key])];
    event.preventDefault();persist();nextAmbient=clock()+1000;
  }
  doc.addEventListener('cw:newspaper-visible-edition',rememberEdition);
  doc.addEventListener('cw:newspaper-mentioned',mention);
  const onHidden=()=>{if(doc.hidden)cancel();};doc.addEventListener('visibilitychange',onHidden);
  const modalObserver=typeof MutationObserver==='function'?new MutationObserver(()=>{if(doc.querySelector('dialog[open]'))cancel();}):null;
  if(doc.body)modalObserver?.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['open']});
  return {frame,talk,hasTalk,setHints,hintsEnabled:()=>memory.hintsEnabled,report:()=>({version:1,bankEntries:data.bankEntries,patrolLinks:data.patrolLinks,played,last,
    visible:!bubble.hidden,hintVisible:!!pending&&!bubble.hidden,hintsEnabled:memory.hintsEnabled,publications:publications(state()).length,heardSpeakers:Object.keys(memory.knowledge),textOnly:true}),
    destroy(){cancel();modalObserver?.disconnect();doc.removeEventListener('visibilitychange',onHidden);host.remove();style.remove();doc.removeEventListener('cw:newspaper-visible-edition',rememberEdition);doc.removeEventListener('cw:newspaper-mentioned',mention);}};
}

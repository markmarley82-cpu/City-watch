(()=>{'use strict';
const root=document.getElementById('app');if(!root)return;
const style=document.createElement('style');style.textContent=`
#watch-notebook{position:fixed;inset:0;z-index:10000;background:#091a21dc;display:none;align-items:center;justify-content:center;padding:12px}
#watch-notebook.open{display:flex}
#watch-notebook .book{width:min(780px,100%);max-height:94dvh;overflow:auto;background:#e5d4a9;color:#30251d;border:5px double #735336;border-radius:12px;padding:16px;box-shadow:0 20px 65px #000a;font:15px Georgia,serif}
#watch-notebook button{background:#513d2e;color:#f7e8ca;border:0;border-radius:5px;padding:9px 11px;margin:3px;cursor:pointer}
#watch-notebook button.selected{background:#956b3b}
#watch-notebook .entry{padding:10px 0;border-bottom:1px solid #a28c6b;line-height:1.5}
#watch-notebook .nb-case-emblem{float:left;width:64px;height:64px;object-fit:contain;margin:0 10px 5px 0}#watch-notebook .entry{display:flow-root}#watch-notebook small{color:#6a5037}
#watch-notebook textarea{width:100%;min-height:75px;background:#f9edcf;color:#30251d;border:1px solid #8b7250;padding:9px;box-sizing:border-box}
#watch-notebook h2{margin:4px 0 10px}
`;document.head.appendChild(style);
const btn=document.createElement('button');btn.textContent='▤ WATCH NOTEBOOK';btn.style.cssText='position:fixed;left:10px;bottom:10px;z-index:9999;background:#59402c;color:#ffe7b1;border:1px solid #d5b26d;border-radius:8px;padding:9px;font-size:12px';document.body.appendChild(btn);
const overlay=document.createElement('div');overlay.id='watch-notebook';overlay.innerHTML='<div class="book" role="dialog" aria-modal="true" aria-label="Watch notebook"><button id="nb-close" style="float:right">✕ Close</button><h2>⚜ The Watch Notebook</h2><div id="nb-tabs"></div><div id="nb-content"></div></div>';document.body.appendChild(overlay);
const tabs=['Cases','Evidence','Suspects','Witnesses','Timeline','My Notes'];let active='Cases';
const state=()=>window.CW_NOTEBOOK_SNAPSHOT?.()||{};
const living=()=>window.CW_LIVING_P7;
const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const noteKey=window.CW_LAB.keys.notes;
let noteDraft=null,savedNotes='',confirmingClose=false;
function captureDraft(){const text=overlay.querySelector('#nb-text');if(text&&noteDraft!==null)noteDraft=text.value;}
function loadDraft(){if(noteDraft!==null)return;try{savedNotes=window.CW_LAB.storage.getItem(noteKey)||'';}catch(e){savedNotes='';}noteDraft=savedNotes;}
function dirtyNotes(){captureDraft();return noteDraft!==null&&noteDraft!==savedNotes;}
function saveNotes(){captureDraft();loadDraft();try{window.CW_LAB.storage.setItem(noteKey,noteDraft);savedNotes=noteDraft;document.getElementById('nb-status').textContent=' Saved on this device.';return true;}catch(e){document.getElementById('nb-status').textContent=' Notes could not be saved on this device.';return false;}}
function finishClose(){confirmingClose=false;noteDraft=null;overlay.classList.remove('open');return true;}
function requestClose(){
 if(!dirtyNotes())return finishClose();
 if(confirmingClose){confirmingClose=false;active='My Notes';draw();overlay.querySelector('#nb-text')?.focus({preventScroll:true});return false;}
 confirmingClose=true;
 const content=document.getElementById('nb-content');content.innerHTML='<section class="nb-draft-choice" aria-labelledby="nb-draft-title"><h3 id="nb-draft-title">Unsaved field notes</h3><p>Save your notes before closing, keep editing, or discard this draft.</p><button type="button" id="nb-keep-editing">Keep editing</button><button type="button" id="nb-save-close">Save and close</button><button type="button" id="nb-discard">Discard changes</button><small id="nb-status" role="status" aria-live="polite"></small></section>';
 content.scrollTop=0;
 overlay.querySelector('#nb-keep-editing').onclick=()=>{confirmingClose=false;active='My Notes';draw();overlay.querySelector('#nb-text')?.focus({preventScroll:true});};
 overlay.querySelector('#nb-save-close').onclick=()=>{if(saveNotes())finishClose();};
 overlay.querySelector('#nb-discard').onclick=finishClose;
 overlay.querySelector('#nb-keep-editing').focus({preventScroll:true});return false;
}

function row(title,description,extra='',emblem=''){return '<div class="entry">'+(emblem?'<img class="nb-case-emblem" src="assets/case-emblems-v1/128/'+safe(emblem)+'.exact.webp" alt="" width="64" height="64">':'')+'<b>'+safe(title)+'</b><div>'+safe(description)+'</div>'+(extra?'<small>'+safe(extra)+'</small>':'')+'</div>';}
function empty(title,description=''){return '<div class="entry" data-nb-empty="true"><b>'+safe(title)+'</b>'+(description?'<div>'+safe(description)+'</div>':'')+'</div>';}
const streetEmblems={"0": {"id": "street-missing-bell", "title": "The Missing Bell"}, "1": {"id": "street-questionable-pie", "title": "A Pie of Questionable Origin"}, "2": {"id": "street-forged-permit", "title": "The Forged Permit"}, "3": {"id": "street-river-lights", "title": "Lights on the River"}, "4": {"id": "street-unpaid-watchman", "title": "The Unpaid Watchman"}, "5": {"id": "street-thirteen-clock", "title": "The Clock That Struck Thirteen"}, "6": {"id": "street-bookseller", "title": "The Bookseller\u2019s Secret"}, "7": {"id": "street-lost-badge", "title": "The Lost Watch Badge"}, "8": {"id": "street-disappearing-door", "title": "The Disappearing Door"}, "9": {"id": "street-expensive-fish", "title": "A Very Expensive Fish"}, "10": {"id": "street-night-soil", "title": "The Night-Soil Dispute"}, "11": {"id": "street-phantom-watchman", "title": "The Phantom Watchman"}, "12": {"id": "street-unfortunate-portrait", "title": "An Unfortunate Portrait"}, "13": {"id": "street-lantern-tax", "title": "The Lantern Tax"}};
function streetRows(s){const st=s.flags?.street||{},ids=new Set([...Object.keys(st.done||{}),...(Number.isInteger(st.active)&&st.active>=0?[String(st.active)]:[])]);return [...ids].filter(id=>streetEmblems[id]).map(id=>row(streetEmblems[id].title,st.done?.[id]?'Report closed':'Investigation opened','',streetEmblems[id].id)).join('');}
function content(){
 if(active==='My Notes')return '<p>Personal field notes. These are your own observations, not verified case evidence. Your draft stays while you browse sections. Use Save notes to keep it on this device.</p><textarea id="nb-text" placeholder="Record a lead, a suspicious routine, or a theory..."></textarea><button id="nb-save">Save notes</button><small id="nb-status"></small>';
 const d=state(),s=d.state||{},incidents=d.incidents;
 if(active==='Suspects')return incidents?.suspects.length?incidents.suspects.map(r=>row(r.title,r.description,r.extra)).join(''):empty('Suspect register','No active encounter suspects are listed here. Completed outcomes are recorded under Cases.');
 const patrolEnquiries=window.CWPatrolRecords?.view(s,window.CW_PATROL_DATA?.cases);
 const enquiries=window.CW_UNIVERSITY_NOTEBOOK?.(s,patrolEnquiries)||patrolEnquiries||{cases:[],evidence:[],witnesses:[],timeline:[]};
 const enquiryRows=section=>enquiries[section].map(r=>row(r.title,r.description,r.extra)).join('');
 const incidentRows=()=>incidents?.reports.map(r=>row(r.title,r.description,r.extra)).join('')||'';
 function patrolRecords(){
  const patrol=window.CW_PATROL?.view();
  return patrol?[...(patrol.active?[patrol.active]:[]),...patrol.queue,...patrol.reports.slice().reverse()]:[];
 }
 if(active==='Cases'){
  const patrolRows=patrolRecords().map(a=>row(a.title,a.stage==='investigate'?'Investigating · '+a.clues.length+'/'+a.clueCount+' clues':a.stage==='awaiting_filing'?'Prepared · awaiting Watch desk filing':'Filed · '+a.meritAwarded+' merit',a.report+(a.requestedActions.length?' Requested: '+a.requestedActions.join(' '):'')+(a.confirmedActions.length?' Confirmed: '+a.confirmedActions.join(' '):''))).join('');
  const chapter=s.chapter||0,stage=s.stage||0;
  const opening=s.flags?.p21PatrolRounds?.active?.routeId==='watch-square-purse';
  return (opening?'':row('Current Watch assignment',d.assignment?.current||'Chapter '+(chapter+1)+' · Step '+(stage+1),
   'Chapter '+(chapter+1)+' · Step '+(stage+1)+(d.assignment?.recruitName?' · '+d.assignment.recruitName:''),['main-ledger','main-delivery','main-patrol'][Math.min(chapter,2)]))+
  enquiryRows('cases')+(incidents?.active?row(incidents.active.title,incidents.active.description,incidents.active.extra):'')+row('The Thirteenth Chime',s.flags?.mystery?.started?'Investigation opened':'Not yet opened',s.flags?.mystery?.done?'Completed':'Check the Detective Desk for case details','mystery-thirteenth-chime')+streetRows(s)+patrolRows+(incidents?incidentRows():(s.flags?.p21EncounterResults||[]).map(r=>row('Street encounter · '+r.binding,r.outcome,r.arrested+' arrested · '+r.released+' released')).join(''));
 }
 if(active==='Evidence'){
  const items=(s.items||[]).filter(x=>/ledger|invoice|signet|testimony|evidence|clue|badge/i.test(x));
  const clues=s.flags?.mystery?.clues||[];
  const patrolClues=enquiryRows('evidence')+patrolRecords().flatMap(a=>a.clues.map(c=>row(a.title,c.text,c.method==='inspect'?'Scene observation':'Recorded local account'))).join('');
  if(!items.length&&!clues.length&&!patrolClues)return empty('No evidence items listed');
  return items.map(x=>row(x,'Collected item')).join('')+
   (clues.length?row('Bell investigation',clues.length+' physical clue(s) recorded'):'')+patrolClues;
 }
 if(active==='Witnesses')return enquiryRows('witnesses')+'<h3 class="nb-scope">City contacts</h3>'+((living()?.state().agents||[]).map(a=>row(a.job,'Currently '+a.state)).join('')||empty('No city contacts listed'));
 if(active==='Timeline'){
  const ev=living()?.events||[];
  return enquiryRows('timeline')+(incidents?.active?row(incidents.active.title,incidents.active.description,incidents.active.extra):'')+incidentRows()+'<h3 class="nb-scope">City activity</h3>'+(ev.slice(-40).reverse().map(e=>row('Day '+e.day+' · '+String(Math.floor(e.minute/60)).padStart(2,'0')+':'+String(e.minute%60).padStart(2,'0'),e.type+(e.actor===null?'':' · citizen '+(e.actor+1)))).join('')||empty('No city activity recorded'));
 }
}
function draw(){
 captureDraft();confirmingClose=false;
 document.getElementById('nb-tabs').innerHTML=tabs.map(t=>'<button data-tab="'+t+'" class="'+(active===t?'selected':'')+'">'+t+'</button>').join('');
 document.getElementById('nb-content').innerHTML=content();
 overlay.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{active=b.dataset.tab;draw();});
 const text=overlay.querySelector('#nb-text');
 if(text){loadDraft();text.value=noteDraft;text.oninput=()=>{noteDraft=text.value;};overlay.querySelector('#nb-save').onclick=saveNotes;}
}
function open(){window.CW_LAB.assertReady();draw();overlay.classList.add('open');}
btn.onclick=open;document.getElementById('nb-close').onclick=()=>window.CW_NOTEBOOK.requestClose();
overlay.addEventListener('click',e=>{if(e.target===overlay)window.CW_NOTEBOOK.requestClose();});
window.CW_NOTEBOOK={open,requestClose,refresh:draw,openSection(section){if(tabs.includes(section))active=section;return window.CW_NOTEBOOK.open();}};
})();

import {CONTACTS,contactGate} from './contact-contract.mjs';
import {CASE01_TEXT as text} from './case.mjs?v=cw1';

const art=file=>new URL(file,import.meta.url);
const portraits={
 porter:art('../assets/characters-drawn-v1/p3_goblin_01-portrait.webp'),
 ponder:art('../assets/wizard-characters-v1/wizard-ponder-stibbons-portrait.webp'),
 'stores-assistant':art('art/assistant-portrait.webp')
};
const names={porter:'Porter',ponder:'Ponder Stibbons','crate-records':'Crate and records','stores-assistant':'Stores assistant'};
const walkNames={porter:'the porter',ponder:'Ponder Stibbons','crate-records':'the crate','stores-assistant':'the stores assistant'};
const labels={
 accept:'Open inquiry',receipt:'Record the movement receipt',report:'Read the Hex report',
 crate:'Compare the crate and packing entry',buyer:'Read the offer and buyer’s account',
 accuse:'Record an accusation against the porter',challenge:'Present the evidence',
 admit:'Start with the return instruction.',
 deny:'You can give your account. I will record the evidence alongside it.',
 correct:'Correct the porter’s record',file:'File the report'
};
const feedback={
 accept:'Inquiry opened.',receipt:'Movement receipt recorded.',report:'Hex report recorded.',
 crate:'Instrument recovered. Packing and return records compared.',buyer:'Offer and buyer’s account recorded.',
 accuse:'Provisional accusation recorded.',challenge:'The evidence has been presented.',
 correct:'Correction recorded.',file:'Report filed.'
};

function available(state,action){
 if(state.complete)return false;
 if(action==='accept')return !state.accepted;
 if(!state.accepted)return false;
 if(['receipt','report','crate','buyer'].includes(action))return !state.evidence.includes(action)&&(action!=='buyer'||state.recovered);
 if(action==='accuse')return !state.accusedEarly&&!state.challenged&&!state.corrected;
 if(action==='challenge')return state.evidence.length===4&&!state.challenged;
 if(action==='admit'||action==='deny')return state.challenged&&!state.response;
 if(action==='correct')return Boolean(state.response)&&!state.corrected;
 return action==='file'&&state.corrected;
}

// Parent document controls only. No case action messages from the map iframe.
export function mountCase01Panel({doc,header,case01,university,isSettled,onChange=()=>{},walkTo=null}){
 const element=(tag,value)=>{const node=doc.createElement(tag);if(value)node.textContent=value;return node;};
 const button=label=>{const node=element('button',label);node.type='button';return node;};
 const picture=(file,className)=>{const img=element('img');img.alt='';img.className=className;img.src=file;img.onerror=()=>img.remove();return img;};
 const open=button('Inquiry');open.hidden=true;header.insertBefore(open,header.lastElementChild);
 const panel=element('dialog');panel.className='cw-uu-case-panel';panel.setAttribute('aria-labelledby','cw-uu-case-title');
 const title=element('h2',text.title);title.id='cw-uu-case-title';
 const next=element('p'),notice=element('p'),contacts=element('div'),records=element('details'),summary=element('summary','Collected evidence'),entries=element('ul'),close=button('Back to the University');
 next.setAttribute('aria-live','polite');notice.setAttribute('role','status');contacts.className='cw-uu-case-actions';records.append(summary,entries);
 panel.append(title,next,notice,contacts,records,close);doc.body.append(panel);

 function render(){
  contacts.replaceChildren();entries.replaceChildren();
  next.textContent='';records.hidden=true;
  if(!isSettled()){next.textContent='Stop and let the University save your position before speaking to a contact.';return;}
  try{
   const visit=university.active();if(!visit)return;
   const {case:state,revision,next:guidance}=case01.view();
   next.textContent=guidance;
   for(const row of case01.notebook().evidence){
    const li=element('li'),caption=element('strong',row.extra);
    li.dataset.document=row.description===text.crate?'packing':row.description===text.offer||row.description===text.buyer?'sale':'report';
    li.append(caption);
    if(li.dataset.document==='packing')li.append(picture(art('art/crate-open.svg'),'cw-uu-evidence-crate'));
    li.append(element('p',row.description));entries.append(li);
   }
   records.hidden=!entries.childElementCount;
   const near=c=>c.actions.filter(action=>available(state,action)&&contactGate(university.graph,{contactID:c.id,action,position:visit.snapshot.position}));
   const anyNear=CONTACTS.some(c=>near(c).some(a=>a!=='accuse'));
   for(const contact of CONTACTS){
    const actions=near(contact);
    // Contacts only answer when you stand beside them; offer to walk there instead of showing nothing.
    if(!actions.length&&walkTo&&!anyNear&&contact.actions.some(a=>a!=='accuse'&&available(state,a))){
     const group=element('section'),heading=element('h3',names[contact.id]),go=button('Walk to '+walkNames[contact.id]);
     if(portraits[contact.id])heading.prepend(picture(portraits[contact.id],'cw-uu-contact-portrait'));
     go.onclick=()=>{if(walkTo(contact.approach))panel.close();else notice.textContent='Wait a moment for the University to save your position, then try again.';};
     group.append(heading,go);contacts.append(group);continue;
    }
    if(!actions.length)continue;
    const group=element('section'),heading=element('h3',names[contact.id]);
    if(portraits[contact.id])heading.prepend(picture(portraits[contact.id],'cw-uu-contact-portrait'));
    group.append(heading);
    for(const action of actions){
     const step=button(labels[action]);group.append(step);
     step.onclick=()=>{
      try{
       const scripted=action==='admit'||action==='deny';
       const result=case01.act({contactID:contact.id,action,visitId:visit.id,revision},{scripted});
       if(result.changed)onChange({assistantSpeaking:scripted});
       notice.textContent=scripted?text[result.case.response]:feedback[action];
       if(result.paid){notice.textContent+=' +'+result.paid.merit+' merit, +'+result.paid.coins+' coins.';hud();}
      }catch(error){notice.textContent=error.message;}
      render();
      const nextAction=contacts.querySelector('button');
      (nextAction||close).focus();
     };
    }
    contacts.append(group);
   }
  }catch(error){next.textContent=error.message;}
 }
 function hud(){
  try{const w=doc.defaultView,r=w.CWP21State.create(w.localStorage).read(),st=r.state,money=doc.getElementById('p21-money'),merit=doc.getElementById('p21-merit');let rank=null;try{rank=w.CWP21State.career(st);}catch{}
   if(money)money.textContent=st.coins+(st.coins===1?' coin':' coins');if(merit)merit.textContent=(rank?rank.name+' · ':'')+st.merit+' merit';}catch{}
 }
 open.onclick=()=>{if(panel.open)return;notice.textContent='';render();panel.showModal();close.focus();};
 close.onclick=()=>panel.close();
 panel.addEventListener('close',()=>{if(!open.hidden)open.focus();});
 function show(ready){open.hidden=!ready;if(!ready&&panel.open)panel.close();}
 return Object.freeze({show,reopen(){if(!open.hidden&&!panel.open)open.click();}});
}

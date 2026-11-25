/* Use the approved recruit folio and oath in the canonical city entry. */
export const LEGACY_PLAYER_KEY='city_watch_lab01_v01_player';
export function registered(state){
  return !!state?.flags?.watchOathVersion&&typeof state.flags.recruitName==='string'&&state.flags.recruitName.trim().length>0;
}
export function signRecruit({storage,campaignAPI,characters,clothing,heads,draft,record}){
  if(!draft?.key||!record?.name||!record.oathVersion)throw Error('Recruit details are incomplete');
  const campaign=campaignAPI.create(storage),current=campaign.read(),candidate=JSON.parse(JSON.stringify(current.state));
  candidate.flags={...candidate.flags,recruitName:record.name,watchOathVersion:record.oathVersion,peopleAppearanceP1:draft.key};
  delete candidate.flags.watchOathPending;
  const keys=[campaignAPI.KEY,LEGACY_PLAYER_KEY,characters.preferenceKey,clothing.preferenceKey,heads.preferenceKey];
  const previous=new Map(keys.map(key=>[key,storage.getItem(key)]));
  try{
    if(!characters.saveSelected(draft.key,storage)||
      clothing.supports(draft.key)&&!clothing.save(draft.key,draft.outfit,storage)||
      !heads.save(draft.key,draft.head,storage))throw Error('Recruit appearance could not be saved');
    campaign.campaign(candidate);campaign.project();return candidate;
  }catch(error){
    for(const [key,value]of previous){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{}}
    throw error;
  }
}

export async function createRecruitment({city,storage=localStorage,campaignAPI=window.CWP21State}){
  await import('./watch-oath/watch-oath.js?v=p21-b407-s039-reuse');
  const {openCharacterStudio}=await import('./character-studio.mjs?v=three-peoples-1');
  const oath=window.CWWatchOath;let opening=false,screen=null,gate=null,phase='ready';
  const state=()=>campaignAPI.create(storage).read().state;
  function status(next){phase=next;document.body.dataset.recruitment=next;window.CWRecruitmentPending=!registered(state());}
  function resumeGate(error=''){
    status('choose-recruit');city.stop();
    if(!gate){
      gate=document.createElement('dialog');gate.id='cw-recruitment-gate';
      gate.innerHTML='<header><h2>Watch recruitment</h2></header><p>Choose your character and name, then sign the Watch oath to report for duty.</p><p role="status"></p><button type="button">Choose your recruit</button>';
      gate.querySelector('button').onclick=()=>{gate.close();open();};
      gate.addEventListener('cancel',e=>e.preventDefault());document.body.append(gate);
    }
    gate.querySelector('[role=status]').textContent=error;if(!gate.open)gate.showModal();
  }
  function finish(){
    status('signed');
    window.CWP21Game?.refresh();
    city.update();
    window.dispatchEvent(new CustomEvent('cw-recruit-signed'));
    if(!document.querySelector('dialog[open]'))document.getElementById('city-use')?.focus({preventScroll:true});
  }
  function showOath(draft){
    status('oath');city.stop();
    screen=oath.mount({initialName:draft.name||'',cancelLabel:'← Back to recruit',
      onSign:record=>{
        try{
          signRecruit({storage,campaignAPI,characters:window.CWCharacters,clothing:window.CWClothing,heads:window.CWHeads,draft,record});
          window.dispatchEvent(new CustomEvent('cw-character-change',{detail:{key:draft.key,head:draft.head,clothing:draft.outfit,persisted:true}}));
          return true;
        }catch(error){window.dispatchEvent(new StorageEvent('storage',{key:null}));throw error;}
      },
      onComplete:()=>{screen=null;finish();},
      onCancel:()=>{const name=screen?.root.querySelector('#cw-oath-name')?.value??draft.name;screen=null;open({...draft,name});}
    });
  }
  async function open(draft=null){
    if(opening||screen||document.querySelector('#character-studio[open]'))return;
    opening=true;city.stop();
    try{
      if(gate?.open)gate.close();
      const current=state();
      if(registered(current)&&!draft){
        status('signed');await openCharacterStudio({library:city.characterPainter.library,name:current.flags.recruitName});return;
      }
      status('choose-recruit');
      await openCharacterStudio({library:city.characterPainter.library,legacySelection:current.flags.peopleAppearanceP1,
        name:current.flags.recruitName||'',draft,
        onClose:({continued})=>{if(!continued&&!registered(state()))resumeGate();},onContinue:showOath});
    }catch(error){resumeGate('Character creation could not load. Please retry; your patrol is preserved.');console.error(error);}
    finally{opening=false;}
  }
  status(registered(state())?'signed':'pending');
  return {open,start:()=>registered(state())?false:open(),report:()=>({phase,signed:registered(state()),name:state().flags.recruitName||''})};
}

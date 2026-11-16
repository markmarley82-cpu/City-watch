import {createEditorial} from './editions.mjs?v=p21-b407-s039-reuse';
import {createNewspapers} from './newspapers.mjs?v=p21-b407-s039-reuse';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const asset=name=>new URL('./assets/'+name,import.meta.url).href;

export function restoreNewspaperFocus(priorFocus,doc=document,app=doc.getElementById?.('app')){
  const usable=target=>!!target?.isConnected&&!target.disabled&&!target.hidden&&typeof target.focus==='function'&&(target.getClientRects?.().length??1)>0&&!target.closest?.('[hidden],[inert],[aria-hidden="true"]');
  const fallbacks=app?.querySelectorAll?.('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')??[];
  for(const target of [priorFocus,doc.getElementById?.('city-use'),...fallbacks])if(usable(target)){target.focus({preventScroll:true});return target;}
  return null;
}

/** load/save own only this extension's clipping state. Never pass the player save. */
export async function createNewspaperReader({catalog,editorial=null,getContext,load,save,onNotebook,onRefer=null,onModal=()=>{},canRead=()=>true,onPurchaseRequired=()=>{},app=document.getElementById('app')}){
  if(typeof getContext!=='function'||typeof load!=='function'||typeof save!=='function'||typeof onNotebook!=='function')throw new TypeError('Explicit context, storage and notebook adapters are required');
  const model=createNewspapers(catalog);
  const editorialModel=editorial?createEditorial(editorial):null;
  const loaded=await load();
  let state=loaded==null?model.emptyState():model.restore(loaded);
  // City stories can be kept as reading material, separately from case evidence.
  const validStory=x=>x&&['times','inquirer'].includes(x.paper)&&['id','headline','body','edition'].every(k=>typeof x[k]==='string')&&x.id.length<100&&x.headline.length<500&&x.body.length<20000;
  let cityClippings=Array.isArray(loaded?.cityClippings)?loaded.cityClippings.filter(validStory).map(x=>({...x})):[];
  const snapshot=(next=state,city=cityClippings)=>city.length?{...structuredClone(next),cityClippings:structuredClone(city)}:structuredClone(next);
  let paper='times',at=0,archive=false,busy=false,priorFocus=null,wasInert=false,wasBlocked=false,frame=0,padBefore=[],destroyed=false,held=false;
  const dialog=el('dialog','cw-news-dialog');dialog.id='cw-newspaper-reader';
  dialog.style.setProperty('--cw-news-paper',`url("${asset('newsprint-sheet.webp')}")`);
  dialog.setAttribute('aria-label','Newspaper');
  const sheet=el('div','cw-news-frame'),header=el('header','cw-news-header'),toolbar=el('nav','cw-news-toolbar');toolbar.setAttribute('aria-label','Newspaper selection');
  const button=(label,fn)=>{const b=el('button','',label);b.type='button';b.onclick=fn;return b;};
  const chooseTimes=button('Times',()=>switchPaper('times')),chooseInquirer=button('Inquirer',()=>switchPaper('inquirer')),close=button('Close',()=>dismiss());close.className='cw-news-close';
  toolbar.append(chooseTimes,chooseInquirer);
  const brand=el('div','cw-news-brand'),edition=el('div','cw-news-edition'),editionName=el('span'),editionId=el('span');edition.append(editionName,editionId);header.append(toolbar,brand,edition);
  const body=el('article','cw-news-body');body.tabIndex=0;body.setAttribute('aria-label','Newspaper article');
  const footer=el('footer','cw-news-footer'),paging=el('nav','cw-news-paging');paging.setAttribute('aria-label','Article pages');
  const prev=button('← Previous',()=>turn(-1)),next=button('Next →',()=>turn(1)),counter=el('span');
  const actions=el('div','cw-news-actions'),clip=button('Clip to notebook',()=>clipCurrent()),notebook=button('Notebook',()=>openNotebook()),follow=button('Follow this lead',()=>followCurrent());follow.style.gridColumn='1 / -1';actions.append(clip,close,follow);paging.append(prev,counter,notebook,next);
  const status=el('p','cw-news-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');footer.append(paging,actions,status);sheet.append(header,body,footer);dialog.append(sheet);document.body.append(dialog);
  function context(){return getContext();}
  function items(){return archive?model.archive(state).map(x=>x.article).filter(a=>a.paper===paper):model.issue(paper,context());}
  function current(){const list=items();at=Math.max(0,Math.min(at,list.length-1));return list[at]??null;}
  function say(text){status.textContent=text;}
  function render(){
    const list=items(),a=current(),editionCopy=!archive&&editorialModel?editorialModel.edition(paper,context(),a?.id??'front'):null;dialog.dataset.paper=paper;
    chooseTimes.setAttribute('aria-pressed',String(paper==='times'));chooseInquirer.setAttribute('aria-pressed',String(paper==='inquirer'));
    brand.replaceChildren();
    if(paper==='times'){
      const crop=el('div','cw-news-times-reference');const logo=el('img','cw-news-masthead');logo.src=asset('times-reference.jpeg');logo.alt='The Ankh-Morpork Times';logo.width=661;logo.height=365;crop.append(logo);brand.append(crop);
      brand.append(el('p','cw-news-motto','“THE TRUTH SHALL MAKE YE FRET” · EXTRA!'));
    }else{
      const mark=el('div','cw-news-wordmark');
      mark.append(el('span','cw-news-title-city','The Ankh-Morpork '),el('span','cw-news-title-main','Inquirer'));
      const redtop=el('div','cw-news-redtop'),slogan=el('p','cw-news-slogan','Bigger stories\nBrighter lies\nA cleaner city\n(mostly)');const logo=el('img','cw-news-approved-redtop');logo.src=asset('inquirer-approved-concept.webp');logo.alt='The Ankh-Morpork Inquirer';logo.width=1024;logo.height=1536;redtop.classList.add('cw-news-approved-header');redtop.append(logo);brand.append(redtop);
    }
    editionName.textContent=archive?'Saved clipping · historical report':paper==='inquirer'?'The people’s paper':'City news · current reports';editionId.textContent=a?(a.phase==='followup'?'Follow-up':'Local report'):'';
    body.replaceChildren();
    if(a){
      const deck=a.id==='RC-MOI-01-inquirer-lead'?'Postal customers demand answers':a.phase==='followup'?'A public account of the inquiry':'Reports from the city';
      body.append(el('h2','cw-news-headline',a.headline),el('p','cw-news-kicker',deck));
      if(a.caseId.startsWith('RC-MOI-')){const image=el('img','cw-news-vignette');image.src=asset(paper==='inquirer'?'inquirer-postal-panel.webp':'postage-engraving.webp');image.alt='Ink illustration of sealed letters, coins, a ledger and quill';image.width=paper==='inquirer'?2172:1536;image.height=paper==='inquirer'?724:1024;body.append(image);}
      if(a.illustration){const image=el('img','cw-news-vignette');image.src=asset(a.illustration.file);image.alt=a.illustration.alt;image.width=1536;image.height=1024;body.append(image);}
      const columns=el('div','cw-news-column-grid'),copy=el('div','cw-news-main-copy');copy.append(el('p','cw-news-copy',a.body));
      columns.append(copy);
      body.append(columns,el('p','cw-news-source',archive?'Clipped report. This records what was published, not present-day proof.':'A lead, not proof.'));
    }else if(!editionCopy)body.append(el('p','cw-news-empty',archive?'No saved clippings from this newspaper.':'No current report is available from this paper.'));
    if(editionCopy){
      const mixed=el('section','cw-news-mixed');mixed.setAttribute('aria-label','Mixed city edition');
      const card=(item,kind,label)=>{
        const article=el('article','cw-news-editorial-card cw-news-kind-'+kind);article.dataset.editorialId=item.id;article.dataset.kind=kind;
        article.append(el('p','cw-news-eyebrow',label),el('h3','',item.headline));
        if(item.illustration){const figure=el('figure','cw-news-story-figure'),image=el('img','cw-news-story-image');image.src=asset(item.illustration.file);image.alt=item.illustration.alt;image.width=1536;image.height=1024;figure.append(image,el('figcaption','',item.illustration.caption));article.append(figure);}
        article.append(el('p','cw-news-story-text',item.body));
        if(kind==='news'){
          const mention=button('Mention this story',()=>{
            const event=new CustomEvent('cw:newspaper-mentioned',{bubbles:true,cancelable:true,detail:{paper,articleId:item.id,slot:a?.id??'front'}});
            dialog.dispatchEvent(event);say(event.defaultPrevented?'You mention the story to the people nearby.':'Come closer to someone before mentioning the story.');
          });mention.className='cw-news-mention-story';mention.disabled=busy;article.append(mention);
          const kept=cityClippings.some(x=>x.id===item.id&&x.paper===paper);
          const keep=button(kept?'Kept in Notebook ✓':'Keep story',()=>keepCityStory(item));
          keep.disabled=busy||kept;keep.className='cw-news-keep-story';article.append(keep);
        }
        return article;
      };
      const rails=[
        [card(editionCopy.classifieds[0],'advert','Classified'),card(editionCopy.notices[0],'notice','City notice'),card(editionCopy.classifieds[1],'advert','Lost, found & for sale')],
        [card(editionCopy.letters[0],'letter',paper==='times'?'Letter to the editor':'Readers have their say'),card(editionCopy.classifieds[2],'advert','Classified')],
        [card(editionCopy.classifieds[3],'advert','Classified'),card(editionCopy.notices[1],'notice','Noticeboard')],
        [card(editionCopy.classifieds[4],'advert','Small advertisement'),card(editionCopy.classifieds[5],'advert','Lost, found & for sale')]
      ];
      editionCopy.news.forEach((item,index)=>{
        const spread=el('section','cw-news-spread'+(index%2?' cw-news-spread-reverse':''));spread.setAttribute('aria-label','City report and notices');
        const story=card(item,'news',paper==='times'?'From around the city':'More from the people’s paper'),rail=el('aside','cw-news-small-column');rail.setAttribute('aria-label','Advertisements and correspondence');rail.append(...rails[index]);spread.append(story,rail);mixed.append(spread);
        if(index===1&&editionCopy.vegetable){const v=editionCopy.vegetable,feature=el('figure','cw-news-vegetable'),picture=el('img');picture.src=asset(v.image);picture.alt=v.alt;picture.width=1024;picture.height=1024;const caption=el('figcaption');caption.append(el('h3','',v.headline),el('p','',v.body));feature.append(picture,caption);mixed.append(feature);}
      });
      body.append(mixed);
      const cx=context(),signature=['availableCases','closedCases','publicTips','publicReports'].map(k=>[...(cx[k]||[])].sort().join(',')).join('|');
      dialog.dispatchEvent(new CustomEvent('cw:newspaper-visible-edition',{bubbles:true,detail:{paper,slot:a?.id??'front',editionKey:String(cx.editionKey??'campaign'),signature}}));
    }
    counter.textContent=list.length?`${at+1} / ${list.length}`:editionCopy?'City pages':'0 / 0';prev.disabled=busy||at<=0;next.disabled=busy||at>=list.length-1;
    clip.hidden=!a&&!!editionCopy;clip.disabled=busy||!a||archive||state.clippings.includes(a.id);clip.textContent=a&&state.clippings.includes(a.id)?'Clipped ✓':'Clip to notebook';
    follow.hidden=!a?.lead||typeof onRefer!=='function';follow.disabled=busy||!a||!model.referral(state,a.id,context());
    follow.title=follow.disabled?'Clip this report to your Notebook before following the lead.':'';
    chooseTimes.disabled=busy||(!archive&&!canRead('times'));chooseInquirer.disabled=busy||(!archive&&!canRead('inquirer'));notebook.disabled=busy;close.disabled=busy;
  }
  function leadHint(){const a=current();say(a?.lead&&!state.clippings.includes(a.id)?'Clip this report to your Notebook, then follow the lead.':'');}
  function turn(delta){if(busy)return;const list=items();at=Math.max(0,Math.min(list.length-1,at+delta));render();body.scrollTop=0;leadHint();}
  function selectCurrentLead(){if(!archive){const index=items().findIndex(a=>a.phase==='lead');if(index>=0)at=index;}}
  function switchPaper(id){if(busy||(!archive&&!canRead(id)))return;paper=id;at=0;selectCurrentLead();render();body.scrollTop=0;leadHint();}
  function followLead(lead,fromNotebook=false){
    if(!lead||typeof onRefer!=='function')return false;
    if(fromNotebook&&window.CWLabNotebook?.close()===false)return false;
    if(dialog.open)dismiss();
    return onRefer(lead);
  }
  function followCurrent(){const a=current();if(busy||!a)return false;return followLead(model.referral(state,a.id,context()));}
  async function clipCurrent(){
    const a=current();if(busy||!a||archive||state.clippings.includes(a.id))return;
    busy=true;render();say('Saving clipping…');
    try{
      const candidate=model.clip(state,a.id,context());
      await save(snapshot(candidate));
      state=candidate;say('Clipped to your notebook.');
      dialog.dispatchEvent(new CustomEvent('cw:newspaper-clipped',{bubbles:true,detail:{articleId:a.id,caseId:a.caseId,evidence:false}}));
    }catch(error){say('Could not save. Your notebook is unchanged. Try again.');}
    finally{busy=false;render();}
  }
  async function keepCityStory(item){
    if(busy||archive||cityClippings.some(x=>x.id===item.id&&x.paper===paper))return;
    const candidate=[...cityClippings,{id:item.id,paper,edition:String(context().editionKey??'campaign'),headline:item.headline,body:item.body}];
    busy=true;render();say('Keeping story…');
    try{await save(snapshot(state,candidate));cityClippings=candidate;say('Story kept in your Notebook. This is newspaper copy, not evidence.');}
    catch{say('Could not save. Your Notebook is unchanged. Try again.');}
    finally{busy=false;render();}
  }
  function openNotebook(){if(busy)return;dismiss();onNotebook();}
  function pad(){
    if(!dialog.open)return;
    const g=[...(navigator.getGamepads?.()??[])].find(Boolean),now=g?g.buttons.map(b=>b.pressed):[];
    if(now[1]&&!padBefore[1])dismiss();else if(now[14]&&!padBefore[14])turn(-1);else if(now[15]&&!padBefore[15])turn(1);else if(now[0]&&!padBefore[0])clipCurrent();
    padBefore=now;if(dialog.open)frame=requestAnimationFrame(pad);
  }
  function dismiss(){if(busy||!dialog.open)return;dialog.close();cleanupModal();}
  function cleanupModal(){
    if(!held)return;held=false;
    cancelAnimationFrame(frame);padBefore=[];if(app)app.inert=wasInert;
    window.CW_P20_INPUT_BLOCKED=wasBlocked;onModal(false);
    if(!destroyed)restoreNewspaperFocus(priorFocus,document,app);
  }
  dialog.addEventListener('close',cleanupModal);
  dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}else if(e.key==='ArrowRight'){e.preventDefault();turn(1);}
    e.stopPropagation();
  });
  function show({paper:requested='times',articleId=null,historical=false}={}){
    if(destroyed)throw new Error('Reader destroyed');
    if(dialog.open)return false;
    if(window.CW_P20_INPUT_BLOCKED)return false;
    if(document.querySelector('#watch-notebook.open,#cw-p16-inventory.open,#cw-clean-reader[open],#p20-base-review:not([hidden])'))return false;
    if(!['times','inquirer'].includes(requested))throw new TypeError('Unknown paper');
    if(!historical&&!canRead(requested)){onPurchaseRequired(requested);return false;}
    paper=requested;archive=historical;at=0;
    const list=items();if(articleId){const i=list.findIndex(a=>a.id===articleId);if(i<0)return false;at=i;}else selectCurrentLead();
    render();leadHint();priorFocus=document.activeElement;wasInert=!!app?.inert;wasBlocked=!!window.CW_P20_INPUT_BLOCKED;
    dialog.showModal();held=true;if(app)app.inert=true;window.CW_P20_INPUT_BLOCKED=true;onModal(true);
    app?.querySelectorAll('.dpad button').forEach(b=>b.dispatchEvent(new Event('pointercancel')));
    body.scrollTop=0;close.focus({preventScroll:true});frame=requestAnimationFrame(pad);return true;
  }
  function renderClippings(container){
    container.replaceChildren();const wrapper=el('section','cw-news-clippings');
    wrapper.append(el('h3','','Newspaper clippings'));
    if(!state.clippings.length&&!cityClippings.length)wrapper.append(el('p','','Buy a newspaper from a street seller and clip a report to keep it here.'));
    for(const {article:a} of model.archive(state)){
      const row=el('article');row.append(el('h3','',a.headline),el('p','',`${a.paper==='times'?'The Ankh-Morpork Times':'The Ankh-Morpork Inquirer'} · saved report`));
      const controls=el('div','cw-news-clipping-actions');
      controls.append(button('Read clipping',()=>{window.CWLabNotebook?.close();queueMicrotask(()=>show({paper:a.paper,articleId:a.id,historical:true}));}));
      const lead=model.referral(state,a.id,context());
      if(lead&&typeof onRefer==='function'){const follow=button('Follow up lead',()=>followLead(model.referral(state,a.id,context()),true));controls.append(follow);}
      row.append(controls);wrapper.append(row);
    }
    for(const a of cityClippings){
      const row=el('article'),detail=el('details'),heading=el('summary','',a.headline);
      detail.append(heading,el('p','',a.body),el('small','',`${a.paper==='times'?'The Ankh-Morpork Times':'The Ankh-Morpork Inquirer'} · ${a.edition} · City story, not evidence`));row.append(detail);wrapper.append(row);
    }
    container.append(wrapper);
  }
  return Object.freeze({open:show,close:dismiss,renderClippings,refresh(){render();},getState:()=>snapshot(),get openState(){return dialog.open;},
    destroy(){if(busy)throw new Error('Wait for the pending save');destroyed=true;if(dialog.open){dialog.close();cleanupModal();}dialog.remove();cancelAnimationFrame(frame);}
  });
}

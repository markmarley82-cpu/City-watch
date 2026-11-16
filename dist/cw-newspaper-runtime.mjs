import {editionFor,ownsNewspaper} from './newspapers/purchases.mjs?v=p21-b407-s039-reuse';
import {installCityWatchNewspapers} from './newspapers/city-watch-newspaper-bridge.mjs?v=p21-b407-s039-reuse';
import {campaignNewspaperContext} from './newspapers/campaign-leads.mjs?v=p21-b407-s039-reuse';

const read = async name => {
  const url=new URL('./newspapers/' + name, import.meta.url);
  url.searchParams.set('v',window.CW_LAB_RELEASE?.runtimeCacheToken||'newspaper-cases-v1');
  const response = await fetch(url);
  if (!response.ok) throw new Error('The newspaper could not be loaded.');
  return response.json();
};
// Dormant recurring-character cases stay closed. Only actual campaign cases publish.
export function newspaperContext(snapshot = window.CW_NOTEBOOK_SNAPSHOT?.()) {
  const state = window.CWP21State?.create(localStorage).read().state || snapshot?.state || {};
  return {
    ...campaignNewspaperContext(state),
    editionKey: editionFor(state)
  };
}
async function ensureNewspaperStyles() {
  const href=new URL('./newspapers/newspaper-reader.css?v=p21-b461-watch-ui',import.meta.url).href;
  let link=[...document.querySelectorAll('link[rel="stylesheet"]')].find(node=>node.href===href);
  if(link?.sheet)return;
  await new Promise((resolve,reject)=>{
    if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=href;}
    link.addEventListener('load',resolve,{once:true});
    link.addEventListener('error',()=>{link.remove();reject(new Error('The newspaper artwork stylesheet could not load.'));},{once:true});
    if(!link.isConnected)document.head.append(link);
  });
}
async function start() {
  await ensureNewspaperStyles();
  await window.CW_LAB.prepare();
  const [catalog, editorial] = await Promise.all([read('newspapers.json'), read('editorial.json')]);
  const reader = await installCityWatchNewspapers({
    catalog, editorial, getContext: () => newspaperContext(),
    storage: window.CW_LAB.storage, saveKey: window.CW_LAB.keys.newspapers,
    onRefer: lead=>{
      let game=window.CWP21Game;
      try{if(!game&&window.parent!==window)game=window.parent.CWP21Game;}catch{}
      if(game?.followNewspaperLead)return game.followNewspaperLead(lead);
      const notice=document.getElementById('message');if(notice)notice.textContent='Return to the city to follow this saved lead.';
      return false;
    },
    canRead: paper=>ownsNewspaper(window.CWP21State?.create(localStorage).read().state,paper),
    onPurchaseRequired: ()=>{const message='Buy this edition from a newspaper seller in the street.';if(window.CWP21City)window.CWP21City.tell(message);else{const notice=document.getElementById('message');if(notice)notice.textContent=message;}}
  });
  window.CW_NEWSPAPERS = Object.freeze({
    open: options => reader.open(options), close: reader.close,
    showClippings: reader.showClippings, getState: reader.getState,
    version: '1.4', report: () => ({version: '1.4', campaignBound: true,
      casePublicationBound: true, playableCaseBindings:3, editionKey: newspaperContext().editionKey,
      editorialEntries: 236, clippingKey: window.CW_LAB.keys.newspapers})
  });
  document.dispatchEvent(new Event('cw:newspapers-ready'));
}
let pendingDelivery=null;
function loadNewspapers(){
  if(pendingDelivery)return pendingDelivery;
  window.CW_NEWSPAPERS=Object.freeze({loading:true,open(){return false;}});
  document.dispatchEvent(new Event('cw:newspapers-status'));
  pendingDelivery=start().then(()=>true).catch(()=>{
    window.CW_NEWSPAPERS=Object.freeze({failed:true,retry:loadNewspapers,open(){
      const notice=document.getElementById('message');
      if(notice)notice.textContent='The newspapers could not be opened. Retry at a street seller; saved notes are unchanged.';
      return false;
    }});
    document.dispatchEvent(new Event('cw:newspapers-status'));
    return false;
  }).finally(()=>{pendingDelivery=null;});
  return pendingDelivery;
}
loadNewspapers();

import assert from 'node:assert/strict';
const {Window}=await import(process.env.CW_QA_DOM_MODULE || 'happy-dom');
const window=new Window({url:'http://portrait-review.local/',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
Object.assign(globalThis,{window,document:window.document,localStorage:window.localStorage,Image:window.Image});
const {createPlayerContacts}=await import('../dist/cw-player-contacts.mjs');
let updates=0,stops=0;
const city={position:()=>[0,0],stop:()=>stops++,update:()=>updates++,tell:()=>{},
 characterPainter:{library:{entries:{legacy:{portrait:'assets/existing-witness.webp'}}}}};
const actors=[{id:'patrol-partner',name:'Nobby Nobbs',key:'mentor-nobby',p:[0,0]}];
const contacts=createPlayerContacts({city,actors,state:()=>({state:{flags:{}}}),
 member:()=>({id:'nobby',name:'Nobby Nobbs',trait:'Street sense',advice:'Look closely.',maxHp:18,weaponName:'Truncheon'}),
 university:{owns:()=>false},sellers:{isSeller:()=>false},campaignTalk:()=>{},pursuit:()=>{},walkTo:()=>{},objective:()=> 'Patrol',document});
const entry={topic:'Street conversation',lines:[{speaker:'npc',text:'Good evening, officer.'}]};
let checked=0;
for(const [id,name,portrait] of [['colon','Colon','colon'],['carrot','Carrot','carrot'],['vimes','Vimes','vimes'],['palm','Mrs Palm','mrs-palm'],['dibbler','Dibbler','dibbler']]){
 assert(contacts.exchange({id,name,key:'legacy'},entry));
 const dialog=document.querySelector('#cw-player-contacts');assert(dialog.open);
 assert.equal(dialog.querySelector('h2').textContent,name);
 assert.equal(dialog.querySelector('.cw-dialogue-portrait img').dataset.portraitId,portrait);
 assert(dialog.querySelector('.cw-dialogue-speech').textContent.includes('Good evening'));
 [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Return to patrol').click();
 assert(!dialog.open);checked++;
}
assert(contacts.partner());assert.equal(document.querySelector('.cw-dialogue-portrait img').dataset.portraitId,'nobby');
assert.equal(globalThis.CW_P20_INPUT_BLOCKED,true);contacts.dismiss();assert.equal(globalThis.CW_P20_INPUT_BLOCKED,false);checked++;
contacts.exchange({id:'colon',name:'Colon',key:'legacy'},entry);
const failed=document.querySelector('.cw-dialogue-portrait img');failed.dispatchEvent(new window.Event('error'));
assert(document.querySelector('.cw-dialogue-portrait img').src.endsWith('/dist/assets/existing-witness.webp'));
contacts.dismiss();contacts.exchange({id:'witness',name:'Witness',key:'legacy'},entry);
assert(!document.querySelector('.cw-dialogue-portrait img').dataset.portraitId);contacts.dismiss();
assert.equal(contacts.report().newSaveKeys.length,0);

const {createDibbler}=await import('../dist/cw-dibbler.mjs');
let record={revision:0,pending:null,state:{coins:10,night:0,flags:{},items:[]}};
const store={read:()=>structuredClone(record),replaceRecord:(next,expected)=>{
 if(expected!==record.revision)return false;record={...structuredClone(next),revision:expected+1};return true;},project:()=>{}};
window.CWP21State={create:()=>store};window.CWPatrolConversations={hasTalk:()=>false};
let saved=0;
const vendor=createDibbler({city:{position:()=>[-2,4],stop:()=>{},
 world:{doors:new Map([['watch',{position:[0,0]}]])}},actors:[],nearest:p=>p,onChange:()=>saved++});
assert.equal(document.querySelector('#cw-dibbler [data-seller-portrait] img'),null,'Shop portrait must load on open, not startup');
assert(vendor.interact());const shop=document.querySelector('#cw-dibbler');
assert(shop.open);assert.equal(shop.querySelector('[data-seller-portrait] img').dataset.portraitId,'dibbler');
assert(!shop.querySelector('[data-buy]').disabled);shop.querySelector('[data-buy]').click();
assert.equal(record.state.coins,7);assert.equal(record.state.flags.dibbler.bag.length,1);assert.equal(saved,1);
shop.querySelector('[data-seller-portrait] img').dispatchEvent(new window.Event('error'));
assert(shop.querySelector('[data-seller-portrait] canvas'),'Failed new art must restore original vendor portrait');
shop.querySelector('[data-close]').click();assert(!shop.open);
assert(stops>=checked);assert(updates>=checked);
console.log('PASS six named dialogue paths, partner modal/input restore, legacy fallbacks, lazy shop portrait, purchase and close');
await window.happyDOM.abort();

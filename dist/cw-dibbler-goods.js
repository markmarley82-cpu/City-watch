/* Recovered approved 23 October stock, adapted to the canonical campaign save. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CWDibblerGoods=api;})(globalThis,function(){
'use strict';
const items=Object.freeze([
{id:'sausage',name:'Sausage-inna-bun',price:3,pitch:'Keep you on your feet!',fail:'Your stomach files a complaint.'},
{id:'cream',name:'Anti-dragon cream',price:4,pitch:'Protection you can spread!',fail:'You are greasy. You are not fireproof.',success:'The slippery lid helps free a jammed strap. Recover up to 3 stamina.'},
{id:'detector',name:'Dragon detector',price:4,pitch:'Never miss a dragon!',fail:'The wood remains wood. No advance warning.',success:'The stick nudges a dropped penny from a drain. +1 coin.'},
{id:'shovel',name:'Treasure-detecting shovel',price:5,pitch:'Buried riches await!',fail:'You uncover a particularly unremarkable stone.',success:'You happen upon a dropped penny. +1 coin.'},
{id:'compass',name:'Suspect-seeking compass',price:4,pitch:'Find the guilty party!',fail:'The needle accuses you.',success:'While examining the needle, you catch your breath. Recover up to 3 stamina.'},
{id:'leaflet',name:'Grand Master’s fighting leaflet',price:4,pitch:'Master combat by correspondence!',fail:'The stance leaves you looking like a folding chair.',success:'The ridiculous stretch loosens your shoulders. Recover up to 3 stamina.'},
{id:'polish',name:'Silent patrol boot polish',price:4,pitch:'Move unheard!',fail:'Your boots squeak with every step.',success:'A moment spent polishing gives you a breather. Recover up to 3 stamina.'}
].map(Object.freeze));
const spec=id=>items.find(i=>i.id===id),clone=x=>JSON.parse(JSON.stringify(x));
function owned(s){return (s.flags.dibbler?.bag||[]).filter(e=>!e.used&&spec(e.item));}
function stock(s,id){return Math.max(0,3-(s.flags.dibbler?.bag||[]).filter(e=>e.item===id&&e.night===s.night).length);}
function purchase(record,id,seed){
 const item=spec(id);if(!item)return {ok:false,reason:'unknown'};
 if(record.pending)return {ok:false,reason:'encounter-active'};
 if(!stock(record.state,id))return {ok:false,reason:'stock'};
 if(record.state.coins<item.price)return {ok:false,reason:'funds'};
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)return {ok:false,reason:'seed'};
 const next=clone(record),s=next.state;s.flags.dibbler=s.flags.dibbler||{bag:[]};const bag=s.flags.dibbler.bag;
 const entry={id:'dibbler-'+next.revision+'-'+bag.length,item:id,night:s.night,seed,used:false};bag.push(entry);s.coins-=item.price;s.items.push(item.name);
 return {ok:true,record:next,entry};
}
function loadout(s){return owned(s).map(clone);}
function lucky(e){return e.seed/4294967296<.1;}
function reason(b,id){const e=b.supplies?.dibbler?.find(e=>e.id===id&&!e.used),a=b.actors?.[b.turn];if(!e)return 'This item is not in your kit.';if(b.phase!=='battle'||a?.id!=='officer'||a.status!=='active')return 'The recruit must have an active turn.';if(b.budget.action<1)return 'Your main action is spent.';if(e.item==='sausage'){if(a.hp>=a.maxHp)return 'Stamina is already full.';const health=Math.ceil(a.hp/a.maxHp*b.supplies.campaignMaxHp)+(a.campaignHpOffset||0);if(health<=10)return 'Too little health to risk eating this sausage.';}return '';}
function use(b,id){const why=reason(b,id);if(why)return {ok:false,reason:why};const e=b.supplies.dibbler.find(e=>e.id===id),item=spec(e.item),a=b.actors[b.turn];e.used=true;b.budget.action--;
 if(e.item==='sausage'){const max=b.supplies.campaignMaxHp,before=Math.ceil(a.hp/a.maxHp*max)+(a.campaignHpOffset||0);a.hp=Math.min(a.maxHp,a.hp+20);a.campaignHpOffset=before-10-Math.ceil(a.hp/a.maxHp*max);e.result='Recover up to 20 stamina; lose 10 campaign health. Your stomach files a complaint.';}
 else{e.result=lucky(e)?item.success:item.fail;if(lucky(e)&&!['detector','shovel'].includes(e.item))a.hp=Math.min(a.maxHp,a.hp+3);}
 b.log.push(item.name+': '+e.result);return {ok:true};}
function capture(s,b,p){for(const frozen of p.supplyLoadout?.dibbler||[]){const used=b.supplies?.dibbler?.find(e=>e.id===frozen.id&&e.used);const entry=s.flags.dibbler?.bag?.find(e=>e.id===frozen.id&&!e.used);if(!used||!entry)continue;entry.used=true;entry.result=used.result;const name=spec(entry.item).name,index=s.items.indexOf(name);if(index>=0)s.items.splice(index,1);if(entry.item!=='sausage'&&lucky(entry)&&['detector','shovel'].includes(entry.item))s.coins++;}}
return {items,spec,owned,stock,purchase,loadout,lucky,reason,use,capture};
});

/* Ordinary provisions. Recovery numbers are game rules, not supernatural lore. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWSupplies=api;})(globalThis,function(){
'use strict';
const Goods=typeof module==='object'&&module.exports?require('./cw-dibbler-goods.js'):globalThis.CWDibblerGoods;
const coffeeItem='Strong coffee',bandageItem='Bandages';
const count=(s,item)=>s.items.filter(x=>x===item).length;
const loadout=s=>({bandages:count(s,bandageItem),coffee:Math.min(2,count(s,coffeeItem)),dibbler:Goods?.loadout(s)||[],campaignMaxHp:s.maxhp});
function bind(b,s,p){
 if(b.supplies||p?.battle)return b;
 const kit=p?.supplyLoadout||loadout(s);
 b.items=kit.bandages;b.supplies={schema:1,encounterId:p.id,coffee:kit.coffee,revived:[],dibbler:kit.dibbler||[],campaignMaxHp:kit.campaignMaxHp||s.maxhp};return b;
}
function capture(s,b,p){
 const kit=b.supplies;if(!kit||kit.schema!==1||kit.encounterId!==p.id||!p.supplyLoadout)return;
 function take(item,n){const have=count(s,item),left=Number.isSafeInteger(n)&&n>=0?Math.min(have,n):have;let remove=have-left;s.items=s.items.filter(x=>x!==item||remove--<=0);return left;}
 Goods?.capture(s,b,p);b.items=take(bandageItem,b.items);kit.coffee=take(coffeeItem,kit.coffee);
 kit.revived=[...new Set([...(p.battle?.supplies?.revived||[]),...(Array.isArray(kit.revived)?kit.revived:[])])].filter(id=>id==='partner');
}
function eligible(a){return !!a&&a.id==='partner'&&(!a.mentorId||['WATCH-04','WATCH-03','WATCH-10','WATCH-07','WATCH-05','WATCH-02'].includes(a.mentorId));}
function reason(b){
 const a=b.actors[b.turn],target=b.actors.find(x=>x.id==='partner');
 if(b.phase!=='battle'||a.id!=='officer'||a.status!=='active')return 'The recruit must have an active turn.';
 if(b.budget.action<1)return 'Your main action is spent.';
 if(!b.supplies?.coffee)return 'No strong coffee remains.';
 if(!eligible(target))return 'Coffee is not suitable for this partner. Seek Watch treatment.';
 if(target.status!=='incapacitated'||target.hp!==0)return 'Your partner must be downed.';
 if(b.supplies.revived.includes(target.id))return 'Your partner has already used coffee in this incident.';
 if(b.mode!=='classic'&&Math.abs(a.x-target.x)+Math.abs(a.y-target.y)!==1)return 'Move beside your downed partner first.';
 if(b.actors.some(x=>x!==target&&['active','surrendered'].includes(x.status)&&x.x===target.x&&x.y===target.y))return 'Clear the space occupied by your downed partner first.';
 return '';
}
function revive(b){const why=reason(b);if(why)return {ok:false,reason:why};const target=b.actors.find(x=>x.id==='partner');b.budget.action=0;b.supplies.coffee--;b.supplies.revived.push(target.id);target.hp=Math.min(4,target.maxHp);target.status='active';target.guard=false;target.shaken=false;b.log.push(target.name+' comes round with strong coffee: '+target.hp+' stamina. Their normal turn still applies.');return {ok:true};}
return {coffeeItem,bandageItem,count,loadout,bind,capture,eligible,reason,revive};
});

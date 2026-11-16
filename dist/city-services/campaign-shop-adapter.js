(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QuillCampaignShop=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const specs=Object.freeze({
  'campaign-provisions-meal':{price:2,type:'meal',hp:8},
  'campaign-provisions-snack':{price:1,type:'meal',hp:3},
  'campaign-provisions-coffee':{price:6,type:'item',item:'Strong coffee',cap:2},
  'campaign-apothecary-bandages':{price:3,type:'item',item:'Bandages',cap:6},
  'campaign-apothecary-dressings':{price:6,type:'item',item:'Bandages',quantity:2,cap:6},
  'campaign-used-goods-satchel':{price:9,type:'gear',flag:'kit',item:'Investigation satchel'},
  'campaign-gimlet-meal':{price:2,type:'meal',hp:8},
  'campaign-gimlet-large-meal':{price:3,type:'meal',hp:12},
  'campaign-burleigh-balanced-truncheon':{price:12,type:'gear',flag:'club',item:'Balanced truncheon'},
  'campaign-curry-meal':{price:2,type:'meal',hp:8},
  'campaign-curry-large-meal':{price:3,type:'meal',hp:12},
  'campaign-poleforth-newspaper':{price:1,type:'newspaper'},
  'campaign-laughing-falafel-meal':{price:2,type:'meal',hp:8},
  'campaign-laughing-falafel-snack':{price:1,type:'meal',hp:3}
 });
 const clone=value=>JSON.parse(JSON.stringify(value));
 function valid(state){return !!state&&Number.isFinite(state.hp)&&Number.isFinite(state.maxhp)&&state.maxhp>0&&Number.isSafeInteger(state.coins)&&state.coins>=0&&state.flags&&Array.isArray(state.items);}
 const stockSpec=key=>typeof key==='string'&&Object.hasOwn(specs,key)?specs[key]:null;
 function stockRestriction(state,key){
  const spec=stockSpec(key);
  if(spec?.type==='gear'){
   const owned=state.flags.content&&typeof state.flags.content==='object'&&state.flags.content.gear&&typeof state.flags.content.gear==='object'&&state.flags.content.gear[spec.flag];
   const weaponOwned=spec.flag==='club'&&(state.flags.weapons?.owned?.includes('balanced-truncheon')||state.items.some(i=>['Good truncheon','Balanced truncheon'].includes(i)));
   if(owned||weaponOwned||state.items.includes(spec.item))return 'owned';
  }
  if(spec?.type==='item'&&state.items.filter(i=>i===spec.item).length+(spec.quantity||1)>spec.cap)return 'capacity';
  return null;
 }
 function purchase(state,key,options={}){
  if(!valid(state))throw Error('Invalid P21 campaign state');
  const spec=stockSpec(key);if(!spec)return {ok:false,reason:'unknown',state:clone(state)};
  const restriction=stockRestriction(state,key);
  if(restriction==='owned')return {ok:false,reason:restriction,state:clone(state)};
  if(state.coins<spec.price)return {ok:false,reason:'funds',state:clone(state)};
  if(restriction)return {ok:false,reason:restriction,state:clone(state)};
  if(spec.type==='newspaper'){
   if(typeof options.purchaseNewspaper!=='function')return {ok:false,reason:'delegate-required',state:clone(state)};
   return options.purchaseNewspaper({key,price:spec.price,state:clone(state),paper:options.paper});
  }
  const next=clone(state);
  if(spec.type==='meal'){
   if(next.hp>=next.maxhp)return {ok:false,reason:'full-health',state:next};
   next.coins-=spec.price;const before=next.hp;next.hp=Math.min(next.maxhp,next.hp+spec.hp);
   return {ok:true,state:next,receipt:{key,price:spec.price,effect:'heal',hpRestored:next.hp-before}};
  }
  if(spec.type==='item'){
   const quantity=spec.quantity||1;
   next.coins-=spec.price;for(let i=0;i<quantity;i++)next.items.push(spec.item);
   return {ok:true,state:next,receipt:{key,price:spec.price,effect:'item',item:quantity>1?quantity+' × '+spec.item:spec.item}};
  }
  next.flags.content=next.flags.content&&typeof next.flags.content==='object'?next.flags.content:{completed:{},patrols:0,storyTalks:0};
  next.flags.content.gear=next.flags.content.gear&&typeof next.flags.content.gear==='object'?next.flags.content.gear:{};
  next.coins-=spec.price;next.flags.content.gear[spec.flag]=true;if(!next.items.includes(spec.item))next.items.push(spec.item);
  return {ok:true,state:next,receipt:{key,price:spec.price,effect:'gear',item:spec.item,flag:spec.flag}};
 }
 return {purchase,valid,specs,stockRestriction};
});

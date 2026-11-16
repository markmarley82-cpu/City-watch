// Counter capabilities, not an invented stock list. Existing commerce owns prices,
// inventory and preparations; free services call the existing player interfaces.
import {hideParkCounters} from '../hide-park-counters.mjs?v=p21-b407-s039-reuse';
const definitions = {
 provisions:['goods','Food & coffee','Meals restore health; carried coffee can rouse a compatible downed partner.'],
 cobbler:['preparation','Boot fitting','Prepare one extra legal opening combat step. This does not increase city or pursuit speed.'],
 tailor:['appearance','Free fitting','Choose from your existing appearance options. There is no fitting charge or additional clothing entitlement.','Choose appearance · Free'],
 ironmonger:['visit','Trade visit · no sales','Meet the ironmonger and examine the workshop. Household tool purchases are not available.'],
 'lamp-supplier':['visit','Trade visit · no sales','Meet the supplier and examine the stock. The patrol lantern does not consume fuel; no oil purchase is required.'],
 stationer:['notebook','Free field notes','Review or write your own notes in the existing Watch Notebook. Paper and ink are not charged.','Open field notes · Free'],
 apothecary:['goods','Dressings & preparations','Buy usable combat dressings or prepare a soothing lozenge.'],
 'used-goods':['goods','Investigation equipment','The investigation satchel is a one-time equipment purchase with its existing field-treatment use.'],
 gimlet:['goods','Prepared meals','Eat at the counter to restore health.'],
 shonky:['appearance','Free fitting','Try your existing appearance options. No charge is added to the Appearance editor.','Choose appearance · Free'],
 'burleigh-stronginthearm':['goods','Watch equipment','Buy existing weapons and bolts. Watch training requirements and ownership checks still apply.'],
 'wienrich-boettcher':['visit','Trade visit · no sales','Speak to the confectioner and examine the counter. Confectionery purchases are not available.'],
 'curry-gardens':['goods','Prepared meals','Eat at the counter to restore health.'],
 boffo:['appearance','Free costume fitting','Try your existing appearance options. A cosmetic change grants no disguise or impersonation ability.','Try appearance · Free'],
 poleforth:['goods','Current newspaper','Buy and keep the current Times edition in the Watch Notebook.'],
 drayman:['visit','Trade visit · no sales','Speak to the butcher and examine the counter. Raw butcher orders are not usable provisions.'],
 'pointer-pickles':['visit','Trade visit · no sales','Visit the mineral counter. Samples and paid analysis are not available.'],
 shatta:['appearance','Free fitting','Choose from your existing appearance options. No premium clothing ownership or charge is introduced.','Choose appearance · Free'],
 ironcrust:['visit','Trade visit · no sales','Speak to the bakery staff. Dwarf bread is not sold as a generic healing item or weapon.'],
 'laughing-falafel':['goods','Night-patrol meals','Eat a prepared meal or small supper to restore health.'],
 crumleys:['visit','Trade visit · no sales','Visit the toy counter and speak to the staff. Toy purchases and gifting are not available.'],
 hugos:['appearance','Free grooming','Choose from the existing head and appearance options. The existing Appearance editor remains free.','Choose appearance · Free']
};
export const counterServices = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([key,[kind,label,copy,actionLabel]])=>[key,Object.freeze({key,kind,label,copy,action:kind==='appearance'||kind==='notebook'?kind:null,actionLabel:actionLabel||null,price:kind==='appearance'||kind==='notebook'?0:null,functional:kind!=='visit'})])));
// Preserve the original fixed catalogue; optional world-bound infill counters
// are resolved separately and only enter a directory after their door is fitted.
const infillCounters=new Map(hideParkCounters.map(r=>[r.key,Object.freeze({key:r.key,kind:'goods',label:r.label,copy:r.copy,action:null,actionLabel:null,price:null,functional:true})]));
export function counterService(key){return Object.hasOwn(counterServices,key)?counterServices[key]:infillCounters.get(key)||null;}
export function isFunctionalCounter(key){return counterService(key)?.functional===true;}
export function counterDirectory(scenes,{tradeVisits=false}={}){
 return scenes.filter(scene=>{const counter=counterService(scene.key);return counter&&(tradeVisits?counter.kind==='visit':counter.functional);});
}
// The host closes its dialog before opening another modal. These free actions do
// not accept a store, purse or purchase callback and never write campaign state.
export async function runCounterService(key,{appearance,notebook,beforeOpen}={}){
 const counter=counterService(key);
 if(!counter)return {ok:false,reason:'unknown-shop'};
 if(!counter.action)return {ok:false,reason:'no-free-service'};
 const action=counter.action==='appearance'?appearance:notebook;
 if(typeof action!=='function')return {ok:false,reason:'service-unavailable'};
 await beforeOpen?.(counter);
 const result=await action(counter.action==='notebook'?'My Notes':undefined);
 if(result===false)return {ok:false,reason:'service-unavailable'};
 return {ok:true,shopKey:key,action:counter.action,charged:0};
}

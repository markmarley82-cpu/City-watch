// Existing campaign actions only; no progression or reward writes.
export function patrolAction({pending,target,nearContact,nearDoor,binding,destinationName}){
 if(pending?.chase)return {kind:'chase',label:'Continue pursuit'};
 if(pending)return {kind:'battle',label:'Resume encounter'};
 if(nearContact)return {kind:'talk',id:nearContact.id,label:'Talk to '+nearContact.name};
 if(binding&&(target==='suspect:'+binding||target==='crypt'&&binding==='crypt-raider'))return {kind:'battle',label:'Confront the suspect'};
 if(nearDoor?.game_id===target&&!nearDoor.held)return {kind:'room',label:'Investigate '+nearDoor.name};
 return {kind:'walk',label:destinationName?'Go to '+destinationName:target?.startsWith('npc:')?'Find your contact':'Go to the investigation'};
}
export function caseProgress(s){const totals=[6,6,5],c=Math.max(0,Math.min(2,s.chapter||0)),stage=Math.max(0,Math.min(totals[c]-1,s.stage||0));return 'Case '+(c+1)+' · '+(stage+1)+'/'+totals[c];}
export function filedCase(before,after){if(!before||after.chapter<=before.chapter)return '';const merit=Math.max(0,after.merit-before.merit),coins=Math.max(0,after.coins-before.coins);return 'Case filed'+(merit?' · +'+merit+' merit':'')+(coins?' · +'+coins+' coins':'')+'. Your next assignment is ready.';}

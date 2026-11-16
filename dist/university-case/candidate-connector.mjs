// University host receiver. All event inputs here
// come from host-owned controls, never directly from an iframe message.
import {createUniversityCase01} from './case.mjs';
import {projectCase01Notebook} from './notebook.mjs';
import {contactGate,HOST_ONLY_ACTIONS} from './contact-contract.mjs';
export function createCase01({makeStore,university,isSettled=()=>false}){
 const case01=createUniversityCase01({makeStore,visit:()=>university.active()});
 function act(event,{scripted=false}={}){
  if(!isSettled())throw Error('Wait for the University position to finish saving');
  const active=university.active();
  if(!active||event.visitId!==active.id)throw Error('Stale University visit');
  if(HOST_ONLY_ACTIONS.includes(event.action)&&!scripted||
   !contactGate(university.graph,{contactID:event.contactID,action:event.action,position:active.snapshot.position}))
   throw Error('Not an authorised contact event');
  return case01.act({action:event.action,visitId:active.id,revision:event.revision});
 }
 return Object.freeze({view:case01.view,act,notebook:ordinaryRows=>projectCase01Notebook(makeStore().read().state,ordinaryRows)});
}

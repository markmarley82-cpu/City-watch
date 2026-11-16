/* Isolated player-art receiver. Does not install or replace the shared NPC rig. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.CWRaceEquipmentFit=api;})(globalThis,function(root){
'use strict';
function create(manifest,options={}){
 const {engine=root.CWFittedEquipment,...settings}=options;
 if(!engine?.create)throw Error('Existing fitted equipment compositor required');
 const fit=engine.create(manifest,settings);
 const form=body=>body?.equipmentForm||body?.form;
 const hidden=body=>manifest.suppressedForms.includes(form(body))||manifest.suppressedBodyHashes.includes(body?.sha256);
 const allowed=(id,piece)=>piece==='original'||!!manifest.rigs[id]?.allowedPieces.includes(piece);
 const prepared=body=>({...body,weaponType:body.equipmentVariant||body.weaponType||'base'});
 function check(id,piece,body){if(!allowed(id,piece))throw Error('Equipment material not received for this recruit');return body?prepared(body):body;}
 return {
  manifest,
  supports:id=>fit.supports(id),
  selected:id=>fit.selected(id),
  select:(id,piece)=>allowed(id,piece)&&fit.select(id,piece),
  async ensure(id,piece,body){if(hidden(body))return true;return fit.ensure(id,piece,check(id,piece,body));},
  ready(id,piece,body){if(hidden(body)||!allowed(id,piece))return false;return fit.ready(id,piece,prepared(body));},
  layer(id,body,pose,frame){
   if(hidden(body))return null;
   const piece=fit.choice(id,pose);
   if(!allowed(id,piece))return null;
   const b=prepared(body),variant=manifest.rigs[id]?.variants[b.weaponType];
   const clip=variant?.partClipMap?.[pose.clip]||pose.clip;
   return fit.layer(id,b,{...pose,clip},frame);
  },
  report:()=>({...fit.report(),playerOnly:true,sourceHashGuard:true,hiddenFormsRetainSelection:true,installedInMainBuild:false})
 };
}
return {create};
});

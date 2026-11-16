/* One identity from patrol briefing through map, encounter and debrief. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./cw-patrol-mentors.js'):root.BastionMentors);if(typeof module==='object'&&module.exports)module.exports=api;else root.CWPatrolPartner=api;})(globalThis,function(M){
'use strict';
function assignment(state,pending){const a=pending?.partnerAssignment||state.flags?.patrolMentorAssignment||{version:1,mentorId:'WATCH-04'};if(!M.valid(a))throw Error('Unknown patrol partner assignment; choose a known officer in Watch duty.');return M.assignment(a)}
function member(state,pending){return M.get(assignment(state,pending).mentorId)}
function bind(battle,state,pending){const a=assignment(state,pending),actor=battle.actors.find(x=>x.id==='partner');if(!actor)throw Error('Encounter partner slot missing');if(actor.mentorId){if(!M.matches(battle,a))throw Error('Encounter partner identity or kit does not match its saved assignment');actor.name=M.get(a.mentorId).name;return battle;}
 const wasLegacy=!!pending?.battle,ratio=wasLegacy?actor.hp/actor.maxHp:null,status=actor.status;M.bind(battle,a);const m=M.get(a.mentorId),v=state.flags?.patrolPartnerVitals?.[m.id];if(wasLegacy){actor.hp=Math.max(0,Math.min(m.maxHp,Math.ceil(ratio*m.maxHp)));actor.status=status;}else if(v){actor.hp=Math.max(0,Math.min(m.maxHp,Number(v.hp)||0));actor.status=actor.hp>0?'active':'incapacitated';}return battle;}
function record(state,battle){const a=battle.actors.find(x=>x.id==='partner');if(!a?.mentorId)return;const m=M.get(a.mentorId);if(!m)return;state.flags.patrolPartnerVitals={...state.flags.patrolPartnerVitals,[m.id]:{hp:Math.max(0,Math.min(m.maxHp,a.hp)),maxHp:m.maxHp,status:a.hp>0?'active':'incapacitated'}};}
return {assignment,member,bind,record,art:id=>{const m=M.get(id);return m?'mentor-'+m.key:null},roster:M.roster};
});

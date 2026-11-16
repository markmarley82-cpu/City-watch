const FIRST_PATROL_FLAG='firstPatrolBriefingVersion';

export function patrolReportMessage(record,filed){
 if(filed?.shift)return 'Shift filed, '+filed.pay+' coins paid.'+(filed.promotion?' Promoted to '+filed.promotion+'.':'')+' Rest or resupply before the next shift.';
 const flags=record?.state?.flags||{};
 const firstPatrol=record?.state?.chapter===0&&record?.state?.stage===0&&
  !!flags[FIRST_PATROL_FLAG]&&Number(flags.p21PatrolRounds?.completed)===1;
 return firstPatrol?
  'Patrol reported to Sergeant Colon. Speak to Colon again for your first Watch case.':
  'Patrol reported to Sergeant Colon. Your round is recorded in the patrol log.';
}

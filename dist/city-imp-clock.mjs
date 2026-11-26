// Presentation follows the saved campaign clock; it never advances or saves time.
export function impMood(time){
 const hour=Number(String(time).split(':')[0]);
 return hour>=3&&hour<6?'exhausted':hour>=0&&hour<3?'tired':'alert';
}
// On-demand guidance from the existing saved job, never an automatic alert or answer.
export function organiserBriefing(record={},context={}){
 const s=record.state||{},round=s.flags?.p21PatrolRounds?.active,view=context.dutyView;
 const lead=String(context.objective||'Check your current assignment in the Notebook.');
 let reminder='Use your current assignment action to follow the next lead. Your recorded evidence is in the Notebook.';
 if(record.pending)reminder=record.pending.chase?'Finish the current pursuit before changing duty. Resume it from your assignment action.':'Resume the current encounter before starting another job. Your incident is still open.';
 else if(round&&view){
  if(view.firstCase)reminder=view.openingReminder;
  else if(view.delivery)reminder='Review the delivery case for your leads and recorded evidence. Captain Carrot takes the report in Watch Square.';
  else if(view.action==='book')reminder='Hand over the suspect, then file your shift report with Colon.';
  else if(view.action==='report')reminder='File your report with Colon. Preparing evidence alone does not close the shift or pay you.';
  else if(view.action==='menu')reminder='Open Night duty to review the saved route before continuing.';
  else if(round.index===round.checkpoints?.length)reminder=round.licence?.outcome==='escort'?'Escort the suspect back to the Watch House, then hand them over before filing.':'Return to Sergeant Colon to file the completed round.';
  else if(round.enquiry)reminder='Inspect the scene and compare witness accounts before choosing a finding. Collected observations are in the Notebook.';
  else if(round.visits?.some(v=>v.enquiry))reminder='Your enquiry is prepared. Finish the remaining checkpoints, then return to Colon to file it.';
  else reminder='Follow the marked checkpoint and check the area. Return to Colon after completing the round.';
 }else if(s.chapter===0&&s.stage===0&&/Captain Carrot/.test(lead))reminder='Captain Carrot is waiting outside the Watch House: tap Walk to Captain Carrot. You can also choose Night duty for another shift.';
 else if(s.chapter===0&&s.stage<=1)reminder='Use Walk to current assignment in Duty, then speak to Sergeant Colon outside the Watch House.';
 else if(s.chapter===0&&s.stage===2)reminder='At the Dock Warehouse, open Room actions and choose False-bottom crate to walk over and inspect it.';
 else if(s.chapter>=2&&s.stage>=4)reminder='Choose Night duty and return to the Watch duty desk to sign on at 21:00.';
 return {lead,reminder};
}
export function impClockModel(clock){
 const [hour,minute]=clock.time.split(':').map(Number);
 const time=`${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'am':'pm'}`;
 return {mood:impMood(clock.time),text:time,
  label:`Dis-organiser, ${time}. ${impMood(clock.time)} imp. ${clock.preview?'Lighting preview. ':''}Tap once to open; tap again for patrol actions.`};
}
export function updateImpClock(button,clock){
 if(!button?.querySelector)return;
 const output=button.querySelector('output');if(!output)return;
 const model=impClockModel(clock);
 if(button.dataset.time!==clock.time)button.dataset.time=clock.time;
 if(button.dataset.mood!==model.mood)button.dataset.mood=model.mood;
 if(output.textContent!==model.text)output.textContent=model.text;
 if(button.getAttribute('aria-label')!==model.label)button.setAttribute('aria-label',model.label);
}

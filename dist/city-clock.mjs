// Device time is used only by standalone lighting previews and to measure elapsed time.
export function clockPhase(date=new Date()){
 const h=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
 const smooth=t=>t*t*(3-2*t);
 const darkness=h<6||h>=19?1:h<7?1-smooth(h-6):h<18?0:smooth(h-18);
 const phase=h<6||h>=19?'Night':h<7?'Dawn':h<18?'Day':'Dusk';
 return {phase,darkness,time:String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0'),basis:'Device local time'};
}
export function shadeNight(ctx,width,height,darkness){
 if(darkness<=0)return;
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.78*Math.min(1,darkness);ctx.fillStyle='#182943';ctx.fillRect(0,0,width,height);ctx.restore();
}

// Explicit review URL for fixed lighting comparisons.
export function reviewClock(search,now=new Date()){
 const mode=new URLSearchParams(search).get("lighting-preview");
 if(!["day","night"].includes(mode))return clockPhase(now);
 const sample=new Date(now);sample.setHours(mode==="night"?0:12,0,0,0);
 return {...clockPhase(sample),preview:true,basis:"Lighting review only"};
}

const DUTY_HOUR=21;
const OPENING_HOUR=20;
const validAnchor=clock=>Number.isFinite(clock?.at)&&Number.isFinite(clock?.real);

function openingClock(state,now){
 const rest=state?.flags?.lastLodgingRest;
 if(Number.isFinite(rest?.nextDutyAt)&&Number.isFinite(rest?.at))return {at:rest.nextDutyAt,real:rest.at};
 const city=new Date(now);
 city.setHours(OPENING_HOUR,0,0,0);
 return {at:city.getTime(),real:now};
}

export function initializeCityClock(state,now=Date.now()){
 if(validAnchor(state.flags.watchShiftClock)||validAnchor(state.flags.preDutyClock))return state;
 return {...state,flags:{...state.flags,preDutyClock:openingClock(state,now)}};
}

export function dutyTime(state,now=Date.now()){
 const {watchShiftClock,preDutyClock}=state?.flags||{};
 const clock=validAnchor(watchShiftClock)?watchShiftClock:validAnchor(preDutyClock)?preDutyClock:openingClock(state,now);
 // One game minute passes per real second, including before the first shift.
 return new Date(clock.at+Math.max(0,now-clock.real)*60);
}

export function shiftClock(state,onDuty,now=Date.now()){
 const current=dutyTime(state,now);
 let city=new Date(current);
 if(onDuty){
  // Signing on waits for the next 21:00, including late-night arrivals.
  city.setHours(DUTY_HOUR,0,0,0);
  if(city.getTime()<current.getTime())city.setDate(city.getDate()+1);
 }else{
  // An early report finishes at dawn; a late report keeps the current time.
  const start=state?.flags?.watchShiftClock?.at;
  const dawn=new Date(Number.isFinite(start)?start:current.getTime());
  dawn.setHours(6,0,0,0);
  if(dawn.getTime()<=(Number.isFinite(start)?start:current.getTime()))dawn.setDate(dawn.getDate()+1);
  city=new Date(Math.max(current.getTime(),dawn.getTime()));
 }
 return {onDuty,at:city.getTime(),real:now};
}

export function campaignClock(search,state,now=Date.now()){
 const view=reviewClock(search,dutyTime(state,now));
 return view.preview?view:{...view,basis:'City time',night:state?.night};
}

// Sample once per real second, matching the street clock update without
// reading or decoding the campaign save on every interior animation frame.
export function createInteriorLightingClock(readState,readSearch){
 let previousSecond=null,previousSearch=null,view;
 return (now=Date.now())=>{
  const second=Math.floor(now/1000),search=readSearch();
  if(second!==previousSecond||search!==previousSearch){
   view=campaignClock(search,readState(),now);
   previousSecond=second;previousSearch=search;
  }
  return view;
 };
}

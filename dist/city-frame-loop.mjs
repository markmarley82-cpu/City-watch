// A visible embedded WebView may withhold animation callbacks. Race each one
// with the existing 30Hz phone cadence, cancelling the loser so there is only
// one loop. Count from the start of the previous callback so paint cost does
// not stretch every timer-driven frame when animation callbacks are sparse.
export function createCityFrameLoop({paint,fail,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now(),hidden=()=>document.hidden,fallbackMS=1000/30}){
 let running=false,raf=null,timer=null,generation=0,frames=0,fallbacks=0,lastError=null;
 function clear(){if(raf!==null)cancel(raf);if(timer!==null)clearTimer(timer);raf=timer=null;}
 function stop(){running=false;generation++;clear();}
 function schedule(deadline=now()+fallbackMS){const token=++generation;let delivered=false;
  const deliver=(time,fallback)=>{if(!running||delivered||token!==generation)return;delivered=true;clear();
   const nextDeadline=now()+fallbackMS;
   try{if(!hidden()){paint(time);frames++;if(fallback)fallbacks++;}}catch(error){lastError=String(error?.message||error);stop();fail(error);return;}
   if(running&&token===generation)schedule(nextDeadline);
  };
  raf=request(time=>deliver(time,false));timer=setTimer(()=>deliver(now(),true),Math.max(0,Math.ceil(deadline-now())));
 }
 return {start(){if(running)return;running=true;schedule();},stop,report:()=>({running,frames,fallbacks,lastError,fallbackMS})};
}

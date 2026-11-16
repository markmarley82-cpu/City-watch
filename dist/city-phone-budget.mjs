const TRANSPARENT_PIXEL='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

// Keep input and movement on the browser clock while bounding expensive city
// painting on memory-constrained phones. Source paintings are discarded only
// after their retained reduced canvas has been drawn.
export function createPhoneBudget({enabled=false,paintFPS=30}={}){
 const interval=1000/paintFPS,released=new WeakSet();
 let nextPaint=-Infinity,painted=0,skipped=0,releasedSources=0;
 function shouldPaint(now,{force=false}={}){
  if(!enabled||force){nextPaint=now+interval;painted++;return true;}
  if(now>=nextPaint-0.01){
   // Keep the original cadence when a callback arrives late. Restarting the
   // interval at each actual paint can halve drawing at33ms callback spacing.
   // Skip missed deadlines in one operation; never burst through old paints.
   nextPaint=Number.isFinite(nextPaint)?nextPaint+(Math.floor(Math.max(0,now+0.01-nextPaint)/interval)+1)*interval:now+interval;
   painted++;return true;
  }
  skipped++;return false;
 }
 function releaseSource(image){
  if(!enabled||!image||released.has(image))return false;
  released.add(image);
  // Detach loader callbacks before src changes so queue completion cannot run twice.
  try{image.cwOriginalSource=image.currentSrc||image.src||image.cwOriginalSource;image.onload=null;image.onerror=null;image.src=TRANSPARENT_PIXEL;releasedSources++;return true;}catch{return false;}
 }
 return Object.freeze({shouldPaint,releaseSource,report:()=>({enabled,paintFPS:enabled?paintFPS:null,paintIntervalMs:enabled?interval:null,painted,skipped,releasedSources})});
}

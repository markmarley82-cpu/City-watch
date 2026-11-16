// Bound city layout/manifest requests, including response-body reads. A stalled
// fetch must not leave startup awaiting forever; no storage or content changes.
export function createCityJSONLoader({fetchJSON=fetch,setTimer=setTimeout,clearTimer=clearTimeout,timeoutMS=20000}={}){
 return async function read(path){
  const controller=new AbortController();let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimer(()=>{controller.abort();reject(Error('City data timed out after '+Math.round(timeoutMS/1000)+' seconds: '+path));},timeoutMS);});
  const request=Promise.resolve().then(async()=>{
   const response=await fetchJSON(path.includes('?')?path:path+'?v=p21-b28-dense-river',{signal:controller.signal});
   if(!response.ok)throw Error('City data could not load (HTTP '+response.status+'): '+path);
   return response.json();
  });
  try{return await Promise.race([request,timeout]);}
  finally{clearTimer(timer);}
 };
}

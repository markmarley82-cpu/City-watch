// A brief pause gives transient network failures time to clear. Healthy loads never wait.
const RETRY_DELAYS_MS=Object.freeze([300,1200]);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function queueImageWithRetry(queueImage,path,url,{retries=RETRY_DELAYS_MS.length,onRetry=()=>{},wait=pause}={}){
 let attempt=0,current=url;
 for(;;){
  try{return await queueImage(path,current)}catch(error){
   if(attempt>=retries)throw error;
   attempt++;
   const delayMs=RETRY_DELAYS_MS[Math.min(attempt-1,RETRY_DELAYS_MS.length-1)];
   onRetry({path,url:current,attempt,error,delayMs});
   await wait(delayMs);
   const retryURL=new URL(url);
   retryURL.searchParams.set('cw-retry',String(attempt));
   current=retryURL.href;
  }
 }
}

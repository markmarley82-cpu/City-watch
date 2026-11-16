export async function queueImageWithRetry(queueImage,path,url,{retries=1,onRetry=()=>{}}={}){
 let attempt=0,current=url;
 for(;;){
  try{return await queueImage(path,current)}catch(error){
   if(attempt>=retries)throw error;
   attempt++;
   onRetry({path,url:current,attempt,error});
   const retryURL=new URL(url);
   retryURL.searchParams.set('cw-retry',String(attempt));
   current=retryURL.href;
  }
 }
}

// Observe the original failing canvas call. Never suppress it or change pixels.
export function installCityImageDiagnostics({prototype=CanvasRenderingContext2D.prototype,onFailure=()=>{}}={}){
 const prior=prototype.drawImage;
 function drawImage(image,...args){
  try{return prior.call(this,image,...args);}
  catch(cause){
   const isImage=image&&typeof image.naturalWidth==='number';
   if(!isImage||!(cause?.name==='InvalidStateError'||/HTMLImageElement.*broken/i.test(cause?.message||'')))throw cause;
   const raw=image.cwOriginalSource||image.currentSrc||image.src||'(no source)';
   let path=raw;
   try{const url=new URL(raw);path=url.protocol==='data:'?'(released data image)':url.pathname;}catch{}
   const details={path,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
    canvasWidth:this.canvas?.width,canvasHeight:this.canvas?.height,stack:String(cause.stack||'')};
   const error=Error('Image draw failed: '+path+' · '+details.naturalWidth+'×'+details.naturalHeight+' · '+(image.complete?'complete':'still loading'),{cause});
   error.name='CityImageDrawError';error.imageFailure=details;
   try{onFailure(details);}catch{}
   throw error;
  }
 }
 prototype.drawImage=drawImage;
 return ()=>{if(prototype.drawImage===drawImage)prototype.drawImage=prior;};
}

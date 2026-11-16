/* P20 Gate-B M3/M4 isolated render trial. Existing source draw paths only; no map/collider/save changes. */
(function(){
 const watch=new Image(), fountain=new Image();
 watch.src='assets/p20-gateb-m34/M3_watch_full_substantial_candidate_RGBA.webp';
 fountain.src='assets/p20-gateb-m34/M4_fountain_source_graded_FULL_RGBA.exact.webp';
 const state={enabled:true,watchCalls:0,watchReplacements:0,fountainCalls:0,fountainReplacements:0};
 const prior=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(...a){
  if(a.length===9){
   // Existing P6 civic:0 Watch crop draw. Keep original destination, y-sort and P6 fade path.
   if(a[1]>13&&a[1]<14&&a[2]>1&&a[2]<2.5&&a[3]>352&&a[3]<354&&a[4]>300&&a[4]<303&&a[7]>220&&a[7]<290){
    state.watchCalls++;
    if(state.enabled&&watch.complete&&watch.naturalWidth===399&&watch.naturalHeight===341){state.watchReplacements++;return prior.call(this,watch,a[5],a[6],a[7],a[8]);}
   }
   // Existing P5 pseudopolis_yard_lion_fountain atlas crop. Keep original destination and scene order.
   if(Math.abs(a[1]-863)<1&&Math.abs(a[2]-737)<1&&Math.abs(a[3]-242)<1&&Math.abs(a[4]-211)<1){
    state.fountainCalls++;
    if(state.enabled&&fountain.complete&&fountain.naturalWidth===242&&fountain.naturalHeight===211){state.fountainReplacements++;return prior.call(this,fountain,a[5],a[6],a[7],a[8]);}
   }
  }
  return prior.apply(this,a);
 };
 window.CW_P20_GATEB_M34={
  version:'BUDDY-GATEB-M134-U04-v0.1',
  setEnabled(v){state.enabled=!!v;return state.enabled;},
  report(){return {enabled:state.enabled,watchReady:watch.naturalWidth===399&&watch.naturalHeight===341,fountainReady:fountain.naturalWidth===242&&fountain.naturalHeight===211,...state,renderPolicy:'Full M3/M4 source-sized substitutions on original P6/P5 draw paths only; split foreground lanes disabled.',mapChanged:false,collisionChanged:false,saveChanged:false};}
 };
})();

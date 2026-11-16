/* Preview-only registration and clock. Runtime character sizes are unchanged. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWRecruitPreview=api;})(globalThis,function(){
'use strict';const cache=new WeakMap();
function envelope(meta,image,physical,makeCanvas=()=>document.createElement('canvas')){
 const key=[meta.cellWidth,meta.cellHeight,meta.footX,meta.footY,meta.visibleHeight,physical].join(':'),prior=cache.get(image);if(prior?.key===key)return prior.box;
 const canvas=makeCanvas();canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const pixels=g.getImageData(0,0,canvas.width,canvas.height).data;let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>32){const px=x%meta.cellWidth-meta.footX,py=y%meta.cellHeight-meta.footY;l=Math.min(l,px);r=Math.max(r,px+1);t=Math.min(t,py);b=Math.max(b,py+1);}
 if(!Number.isFinite(l))throw Error('Empty recruit preview');const scale=physical/meta.visibleHeight,box={left:(l-2)*scale,right:(r+2)*scale,top:(t-2)*scale,bottom:(b+2)*scale};cache.set(image,{key,box});return box;
}
function union(boxes){return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};}
function layout(box,reference,width,height,mode='fit',compare=false){
 const pad=12,top=Math.min(box.top,compare?reference.top:box.top),bottom=Math.max(box.bottom,compare?reference.bottom:box.bottom),span=compare?width*.62:width-2*pad;
 let zoom=Math.min((height-2*pad)/(bottom-top),(span-2*pad)/(box.right-box.left));if(compare)zoom=Math.min(zoom,(width*.30-2*pad)/(reference.right-reference.left));if(mode==='1')zoom=Math.min(1,zoom);zoom=Math.max(.01,zoom);
 return {zoom,floor:height-pad-bottom*zoom,mainX:(compare?width*.32:width*.5)-(box.left+box.right)*zoom/2,referenceX:width*.82-(reference.left+reference.right)*zoom/2};
}
function phase(spec,elapsed=0,manual){const tick=Number.isFinite(manual)?Math.max(0,Math.floor(manual)):Math.floor(Math.max(0,elapsed)/spec.frameMS);return spec.loop?tick%spec.count:Math.min(spec.count-1,tick);}
function step(spec,elapsed,manual,delta){return (phase(spec,elapsed,manual)+delta+spec.count)%spec.count;}
return {envelope,union,layout,phase,step};
});

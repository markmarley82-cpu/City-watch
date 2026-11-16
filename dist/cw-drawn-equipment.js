/* Equipment registration for existing painted poses. Body pixels never move. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWDrawnEquipment=api;})(globalThis,function(){
'use strict';
function validate(fit,body,part){
 if(fit.bodyHash!==body.sha256||fit.partHash!==part.sha256)throw Error('Artwork changed: refit required');
 if(!Number.isInteger(fit.frame)||fit.frame<0||fit.frame>=body.frames||!Number.isInteger(fit.partFrame)||fit.partFrame<0||fit.partFrame>=part.frames)throw Error('Invalid pose');
 if(![fit.x,fit.y,fit.scale,fit.angle].every(Number.isFinite)||fit.scale<=0||fit.scale>20)throw Error('Invalid equipment transform');
 if(!Array.isArray(fit.front)||fit.front.some(poly=>!Array.isArray(poly)||poly.length<3||poly.some(p=>!Array.isArray(p)||p.length!==2||p.some((v,i)=>!Number.isFinite(v)||v<0||v>[body.cellWidth,body.cellHeight][i]))))throw Error('Invalid foreground mask');
 return true;
}
function draw(g,bodyImage,partImage,body,part,fit,{facing=-1,maskImage=null,makeCanvas=null}={}){
 validate(fit,body,part);const w=body.cellWidth,h=body.cellHeight,bx=fit.frame%body.cols*w,by=Math.floor(fit.frame/body.cols)*h,px=fit.partFrame%part.cols*part.cellWidth,py=Math.floor(fit.partFrame/part.cols)*part.cellHeight;
 g.save();try{if(facing>0){g.translate(w,0);g.scale(-1,1)}g.drawImage(bodyImage,bx,by,w,h,0,0,w,h);
 let equipment=g,buffer=null;if(maskImage){buffer=makeCanvas?makeCanvas(w,h):typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});equipment=buffer.getContext('2d');}
 equipment.save();try{equipment.translate(fit.x,fit.y);equipment.rotate(fit.angle);equipment.scale(fit.scale,fit.scale);if(part.sourceAtlas){const [x,y,w,h]=part.sourceCoordinates[fit.partFrame];equipment.drawImage(partImage,x,y,w,h,-w/2,-h,w,h)}else equipment.drawImage(partImage,px,py,part.cellWidth,part.cellHeight,-part.pivot[0],-part.pivot[1],part.cellWidth,part.cellHeight)}finally{equipment.restore()}
 if(buffer){equipment.globalCompositeOperation='destination-in';equipment.drawImage(maskImage,bx,by,w,h,0,0,w,h);g.drawImage(buffer,0,0)}
 if(fit.front.length){g.save();try{g.beginPath();for(const polygon of fit.front){polygon.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath()}g.clip();g.drawImage(bodyImage,bx,by,w,h,0,0,w,h)}finally{g.restore()}}
 }finally{g.restore()}return {frame:fit.frame,partFrame:fit.partFrame,bodyGeometryUnchanged:true};
}
function complete(records,body,part){if(records.length!==body.frames)return false;const frames=new Set();for(const f of records){validate(f,body,part);if(!f.reviewed||frames.has(f.frame))return false;frames.add(f.frame)}return frames.size===body.frames}
return Object.freeze({version:1,validate,draw,complete});
});

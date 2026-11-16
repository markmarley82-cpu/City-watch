/* Registered painted-pose player. Never deforms the body, head or garments. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWActionFrames=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-action-frames.js');}})(globalThis,function(){
'use strict';
const clips=Object.freeze({idle:{frames:4,ms:220,loop:true},walk:{frames:8,ms:95,loop:true},attack:{frames:8,ms:75,loop:false,impact:4},guard:{frames:4,ms:100,loop:false},hit:{frames:4,ms:90,loop:false},down:{frames:6,ms:110,loop:false},shove:{frames:6,ms:90,loop:false},restrain:{frames:6,ms:110,loop:false},surrender:{frames:6,ms:130,loop:false}});
const order=Object.freeze(['back','body','trousers','boots','coat','head','headFront','helmet','badge','weapon']);
let config=null;const registered=new Map(),active=new Map(),fields=['id','cellWidth','cellHeight','cols','rows','frames','footX','footY','visibleHeight','clips','nativeFacing','frameMS','p3Full'];
const now=()=>typeof performance!=='undefined'?performance.now():0;
function configure(value){config=value;/* Historical mesh descriptions are provenance only. */}
function rig(meta){return config?.rigs?.[meta.id]||null;}
function register(meta,spec){
 if(!meta?.id||!spec||!clips[spec.action]||![-1,1].includes(spec.facing)||!['drawn-poses','supplied-frames'].includes(spec.provenance)||!spec.source)throw Error('Painted clip needs action, facing and provenance');
 if(!Number.isInteger(spec.count)||spec.count<2||!Number.isFinite(spec.frameMS)||spec.frameMS<16||!Number.isFinite(spec.visibleHeight)||spec.visibleHeight<=0)throw Error('Invalid clip timing or count');
 if(![spec.cellWidth,spec.cellHeight].every(n=>Number.isInteger(n)&&n>0)||!Number.isInteger(spec.cols)||spec.cols<1||!Array.isArray(spec.pivot)||spec.pivot.length!==2||spec.pivot.some((n,i)=>!Number.isFinite(n)||n<0||n>[spec.cellWidth,spec.cellHeight][i]))throw Error('Invalid clip registration');
 if(!Array.isArray(spec.layers)||!spec.layers.some(p=>p.slot==='body')||spec.layers.some(p=>!order.includes(p.slot)||!p.image||p.image.complete===false||(p.image.naturalWidth||p.image.width)!==spec.cellWidth*spec.cols||(p.image.naturalHeight||p.image.height)!==spec.cellHeight*Math.ceil(spec.count/spec.cols)))throw Error('Painted layers must share the frame grid');
 const keys=new Set();for(const p of spec.layers){const key=p.slot+':'+(p.choice||'original');if(keys.has(key))throw Error('Duplicate painted layer');keys.add(key);}
 if(spec.events&&spec.events.some(e=>!Number.isInteger(e.frame)||e.frame<0||e.frame>=spec.count||typeof e.type!=='string'))throw Error('Invalid event frame');
 const key=meta.id+':'+spec.action+':'+spec.facing,images=new Set(spec.layers.map(p=>p.image));for(const [id,clip]of registered)if(id!==key)for(const p of clip.layers)images.add(p.image);if([...images].reduce((n,im)=>n+(im.naturalWidth||im.width)*(im.naturalHeight||im.height)*4,0)>16*1024*1024)throw Error('Release inactive painted clips before loading more');
 registered.set(key,{...spec,pivot:spec.pivot.slice(),layers:spec.layers.map(p=>({...p})),registration:Object.fromEntries(fields.map(k=>[k,JSON.stringify(meta[k])]))});return true;
}
function candidate(meta,action,facing){const s=registered.get(meta.id+':'+action+':'+(facing>0?1:-1));return s&&fields.every(k=>s.registration[k]===JSON.stringify(meta[k]))?s:null;}
function compatible(s,pose,meta){
 if(!s)return null;const head=pose.head===true?(globalThis.CWHeads?.selected(meta.id)||'original'):(pose.head||'original'),outfit=pose.clothing===true?globalThis.CWClothing?.selected(meta.id):pose.clothing;
 const chosen=s.layers.filter(p=>(p.choice||'original')===(p.slot==='head'?head:outfit?.[p.slot]||'original'));
 if(!chosen.some(p=>p.slot==='body'))return null;
 if(s.fullBody){if(head!=='original'||Object.values(outfit||{}).some(v=>v!=='original'))return null;}
 else{if(head!=='original'&&!chosen.some(p=>p.slot==='head'))return null;for(const [slot,value]of Object.entries(outfit||{}))if(value!=='original'&&!chosen.some(p=>p.slot===slot&&(p.choice||'original')===value))return null;}
 return chosen.sort((a,b)=>order.indexOf(a.slot)-order.indexOf(b.slot));
}
function available(meta,pose={}){return Object.keys(clips).filter(a=>['idle','walk'].includes(a)||!!compatible(candidate(meta,a,pose.facing||-1),pose,meta));}
function info(meta,pose={}){const s=candidate(meta,pose.clip,pose.facing||-1);return compatible(s,pose,meta)?{count:s.count,frameMS:s.frameMS,loop:!!s.loop}:null;}
function unregister(meta,action,facing){return registered.delete(meta.id+':'+action+':'+(facing>0?1:-1));}
function coverage(meta){return Object.keys(clips).map(action=>({action,left:!!candidate(meta,action,-1),right:!!candidate(meta,action,1),source:['idle','walk'].includes(action)?'legacy source atlas':'registered painted clip required'}));}
function play(actor,action,at=now()){if(!clips[action]||['walk','idle'].includes(action))return false;active.set(String(actor),{action,at});while(active.size>128)active.delete(active.keys().next().value);return true;}
function poseFor(actor,pose={},at=now(),meta){const state=active.get(String(actor));if(!state)return pose;const c=clips[state.action],painted=meta?info(meta,{...pose,clip:state.action}):null,elapsed=at-state.at;if(elapsed>=(painted?painted.count*painted.frameMS:c.frames*c.ms)){active.delete(String(actor));return pose;}return {...pose,clip:state.action,elapsed:Math.max(0,elapsed),frame:undefined};}
function render(g,meta,image,pose={},x,y,drawHeight){
 const spec=candidate(meta,pose.clip,pose.facing||-1),layers=compatible(spec,pose,meta);if(!layers)return null;
 const scale=(drawHeight??meta.renderHeight??60)/spec.visibleHeight;if(!Number.isFinite(scale)||scale<=0||![x,y].every(Number.isFinite))return null;
 const tick=pose.reduced?0:Number.isFinite(pose.frame)?Math.max(0,Math.floor(pose.frame)):Math.floor(Math.max(0,pose.elapsed||0)/spec.frameMS),frame=spec.loop?tick%spec.count:Math.min(spec.count-1,tick),sx=frame%spec.cols*spec.cellWidth,sy=Math.floor(frame/spec.cols)*spec.cellHeight;
 g.save();try{g.translate(x,y);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';for(const p of layers)g.drawImage(p.image,sx,sy,spec.cellWidth,spec.cellHeight,-spec.pivot[0]*scale,-spec.pivot[1]*scale,spec.cellWidth*scale,spec.cellHeight*scale);}finally{g.restore();}
 return {index:frame,frame,sx,sy,sw:spec.cellWidth,sh:spec.cellHeight,facing:spec.facing,flip:false,available:true,clip:pose.clip,action:pose.clip,loop:!!spec.loop,painted:true,source:spec.source,impact:spec.events?.some(e=>e.type==='impact'&&e.frame===frame)||false};
}
return Object.freeze({version:'2.0-painted-only',clips,order,configure,rig,register,unregister,info,available,coverage,play,poseFor,render,report:()=>({registeredClips:registered.size,active:active.size,meshDeformation:false,maxRegisteredImageBytes:16*1024*1024})});
});

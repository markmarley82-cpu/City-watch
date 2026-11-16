import {sampleLampMood} from './city-light-mood.mjs?v=p21-b407-s039-reuse';
import {lightRegistration} from './city-light-registration.mjs?v=p21-b407-s039-reuse';
// Candle/lamplight presentation only. Authored windows follow retained source pixels.
// No building, clock, navigation, interaction or save authority.
export const WINDOW_ANCHORS=Object.freeze({
 'UU-SHOPLANE-001:paperbinders-home':[[91,205],[176,227],[230,250],[286,277],[166,325,164,380],[225,350,220,407],[66,266,75,324]],
 'UU-SHOPLANE-001:candle-makers-home':[[72,159],[138,175],[169,190],[300,200],[77,246,85,303],[147,275,150,333],[187,296,190,356]],
 'UU-SHOPLANE-001:stone-bindery-corner':[[125,178],[192,200],[236,226],[328,234],[195,299,190,352],[376,304,385,358],[198,135]],
 'UU-SHOPLANE-001:instrument-repair-home':[[154,162],[114,238],[249,247],[332,287],[456,243],[323,338,321,395]],
 'SHADES-001:cobbler':[[169,126],[289,134],[172,215,178,278],[251,219,255,282],[137,197,130,262]]
});
export function createWindowLighting({createCanvas=()=>document.createElement('canvas'),anchors=null,resolutionScale=.5}={}){
 let viewCamera={x:0,y:0},viewZoom=1;
 const actorContexts=new WeakMap(),budget=64,windowReserve=32,maxPixels=2031616;let actorRects=[],actorUnknown=false,actorPixelRatio=1,actorSkippedOccluders=0,actorMaskDraws=0;let layer=null,g=null,poolLayer=null,pg=null,actorLayer=null,ag=null,night=0,used=0,authored=0,occluders=0,spills=0,selected=new Map(),lightBounds=[],width=0,height=0;
 const registrationCache=new WeakMap();let sceneCoverage=null,receiver=null,receiverContext=null,facadeReceivers=0,facadeTiles=0,detailTransform=null,playerLantern=null,supplementalWindows=0,lampAnimationEnabled=false,reduceMotion=false,moodCounts={},minModulation=1,maxModulation=1;
 function registration(o){if(!registrationCache.has(o))registrationCache.set(o,lightRegistration(o,anchors));return registrationCache.get(o);}
 function points(o){return registration(o).points;}
 function radial(target,x,y,r,alpha,flat=1,colors=null){target.save();target.translate(x,y);target.scale(1,flat);target.globalAlpha=Math.max(0,Math.min(1,alpha));target.globalCompositeOperation='source-over';const f=target.createRadialGradient(0,0,0,0,0,r);f.addColorStop(0,colors?.[0]||'rgba(255,211,125,1)');f.addColorStop(.3,colors?.[1]||'rgba(255,176,68,.58)');f.addColorStop(1,colors?.[2]||'rgba(246,153,51,0)');target.fillStyle=f;target.fillRect(-r,-r,r*2,r*2);target.restore();}
 function placed(o,p){return{x:o.bounds[0]+p.x*o.scale,y:o.bounds[1]+p.y*o.scale};}
 return {
  registerScene(objects){const counts={total:0,lit:0,unlit:0,excluded:0,unregistered:[],sourceSizeChanged:[]};for(const o of objects){const r=registration(o);if(r.status==='excluded'){counts.excluded++;continue;}counts.total++;if(r.status==='lit')counts.lit++;else if(r.status==='unlit')counts.unlit++;else if(r.status==='source-size-changed')counts.sourceSizeChanged.push(r.key);else counts.unregistered.push(r.key);}sceneCoverage=counts;return counts;},
  beginFrame(darkness=0,view={}){
   actorRects=[];actorUnknown=false;actorSkippedOccluders=actorMaskDraws=0;actorPixelRatio=view.pixelRatio||1;facadeReceivers=facadeTiles=0;playerLantern=view.playerLight&&Number.isFinite(view.playerLight.x)&&Number.isFinite(view.playerLight.y)?{...view.playerLight,radius:300}:null;reduceMotion=!!view.reducedMotion;lampAnimationEnabled=!reduceMotion&&Number.isFinite(view.timeMs);moodCounts={};minModulation=maxModulation=1;night=Math.max(0,Math.min(1,Number(darkness)||0));used=authored=occluders=spills=supplementalWindows=0;selected=new Map();lightBounds=[];width=view.width||0;height=view.height||0;
   if(!night||!width||!height)return;
   if(!layer){layer=createCanvas();g=layer.getContext('2d');poolLayer=createCanvas();pg=poolLayer.getContext('2d');actorLayer=createCanvas();ag=actorLayer.getContext('2d');}
   // Only diffuse ground glow may be low resolution. Artwork composited over
   // the scene must retain its display pixels, including the night actors.
   const detailRatio=Number.isFinite(view.pixelRatio)?Math.max(1,view.pixelRatio):1,softRatio=Math.max(.25,Math.min(1,resolutionScale));
   const fit=Math.min(1,Math.sqrt(maxPixels/(width*height*(2*detailRatio*detailRatio+softRatio*softRatio))));
   const z=view.zoom||1,c=view.camera||{x:0,y:0};viewZoom=z;viewCamera=c;
   for(const [surface,target,ratio] of [[layer,g,detailRatio],[poolLayer,pg,softRatio],[actorLayer,ag,detailRatio]]){
    const w=Math.max(1,Math.floor(width*ratio*fit)),h=Math.max(1,Math.floor(height*ratio*fit));if(surface.width!==w)surface.width=w;if(surface.height!==h)surface.height=h;
    target.setTransform(1,0,0,1,0,0);target.clearRect(0,0,w,h);target.setTransform(w/width*z,0,0,h/height*z,w/2-c.x*w/width*z,h/2-c.y*h/height*z);
   }
   detailTransform={a:layer.width/width*z,d:layer.height/height*z,e:layer.width/2-c.x*layer.width/width*z,f:layer.height/2-c.y*layer.height/height*z};
   if(playerLantern){const{x,y,radius}=playerLantern;radial(pg,x,y-3,radius,.94,1,['rgba(255,228,169,1)','rgba(255,198,107,.72)','rgba(255,175,69,0)']);lightBounds.push([x-radius,y-3-radius,x+radius,y-3+radius]);used++;authored++;spills++;}
   const candidates=[];
   for(const o of view.objects||[]){if(o.person||!o.im||!o.anchor||!o.p||!o.scale)continue;const opacity=view.opacities?.get(o.id)??1;if(opacity<=0)continue;for(const p of points(o)){const q=placed(o,p),sx=(q.x-c.x)*z+width/2,sy=(q.y-c.y)*z+height/2;const lamp=o.sceneryKind==='street-lamp'||registration(o).key==='lamp_bench',reach=(lamp?155:115)*o.scale*z,gx=sx+(p.gx-p.x)*o.scale*z,gy=sy+(p.gy-p.y)*o.scale*z,groundVisible=Number.isFinite(gx)&&Number.isFinite(gy)&&gx>=-reach&&gx<=width+reach&&gy>=-reach*.5&&gy<=height+reach*.5;if((sx<-65||sx>width+65||sy<-65||sy>height+65)&&!groundVisible)continue;candidates.push({o,p,opacity,lamp,d:(sx-width/2)**2+(sy-height/2)**2});}}
   const ordered=candidates.sort((a,b)=>Number(b.lamp)-Number(a.lamp)||a.d-b.d),primary=ordered.slice(0,budget),chosen=new Set(primary);
   // Reserve cheap source emission for windows when street posts fill the primary pool budget.
   const supplemental=ordered.filter(v=>!v.lamp&&!chosen.has(v)).slice(0,windowReserve);for(const v of supplemental)v.sourceOnly=true;supplementalWindows=supplemental.length;
   for(const v of [...primary,...supplemental]){v.mood=v.lamp?sampleLampMood(v.o.lampMood||'civic',v.o.id,view.timeMs,{reducedMotion:reduceMotion}):null;if(v.mood){moodCounts[v.mood.name]=(moodCounts[v.mood.name]||0)+1;minModulation=Math.min(minModulation,v.mood.modulation);maxModulation=Math.max(maxModulation,v.mood.modulation);}const list=selected.get(v.o)||[];list.push(v);selected.set(v.o,list);used++;if(v.p.authored)authored++;const q=placed(v.o,v.p),radius=Math.max(12,42*v.o.scale);lightBounds.push([q.x-radius,q.y-radius,q.x+radius,q.y+radius]);
    if(!v.sourceOnly&&Number.isFinite(v.p.gx)&&Number.isFinite(v.p.gy)){const height=Math.max(0,v.p.gy-v.p.y),r=(v.lamp?v.mood.radius:Math.max(78,115-height*.10))*v.o.scale,strength=v.lamp ? .94*v.mood.intensity*v.mood.modulation : .84*Math.max(.5,1-height/320);const x=v.o.bounds[0]+v.p.gx*v.o.scale,y=v.o.bounds[1]+v.p.gy*v.o.scale;radial(pg,x,y,r,strength*v.opacity,.50,v.mood?.colors);lightBounds.push([x-r,y-r*.50,x+r,y+r*.50]);spills++;}
   }
  },
  draw(ctx,o,opacity=1){
   if(!night||!used||!g||opacity<=0||!o.im)return;
   const b=o.bounds;if(!lightBounds.some(a=>a[0]<b[0]+b[2]&&a[2]>b[0]&&a[1]<b[1]+b[3]&&a[3]>b[1]))return;
   // The same source alpha and cutaway opacity hide light behind nearer scenery.
   const screenBounds=[(b[0]-viewCamera.x)*viewZoom+width/2,(b[1]-viewCamera.y)*viewZoom+height/2,b[2]*viewZoom,b[3]*viewZoom];
   const touchesActor=actorUnknown||actorRects.some(a=>a[0]<screenBounds[0]+screenBounds[2]&&a[2]>screenBounds[0]&&a[1]<screenBounds[1]+screenBounds[3]&&a[3]>screenBounds[1]);
   if(touchesActor)actorMaskDraws++;else actorSkippedOccluders++;
   for(const target of touchesActor?[g,pg,ag]:[g,pg]){target.save();target.globalAlpha=opacity;target.globalCompositeOperation='destination-out';if(o.paint)o.paint(target);else target.drawImage(o.im,o.bounds[0],o.bounds[1],o.im.width*o.scale,o.im.height*o.scale);target.restore();}occluders++;
   if(playerLantern&&!o.person&&o.sceneryKind!=='street-lamp'){
    const radius=playerLantern.radius,x=playerLantern.x,y=playerLantern.y-25,left=Math.max(b[0],x-radius),top=Math.max(b[1],y-radius),right=Math.min(b[0]+b[2],x+radius),bottom=Math.min(b[1]+b[3],y+radius);
    if(right>left&&bottom>top){
     if(!receiver){receiver=createCanvas();receiver.width=receiver.height=256;receiverContext=receiver.getContext('2d');}
     // Reuse a small receiver in display-aligned tiles. Shrinking an entire
     // wall into this scratch surface would blur it even on a sharp layer.
     const rg=receiverContext,t=detailTransform,x0=Math.max(0,Math.floor(left*t.a+t.e)),y0=Math.max(0,Math.floor(top*t.d+t.f)),x1=Math.min(layer.width,Math.ceil(right*t.a+t.e)),y1=Math.min(layer.height,Math.ceil(bottom*t.d+t.f));
     for(let py=y0;py<y1;py+=256)for(let px=x0;px<x1;px+=256){
      const tw=Math.min(256,x1-px),th=Math.min(256,y1-py),wx=(px-t.e)/t.a,wy=(py-t.f)/t.d,ww=tw/t.a,wh=th/t.d;
      rg.setTransform(1,0,0,1,0,0);rg.clearRect(0,0,256,256);rg.save();rg.setTransform(t.a,0,0,t.d,t.e-px,t.f-py);rg.globalAlpha=opacity;rg.globalCompositeOperation='source-over';if(o.paint)o.paint(rg);else rg.drawImage(o.im,b[0],b[1],o.im.width*o.scale,o.im.height*o.scale);
      // Retain painted masonry detail, warm its reflected colour, then mask to local falloff.
      rg.globalAlpha=.15;rg.globalCompositeOperation='source-atop';rg.fillStyle='#ffe4af';rg.fillRect(wx,wy,ww,wh);rg.globalAlpha=1;rg.globalCompositeOperation='destination-in';const falloff=rg.createRadialGradient(x,y,0,x,y,radius);falloff.addColorStop(0,'rgba(255,255,255,.95)');falloff.addColorStop(.4,'rgba(255,255,255,.7)');falloff.addColorStop(1,'rgba(255,255,255,0)');rg.fillStyle=falloff;rg.fillRect(wx,wy,ww,wh);rg.restore();
      g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.drawImage(receiver,0,0,tw,th,px,py,tw,th);g.restore();facadeTiles++;
     }
     if(x1>x0&&y1>y0)facadeReceivers++;
    }
   }
   for(const {p,mood} of selected.get(o)||[]){const q=placed(o,p),gain=mood?mood.intensity*mood.modulation:1;radial(g,q.x,q.y,Math.max(12,42*o.scale),.38*opacity*gain,1,mood?.colors);radial(g,q.x,q.y,Math.max(7,17*o.scale),opacity*gain,1,mood?.colors);}
  },
  drawPlayerLantern(ctx){
   if(!playerLantern)return;const x=playerLantern.x+12,y=playerLantern.y-25;
   // Small brass cage and handle, painted with the recruit in scene depth order.
   ctx.save();ctx.strokeStyle='#36251a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-10,y-8);ctx.lineTo(x,y-6);ctx.stroke();ctx.beginPath();ctx.arc(x,y-6,3,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle='#a77e38';ctx.fillRect(x-4,y-4,8,11);ctx.fillStyle=night?'#ffe4a5':'#99865d';ctx.fillRect(x-2.5,y-2,5,7);ctx.strokeStyle='#49321c';ctx.strokeRect(x-4,y-4,8,11);ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x,y+7);ctx.stroke();ctx.restore();
   if(night&&g){radial(g,x,y+1,22,.65);radial(g,x,y+1,7,1);}
  },
  drawActor(ctx,paint,{imageBounded=false}={}){
   if(!night||!used||!g){paint(ctx);return;}
   // Ground spill illuminates the actor locally; only rear window emissions are hidden.
   // One actor-painter call only: mirror its canvas operations into the alpha
   // receiver so animation clocks and facing state are never sampled twice.
   if(!actorContexts.has(ctx)){
    const methods=new Set(['save','restore','translate','scale','rotate','transform','beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','arcTo','ellipse','rect','roundRect','clip','fill','stroke','fillRect','strokeRect','drawImage','fillText','strokeText','setLineDash']);
    actorContexts.set(ctx,new Proxy(ctx,{get(target,key){const value=target[key];if(typeof value!=='function')return value;return(...args)=>{const result=value.apply(target,args);if(key==='drawImage'){
       try{const m=target.getTransform(),i=args.length===9?5:1,x=args[i],y=args[i+1],w=args.length===3?(args[0].naturalWidth||args[0].width):args[i+2],h=args.length===3?(args[0].naturalHeight||args[0].height):args[i+3];
        const corners=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>[(m.a*px+m.c*py+m.e)/actorPixelRatio,(m.b*px+m.d*py+m.f)/actorPixelRatio]);
        if(corners.flat().every(Number.isFinite))actorRects.push([Math.min(...corners.map(p=>p[0]))-32,Math.min(...corners.map(p=>p[1]))-32,Math.max(...corners.map(p=>p[0]))+32,Math.max(...corners.map(p=>p[1]))+32]);else actorUnknown=true;
       }catch{actorUnknown=true;}
      }if(methods.has(key)){g[key](...args);ag[key](...args);}return result;};},set(target,key,value){target[key]=value;if(key!=='globalCompositeOperation'&&key!=='canvas'){if(key in g)g[key]=value;if(key in ag)ag[key]=value;}return true;}}));
   }
   g.save();g.globalCompositeOperation='destination-out';g.globalAlpha=ctx.globalAlpha;ag.save();ag.globalCompositeOperation='source-over';ag.globalAlpha=ctx.globalAlpha;
   const before=actorRects.length;try{paint(actorContexts.get(ctx));if(!imageBounded||actorRects.length===before)actorUnknown=true;}finally{g.restore();ag.restore();}
  },
  composite(ctx){if(!night||!used||!g)return;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=night;ctx.drawImage(poolLayer,0,0,width,height);ctx.drawImage(layer,0,0,width,height);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.82*night;if(actorUnknown)ctx.drawImage(actorLayer,0,0,width,height);else if(actorRects.length){ctx.save();ctx.beginPath();for(const a of actorRects)ctx.rect(a[0],a[1],a[2]-a[0],a[3]-a[1]);ctx.clip();ctx.drawImage(actorLayer,0,0,width,height);ctx.restore();}ctx.restore();},
  dispose(){if(layer){layer.width=layer.height=1;poolLayer.width=poolLayer.height=1;actorLayer.width=actorLayer.height=1;}if(receiver)receiver.width=receiver.height=1;receiver=receiverContext=null;layer=g=poolLayer=pg=actorLayer=ag=null;selected.clear();},
  report(){return{version:12,actorMaskDraws,actorSkippedOccluders,playerLanternFacades:facadeReceivers,facadeTiles,detailPixelRatio:layer&&width?layer.width/width:0,actorPixelRatio:actorLayer&&width?actorLayer.width/width:0,facadeReceiverMiB:receiver?256*256*4/1048576:0,playerLantern:playerLantern?{active:night>0,position:[playerLantern.x,playerLantern.y],radius:playerLantern.radius,carried:true}:null,supplementalWindowLights:supplementalWindows,maxGroundPools:budget+(playerLantern?1:0),subtleLampFlicker:night>0&&lampAnimationEnabled,lampMoodProfiles:moodCounts,reducedMotion:reduceMotion,lampModulationRange:[minModulation,maxModulation],localGroundSpill:true,actorReceivesGroundSpill:true,actorVisibilityLayer:true,streetLampPriority:true,softLightResolution:resolutionScale,source:'Reviewed source registrations only; no runtime colour detection',sceneCoverage,maxLights:budget+windowReserve+(playerLantern?1:0),activeLights:used,authoredLights:authored,fallbackLights:used-authored,groundPools:spills,sceneryOccluders:occluders,darkness:night,emissionAfterNightTint:true,daytimeEmission:false,lightBufferMiB:layer?(layer.width*layer.height+poolLayer.width*poolLayer.height+actorLayer.width*actorLayer.height+(receiver?65536:0))*4/1048576:0,maxBufferMiB:8,bridgeTreatment:false,newPositions:false,physicalDeviceVerified:false};}
 };
}

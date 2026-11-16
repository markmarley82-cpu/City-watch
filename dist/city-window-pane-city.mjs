// Citywide extension of the approved Watch/first two art returns. No runtime colour detection.
import {drawMisbegotPanes} from './city-window-pane-misbegot.mjs?v=p21-b407-s039-reuse';
import {CITY_GLASS} from './city-window-pane-city-data.mjs?v=p21-b407-s039-reuse';
import {watchPanePoint as priorPoint,drawWatchPanes as priorDraw} from './city-window-pane-batch02.mjs?v=p21-b407-s039-reuse';
export function paneEntry(o){const e=CITY_GLASS[o.lightSource||o.sourceAsset||o.id];if(!e)return null;const s=[o.im.cwSourceWidth||o.im.width,o.im.cwSourceHeight||o.im.height];return o.lightTransform||s[0]===e.size[0]&&s[1]===e.size[1]?e:null;}
export function paneMap(o,e,x,y){const t=o.lightTransform;if(t?.maps){const m=t.maps.find(m=>x>=m.start&&x<m.end)||t.maps.at(-1);return[m.a*x+m.c+t.anchor[0],m.b*x+m.v*y+m.f+t.anchor[1]];}if(t?.quad){const[a,b,,d]=t.quad,u=x/e.size[0],v=y/e.size[1];return[a[0]+(b[0]-a[0])*u+(d[0]-a[0])*v,a[1]+(b[1]-a[1])*u+(d[1]-a[1])*v];}return[o.lightMirror?e.size[0]-x:x,y];}
const match=(o,e,p,a)=>{const d=o.im.cwDensity||1,[x,y]=paneMap(o,e,...a);return Math.abs(p.x-x*d)<.015&&Math.abs(p.y-y*d)<.015;};
export function watchPanePoint(o,p){if(priorPoint(o,p)||['PALACE-MAIN-RANGE-v2','E045-S569-WEST'].includes(o.id))return true;const e=paneEntry(o);return !!e&&(e.windows.some(w=>match(o,e,p,w.anchor))||(e.suppressed||[]).some(a=>match(o,e,p,a))||o.id==='PALACE-MAIN-RANGE-v2'||o.id==='E045-S569-WEST');}
export function drawWatchPanes(g,o,night){if(!night)return;drawMisbegotPanes(g,o,night);priorDraw(g,o,night);const e=paneEntry(o);if(!e||o.nightEmission||!night)return;const d=o.im.cwDensity||1,wins=e.windows.filter(w=>{const[x,y]=paneMap(o,e,...w.anchor);return !priorPoint(o,{x:x*d,y:y*d});});if(!wins.length)return;
 const c=document.createElement('canvas');c.width=Math.ceil(o.bounds[2]/o.scale);c.height=Math.ceil(o.bounds[3]/o.scale);const t=c.getContext('2d');t.scale(d,d);t.fillStyle='#ffe1a0';t.globalAlpha=.92*night;
 // Only registered glazing spans emit; painted lattice/mullions remain dark.
 t.beginPath();for(const w of wins)for(const[x,y,width]of w.spans){const a=paneMap(o,e,x,y),b=paneMap(o,e,x+width,y),c=paneMap(o,e,x+width,y+1),z=paneMap(o,e,x,y+1);t.moveTo(...a);t.lineTo(...b);t.lineTo(...c);t.lineTo(...z);t.closePath();}t.fill();
 // Clip against the actual current source, including cutaway/hidden images and fitted legacy painter.
 t.setTransform(1,0,0,1,0,0);t.globalAlpha=1;t.globalCompositeOperation='destination-in';if(o.paint){const m=document.createElement('canvas');m.width=c.width;m.height=c.height;const a=m.getContext('2d');a.scale(1/o.scale,1/o.scale);a.translate(-o.bounds[0],-o.bounds[1]);o.paint(a);t.drawImage(m,0,0);m.width=m.height=1;}else t.drawImage(o.im,0,0);
 g.save();g.drawImage(c,o.bounds[0],o.bounds[1],c.width*o.scale,c.height*o.scale);g.restore();c.width=c.height=1;
}

import {MISBEGOT_GLASS} from './city-window-pane-misbegot-data.mjs?v=p21-b407-s039-reuse';

// Bridge images stream at 1x, 1/2x or 1/4x; their world bounds remain native.
// Keep glazing in native painting coordinates rather than decoded-image pixels.
export function misbegotPaneEntry(o){
 if(o.edge!=='E007'||!o.bridgePart||!o.im||o.nightEmission)return null;
 const letter=/^E007:(?:rear|front)_([A-P])$/.exec(o.id)?.[1],e=MISBEGOT_GLASS[letter];
 return e&&o.sourceLayers?.some(p=>p.endsWith(`/misbegot_house_${letter}_RGBA.webp`))&&o.bounds[2]===e.size[0]&&o.bounds[3]===e.size[1]?e:null;
}
export function drawMisbegotPanes(g,o,night){
 if(!night)return;const e=misbegotPaneEntry(o);if(!e)return;
 const c=document.createElement('canvas');[c.width,c.height]=e.size;const t=c.getContext('2d');
 t.fillStyle='#ffe1a0';t.globalAlpha=.92*night;t.beginPath();
 for(const w of e.windows)for(const[x,y,width]of w.spans)t.rect(x,y,width,1);
 t.fill();
 // Respect the current source alpha at every bridge streaming resolution.
 t.globalAlpha=1;t.globalCompositeOperation='destination-in';t.drawImage(o.im,0,0,...e.size);
 g.save();g.drawImage(c,...o.bounds);g.restore();c.width=c.height=1;
}

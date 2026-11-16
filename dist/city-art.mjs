/* Render registration only; this module grants no navigation or collision authority. */
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const PONS={edge:'E004',anchor:[83,164],rect:[81,164,5,33],local:([x,y])=>[y-164,83-x]};
export function bridgeInFront(p,part){const [s,t]=PONS.local(p),onDeck=p[2]==='E004'&&s>=0&&s<=32&&Math.abs(t)<=2;if(onDeck)return part==='back';return p[0]>85||p[1]>196;}
export function bridgePlacement(r){const p=project(PONS.anchor);return {id:'pons:'+r.file.split('/').pop(),p:PONS.anchor,anchor:r.native_anchor_px,scale:1,rect:PONS.rect,bounds:[p.x-r.native_anchor_px[0],p.y-r.native_anchor_px[1],...r.dimensions]};}
export function universityViewContract(m){return {cityPlot:m.city_plot_engine_cell_rect.slice(),approach:[...m.public_examine_approach_engine,m.approach_edge],entry:'EXAMINE',gateOpen:false,navAdded:false,worldOrigin:m.campus_world?.origin||null,placements:m.recommended_correction.placements};}
// Orthographic ground receiver: below-grade masonry is hidden by dry ground.
// The deck remains at its existing navigation height. Source paints stay intact.
export function bridgeGroundReceiver(screen,wet){const p=[screen.x/56+screen.y/28,screen.y/28-screen.x/56],[s,t]=PONS.local(p);return {point:p,showMasonry:wet(p)||(s>=0&&s<=32&&Math.abs(t)<=2)};}
export function bridgeWaterSpan(water){const cuts=[];for(const polygon of water)for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a[0]>83)!==(b[0]>83))cuts.push(a[1]+(83-a[0])*(b[1]-a[1])/(b[0]-a[0]));}return cuts.filter(y=>y>=164&&y<=196).sort((a,b)=>a-b);}

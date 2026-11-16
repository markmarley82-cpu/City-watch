import {cellKey,pathBetween} from './layout-core.mjs?v=p21-b407-s039-reuse';
export {cellKey,pathBetween};
export function bridgeWalk(){const set=new Set();for(let s=.5;s<47;s++)for(let t=-1.5;t<2;t++)set.add(cellKey([s,t]));return set;}
export const project=([s,t])=>({x:-28*(s+t),y:14*(s-t)});
export const unproject=({x,y})=>[Math.floor((-x/28+y/14)/2)+.5,Math.floor((-x/28-y/14)/2)+.5];
export const validBridgeSave=(v,walk)=>!!v&&v.version===1&&Array.isArray(v.position)&&v.position.length===2&&v.position.every(Number.isFinite)&&walk.has(cellKey(v.position))&&Number.isSafeInteger(v.steps)&&v.steps>=0;
export const cutawayOpacity=(overlaps,minTransmission=.82)=>overlaps>0?1-Math.pow(minTransmission,1/overlaps):1;

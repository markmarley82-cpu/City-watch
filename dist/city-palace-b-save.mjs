import {validSave} from './city-core.mjs?v=p21-b407-s039-reuse';

// Call only after applying the exact Palace B and Court Homes supports.
export function recoverPalaceBSave(saved,world,clearPoint,receivers){
  const old=saved?.position, visited=saved?.visited;
  if(!Array.isArray(old)||old.length!==3||!old.slice(0,2).every(Number.isInteger)||typeof old[2]!=='string')return null;
  const record={version:7,position:old,visited};
  if(validSave(record,world)||world.members.get(old.slice(0,2).join(','))?.has(old[2]))return null;
  const next=receivers[old.join(',')];
  if(!Array.isArray(next)||next[2]!==old[2]||!validSave({...record,position:next},world))return null;
  const [x,y,id]=next;
  if(![[x,y],...[[-.12,-.12],[-.12,.12],[.12,-.12],[.12,.12]].map(([dx,dy])=>[x+dx,y+dy])].every(p=>clearPoint(p)&&!world.wet(p)&&world.waterCollision.pointClear(p,[id])))return null;
  return {position:next.slice(),cityFoot:next.slice()};
}

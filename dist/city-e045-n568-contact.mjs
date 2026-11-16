// Exterior contact for the original unnamed house. Creates no interior or graph edge.
export const N568_CONTACT=Object.freeze({id:'original:n568-house',name:'Stone dwelling',edge:'E045',stance:Object.freeze([56,203,'E045']),contact:Object.freeze([55.31907142857143,202.14]),threshold:Object.freeze([[55.31907142857143,202.14]].map(Object.freeze))});
export function activateN568Contact({world,clearPoint,streetPath,footProbes}){
 const c=N568_CONTACT,finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string';
 const full=p=>finite(p)&&footProbes.every(([dx,dy])=>{const q=[p[0]+dx,p[1]+dy,p[2]];return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has(p[2])&&clearPoint(q)&&(!world.waterCollision||world.waterCollision.pointClear(q,[p[2]]));});
 const route=streetPath(world,[56,207,c.edge],c.stance.slice(0,2),c.edge);
 if(world.edges.get(c.edge)?.kind!=='STREET'||world.doors.has(c.id)||!full(c.stance)||route===null||route.some(p=>!full(p)))throw Error('N568 exterior contact has no safe unique approach');
 const door=Object.freeze({game_id:c.id,lf_id:'ORIGINAL INFILL',name:c.name,position:Object.freeze(c.stance.slice(0,2)),edge:c.edge,held:false,exteriorOnly:true,source_instance:'E045-N568-ORIGINAL',source_asset:'E045-N568-ORIGINAL',approach_basis:'Measured painted doorway; existing pedestrian approach',case_function_preserved:'A weathered stone dwelling opens onto the service approach. Its wooden door is shut.'});
 world.doors.set(c.id,door);let active=true;
 const canUse=p=>active&&world.doors.get(c.id)===door&&finite(p)&&p[2]===c.edge&&Math.hypot(p[0]-c.stance[0],p[1]-c.stance[1])<=.6&&full(p)&&(!world.canTraverse||world.canTraverse(p,c.stance));
 return Object.freeze({door,route,canUse,examine(p){return canUse(p)?{title:door.name,text:door.case_function_preserved,entersInterior:false}:null;},dispose(){if(world.doors.get(c.id)===door)world.doors.delete(c.id);active=false;}});
}

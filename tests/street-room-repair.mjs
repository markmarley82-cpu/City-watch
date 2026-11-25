import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathfind,canStand} from '../dist/guild-interiors/room-core.mjs';
import {actorHeight,foregroundFor,clipRoomForeground} from '../dist/guild-interiors/room-presentation.mjs';
const rooms=JSON.parse(fs.readFileSync('dist/guild-interiors/rooms.json')).rooms.filter(r=>r.id.startsWith('street-'));
assert.equal(rooms.length,13);assert.equal(new Set(rooms.map(r=>r.npc.actorId)).size,13);
for(const r of rooms){
 assert(canStand(r,r.entry),r.id+' entry blocked');
 for(const h of r.hotspots)assert(pathfind(r,r.entry,h.stand),r.id+': unreachable '+h.id);
 assert(actorHeight(r)>150&&actorHeight(r)<300,r.id+' scale');
 for(const o of r.presentation.foreground){assert(o.mask.every(p=>p.every(Number.isFinite)));const xs=o.base.map(p=>p[0]),ys=o.base.map(p=>p[1]),x=(Math.min(...xs)+Math.max(...xs))/2,y=Math.max(...ys);assert(foregroundFor(r,[x/1536,(Math.min(...ys)-20)/1024]).includes(o),r.id+' missing behind mask');assert(!foregroundFor(r,[x/1536,(y+20)/1024]).includes(o),r.id+' masks a person in front');}
 let clips=0;clipRoomForeground({beginPath(){},rect(){},moveTo(){},lineTo(){},closePath(){},clip(rule){assert.equal(rule,'evenodd');clips++;}},r,[r.entry[0],r.entry[1]-.1]);assert(clips>0,r.id+' foreground inactive');
}
console.log('PASS: 13 distinct staff bindings, 13 registered scales, every room route and foreground depth');

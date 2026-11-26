import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileCity,pathBetween,rectCells,engine,key} from '../dist/city-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const data=read('dist/assets/city-v07/city-design.json'),world=compileCity(data,read('dist/assets/team-v05/precinct-rc1.json'));
const exterior=read('dist/assets/landmark-exteriors-v3/manifest.json').instances.find(r=>r.landmarkID==='drum'),door=world.doors.get('drum');
assert.deepEqual(exterior.rect,[103,239,9,8]);assert.deepEqual(door.position,[106,247]);assert.equal(door.held,false);
const cells=rectCells(data.landmarks.find(l=>l.game_id==='drum').footprint_xywh).map(engine);
// Larger Drum (23 Nov): the 9x8 plot is retired from walking at runtime by dist/city-drum-plot.mjs,
// so the compiled design only holds the original 30-cell foundation.
for(const p of cells)assert(world.solid.has(key(p)),'Navigable tavern foundation '+p);
const route=pathBetween(world,[126,132,'RC1'],door.position,door.edge);assert(route?.length,'Watch-to-Drum route');
const apron=world.forecourts.find(f=>f.id==='APRON:drum');assert.deepEqual(apron.contact,[108,247]);assert.equal(apron.parent,'E052');
for(const p of apron.cells){assert(!world.solid.has(key(p)));assert(!world.wet(p));}
const overlap=(a,b)=>a[0]<b[0]+b[2]-1e-6&&a[0]+a[2]>b[0]+1e-6&&a[1]<b[1]+b[3]-1e-6&&a[1]+a[3]>b[1]+1e-6;
// The yard and gap cleared for the old 97,240 site belong to that site; the larger Drum moved east.
const shades=read('dist/assets/shades-streets-v1/manifest.json');
for(const o of [...shades.instances,...read('dist/assets/new-buildings-v1/manifest.json').buildings]){
 assert(!overlap(exterior.rect,o.rect),'Tavern overlaps '+o.id);
 for(const [x,y]of apron.cells)assert(!(x>=o.rect[0]-.5&&x<o.rect[0]+o.rect[2]-.5&&y>=o.rect[1]-.5&&y<o.rect[1]+o.rect[3]-.5),'Entrance path crosses '+o.id+' at '+[x,y]);
}
for(const [from,to,edge]of [[[108,239,'E050'],[113,256],'E052'],[[108,239,'E050'],[82,250],'E064'],[[108,239,'E050'],[143,239],'E051']])assert(pathBetween(world,from,to,edge)?.length,'Lost through street '+edge);
assert.deepEqual(read('dist/cases/city-cases.json').places.drum.at,[106,247,'APRON:drum']);
console.log(JSON.stringify({foundationCells:cells.length,door:door.position,watchRoute:route.length,neighbourCollisions:0,clearEntranceCells:apron.cells.length,throughStreets:3}));

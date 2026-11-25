import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileCity} from '../dist/city-core.mjs';
import {streetPath,acceptStreetStep} from '../dist/city-movement.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../dist/'+p,import.meta.url)));
const world=compileCity(read('assets/city-v07/city-design.json'),read('assets/team-v05/precinct-rc1.json'));
const points=[[134,135,'RC1'],[107,243,'APRON:drum'],[44,244,'APRON:warehouse'],[94,293,'APRON:guild-bakers'],[85,46,'APRON:lantern']].filter(p=>world.members.get(p.slice(0,2).join(','))?.has(p[2]));
let routes=0,steps=0;const failures=[];
for(const start of points)for(const target of points){if(start===target)continue;const path=streetPath(world,start,target.slice(0,2),target[2]);assert(path);let from=start;routes++;for(const to of path){if(!acceptStreetStep(world,from,to))failures.push({from,to});from=to;steps++;}}
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,10)));assert(routes>=6);console.log('PASS',routes,'planned routes /',steps,'exact legal route steps');

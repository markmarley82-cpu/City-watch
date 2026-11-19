// Times cross-city street routes on the compiled map (no browser).  node tests/bench-street-route.mjs
import {readFileSync} from 'node:fs';
import {compileCity} from '../dist/city-core.mjs';
import {streetPath,createStreetSearch} from '../dist/city-movement.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../dist/'+p,import.meta.url)));
const world=compileCity(read('assets/city-v07/city-design.json'),read('assets/team-v05/precinct-rc1.json'));
const routes=[[[134,135,'RC1'],[107,243,'APRON:drum']],[[134,135,'RC1'],[44,244,'APRON:warehouse']],[[94,293,'APRON:guild-bakers'],[44,244,'APRON:warehouse']],[[134,135,'RC1'],[85,46,'APRON:lantern']]];
for(const [a,b] of routes){
 if(!world.members.get(a[0]+','+a[1])?.has(a[2])||!world.members.get(b[0]+','+b[1])?.has(b[2])){console.log('not in base world',a,b);continue;}
 let t=performance.now();const path=streetPath(world,a,b.slice(0,2),b[2]);const sync=performance.now()-t;
 t=performance.now();const s=createStreetSearch(world,a,b.slice(0,2),b[2]);let r;do r=s.advance(64);while(r.status==='pending');const coop=performance.now()-t;
 console.log(JSON.stringify(a),'->',JSON.stringify(b),'steps',path?.length,'sync',sync.toFixed(0)+'ms','coop',coop.toFixed(0)+'ms','pops',r.pops,'expanded',r.expanded);
}

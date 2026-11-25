import fs from 'node:fs';import assert from 'node:assert/strict';
import {createRecruitArt} from '../dist/cw-recruit-art-v2.mjs';
const data=JSON.parse(fs.readFileSync('dist/assets/recruit-art-hd/manifest.json'));
const requested=new Set(),art=createRecruitArt(data,{baseURL:'https://example.test/',loadImage:async url=>{requested.add(url);return {width:1536,height:192};}});
const g={save(){},restore(){},translate(){},scale(){},drawImage(image,sx,sy,sw,sh){assert.equal(sy,0);assert.equal(sw,256);assert.equal(sh,192);assert(sx>=0&&sx+sw<=1536);}};
for(const id of Object.keys(data.bodies))for(const clip of ['idle','walk','attack','guard','hit','shove','restrain','surrender','down']){
 for(const weapon of clip==='attack'?['unarmed','truncheon']:['unarmed']){
 const pose={actorId:'player',clip,weapon,clothing:{},frame:5};await art.ensure(id,pose,true);const f=art.draw(g,id,pose,0,0,120);assert.equal(f.recruitArt,'source-hd');assert.equal(f.clip,clip);assert.equal(f.weapon,weapon);
 }}
assert([...requested].some(s=>s.includes('/truncheon/')));assert(art.report().decodedBytes<=28*1024*1024);
console.log('PASS: all five source-resolution recruits, nine actions, six-frame grids and truncheon; bounded action cache');

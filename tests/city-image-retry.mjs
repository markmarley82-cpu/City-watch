import assert from 'node:assert/strict';
import {queueImageWithRetry} from '../dist/city-image-retry.mjs';
const path='assets/graphics-p17/shades/sprites/buildings/narrow_shop_house.exact.webp';
const url='https://example.test/City-watch/'+path+'?v=paint#source',image={width:1024,height:1024};
let calls=[],waits=[],events=[];
const options={wait:async ms=>waits.push(ms),onRetry:event=>events.push(event)};
assert.equal(await queueImageWithRetry(async(p,u)=>{calls.push([p,u]);return image},path,url,options),image);
assert.deepEqual(calls,[[path,url]]);assert.deepEqual(waits,[]);assert.deepEqual(events,[]);
calls=[];waits=[];events=[];
const failures=[new Error('Painting timed out after 20 seconds'),new Error('Painting could not load')];
assert.equal(await queueImageWithRetry(async(p,u)=>{calls.push([p,u]);if(calls.length<3)throw failures[calls.length-1];return image},path,url,options),image);
assert.equal(calls.length,3);assert.deepEqual(waits,[300,1200]);
assert.deepEqual(events.map(e=>[e.attempt,e.delayMs,e.error]),[[1,300,failures[0]],[2,1200,failures[1]]]);
for(const [i,[p,u]]of calls.entries()){const parsed=new URL(u);assert.equal(p,path);assert.equal(parsed.searchParams.get('v'),'paint');assert.equal(parsed.hash,'#source');assert.equal(parsed.searchParams.get('cw-retry'),i?String(i):null);assert.equal(parsed.searchParams.getAll('cw-retry').length,i?1:0);}
calls=[];waits=[];events=[];const permanent=new Error('Painting could not load: '+path);
await assert.rejects(queueImageWithRetry(async(p,u)=>{calls.push(u);throw permanent},path,url,options),e=>e===permanent);
assert.equal(calls.length,3);assert.deepEqual(waits,[300,1200]);assert.equal(events.length,2);
for(const retries of [0,1]){let attempts=0,delays=[];await assert.rejects(queueImageWithRetry(async()=>{attempts++;throw permanent},path,url,{retries,wait:async ms=>delays.push(ms)}),e=>e===permanent);assert.equal(attempts,retries+1);assert.deepEqual(delays,retries?[300]:[]);}
console.log('PASS healthy loads, two transient failures, delayed cache-busted retries, bounded permanent failure, explicit retry limits');

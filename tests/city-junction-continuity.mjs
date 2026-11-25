import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileCity} from '../dist/city-core.mjs';
import {createFreeWalk} from '../dist/city-free-walk.mjs';
const root=new URL('../dist/',import.meta.url);const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));const w=compileCity(read('assets/city-v07/city-design.json'),read('assets/team-v05/precinct-rc1.json'));
const failures=[],passed=[];
function straight(start,dx,dy,n=6){const seen=new Set(),todo=[[start,0]];for(let i=0;i<todo.length;i++){const [p,k]=todo[i],id=p.join(',')+':'+k;if(seen.has(id))continue;seen.add(id);if(k===n)return p;for(const q of w.neighbours(p)){const a=q[0]-p[0],b=q[1]-p[1];if(a===0&&b===0)todo.push([q,k]);else if(a===dx&&b===dy)todo.push([q,k+1]);}}return null;}
for(const [id,p]of w.nodes){for(let y=Math.round(p[1])-1;y<=Math.round(p[1])+1;y++)for(let x=Math.round(p[0])-1;x<=Math.round(p[0])+1;x++)for(const edge of w.members.get(x+','+y)||[]){if(!['STREET','YARD','PRECINCT'].includes(w.edges.get(edge)?.kind))continue;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const start=[x,y,edge],end=straight(start,dx,dy);if(!end)continue;const walk=createFreeWalk(w);walk.reset(start);for(let n=1;n<=150;n++)walk.advance(n*16,[dx,dy]);const foot=walk.foot(),travel=(foot[0]-x)*dx+(foot[1]-y)*dy;if(travel<5.5)failures.push({id,start,end,vector:[dx,dy],travel,foot});else passed.push({id,start,end,vector:[dx,dy],travel});}}}
assert.equal(failures.length,0,JSON.stringify(failures));assert(passed.length>=1200);console.log('PASS',passed.length,'registered cardinal junction crossings; base graph, no new joins');
// Painted overlap alone never creates a transition, even after the new lookahead.
const a=[0,0,'a'],toy={edges:new Map([['a',{kind:'STREET',a:'n',b:'x',points:[[0,0],[0,1]]}],['b',{kind:'STREET',a:'q',b:'z',points:[[0,0],[1,0]]}]]),members:new Map([['0,0',new Set(['a','b'])],['0,1',new Set(['a'])],['1,0',new Set(['b'])]]),wet:()=>false,neighbours:p=>p[2]==='a'?[[0,1,'a']]:[[1,0,'b']]};
const {manualNeighbour}=await import('../dist/city-core.mjs');assert.equal(manualNeighbour(toy,a,1,0),null);assert.equal(manualNeighbour(toy,a,0,1,()=>true),null);assert.equal(manualNeighbour(toy,a,1,1),null);
console.log('PASS unregistered overlap, occupied cells and diagonal corner guards');

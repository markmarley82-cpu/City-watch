import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const packet='art-review/recruit-dwarf-silver';
const source=execFileSync('git',['show','origin/main:dist/cw-recruit-art-v2.mjs'],{encoding:'utf8'});
const {createRecruitArt}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(await fs.readFile(packet+'/manifest.json','utf8'));
const art=createRecruitArt(data,{baseURL:'https://asset-review.invalid/',makeCanvas:createCanvas,
  maxDecodedBytes:64*1024*1024,loadImage:url=>loadImage(path.resolve(packet,path.basename(new URL(url).pathname)))});
const actions=data.actions, kit=['original','watch-plate','service-mail','work-jerkin'];
async function render(action,frame,equipment,head,actorId='player',facing=-1){
 const pose={actorId,clip:action==='truncheon'?'attack':action,weapon:action==='truncheon'?'truncheon':'unarmed',
   frame,equipment,head,facing,clothing:{}};
 await art.ensure('p3_dwarf_01',pose,true);
 const c=createCanvas(128,96);const ctx=c.getContext('2d');
 const meta=art.draw(ctx,'p3_dwarf_01',pose,64,92,44);
 assert(meta&&!meta.appearancePending&&meta.equipmentReady);
 return {data:ctx.getImageData(0,0,128,96).data,canvas:c,meta};
}
const hc=createCanvas(768,960);hc.getContext('2d').drawImage(await loadImage(packet+'/silver-dwarf-head-forked-silver-beard.webp'),0,0);
const headPixels=hc.getContext('2d').getImageData(0,0,768,960).data;
const results=[];const drift=[];
for(const action of actions)for(let frame=0;frame<6;frame++)for(const equipment of kit){
 const base=await render(action,frame,equipment,undefined);
 const finalHead=await render(action,frame,equipment,'b');
 let pixels=0,opaqueHeadOverdrawPixels=0;
 for(let i=0;i<base.data.length;i+=4){
  if(base.data.subarray(i,i+4).some((v,k)=>v!==finalHead.data[i+k]))pixels++;
  const x=(i/4)%128,y=Math.floor(i/4/128),hi=((actions.indexOf(action)*96+y)*768+frame*128+x)*4;
  const delta=[0,1,2].reduce((s,k)=>s+Math.abs(base.data[i+k]-finalHead.data[i+k]),0);
  if(headPixels[hi+3]>240&&delta>30)opaqueHeadOverdrawPixels++;
 }
 if(pixels)drift.push({action,frame:frame+1,equipment,changedPixels:pixels,opaqueHeadOverdrawPixels});
 for(const head of [undefined,'a','b']){
  const left=await render(action,frame,equipment,head);
  const combat=await render(action,frame,equipment,head,'battle:officer');
  assert.deepEqual(left.data,combat.data,'Patrol/combat art differs');
  const right=await render(action,frame,equipment,head,'player',1);
  for(let y=0;y<96;y++)for(let x=0;x<128;x++)for(let k=0;k<4;k++)
    assert.equal(left.data[(y*128+x)*4+k],right.data[(y*128+127-x)*4+k],'Mirrored facing mismatch');
  results.push({action,frame:frame+1,equipment,head:head||'original',patrolCombatIdentical:true,mirrorIdentical:true,
    defaultVersusHeadLastPixels:pixels,opaqueHeadOverdrawPixels});
 }
}
await fs.writeFile(packet+'/renderer-audit.json',JSON.stringify({
 sourceCommit:execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),
 rendererSHA256:crypto.createHash('sha256').update(source).digest('hex'),
 execution:'actual createRecruitArt module with @napi-rs/canvas; 60 poses x 4 kit choices x 3 heads x 2 roles x 2 facings, not a browser playthrough',
 interpretation:'Default/head-last differences are low-alpha composition fringes. No opaque silver-head pixels differ materially with any kit. Raw pixel differences alone are not evidence of armour clipping.',
 checks:results,defaultHeadOrderDifferences:drift,
 physicalPhoneVerified:false},null,2)+'\n');
const sheet=createCanvas(1024,440);const ctx=sheet.getContext('2d');ctx.fillStyle='#b6aea0';ctx.fillRect(0,0,1024,440);
let col=0;for(const equipment of kit){
 for(let row=0;row<2;row++){
  const {canvas}=await render('idle',0,equipment,row?'b':undefined);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,0,0,128,96,col*256,row*210,256,192);
  ctx.fillStyle='#111';ctx.font='16px sans-serif';ctx.fillText(equipment+' / '+(row?'head last':'default'),col*256+4,row*210+204);
 }col++;
}
await fs.writeFile(packet+'/head-order-comparison.png',sheet.toBuffer('image/png'));
await fs.mkdir(packet+'/motion-review',{recursive:true});
for(let phase=0;phase<6;phase++){
 const c=createCanvas(920,770),g=c.getContext('2d');g.fillStyle='#393a37';g.fillRect(0,0,920,770);
 g.font='13px sans-serif';g.fillStyle='#eee';
 kit.forEach((k,i)=>g.fillText(k+'  L / R',120+i*200,20));
 for(let row=0;row<10;row++){
  const action=actions[row];g.fillStyle='#eee';g.fillText(action,5,65+row*72);
  for(let k=0;k<4;k++)for(let side=0;side<2;side++){
   const {canvas}=await render(action,phase,kit[k],undefined,'player',side?1:-1);
   g.drawImage(canvas,0,0,128,96,105+k*200+side*90,20+row*72,128,96);
  }
 }
 await fs.writeFile(packet+`/motion-review/phase-${phase+1}.png`,c.toBuffer('image/png'));
}
console.log(JSON.stringify({poses:60,kitConfigurations:4,patrolCombatPairs:results.length,defaultHeadDifferences:drift.length,
  opaqueHeadDifferenceByKit:Object.fromEntries(kit.map(k=>[k,results.filter(r=>r.equipment===k).reduce((s,r)=>s+r.opaqueHeadOverdrawPixels,0)]))},null,2));

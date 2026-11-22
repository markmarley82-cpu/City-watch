// Check encoded delivery files independently of the exporter.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const dir='art-review/final-four-landmarks-v2';
async function read(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
async function main(){
 const reg=JSON.parse(await fs.readFile(path.join(dir,'registration.json'))),manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json')));
 for(const row of manifest.files){const b=await fs.readFile(path.join(dir,row.file));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),row.sha256);}
 for(const row of reg)for(const sub of ['','game2x/']){
  const p={};for(const suffix of ['day','night','roof','walls','roof-night','walls-night','emission'])p[suffix]=await read(path.join(dir,sub,`${row.name}-${suffix}.webp`));
  const d=p.day;for(const v of Object.values(p)){assert.equal(v.info.width,d.info.width);assert.equal(v.info.height,d.info.height);}
  for(let i=0;i<d.data.length;i+=4){
   assert.equal(d.data[i+3],p.night.data[i+3]);
   for(const layer of ['roof','walls'])assert.equal(p[layer].data[i+3],p[layer+'-night'].data[i+3]);
   assert.equal(p.roof.data[i+3]+p.walls.data[i+3],d.data[i+3]);
   assert(p.emission.data[i+3]<=p.walls.data[i+3]);
   const l=p.roof.data[i+3]?p.roof.data:p.walls.data;if(d.data[i+3])for(let k=0;k<4;k++)assert.equal(d.data[i+k],l[i+k]);
  }
  if(sub)assert.equal(row.game2x.drawScale,.5);
  console.log(`PASS ${sub}${row.name}: identical paired alpha, exact layer partition, contained emission`);
 }
 const outpost=reg.find(r=>r.name==='outpost');for(const a of outpost.foundationAngles)assert(a>=26&&a<=27);
 console.log('PASS Outpost foundation: '+outpost.foundationAngles.map(a=>a.toFixed(3)).join(' / ')+' degrees');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

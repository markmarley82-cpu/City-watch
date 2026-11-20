// Checks the delivered art, not runtime placement or physical-device appearance.
// Run from repository root: node tools/check-city-art-packets.cjs
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const root = 'art-review';
const results = [];
async function json(file) {return JSON.parse(await fs.readFile(file,'utf8'));}
async function pixels(file) {return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
async function pair(a,b) {
  const [x,y] = await Promise.all([pixels(a),pixels(b)]);
  assert.equal(x.info.width,y.info.width,`${a}: width`);
  assert.equal(x.info.height,y.info.height,`${a}: height`);
  for(let i=3;i<x.data.length;i+=4) assert.equal(x.data[i],y.data[i],`${a}: alpha pixel ${i>>2}`);
  return x;
}
async function main() {
  for (const set of ['shop-street-v1','dockside-street-v1','artisan-street-v1','palace-main-block-v1']) {
    const dir = path.join(root,set), manifest = await json(path.join(dir,'manifest.json'));
    for(const row of manifest.files) {
      const data=await fs.readFile(path.join(dir,row.file));
      assert.equal(crypto.createHash('sha256').update(data).digest('hex'),row.sha256,`${set}/${row.file}: checksum`);
      if(row.bytes !== undefined) assert.equal(data.length,row.bytes,`${row.file}: bytes`);
      if (/\.(webp|png|jpe?g)$/i.test(row.file)) await sharp(data).metadata();
    }
    const names = manifest.buildings ? manifest.buildings.map(b=>b.name) : ['main'];
    for(const name of names) {
      const file=s=>path.join(dir,`${name}-${s}.webp`);
      const day=await pair(file('day'),file('night'));
      await pair(file('roof'),file('roof-night'));
      const walls=await pair(file('walls'),file('walls-night'));
      const roof=await pixels(file('roof'));
      const emission=await pixels(file(name==='main'?'window-emission':'emission'));
      assert.equal(day.data.length,walls.data.length,`${name}: wall canvas`);
      assert.equal(day.data.length,roof.data.length,`${name}: roof canvas`);
      assert.equal(day.data.length,emission.data.length,`${name}: emission canvas`);
      let emittingPixels=0, maxLayerAlphaExcess=0;
      for(let i=3;i<day.data.length;i+=4) {
        // Existing WebP masks differ by at most 4/255 at antialiased edges.
        // Record that quantization instead of claiming exact containment.
        maxLayerAlphaExcess=Math.max(maxLayerAlphaExcess,roof.data[i]-day.data[i],walls.data[i]-day.data[i]);
        assert(maxLayerAlphaExcess<=4,`${name}: layer outside silhouette`);
        assert(emission.data[i]<=walls.data[i],`${name}: emission outside walls`);
        if(emission.data[i]) emittingPixels++;
      }
      results.push({packet:set,name,dimensions:[day.info.width,day.info.height],alphaMismatch:0,maxLayerAlphaExcess,emissionOutsideWalls:0,emittingPixels});
    }
    if(manifest.buildings) {
      const reg=await json(path.join(dir,'registration.json'));
      for(const b of reg) {
        if(b.base) for(const side of ['left','right']) {
          const p=b.base[side],c=b.base.corner;
          assert(Math.abs(Math.abs((p[1]-c[1])/(p[0]-c[0]))-.5)<1e-6,`${b.name}: foundation projection`);
        }
        const m=manifest.buildings.find(x=>x.name===b.name);
        assert(m,`${b.name}: manifest entry`);
        const door=m.doorHeight ?? m.doorHeightRendered ?? b.doorHeightRendered;
        assert(door>65 && door<75,`${b.name}: door scale ${door}`);
      }
    }
  }
  const landmark=path.join(root,'landmark-grid-redraws');
  const nm=await json(path.join(landmark,'night/manifest.json'));
  for(const r of nm.records) {
    const source=path.join(landmark,'night',r.source), night=path.join(landmark,'night',r.night);
    await pair(source,night);
    for(const [file,sha] of [[source,r.sourceSHA256],[night,r.nightSHA256]])
      assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),sha,`${file}: checksum`);
    results.push({packet:'landmark-grid-redraws',name:r.name,alphaMismatch:0});
  }
  await pair(path.join(root,'dockside-street-v1/rope-yard-day.webp'),path.join(root,'dockside-street-v1/rope-yard-night.webp'));
  const report={date:'2026-11-20',scope:'Static art checks; runtime and physical-phone testing not performed',buildings:results.length,results};
  await fs.writeFile('docs/art/CITY-ART-PACKET-CHECKS.json',JSON.stringify(report,null,2)+'\n');
  console.log(`PASS: ${results.length} buildings plus rope yard; checksums, decode, day/night alpha, layer canvas, emission containment, street foundations and door scale.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});

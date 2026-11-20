// Export existing registered night pixels through existing roof/wall alpha masks.
// This does not repaint, resize, re-angle or replace any source artwork.
// Run from repository root: node tools/export-city-night-layers.cjs
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

async function exportLayer(dir, name, layer) {
  const night = await sharp(path.join(dir, `${name}-night.webp`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const mask = await sharp(path.join(dir, `${name}-${layer}.webp`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if (night.info.width !== mask.info.width || night.info.height !== mask.info.height) throw Error(`Canvas mismatch: ${dir}/${name}`);
  for (let i=3; i<night.data.length; i+=4) {
    night.data[i] = mask.data[i];
    if (!mask.data[i]) night.data[i-3] = night.data[i-2] = night.data[i-1] = 0;
  }
  await sharp(night.data, {raw:{width:night.info.width,height:night.info.height,channels:4}})
    .webp({lossless:true,effort:6}).toFile(path.join(dir, `${name}-${layer}-night.webp`));
}

async function main() {
  const shop = 'art-review/shop-street-v1';
  for (const name of ['cobbler','pawnbroker','curry-house','lodging']) await exportLayer(shop,name,'roof');
  const palace = 'art-review/palace-main-block-v1';
  await exportLayer(palace,'main','roof');
  await exportLayer(palace,'main','walls');
  for (const dir of [shop,palace]) {
    const file = path.join(dir,'manifest.json');
    const manifest = JSON.parse(await fs.readFile(file,'utf8'));
    manifest.files = [];
    for (const name of (await fs.readdir(dir)).filter(n=>/\.(webp|jpg|png)$/.test(n)).sort()) {
      const bytes = await fs.readFile(path.join(dir,name));
      const meta = await sharp(bytes).metadata();
      manifest.files.push({file:name,bytes:bytes.length,size:[meta.width,meta.height],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
    }
    manifest.nightLayerExport = 'Existing night RGB, existing day layer alpha, unchanged dimensions and registration; tools/export-city-night-layers.cjs';
    await fs.writeFile(file,JSON.stringify(manifest,null,2)+'\n');
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

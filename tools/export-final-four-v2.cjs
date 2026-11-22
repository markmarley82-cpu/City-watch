// Reproducible art export: lighting registration, exact alpha, cutaway partition.
// Built-in imagegen supplies the paintings; this exporter enforces the pixel contract.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const D = 'art-review/final-four-landmarks-v2';
const names = ['bakery','shrine','alley','outpost'];
const cuts = {
 bakery:[[[0,0],[1254,0],[1254,328],[1024,432],[625,579],[211,426],[0,328]]],
 shrine:[[[0,0],[1136,0],[1136,491],[906,597],[570,725],[229,634],[0,491]]],
 alley:[[[0,0],[941,0],[941,451],[792,531],[485,635],[145,575],[0,451]]],
 outpost:[[[240,0],[643,0],[643,316],[394,437],[240,391]],[[508,418],[728,523],[851,710],[851,738],[587,828],[362,749]]]
};
const doors = {bakery:[[280,839],[280,1055]],shrine:[[350,827],[350,1144]],alley:[[275,1318],[275,1539]],outpost:[[329,1054],[329,1233]]};
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
async function pix(f) {return sharp(f).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
function fit(data,w,h) {
 const bottom=[];for(let x=0;x<w;x++){let y=h-1;while(y>=0 && data[(y*w+x)*4+3]<=180)y--;bottom.push(y);}
 const occupied=bottom.map((v,i)=>v>=0?i:-1).filter(x=>x>=0);
 const l=occupied[0],r=occupied.at(-1),c=bottom.indexOf(Math.max(...bottom));
 function line(lo,hi){let n=0,sx=0,sy=0,sxx=0,sxy=0;for(let x=lo;x<hi;x++){const y=bottom[x];if(y<0)continue;n++;sx+=x;sy+=y;sxx+=x*x;sxy+=x*y;}const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);return {slope,intercept:(sy-slope*sx)/n,angleDegrees:Math.atan(Math.abs(slope))*180/Math.PI};}
 return {left:line(l+30,c-40),right:line(c+40,r-30),l,r,c,y:bottom[c]};
}
// Shift columns vertically to correct both foundation axes without changing vertical scale.
// Exported registration reports raster measurements, rather than substituting ideal metadata.
function shiftColumns(input,w,h,shift) {
 const out=Buffer.alloc(input.length);
 for(let x=0;x<w;x++)for(let y=0;y<h;y++){
  const sy=y-shift(x), y0=Math.floor(sy),t=sy-y0,i=(y*w+x)*4;
  let a=0;const rgb=[0,0,0];
  for(const [yy,weight] of [[y0,1-t],[y0+1,t]])if(yy>=0&&yy<h){const j=(yy*w+x)*4,aa=input[j+3]*weight;a+=aa;for(let k=0;k<3;k++)rgb[k]+=input[j+k]*aa;}
  out[i+3]=Math.round(a);for(let k=0;k<3;k++)out[i+k]=a?Math.round(rgb[k]/a):0;
 }
 return out;
}
function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
async function save(file,data,w,h){await sharp(data,{raw:{width:w,height:h,channels:4}}).webp({lossless:true,effort:6}).toFile(path.join(D,file));}
async function main(){
 const old=JSON.parse(await fs.readFile(path.join(D,'sources/v1-registration.json')));
 const registrations=[],qa=[],review=[];
 for(const name of names){
  const row=old.assets.find(a=>a.name===name), dv=row.variants.day,nv=row.variants.night;
  const src=await pix(path.join(D,'sources',name==='outpost'?'outpost-day-study.png':`${name}-day.webp`));
  const w=src.info.width,h=src.info.height;
  const study=await pix(await sharp(path.join(D,'sources',`${name}-night.webp`)).resize(w,h,{fit:'fill'}).png().toBuffer());
  const original=await pix(path.join(D,'sources',`${name}-day.webp`));
  const sb=await sharp(study.data,{raw:{width:w,height:h,channels:4}}).removeAlpha().blur(9).raw().toBuffer();
  const db=await sharp(original.data,{raw:{width:w,height:h,channels:4}}).removeAlpha().blur(9).raw().toBuffer();
  let day=src.data;const night=Buffer.from(day),emission=Buffer.alloc(day.length),roof=Buffer.from(day),walls=Buffer.from(day);
  const before=fit(day,w,h);
  const shift=name==='outpost'?x=>(x-before.c)*(x<=before.c?.5-before.left.slope:-.5-before.right.slope):()=>0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,j=(y*w+x)*3;
   // Only a low-frequency lighting field is transferred; architectural pixels stay registered.
   for(let k=0;k<3;k++)night[i+k]=Math.min(255,Math.round(day[i+k]*Math.max(.22,Math.min(4,sb[j+k]/Math.max(18,db[j+k])))));
   const isRoof=cuts[name].some(poly=>inside(x,y,poly));
   (isRoof?walls:roof)[i+3]=0;
   // Emission is restricted to warm bright pixels from the lighting study, on retained walls.
   if(!isRoof&&study.data[i]>175&&study.data[i+1]>105&&study.data[i]-study.data[i+2]>65){
    emission[i]=255;emission[i+1]=176;emission[i+2]=60;
    emission[i+3]=Math.min(day[i+3],Math.round(Math.max(0,study.data[i]-175)*2.5));
   }
   for(const p of [day,night,roof,walls,emission])if(!p[i+3])p[i]=p[i+1]=p[i+2]=0;
  }
  if(name==='outpost')day=shiftColumns(day,w,h,shift);
  const n=name==='outpost'?shiftColumns(night,w,h,shift):night;
  // Repartition after resampling: no double-alpha seam at the roof boundary.
  const warpedRoof=name==='outpost'?shiftColumns(roof,w,h,shift):roof;
  const e=name==='outpost'?shiftColumns(emission,w,h,shift):emission;
  const r=Buffer.from(day),wa=Buffer.from(day),rn=Buffer.from(n),wn=Buffer.from(n);
  for(let i=0;i<day.length;i+=4){
   const roofPixel=warpedRoof[i+3]>day[i+3]/2;
   if(roofPixel){wa[i+3]=wn[i+3]=0;e[i+3]=0;}else r[i+3]=rn[i+3]=0;
   e[i+3]=Math.min(e[i+3],wa[i+3]);
   for(const p of [day,n,r,wa,rn,wn,e])if(!p[i+3])p[i]=p[i+1]=p[i+2]=0;
  }
  const outputs={day,night:n,roof:r,walls:wa,'roof-night':rn,'walls-night':wn,emission:e};
  for(const [suffix,data]of Object.entries(outputs))await save(`${name}-${suffix}.webp`,data,w,h);
  const after=fit(day,w,h),scale=70/Math.abs(doors[name][1][1]-doors[name][0][1]);
  const gw=Math.round(w*scale*2),gh=Math.round(h*scale*2);
  await fs.mkdir(path.join(D,'game2x'),{recursive:true});
  const game={};
  for(const s of ['day','night','roof','emission'])game[s]=await pix(await sharp(path.join(D,`${name}-${s}.webp`)).resize(gw,gh).png().toBuffer());
  const gd=game.day.data,gn=game.night.data,gr=Buffer.from(gd),gwall=Buffer.from(gd),grn=Buffer.from(gn),gwn=Buffer.from(gn),ge=game.emission.data;
  for(let i=0;i<gd.length;i+=4){
   gn[i+3]=gd[i+3];
   if(game.roof.data[i+3]>gd[i+3]/2){gwall[i+3]=gwn[i+3]=0;ge[i+3]=0;}else gr[i+3]=grn[i+3]=0;
   ge[i+3]=Math.min(ge[i+3],gwall[i+3]);
   for(const p of [gd,gn,gr,gwall,grn,gwn,ge])if(!p[i+3])p[i]=p[i+1]=p[i+2]=0;
  }
  for(const [s,data]of Object.entries({day:gd,night:gn,roof:gr,walls:gwall,'roof-night':grn,'walls-night':gwn,emission:ge}))await save(`game2x/${name}-${s}.webp`,data,gw,gh);
  const base={left:[after.l,after.left.slope*after.l+after.left.intercept],corner:[after.c,after.y],right:[after.r,after.right.slope*after.r+after.right.intercept]};
  registrations.push({name,dimensions:[w,h],nativeAnchor:base.corner,base,drawScale:scale,doorHeightRendered:70,doorBracket:doors[name],game2x:{directory:'game2x/',dimensions:[gw,gh],drawScale:.5,nativeAnchor:[base.corner[0]*gw/w,base.corner[1]*gh/h],base:Object.fromEntries(Object.entries(base).map(([key,p])=>[key,[p[0]*gw/w,p[1]*gh/h]])),doorHeightRendered:70},sourceFootprint:dv.base,foundationAngles:[after.left.angleDegrees,after.right.angleDegrees],roofMaskPolygons:cuts[name],columnCorrection:name==='outpost'?{pivot:before.c,leftSlopeDelta:.5-before.left.slope,rightSlopeDelta:-.5-before.right.slope}:null,status:'Proposed; creative and in-game review pending',files:Object.fromEntries(Object.keys(outputs).map(s=>[s,`${name}-${s}.webp`]))});
  // Verify the final encoded WebPs, not just the in-memory intermediates.
  const encoded={};for(const s of Object.keys(outputs))encoded[s]=(await pix(path.join(D,`${name}-${s}.webp`))).data;
  let alphaMismatch=0,layerMismatch=0,emissionOutsideWalls=0,unlit=0;
  for(let i=0;i<day.length;i+=4){
   if(encoded.day[i+3]!==encoded.night[i+3])alphaMismatch++;
   for(const s of ['roof','walls'])if(encoded[s][i+3]!==encoded[s+'-night'][i+3])alphaMismatch++;
   if(encoded.roof[i+3]+encoded.walls[i+3]!==encoded.day[i+3])layerMismatch++;
   if(encoded.emission[i+3]>encoded.walls[i+3])emissionOutsideWalls++;
   const layer=encoded.roof[i+3]?encoded.roof:encoded.walls;
   if(encoded.day[i+3]&&[0,1,2,3].some(k=>encoded.day[i+k]!==layer[i+k]))unlit++;
  }
  if(alphaMismatch||layerMismatch||emissionOutsideWalls||unlit)throw Error(`${name}: encoded contract failed`);
  if(name==='outpost'&&[after.left.angleDegrees,after.right.angleDegrees].some(a=>a<26||a>27))throw Error('Outpost foundation failed 26–27 degree requirement');
  qa.push({name,dimensions:[w,h],alphaMismatch,layerMismatch,emissionOutsideWalls,dayRecompositionMismatch:unlit,foundationAngles:[after.left.angleDegrees,after.right.angleDegrees],runtimeVerified:false,physicalPhoneVerified:false});
  // Same-scale two-column review; no live game changes.
  const cellW=440,cellH=640;
  for(const s of ['day','night','walls']){
   const img=await sharp(path.join(D,`${name}-${s}.webp`)).resize({width:Math.round(w*scale),height:Math.round(h*scale)}).png().toBuffer();
   const meta=await sharp(img).metadata();
   const label=Buffer.from(`<svg width="440" height="640"><text x="12" y="24" font-family="sans-serif" font-size="17" fill="#eee">${name}: ${s} (door 70px)</text><path d="M18 450v-60m-8 0h16m-16 60h16" stroke="#e9c675" stroke-width="3"/><text x="38" y="430" fill="#e9c675" font-size="16">60px officer</text></svg>`);
   review.push(await sharp({create:{width:cellW,height:cellH,channels:3,background:'#343b3b'}}).composite([{input:img,left:Math.floor((cellW-meta.width)/2),top:Math.max(35,cellH-meta.height-20)},{input:label}]).png().toBuffer());
  }
 }
 await fs.writeFile(path.join(D,'registration.json'),JSON.stringify(registrations,null,2)+'\n');
 await fs.writeFile(path.join(D,'qa.json'),JSON.stringify({checks:qa,limitations:['Asset review only; no game placement, runtime lighting or physical-device sign-off.','Roof layers include upper gables; walls are retained exteriors, not furnished interiors.','Non-Outpost geometry is preserved from v1 and retains its measured raster tolerances.']},null,2)+'\n');
 await sharp({create:{width:1320,height:2560,channels:3,background:'#343b3b'}}).composite(review.map((input,i)=>({input,left:(i%3)*440,top:Math.floor(i/3)*640}))).jpeg({quality:90}).toFile(path.join(D,'review.jpg'));
 const files=[];for(const file of (await fs.readdir(D)).filter(f=>/webp$|jpg$/.test(f)).sort()){const b=await fs.readFile(path.join(D,file));files.push({file,bytes:b.length,sha256:hash(b)});}
 await fs.writeFile(path.join(D,'manifest.json'),JSON.stringify({packet:'final-four-landmarks-v2',status:'Proposed',buildings:registrations.map(r=>({name:r.name,doorHeight:70})),files},null,2)+'\n');
 console.log(JSON.stringify(qa,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});

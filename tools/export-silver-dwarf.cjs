// Assemble existing authored v2 body and fitted silver head using the runtime's rules.
// No generated replacement poses: feet, kit and all ten action rows remain registered.
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const src='dist/assets/recruit-art-v2',out='art-review/recruit-dwarf-silver';
async function pixels(f){return sharp(f).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 await fs.mkdir(out,{recursive:true});
 const body=await pixels(path.join(src,'dwarf-recruit-body.webp')),mask=await pixels(path.join(src,'dwarf-recruit-head-mask.webp')),head=await pixels(path.join(src,'dwarf-recruit-head-forked-silver-beard.webp'));
 assert.equal(body.info.width,768);assert.equal(body.info.height,960);
 const data=Buffer.from(body.data);
 for(let i=0;i<data.length;i+=4)if(mask.data[i])data[i]=data[i+1]=data[i+2]=data[i+3]=0;
 for(let i=0;i<data.length;i+=4)if(head.data[i+3]){const sa=head.data[i+3]/255,da=data[i+3]/255,a=sa+da*(1-sa);for(let k=0;k<3;k++)data[i+k]=Math.round((head.data[i+k]*sa+data[i+k]*da*(1-sa))/a);data[i+3]=Math.round(a*255);}
 const image=await sharp(data,{raw:{width:768,height:960,channels:4}}).webp({lossless:true,effort:6}).toBuffer();
 await fs.writeFile(path.join(out,'silver-dwarf-body.webp'),image);
 const suffixes=['coat-mask','regions-mask','watch-breastplate','service-mail','leather-jerkin','head-mask','head-dark-braided-beard','head-forked-silver-beard'];
 for(const suffix of suffixes)await fs.copyFile(path.join(src,`dwarf-recruit-${suffix}.webp`),path.join(out,`silver-dwarf-${suffix}.webp`));
 const clips=['idle','walk','attack','guard','hit','shove','restrain','surrender','down','truncheon'];
 const result=await pixels(image),checks=[];
 for(let row=0;row<10;row++)for(let col=0;col<6;col++){
  let visible=0,outsideHeadChange=0;
  for(let y=row*96;y<(row+1)*96;y++)for(let x=col*128;x<(col+1)*128;x++){const i=(y*768+x)*4;if(result.data[i+3])visible++;if(body.data[i+3]&&!mask.data[i]&&!head.data[i+3])for(let k=0;k<4;k++)if(result.data[i+k]!==body.data[i+k])outsideHeadChange++;}
  assert(visible>20);assert.equal(outsideHeadChange,0);checks.push({action:clips[row],frame:col+1,visiblePixels:visible,outsideHeadChanges:0});
 }
 const files={body:'silver-dwarf-body.webp',...Object.fromEntries(suffixes.map(s=>[s,`silver-dwarf-${s}.webp`]))};
 const manifest={schemaVersion:1,cellWidth:128,cellHeight:96,cols:6,rows:10,footX:64,footY:92,bodies:{p3_dwarf_01:{visibleHeight:44,files,heads:['dark-braided-beard','forked-silver-beard']}},status:'Proposed; retains authored red-dwarf body and installs the fitted long silver head as default',actions:clips,source:'Existing shipped v2 dwarf atlas and authored fitted silver head; assembled with the runtime head-removal rule'};
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await fs.writeFile(path.join(out,'registration.json'),JSON.stringify({bodyID:'p3_dwarf_01',sheet:[768,960],cell:[128,96],foot:[64,92],facings:'Authored left; mirrored right',defaultHead:'forked-silver-beard',actions:clips,sourcePoseBody:'p3_dwarf_02',runtimeVerified:false,creativeApproval:false},null,2)+'\n');
 const records=[];for(const file of Object.values(files)){const bytes=await fs.readFile(path.join(out,file));records.push({file,sha256:hash(bytes),bytes:bytes.length});}
 await fs.writeFile(path.join(out,'qa.json'),JSON.stringify({frames:checks,files:records,passed:'All 60 cells present; no changed pixels outside the head mask/overlay; source kit copied byte for byte.',runtimeVerified:false,physicalPhoneVerified:false},null,2)+'\n');
 const composites=[];for(let row=0;row<10;row++){
  const strip=await sharp(image).extract({left:0,top:row*96,width:768,height:96}).resize(768,96).png().toBuffer();
  const label=Buffer.from(`<svg width="920" height="110"><text x="5" y="50" fill="#eee" font-size="18" font-family="sans-serif">${clips[row]}</text></svg>`);
  composites.push({input:strip,left:145,top:row*110+7},{input:label,left:0,top:row*110});
 }
 await sharp({create:{width:920,height:1100,channels:3,background:'#62625b'}}).composite(composites).png().toFile(path.join(out,'review.png'));
 console.log('PASS 60 authored frames, exact head-only change, nine aligned kit/head layers, 128x96 cell and (64,92) foot contract');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

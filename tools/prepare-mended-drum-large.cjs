/* Deterministic game-asset registration/export of the generated source. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sharp=require('sharp');
const dir='art-review/mended-drum-large-v1',p=n=>path.join(dir,n);
(async()=>{
 const {data,info}=await sharp(p('source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const src={left:[181,760],corner:[832,1006],right:[1364,755]},v=140/190;
 // In this engine project([x,y]) = [(x-y)*28,(x+y)*14].
 // At 2x: 9 cells along the left face, 8 along the right.
 const hs=[9*56/(832-181),8*56/(1364-832)],slopes=[(1006-760)/(832-181),(755-1006)/(1364-832)];
 const xmap=x=>(x-832)*(x<=832?hs[0]:hs[1]);
 const shift=x=>{const face=x<=832?0:1;return (face===0?.5:-.5)*xmap(x)-v*slopes[face]*(x-832);};
 const all=[];for(let x=0;x<info.width;x++)all.push(shift(x));
 const minX=Math.floor(xmap(0))-24,maxX=Math.ceil(xmap(info.width-1))+24,minY=Math.floor(Math.min(...all))-24,maxY=Math.ceil(v*(info.height-1)+Math.max(...all))+24;
 const width=maxX-minX+1,height=maxY-minY+1,out=Buffer.alloc(width*height*4);
 // Inverse sample premultiplied RGB to prevent edge mattes. Preserve source; export normalises 250+ alpha only.
 function sample(x,y,c){if(x<0||y<0||x>=info.width||y>=info.height)return 0;const idx=(y*info.width+x)*4,a=data[idx+3];return c===3?(a>=250?255:a):data[idx+c]*(a>=250?255:a)/255;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const nx=x+minX,sx=nx/(nx<=0?hs[0]:hs[1])+832,sy=(y+minY-shift(sx))/v;
  const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,w=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy],xy=[[x0,y0],[x0+1,y0],[x0,y0+1],[x0+1,y0+1]],q=[];
  for(let c=0;c<4;c++)q[c]=xy.reduce((s,[a,b],i)=>s+w[i]*sample(a,b,c),0);
  const idx=(y*width+x)*4;out[idx+3]=Math.round(q[3]);for(let c=0;c<3;c++)out[idx+c]=q[3]>0?Math.round(q[c]*255/q[3]):0;
 }
 const point=([x,y])=>[xmap(x)-minX,v*y+shift(x)-minY];
 const base=Object.fromEntries(Object.entries(src).map(([k,q])=>[k,point(q)]));
 const reg={id:'mended-drum-large-v1',file:'drum-day-2x.webp',dimensions:[width,height],drawScale:.5,anchor:base.corner,foundation:base,footprintCells:[9,8],footprintProjection:{xStep:28,yStep:14},door:{sourceTop:[481,665],sourceFoot:[481,855],top:point([481,665]),foot:point([481,855]),screenHeight:70},source:'source.png',method:'Per-face horizontal registration and vertical column projection; uniform vertical scale, no cropped chimneys. Near-opaque generated alpha normalised during export.',sourceFoundation:src,sourceRevision:JSON.parse(fs.readFileSync(p('registration.json'))).sourceRevision,creativeApproval:false,runtimeIntegrated:false,physicalPhoneVerified:false};
 const png=await sharp(out,{raw:{width,height,channels:4}}).png().toBuffer();
 await sharp(png).webp({lossless:true,effort:6}).toFile(p('drum-day-2x.webp'));
 await sharp(png).resize(Math.round(width/2),Math.round(height/2)).webp({lossless:true,effort:6}).toFile(p('drum-day-game.webp'));
 await sharp(png).png().toFile(p('registered.png'));
 reg.sha256=crypto.createHash('sha256').update(fs.readFileSync(p(reg.file))).digest('hex');
 fs.writeFileSync(p('game-registration.json'),JSON.stringify(reg,null,2)+'\n');
 const angles=[base.left,base.right].map(q=>Math.atan2(Math.abs(q[1]-base.corner[1]),Math.abs(q[0]-base.corner[0]))*180/Math.PI);
 angles.forEach(a=>assert(Math.abs(a-26.565051177)<1e-6));
 assert(Math.abs((reg.door.foot[1]-reg.door.top[1])*.5-70)<1e-8);
 const decoded=await sharp(p(reg.file)).ensureAlpha().raw().toBuffer();assert(decoded.equals(out),'Lossless WebP differs from registered raw pixels');
 // Pale, dark and cobble composites use exact screen-size artwork and a 60px height gauge.
 const panels=[];for(const bg of ['#e6dfd2','#161b20','#625f54']){
  const sw=Math.round(width/2),sh=Math.round(height/2);
  const backdrop=Buffer.from('<svg width="'+sw+'" height="'+(sh+35)+'"><rect width="100%" height="100%" fill="'+bg+'"/><path d="M20 20v60m-4-60h8m-8 60h8" stroke="#e03638" stroke-width="3"/><text x="30" y="55" fill="#e03638" font-size="12">60 px officer</text></svg>');
  panels.push(await sharp(backdrop).composite([{input:await sharp(png).resize(sw,sh).png().toBuffer(),top:25,left:0}]).png().toBuffer());
 }
 const meta=await sharp(panels[0]).metadata();await sharp({create:{width:meta.width*3,height:meta.height,channels:4,background:'#222'}}).composite(panels.map((input,i)=>({input,left:i*meta.width,top:0}))).webp({quality:90}).toFile(p('review-sheet.webp'));
 const report={exportGeometryPass:true,angles,doorScreenHeight:70,footprintCells:[9,8],foundationScreenSpans:[252,224],losslessPixels:true,dimensions:[width,height],sourcePreserved:true};
 fs.mkdirSync('qa-results',{recursive:true});fs.writeFileSync('qa-results/drum-export.json',JSON.stringify(report,null,2));fs.writeFileSync(p('export-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

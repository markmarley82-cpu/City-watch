/* Test-server instrumentation only. No dist mutation. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='qa-results',packet='art-review/mended-drum-large-v1';fs.mkdirSync(out,{recursive:true});
const inject="window.__DrumSurvey={objects:sceneryObjects.filter(o=>o.rect).map(o=>({id:o.id,rect:o.rect,kind:o.sceneryKind,mode:o.collisionMode})),doors:[...world.doors.values()].map(d=>({id:d.game_id,p:d.position,held:d.held})),roads:[...world.members.keys()].map(k=>k.split(',').map(Number)),water:world.water};";
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith('/City-watch/')){res.writeHead(404);return res.end();}
 const rel=decodeURIComponent(u.pathname.slice(12)),root=path.resolve('dist'),file=path.resolve(root,rel||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.html':'text/html','.webp':'image/webp','.png':'image/png','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 if(rel==='city.mjs'){let s=fs.readFileSync(file,'utf8'),marker='window.CWRebuiltCity=Object.freeze(';assert(s.includes(marker));res.end(s.replace(marker,inject+'\n'+marker));}else fs.createReadStream(file).pipe(res);
});
function wet(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function overlap(a,b){return a[0]-.5<b[0]+b[2]-.5&&a[0]+a[2]-.5>b[0]-.5&&a[1]-.5<b[1]+b[3]-.5&&a[1]+a[3]-.5>b[1]-.5;}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/City-watch/index.html');
  await page.waitForFunction(()=>document.body.dataset.cityBoot==='ready'&&window.__DrumSurvey,null,{timeout:240000});
  const survey=await page.evaluate(()=>window.__DrumSurvey),old=survey.objects.find(o=>o.id==='LANDMARK-510:drum');assert(old);
  fs.writeFileSync(packet+'/site-context.json',JSON.stringify({objects:survey.objects.filter(o=>overlap(o.rect,[75,215,55,60])),roads:survey.roads.filter(p=>p[0]>=75&&p[0]<=130&&p[1]>=215&&p[1]<=275),doors:survey.doors.filter(d=>d.p?.[0]>=75&&d.p[0]<=130&&d.p[1]>=215&&d.p[1]<=275),water:survey.water},null,2));
  const candidates=[];
  for(let x=old.rect[0]-8;x<=old.rect[0]+3;x++)for(let y=old.rect[1]-8;y<=old.rect[1]+3;y++){
   const r=[x,y,8,9];if(!overlap(r,old.rect))continue;
   const buildings=survey.objects.filter(o=>o.id!==old.id&&overlap(r,o.rect)&&o.mode!=='none'&&!/lamp|river|paving|ground|boat|bridge|prop|fountain/.test(o.id));
   const roads=survey.roads.filter(p=>p[0]>=x-.5&&p[0]<x+7.5&&p[1]>=y-.5&&p[1]<y+8.5),water=[];
   for(let a=x;a<x+8;a++)for(let b=y;b<y+9;b++)if(survey.water.some(poly=>wet([a,b],poly)))water.push([a,b]);
   const doors=survey.doors.filter(d=>d.id!=='drum'&&d.p?.[0]>=x-.5&&d.p[0]<x+7.5&&d.p[1]>=y-.5&&d.p[1]<y+8.5);
   candidates.push({rect:r,buildingConflicts:buildings.map(o=>({id:o.id,rect:o.rect})),roadCells:roads.length,waterCells:water.length,doorConflicts:doors.map(d=>d.id),distance:Math.abs(x-old.rect[0])+Math.abs(y-old.rect[1])});
  }
  candidates.sort((a,b)=>(a.waterCells-b.waterCells)||((a.doorConflicts.length-b.doorConflicts.length)*1000+(a.roadCells-b.roadCells)*10+(a.buildingConflicts.length-b.buildingConflicts.length)*20)||(a.distance-b.distance));
  const best=candidates[0],report={boot:'ready',surveyedSource:'real city sceneryObjects after startup',old,orientation:{rectWidth:8,rectHeight:9,leftFaceCells:9,rightFaceCells:8},candidateCount:candidates.length,bestCandidates:candidates.slice(0,8),clearSiteFound:candidates.some(c=>!c.roadCells&&!c.waterCells&&!c.doorConflicts.length&&!c.buildingConflicts.length),pageErrors:errors,mapChanged:false};
  fs.writeFileSync(out+'/drum-site-survey.json',JSON.stringify(report,null,2));fs.writeFileSync(packet+'/site-survey.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  const scale=18,svg=['<svg xmlns="http://www.w3.org/2000/svg" width="900" height="800"><rect width="100%" height="100%" fill="#212626"/><style>text{font:12px sans-serif;fill:white}</style><text x="20" y="24">Mended Drum enlargement: runtime footprint survey (top-down)</text>'];
  const rect=(r,fill,stroke)=>'<rect x="'+(40+(r[0]-90)*scale)+'" y="'+(70+(r[1]-226)*scale)+'" width="'+r[2]*scale+'" height="'+r[3]*scale+'" fill="'+fill+'" stroke="'+stroke+'"/>';
  for(const p of survey.roads.filter(p=>p[0]>=90&&p[0]<=122&&p[1]>=226&&p[1]<=257))svg.push(rect([p[0],p[1],1,1],'#627465','#72856f'));
  for(const o of survey.objects.filter(o=>overlap(o.rect,[90,226,32,31])))svg.push(rect(o.rect,'#393f46','#88929b'));
  svg.push(rect(old.rect,'#8f784d','#f7cc6d'),rect(best.rect,'#d76f3633','#ff815c'),'<text x="650" y="100">Gold: existing tavern</text><text x="650" y="125">Orange: best candidate</text><text x="650" y="150">Green: registered roads</text><text x="650" y="175">Grey: other objects</text></svg>');
  fs.writeFileSync(packet+'/site-plan.svg',svg.join(''));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

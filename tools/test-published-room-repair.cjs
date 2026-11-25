const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base='https://markmarley82-cpu.github.io/City-watch/';
(async()=>{
 const text=fs.readFileSync('dist/guild-interiors/interior-view.mjs','utf8');
 let ready=false;
 for(let i=0;i<24;i++){const r=await fetch(base+'guild-interiors/interior-view.mjs?release=28c978d1');if(r.ok&&(await r.text())===text){ready=true;break;}await new Promise(r=>setTimeout(r,15000));}
 assert(ready,'Published room view did not update');
 const shop=JSON.parse(fs.readFileSync('dist/guild-interiors/assets/shopkeepers-v2/manifest.json'));
 const files=['guild-interiors/interior-view.mjs','guild-interiors/cw-guild-contact-view.mjs','guild-interiors/cw-guild-contact-view.css','guild-interiors/rooms.json','guild-interiors/room-presentation.mjs','guild-interiors/room-markup.mjs','guild-interiors/guild-host.mjs','cw-recruit-art-v2.mjs','cw-character-runtime.js','character-actors.mjs','character-studio.mjs','city.mjs','phone-map.js','cw-p21-game.mjs','guild-interiors/assets/shopkeepers-v2/manifest.json',...Object.values(shop.characters).map(c=>'guild-interiors/'+c.image)];
 for(const f of fs.readdirSync('dist/assets/recruit-art-hd',{recursive:true}))if(fs.statSync('dist/assets/recruit-art-hd/'+f).isFile())files.push('assets/recruit-art-hd/'+f);
 let i=0;
 await Promise.all(Array.from({length:8},async()=>{while(i<files.length){const f=files[i++],r=await fetch(base+f+'?release=28c978d1');assert(r.ok,'Missing live asset '+f);const actual=Buffer.from(await r.arrayBuffer()),expected=fs.readFileSync('dist/'+f);assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),crypto.createHash('sha256').update(expected).digest('hex'),'Live file differs '+f);}}));
 const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:390,height:700},deviceScaleFactor:3,isMobile:true,hasTouch:true});await p.goto(base+'?release=28c978d1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});assert.equal(await p.locator('body').getAttribute('data-city-boot'),'ready');fs.mkdirSync('qa-results/live-release',{recursive:true});await p.screenshot({path:'qa-results/live-release/startup.jpg'});fs.writeFileSync('qa-results/live-release/results.json',JSON.stringify({passed:true,url:base,filesVerified:files.length,sha256:true,mobileStartup:'ready',physicalIPhoneVerified:false},null,2));console.log('PASS live release:',files.length,'exact file hashes and mobile startup');}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

/* LAB01: compact build identity and reversible artwork comparison. */
(function(){'use strict';
 const brand=document.querySelector('#app .brand');
 if(brand){const badge=document.createElement('small');badge.id='lab-build-badge';badge.textContent=window.CW_LAB_RELEASE.badge;badge.title=window.CW_LAB_RELEASE.label+' · '+window.CW_LAB_RELEASE.purpose;badge.style.cssText='font:700 8px system-ui;display:inline-block;margin-left:5px;padding:2px 3px;border:1px solid #ae8854;border-radius:3px;vertical-align:middle;color:#ffe1a2';brand.appendChild(badge);}
 const favicon=document.createElement('link');favicon.rel='icon';favicon.href='icon-192.exact.webp';document.head.appendChild(favicon);
 const grid=document.getElementById('p13-menu-grid'),menu=document.getElementById('p13-menu');if(!grid)return;
 const add=(id,label,fn)=>{const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.onclick=()=>{menu?.classList.remove('open');fn(b);};grid.appendChild(b);return b;};
 const labelArt=b=>{const s=window.CWLabArt?.status();b.textContent=!s?'Watch art: Gate-B reference':s.errors.length?'Watch art: fallback reference':!s.ready?'Watch art: loading…':s.effectiveMode==='study'?'Watch art: '+window.CW_LAB_RELEASE.art.label:'Watch art: Gate-B reference';};
 const artButton=add('lab-art-compare','Watch art: loading…',b=>{const mode=window.CWLabArt?.status().requestedMode==='study'?'reference':'study';window.CWLabArt?.setMode(mode);labelArt(b);});
 artButton.classList.add('cw-review-item');
 // Keep the checkpoint's default artwork stable during ordinary play.
 // Historical artwork comparison remains available inside Developer review.
 const syncArtReview=()=>{const enabled=!!window.CW_P20_DEV_REVIEW;artButton.hidden=!enabled;if(!enabled)window.CWLabArt?.setMode('study');labelArt(artButton);};
 const app=document.getElementById('app');
 if(app)new MutationObserver(syncArtReview).observe(app,{attributes:true,attributeFilter:['class']});
 syncArtReview();window.CWLabArt?.ready.then(syncArtReview);
 add('lab-square-view','View Watch Square',()=>window.CW_P20_BASE?.focus('wide'));
 add('lab-follow-player','Follow recruit',()=>window.CW_P20_BASE?.follow());
})();

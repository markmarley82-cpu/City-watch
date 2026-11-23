/* Conversation portraits (art/portraits-v1, 23 Nov 2026). When a parchment dialogue opens with a named
   speaker as its heading (Sergeant Colon, Nobby, Carrot, Vimes, Mrs Palm, Dibbler), show that speaker's
   portrait beside the words. Only headings are matched, so a name inside a sentence never triggers it. */
(function(){
 'use strict';
 const BASE='assets/portraits-v1/',V='?v=1';
 const PEOPLE=[
  [/^(sergeant\s+)?(fred\s+)?colon\b/i,'colon','Sergeant Colon'],
  [/^(corporal\s+)?nobby(\s+nobbs)?\b|^corporal\s+nobbs\b/i,'nobby','Corporal Nobbs'],
  [/^(captain\s+)?carrot\b/i,'carrot','Captain Carrot'],
  [/^(commander\s+)?(sir\s+)?(sam(uel)?\s+)?vimes\b/i,'vimes','Commander Vimes'],
  [/^mrs\.?\s+(rosemary\s+)?palm\b/i,'mrs-palm','Mrs Palm'],
  [/^(cut-me-own-throat\s+)?(c\.?\s*m\.?\s*o\.?\s*t\.?\s+)?dibbler\b/i,'dibbler','Dibbler']
 ];
 function who(text){const t=String(text||'').trim();for(const [re,file,name] of PEOPLE)if(re.test(t))return {file,name};return null;}
 function decorate(root){
  for(const h of root.querySelectorAll('dialog[open] :is(h2,h3)')){
   if(h.id==='p21-duty-title'||h.closest('header'))continue;
   const box=h.parentElement;if(!box)continue;
   // A dialogue with its own profile already shows the current speaker.
   if(h.closest('dialog')?.querySelector('.cw-dialogue-portrait')){
    box.querySelector(':scope > img.cw-speaker-portrait')?.remove();
    box.classList.remove('cw-has-speaker');continue;
   }
   const p=who(h.textContent);
   const old=box.querySelector(':scope > img.cw-speaker-portrait');
   if(!p){if(old&&old.nextElementSibling===h){old.remove();box.classList.remove('cw-has-speaker');}continue;}
   if(old&&old.dataset.who===p.file)continue;old?.remove();
   const img=new Image();img.className='cw-speaker-portrait';img.alt='';img.dataset.who=p.file;img.decoding='async';img.src=BASE+p.file+'.webp'+V;
   box.classList.add('cw-has-speaker');h.before(img);
  }
 }
 let queued=false;
 const run=()=>{queued=false;try{decorate(document);}catch(e){console.warn('Speaker portraits',e);}};
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(run);}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 globalThis.CWSpeakerPortraits=Object.freeze({who,decorate});
})();

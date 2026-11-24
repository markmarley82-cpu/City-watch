/* Conversation portraits (art/portraits-v1, 23 Nov 2026). When a parchment dialogue opens with a named
   speaker as its heading (Sergeant Colon, Nobby, Carrot, Vimes, Mrs Palm, Dibbler), show that speaker's
   portrait beside the words. Only headings are matched, so a name inside a sentence never triggers it. */
(function(){
 'use strict';
 const BASE='assets/portraits-v1/',V='?v=2';
 const PEOPLE=[
  [/^(sergeant\s+)?(fred\s+)?colon\b/i,'colon','Sergeant Colon'],
  [/^(corporal\s+)?nobby(\s+nobbs)?\b|^corporal\s+nobbs\b/i,'nobby','Corporal Nobbs'],
  [/^(captain\s+)?carrot\b/i,'carrot','Captain Carrot'],
  [/^(commander\s+)?(sir\s+)?(sam(uel)?\s+)?vimes\b/i,'vimes','Commander Vimes'],
  [/^mrs\.?\s+(rosemary\s+)?palm\b/i,'mrs-palm','Mrs Palm'],
  [/^(cut-me-own-throat\s+)?(c\.?\s*m\.?\s*o\.?\s*t\.?\s+)?dibbler\b/i,'dibbler','Dibbler']
 ];
 // Street people in city cases, matched on the case's speaker line only (checked case by case, 23 Nov).
 const STREET=[
  [/^(a|the)\s+porter$/i,'porter'],[/^(a|the)\s+(flour-dusted\s+)?baker$/i,'baker'],[/^(a|the)\s+net-mender$/i,'net-mender'],
  [/^(a|the)\s+(anxious\s+)?stallholder$/i,'stallholder'],[/^(a|the)\s+dock\s+clerk$/i,'dock-clerk'],[/^(a|the)\s+carter$/i,'carter']
 ];
 function who(text,street=false){const t=String(text||'').trim();for(const [re,file,name] of PEOPLE)if(re.test(t))return {file,name};if(street)for(const [re,file] of STREET)if(re.test(t))return {file,name:t};return null;}
 function decorate(root){
  for(const h of root.querySelectorAll('dialog[open] :is(h2,h3,p.cw-case-speaker)')){
   if(h.id==='p21-duty-title'||h.closest('header'))continue;
   // The contacts folio already shows the speaker's portrait in its side panel.
   if(h.closest('dialog')?.querySelector('.cw-dialogue-portrait :is(img,canvas)')){h.parentElement?.querySelector(':scope > img.cw-speaker-portrait')?.remove();continue;}
   const p=who(h.textContent,h.matches('p.cw-case-speaker')),box=h.parentElement;if(!box)continue;
   const old=box.querySelector(':scope > img.cw-speaker-portrait');
   if(!p){if(old&&old.nextElementSibling===h)old.remove();continue;}
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

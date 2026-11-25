/* Use the same approved faces in campaign conversations and city contacts. */
(function(root){
 'use strict';
 const faces=Object.freeze({p3_named_colon_base:['colon','Sergeant Colon'],colon:['colon','Sergeant Colon'],p3_named_carrot_base:['carrot','Captain Carrot'],carrot:['carrot','Captain Carrot'],p3_named_vimes_base:['vimes','Commander Vimes'],vimes:['vimes','Commander Vimes'],p3_named_mrs_palm_base:['mrs-palm','Mrs Palm'],'mentor-nobby':['nobby','Nobby Nobbs'],'portrait-dibbler':['dibbler','Dibbler']});
 function paint(container,key,large=false){
  const face=faces[key];if(!face)return false;
  container.replaceChildren();container.classList.add('people-face');container.classList.toggle('people-face-large',large);container.dataset.character=key;
  const img=container.ownerDocument.createElement('img');img.alt='Portrait of '+face[1];img.decoding='async';img.width=img.height=160;img.dataset.campaignPortrait=face[0];
  img.onerror=()=>{if(container.dataset.character!==key||container.firstElementChild!==img)return;const seal=container.ownerDocument.createElement('span');seal.className='cw-dialogue-initial';seal.textContent='CW';seal.setAttribute('aria-label','City Watch seal');container.replaceChildren(seal);};
  img.src='assets/portraits-v1/'+face[0]+'.webp?v=2';container.append(img);return true;
 }
 root.CWCampaignPortraits=Object.freeze({paint});
})(globalThis);

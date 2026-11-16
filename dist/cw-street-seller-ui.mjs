// Shared presentation only. Seller transactions retain their canonical stores.
export function styleStreetSeller(dialog){
 if(!document.getElementById('cw-street-seller-style')){
  const link=document.createElement('link');link.id='cw-street-seller-style';link.rel='stylesheet';
  link.href=new URL('./cw-street-sellers.css?v=p21-b461-watch-ui',import.meta.url).href;
  document.head.append(link);
 }
 dialog.classList.add('cw-street-seller');
}

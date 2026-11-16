export const NEWSPAPER_PRICE=1;
export const PAPERS=Object.freeze(['times','inquirer']);
export function editionFor(state){return 'watch-night-'+(Number.isSafeInteger(state?.night)&&state.night>0?state.night:1);}
export function ownsNewspaper(state,paper,edition=editionFor(state)){
  if(!PAPERS.includes(paper))return false;
  const receipt=state?.flags?.newspaperPurchases?.[paper+'@'+edition];
  return receipt?.paper===paper&&receipt.edition===edition&&Number.isSafeInteger(receipt.price)&&receipt.price>0;
}
// Money and ownership are committed together in the existing canonical patrol record.
export function purchaseNewspaper({storage,api,paper,price=NEWSPAPER_PRICE,expectedEdition}){
  if(!PAPERS.includes(paper)||!Number.isSafeInteger(price)||price<1)return {ok:false,reason:'invalid'};
  const campaign=api.create(storage),state=campaign.read().state,edition=editionFor(state);
  if(expectedEdition&&expectedEdition!==edition)return {ok:false,reason:'edition'};
  if(ownsNewspaper(state,paper,edition))return {ok:true,charged:0,alreadyOwned:true,paper,edition,balance:state.coins};
  if(!Number.isSafeInteger(state.coins)||state.coins<price)return {ok:false,reason:'funds',balance:state.coins,price};
  state.coins-=price;
  const prior=state.flags.newspaperPurchases;
  state.flags.newspaperPurchases={...(prior&&typeof prior==='object'&&!Array.isArray(prior)?prior:{}),[paper+'@'+edition]:{paper,edition,price}};
  try{campaign.campaign(state);}catch{return {ok:false,reason:'save'};}
  // This is a projection, not the purchase commit; the canonical record remains authoritative.
  try{campaign.project();}catch{}
  return {ok:true,charged:price,alreadyOwned:false,paper,edition,balance:state.coins};
}

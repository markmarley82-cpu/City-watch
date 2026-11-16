import {styleStreetSeller} from './cw-street-seller-ui.mjs?v=p21-b461-watch-ui';
import {NEWSPAPER_PRICE,editionFor,ownsNewspaper,purchaseNewspaper} from './newspapers/purchases.mjs?v=p21-b407-s039-reuse';
const names={times:'The Ankh-Morpork Times',inquirer:'The Ankh-Morpork Inquirer'};
export function createNewspaperStreetSellers({city,actors,nearest,onChange}){
  const market=city.world.doors.get('market').position;
  const entries=[{id:'news-times',paper:'times',name:'Times seller',key:'p3_human_01',target:[123,139]},
    {id:'news-inquirer',paper:'inquirer',name:'Inquirer seller',key:'p3_human_02',target:[market[0]+3,market[1]+2]}];
  const occupied=p=>actors.some(a=>a.p[0]===p[0]&&a.p[1]===p[1]);
  for(const entry of entries){
    entry.p=nearest(entry.target);
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1],[2,0]]){if(!occupied(entry.p))break;entry.p=nearest([entry.target[0]+dx,entry.target[1]+dy]);}
    actors.push(entry);
  }
  const byId=new Map(entries.map(a=>[a.id,a])),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const state=()=>window.CWP21State.create(localStorage).read().state;
  const nearby=()=>entries.filter(a=>distance(city.position(),a.p)<=2.5).sort((a,b)=>distance(city.position(),a.p)-distance(city.position(),b.p))[0]||null;
  const dialog=document.createElement('dialog');dialog.id='cw-newspaper-seller';dialog.setAttribute('aria-label','Newspaper seller');styleStreetSeller(dialog);
  const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');close.textContent='Close';close.autofocus=true;close.setAttribute('aria-label','Leave newspaper seller');close.onclick=()=>dialog.close();header.append(title,close);
  const description=document.createElement('p'),balance=document.createElement('p'),status=document.createElement('p'),buy=document.createElement('button'),retry=document.createElement('button');status.setAttribute('role','status');buy.id='cw-newspaper-buy';buy.style.width='100%';retry.id='cw-newspaper-retry';retry.textContent='Retry newspaper delivery';retry.style.width='100%';retry.hidden=true;const page=document.createElement('section'),footer=document.createElement('footer');page.className='seller-news';description.className='seller-news-copy';balance.className='seller-balance';page.append(description);footer.append(balance,buy,status,retry);dialog.append(header,page,footer);document.body.append(dialog);
  let selected=null,quotedEdition=null,pending=null,busy=false;
  function render(){
    if(!selected)return;
    const s=state(),owned=ownsNewspaper(s,selected.paper);quotedEdition=editionFor(s);
    title.textContent=selected.name;description.textContent=names[selected.paper]+' · '+(owned?'You already own this edition.':'Today’s edition costs '+NEWSPAPER_PRICE+' coin.');
    balance.textContent='Your purse: '+s.coins+(s.coins===1?' coin':' coins');
    buy.textContent=owned?'Read your copy':'Buy for '+NEWSPAPER_PRICE+' coin';
    const delivery=window.CW_NEWSPAPERS,loading=!delivery?.open||delivery.loading;
    buy.disabled=busy||(!owned&&s.coins<NEWSPAPER_PRICE)||loading||delivery?.failed;
    retry.hidden=!delivery?.failed||typeof delivery.retry!=='function';retry.disabled=busy;
    status.textContent=delivery?.failed?'The newspapers could not be loaded. Retry the delivery; no coins have been taken.':loading?'The newspaper delivery is still loading.':!owned&&s.coins<NEWSPAPER_PRICE?'You do not have enough coins.':'';
  }
  function open(entry){
    if(!entry||distance(city.position(),entry.p)>2.5||window.CWRecruitmentPending||document.querySelector('dialog[open],.cw-oath'))return false;
    selected=entry;pending=null;city.stop();render();dialog.showModal();return true;
  }
  buy.onclick=()=>{
    if(busy||!selected||distance(city.position(),selected.p)>2.5)return;
    if(!window.CW_NEWSPAPERS?.open||window.CW_NEWSPAPERS.failed||window.CW_NEWSPAPERS.loading){render();return;}
    busy=true;buy.disabled=true;
    try{
      const receipt=purchaseNewspaper({storage:localStorage,api:window.CWP21State,paper:selected.paper,expectedEdition:quotedEdition});
      if(!receipt.ok){render();status.textContent=receipt.reason==='funds'?'You do not have enough coins.':receipt.reason==='edition'?'A new edition has arrived. Check the price again.':'The purchase could not be saved. No coins were taken.';return;}
      const paper=selected.paper;dialog.close();onChange();
      city.tell(receipt.charged?'Bought '+names[paper]+' for '+receipt.charged+' coin.':'Reading your purchased edition.');
      window.CW_NEWSPAPERS.open({paper});
    }finally{busy=false;if(dialog.open){const message=status.textContent;render();if(message)status.textContent=message;}}
  };
  retry.onclick=async()=>{
    if(busy||!dialog.open||typeof window.CW_NEWSPAPERS?.retry!=='function')return;
    await window.CW_NEWSPAPERS.retry();if(dialog.open)render();
  };
  for(const event of ['cw:newspapers-ready','cw:newspapers-status'])document.addEventListener(event,()=>{if(dialog.open)render();});
  return {
    entries,nearby,talk:id=>open(byId.get(id)),owns:(paper,current=state())=>ownsNewspaper(current,paper),isSeller:id=>byId.has(id),interact:()=>open(nearby()),
    refresh(){if(pending&&distance(city.position(),pending.p)<=2.5&&!document.querySelector('dialog[open],.cw-oath'))open(pending);},
    click(p){const seller=entries.find(a=>distance(p,a.p)<=1.2);if(!seller)return false;if(distance(city.position(),seller.p)<=2.5)return open(seller);pending=seller;city.nav(seller.p.slice(0,2),seller.p[2]);city.tell('Walking to the '+seller.name+'.');return true;},
    drawPaper(ctx,p,id,project){const a=byId.get(id);if(!a)return;const q=project(p);ctx.save();ctx.translate(q.x+9,q.y-34);ctx.rotate(-.15);ctx.fillStyle='#eee2bd';ctx.fillRect(-7,-5,14,11);ctx.fillStyle=a.paper==='inquirer'?'#9d2823':'#3d3529';ctx.fillRect(-6,-4,12,3);ctx.fillStyle='#665845';ctx.fillRect(-5,1,10,1);ctx.fillRect(-5,3,8,1);ctx.restore();},
    drawLabels(ctx,project,zoom){if(zoom<.3)return;for(const a of entries){if(distance(city.position(),a.p)>12)continue;const q=project(a.p),text=a.name+' · '+NEWSPAPER_PRICE+' coin';ctx.save();ctx.translate(q.x,q.y-70);ctx.scale(1/zoom,1/zoom);ctx.font='600 11px Georgia';ctx.textAlign='center';const width=ctx.measureText(text).width;ctx.fillStyle='#17261ee8';ctx.fillRect(-width/2-5,-12,width+10,19);ctx.fillStyle='#f1dfb1';ctx.fillText(text,0,1);ctx.restore();}}
  };
}

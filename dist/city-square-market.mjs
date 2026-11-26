// Market stalls in the two largest empty squares (Mark, 26 Nov 2026: "some places are too wide").
// Uses the painted market props from assets/furniture-p4 (first made for the old small map).
// Each prop is drawn standing on its front cell and blocks only its own small footprint;
// a placement is skipped if blocking it would cut off its front cell from the Watch House.
const SHEETS={market:'assets/furniture-p4/ankh_morpork_market_prop_sprite_sheet.webp',trade:'assets/furniture-p4/isometric_fantasy_market_asset_atlas.webp'};
const ORIGINAL=1448; // sprite rectangles are measured on the 1448-wide source sheets
// [sprite, front cell x, y, footprint w, h]  (footprint extends back from the front cell)
export const MARKET_LAYOUT=[
 // Body Street square, north of the river: two rows of stalls either side of a walkway.
 ['trade:0',112,58,2,2],['trade:1',115,58,2,2],['trade:2',118,58,2,2],['trade:14',121,58,1,1],
 ['trade:11',112,65,2,1],['trade:12',116,65,2,1],['trade:7',119,65,2,1],['trade:9',122,65,1,1],
 ['market:16',117,62,1,1],
 // Broken Moon civic stair, south: stalls down the middle of the wide street.
 ['trade:1',124,269,2,2],['trade:13',126,269,1,1],['trade:2',124,274,2,2],['trade:8',126,274,1,1],
 ['trade:0',124,279,2,2],['trade:6',126,279,1,1],['trade:11',124,285,2,1],['trade:16',126,285,1,1]
];
export async function createSquareMarket({read,load,addSprites,scale=1.45}){
 const data=await read('assets/furniture-p4/sprite-rectangles.json');
 const images={};for(const [k,p] of Object.entries(SHEETS))images[k]=await load(p);
 const cut=new Map();
 function sprite(key){
  if(cut.has(key))return cut.get(key);
  const s=data.sprites[key];if(!s)return null;const im=images[s.sheet],f=(im.naturalWidth||im.width)/ORIGINAL;
  const [x,y,w,h]=s.src,c=document.createElement('canvas');c.width=Math.round(w*f);c.height=Math.round(h*f);
  c.getContext('2d').drawImage(im,x*f,y*f,w*f,h*f,0,0,c.width,c.height);
  const k=s.width*scale/c.width,out={canvas:c,k};cut.set(key,out);return out;
 }
 const rows=[];
 for(const [key,x,y,w,h] of MARKET_LAYOUT){
  const s=sprite(key);if(!s)continue;
  rows.push(['market:'+key+':'+x+','+y,s.canvas,[x,y],[s.canvas.width/2,s.canvas.height-6/s.k],s.k,[x-w+1,y-h+1,w,h],{sceneryKind:'street-furniture',sourceAsset:'furniture-p4:'+key,collisionMode:'explicit-square-market'}]);
 }
 const objects=addSprites(rows);
 return Object.freeze({objects,layout:MARKET_LAYOUT});
}
// Block each placed prop's footprint with the same mechanism as the Mended Drum plot.
export function activateSquareMarket({market,world,ground,activatePlot,streetPath}){
 if(!market)return {active:0};
 let active=0,held=0;
 for(const o of market.objects){
  const [x,y,w,h]=o.rect,front=[x+w-1,y+h],edges=world.members.get(front[0]+','+front[1]);
  if(!edges?.size){held++;continue;}
  const edge=[...edges][0];
  const plot=activatePlot({world,ground,rect:o.rect,door:[...front,edge],reachable:()=>streetPath(world,[126,132,'RC1'],front,edge)!==null});
  if(plot?.active)active++;else held++;
 }
 return {active,held};
}

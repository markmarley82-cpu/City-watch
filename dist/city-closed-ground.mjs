/* Closes the empty ground between the built city and the city walls (tools/make-closed-ground.py).
   The closed cells are handed to the open-ground pass as private areas, so nobody walks there, and
   every edge between closed and open ground gets a low stone wall, with posts where a run ends or
   turns: no invisible walls. The wall pieces are decoration only (they don't block cells
   themselves) and are drawn from the ART-107 modular wall kit. */
const KIT='assets/art-107-walls/sprites/neutral/';
const PIECES={
 se:{file:'neutral_low_se.exact.webp',size:[96,109],anchor:[32,66]},
 sw:{file:'neutral_low_sw.exact.webp',size:[96,109],anchor:[64,66]},
 post:{file:'neutral_terminal_post.exact.webp',size:[72,137],anchor:[36,119]}
};
export async function createClosedGround({read,load,addSprites}){
 const manifest=await read('assets/closed-ground-v1/manifest.json?v=1');
 const im={};for(const [k,p] of Object.entries(PIECES))im[k]=await load(KIT+p.file,p.size);
 const meta={sceneryKind:'boundary-wall',collisionMode:'explicit-park-prop',lightingExcluded:true};
 const rows=[];
 manifest.walls.forEach(([kind,x,y],i)=>{
  // The piece's start port is its upper end: (x, y) is that point on the cell-edge line.
  // Sort it with the closed cell it borders, so people on the open side are drawn correctly.
  const cell=kind==='se'?[Math.round(x+.5),Math.round(y-.5)]:[Math.round(x-.5),Math.round(y+.5)];
  rows.push(['closed-wall:'+i,im[kind],[x,y],PIECES[kind].anchor,.5,[cell[0],cell[1],1,1],meta]);
 });
 manifest.posts.forEach(([x,y],i)=>rows.push(['closed-post:'+i,im.post,[x,y],PIECES.post.anchor,.5,[Math.round(x-.5),Math.round(y-.5),1,1],meta]));
 const objects=addSprites(rows);
 const closed=new Set();for(const [x,y,w] of manifest.privateAreas)for(let i=0;i<w;i++)closed.add((x+i)+','+y);
 const isClosed=p=>closed.has(Math.round(p[0])+','+Math.round(p[1]));
 return Object.freeze({privateAreas:manifest.privateAreas,objects,isClosed,report:()=>({closedCells:manifest.closedCells,walls:manifest.walls.length,posts:manifest.posts.length})});
}

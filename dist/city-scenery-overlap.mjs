/* Boot-time removal of legacy filler intersecting fitted painted premises.
 * Limits the test to the same ground block; distant screen occlusion is retained. */
export function conflictsWithPainting(filler,painted){
 const a=filler.rect,b=painted.rect;
 const gap=Math.hypot(Math.max(a[0]-b[0]-b[2],b[0]-a[0]-a[2],0),Math.max(a[1]-b[1]-b[3],b[1]-a[1]-a[3],0));
 if(gap>8)return false;
 const [x,y,w,h]=filler.bounds,[px,py,pw,ph]=painted.bounds;
 if(x>=px+pw||x+w<=px||y>=py+ph||y+h<=py)return false;
 // Compare opaque paint, rather than transparent rectangular image margins.
 for(let iy=2;iy<8;iy++)for(let ix=1;ix<8;ix++){
  const u=ix/8,v=iy/8,sx=x+w*u,sy=y+h*v;
  if(sx<px||sy<py||sx>=px+pw||sy>=py+ph)continue;
  const fa=(Math.floor(v*filler.im.height)*filler.im.width+Math.floor(u*filler.im.width))*4+3;
  const pa=(Math.floor((sy-py)/ph*painted.im.height)*painted.im.width+Math.floor((sx-px)/pw*painted.im.width))*4+3;
  if(filler.alpha[fa]>128&&painted.alpha[pa]>128)return true;
 }
 return false;
}

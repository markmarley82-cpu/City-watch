/* Reuse painted terrain at display resolution while actors keep their own clock.
 * The buffer is only a presentation cache: no routes, geometry or saves live here. */
export class GroundFrameCache {
  constructor({createCanvas=()=>document.createElement('canvas'),margin=384,maxPixels=8*1048576,refreshMS=100}={}) {
    this.createCanvas=createCanvas;this.margin=margin;this.stripPad=160;this.maxPixels=maxPixels;this.refreshMS=refreshMS;
    this.surface=null;this.rect=null;this.rebuilds=0;this.reuses=0;this.lastPaint=-Infinity;
  }
  draw(ctx,{camera,zoom,width,height,pixelRatio=1,version,paint,now=performance.now()}) {
    const viewport=[camera.x-width/(2*zoom),camera.y-height/(2*zoom),camera.x+width/(2*zoom),camera.y+height/(2*zoom)];
    const sameDisplay=this.rect&&this.zoom===zoom&&this.width===width&&this.height===height&&this.pixelRatio===pixelRatio;
    const fits=sameDisplay&&
      viewport[0]>=this.rect[0]&&viewport[1]>=this.rect[1]&&viewport[2]<=this.rect[2]&&viewport[3]<=this.rect[3];
    const dx=camera.x-(this.lastCameraX??camera.x),dy=camera.y-(this.lastCameraY??camera.y);
    this.lastCameraX=camera.x;
    this.lastCameraY=camera.y;
    const current=version();
    if(!fits||(current!==this.version&&now-this.lastPaint>=this.refreshMS)) {
      if(!fits)this.edgeRebuilds=(this.edgeRebuilds||0)+1;else this.contentRebuilds=(this.contentRebuilds||0)+1;
      const w=width+2*this.margin,h=height+2*this.margin,d=Math.min(pixelRatio,Math.sqrt(this.maxPixels/(w*h)));
      const pw=Math.max(1,Math.floor(w*d)),ph=Math.max(1,Math.floor(h*d)),ww=pw/(d*zoom),hh=ph/(d*zoom);
      // Refresh streamed content on the retained pixel grid while it still
      // contains the viewport. Recentering here needlessly invalidates static
      // terrain layers during movement, even before a margin is exhausted.
      // On an ordinary walking miss, put more of the existing margin ahead
      // of the camera. Keep room behind it for turns and keep the pixel budget.
      const travel=Math.max(Math.abs(dx),Math.abs(dy));
      const lead=sameDisplay&&travel*zoom>=1&&travel*zoom<=this.margin ? .6/travel : 0;
      const x=camera.x+dx*lead*(ww-width/zoom)/2;
      const y=camera.y+dy*lead*(hh-height/zoom)/2;
      // Walking off the edge with unchanged content: slide the retained pixels by a whole number
      // of pixels and paint only the newly exposed strips (as old 2D games scrolled), instead of
      // repainting the whole surface in one frame. Integer shifts keep the same pixel grid.
      if(!fits&&sameDisplay&&this.scroll!==false&&current===this.version&&this.surface&&this.surface.width===pw&&this.surface.height===ph&&this.d===d){
        const k=d*zoom,sx=Math.round(((x-ww/2)-this.rect[0])*k),sy=Math.round(((y-hh/2)-this.rect[1])*k);
        if(Math.abs(sx)<pw/2&&Math.abs(sy)<ph/2&&(sx||sy)){
          this.scrollFrom(sx,sy,pw,ph,k,paint);
          this.lastPaint=now;this.rebuilds++;this.scrolls=(this.scrolls||0)+1;
          return this.copy(ctx,viewport);
        }
      }
      const rect=fits&&this.surface?.width===pw&&this.surface?.height===ph?this.rect.slice():[x-ww/2,y-hh/2,x+ww/2,y+hh/2];
      if(!this.surface)this.surface=this.createCanvas();
      if(this.surface.width!==pw)this.surface.width=pw;
      if(this.surface.height!==ph)this.surface.height=ph;
      const g=this.surface.getContext('2d');
      g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,pw,ph);g.save();
      try{g.setTransform(d*zoom,0,0,d*zoom,-rect[0]*d*zoom,-rect[1]*d*zoom);paint(g,rect);}
      catch(error){this.rect=null;throw error;}
      finally{g.restore();}
      this.rect=rect;this.zoom=zoom;this.width=width;this.height=height;this.pixelRatio=pixelRatio;this.d=d;
      this.version=version();this.lastPaint=now;this.rebuilds++;
    } else this.reuses++;
    return this.copy(ctx,viewport);
  }
  scrollFrom(sx,sy,pw,ph,k,paint){
    if(!this.back)this.back=this.createCanvas();
    if(this.back.width!==pw)this.back.width=pw;
    if(this.back.height!==ph)this.back.height=ph;
    const b=this.back.getContext('2d');
    b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,pw,ph);b.drawImage(this.surface,-sx,-sy);
    const old=this.surface;this.surface=this.back;this.back=old;
    this.rect=[this.rect[0]+sx/k,this.rect[1]+sy/k,this.rect[2]+sx/k,this.rect[3]+sy/k];
    // Exposed strips in surface pixels: one vertical and one horizontal band at most.
    const strips=[];
    if(sx>0)strips.push([pw-sx,0,pw,ph]);else if(sx<0)strips.push([0,0,-sx,ph]);
    if(sy>0)strips.push([0,ph-sy,pw,ph]);else if(sy<0)strips.push([0,0,pw,-sy]);
    const pad=this.stripPad,g=b===this.surface.getContext('2d')?b:this.surface.getContext('2d');
    for(const [x0,y0,x1,y1] of strips){
      g.save();
      try{
        g.setTransform(1,0,0,1,0,0);g.beginPath();g.rect(x0,y0,x1-x0,y1-y0);g.clip();
        g.setTransform(k,0,0,k,-this.rect[0]*k,-this.rect[1]*k);
        // Paint a generously padded view so pieces anchored just outside the strip still reach it.
        paint(g,[this.rect[0]+x0/k-pad,this.rect[1]+y0/k-pad,this.rect[0]+x1/k+pad,this.rect[1]+y1/k+pad]);
      }finally{g.restore();}
    }
  }
  copy(ctx,viewport){
    // Copy the visible part of the retained surface, not its movement margins.
    // Snap to the original source grid with a sampling gutter so fractional
    // camera positions retain exactly the same scale and interpolation phase.
    const sxScale=this.surface.width/(this.rect[2]-this.rect[0]),syScale=this.surface.height/(this.rect[3]-this.rect[1]);
    const sx=Math.max(0,Math.floor((viewport[0]-this.rect[0])*sxScale)-2),sy=Math.max(0,Math.floor((viewport[1]-this.rect[1])*syScale)-2);
    const ex=Math.min(this.surface.width,Math.ceil((viewport[2]-this.rect[0])*sxScale)+2),ey=Math.min(this.surface.height,Math.ceil((viewport[3]-this.rect[1])*syScale)+2);
    const sw=ex-sx,sh=ey-sy;this.copiedPixels=sw*sh;
    ctx.drawImage(this.surface,sx,sy,sw,sh,this.rect[0]+sx/sxScale,this.rect[1]+sy/syScale,sw/sxScale,sh/syScale);
  }
  report(){return {rebuilds:this.rebuilds,scrolls:this.scrolls||0,edgeRebuilds:this.edgeRebuilds||0,contentRebuilds:this.contentRebuilds||0,reuses:this.reuses,copiedPixels:this.copiedPixels||0,retainedPixels:(this.surface?.width||0)*(this.surface?.height||0),decodedMiB:(this.surface?.width||0)*(this.surface?.height||0)*4/1048576,maxMiB:this.maxPixels*4/1048576};}
  dispose(){if(this.surface)this.surface.width=this.surface.height=1;this.surface=null;this.rect=null;}
}

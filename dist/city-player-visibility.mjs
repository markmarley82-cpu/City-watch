// Presentation-only sight area. Navigation, simulation and saves stay independent.
export function playerSight(player,{camera,width,height,zoom=1}){
 const center={x:player.x,y:player.y-24};
 const radiusPixels=Math.max(96,Math.min(320*zoom,width*.48,height*.62));
 const radius=radiusPixels/zoom;
 return{center,radius,radiusPixels,clearFraction:.72,screen:{x:(center.x-camera.x)*zoom+width/2,y:(center.y-camera.y)*zoom+height/2},bounds:[center.x-radius,center.y-radius,center.x+radius,center.y+radius]};
}
export function pointInSight(point,sight,fraction=1){return !sight||(point.x-sight.center.x)**2+(point.y-sight.center.y)**2<=(sight.radius*fraction)**2;}
export function boundsInSight(bounds,sight,margin=0){
 if(!sight)return true;
 const x=Math.max(bounds[0],Math.min(sight.center.x,bounds[0]+bounds[2])),y=Math.max(bounds[1],Math.min(sight.center.y,bounds[1]+bounds[3]));
 return(x-sight.center.x)**2+(y-sight.center.y)**2<=(sight.radius+margin)**2;
}
export function drawPlayerFog(g,sight,width,height,darkness=0){
 const n=Math.max(0,Math.min(1,darkness)),rgb=[104,111,106].map((v,i)=>Math.round(v*(1-n)+[10,21,30][i]*n));
 const color=a=>'rgba('+rgb.join(',')+','+a+')';
 const f=g.createRadialGradient(sight.screen.x,sight.screen.y,0,sight.screen.x,sight.screen.y,sight.radiusPixels);
 f.addColorStop(0,color(0));f.addColorStop(sight.clearFraction,color(0));f.addColorStop(.9,color(.45));f.addColorStop(1,color(1));
 g.save();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=f;g.fillRect(0,0,width,height);g.restore();
}

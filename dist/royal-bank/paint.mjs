const WIDTH=1536, HEIGHT=1024;
function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('A Post Office painting could not load.'));image.src=url;});}
export async function loadPostalPaint(art,baseURL){
 const [plate,...staff]=await Promise.all([art.plate,...art.staff.map(n=>n.sprite)].map(file=>loadImage(new URL(file+'?v=b505',baseURL))));
 if(plate.naturalWidth!==WIDTH||plate.naturalHeight!==HEIGHT)throw Error('Post Office floor art does not match the room.');
 const cast=new Map(art.staff.map((p,i)=>{
  const [x,y,w,h]=p.spriteBounds,im=staff[i];
  if(x+w>im.naturalWidth||y+h>im.naturalHeight||p.footX<x||p.footX>x+w)throw Error('Post Office sprite registration is invalid.');
  return [p.id,{p,im}];
 }));
 function clerk(g,id,x,y,height){
  const {p,im}=cast.get(id),[sx,sy,sw,sh]=p.spriteBounds,f=height/sh;
  g.drawImage(im,sx,sy,sw,sh,x-(p.footX-sx)*f,y-height,sw*f,height);
 }
 function base(g){
  g.drawImage(plate,0,0);
  for(const {p} of cast.values())clerk(g,p.id,p.position[0]*WIDTH,p.position[1]*HEIGHT,p.height);
  g.save();g.beginPath();for(const [i,[x,y]] of art.counterFront.entries()){if(i)g.lineTo(x*WIDTH,y*HEIGHT);else g.moveTo(x*WIDTH,y*HEIGHT);}g.closePath();g.clip();g.drawImage(plate,0,0);g.restore();
  const [nx,ny]=art.notice;g.save();g.translate(nx*WIDTH,ny*HEIGHT);g.transform(1,-.47,0,1,0,0);
  g.fillStyle='#453726';g.fillRect(-9,-10,18,24);g.fillStyle='#b5a078';g.fillRect(-7,-8,14,20);
  g.fillStyle='#61543e';for(let row=0;row<4;row++)g.fillRect(-5,-3+3*row,10-(row===3?3:0),.8);g.restore();
 }
 return Object.freeze({base,clerk});
}

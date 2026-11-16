// Local pigment variation for a reused building. The donor remains unchanged.
// Keep alpha, world registration and separate pane emission exactly as authored.
export const reuseFinishes=Object.freeze({
 limewash:Object.freeze([202,182,142,.15]),
 weatheredStone:Object.freeze([135,153,157,.15]),
 redOchre:Object.freeze([174,110,85,.16])
});

export function tintReusePixels(pixels,finish){
 const pigment=reuseFinishes[finish];
 if(!pigment)throw Error('Unknown building finish: '+finish);
 const [r,g,b,a]=pigment;
 for(let i=0;i<pixels.length;i+=4){
  if(!pixels[i+3])continue;
  pixels[i]=Math.round(pixels[i]*(1-a)+r*a);
  pixels[i+1]=Math.round(pixels[i+1]*(1-a)+g*a);
  pixels[i+2]=Math.round(pixels[i+2]*(1-a)+b*a);
 }
 return pixels;
}

export function createReuseFinishImage(source,finish){
 const image=document.createElement('canvas');
 image.width=source.width;image.height=source.height;
 const g=image.getContext('2d',{willReadFrequently:true});
 g.drawImage(source,0,0,image.width,image.height);
 const data=g.getImageData(0,0,image.width,image.height);
 tintReusePixels(data.data,finish);g.putImageData(data,0,0);
 for(const key of ['cwDensity','cwSourceWidth','cwSourceHeight'])
  if(source[key]!==undefined)Object.defineProperty(image,key,{value:source[key]});
 return image;
}

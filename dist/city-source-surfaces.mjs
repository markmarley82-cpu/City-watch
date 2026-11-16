// One-shot construction sources are released only after their runtime copies exist.
export function createOperaTexture(im,{project,createCanvas=()=>document.createElement('canvas'),release=()=>{}}={}){const B=[935,952],A=[30,692],C=[1516,740],ta=project([-4.5,14.5]),tb=project([4.5,14.5]),tc=project([4.5,8.5]),vertical=.30;
 const maps=[[0,B[0],(tb.x-ta.x)/(B[0]-A[0]),(tb.y-ta.y-vertical*(B[1]-A[1]))/(B[0]-A[0])],[B[0],im.width,(tc.x-tb.x)/(C[0]-B[0]),(tc.y-tb.y-vertical*(C[1]-B[1]))/(C[0]-B[0])]].map(([start,end,a,b])=>({start,end,a,b,c:tb.x-a*B[0],f:tb.y-b*B[0]-vertical*B[1]}));
 const pts=maps.flatMap(m=>[[m.start,0],[m.end,0],[m.end,im.height],[m.start,im.height]].map(([x,y])=>[m.a*x+m.c,m.b*x+vertical*y+m.f]));const minX=Math.floor(Math.min(...pts.map(p=>p[0])))-2,minY=Math.floor(Math.min(...pts.map(p=>p[1])))-2,maxX=Math.ceil(Math.max(...pts.map(p=>p[0])))+2,maxY=Math.ceil(Math.max(...pts.map(p=>p[1])))+2;
 const out=createCanvas();out.width=maxX-minX;out.height=maxY-minY;const c=out.getContext('2d');for(const m of maps){c.save();c.setTransform(m.a,m.b,0,vertical,m.c-minX,m.f-minY);c.beginPath();c.rect(m.start,0,m.end-m.start,im.height);c.clip();c.drawImage(im,0,0);c.restore();}
 release(im);
 return {im:out,anchor:[-minX,-minY],registration:{sourceContacts:[A,B,C],targetContacts:[ta,tb,tc],verticalScale:vertical,planes:maps,method:'Runtime upright texture-plane registration; original source PNG unchanged; manually measured irregular stone contacts.'}};
}
export function createWornTile(source,{createCanvas=()=>document.createElement('canvas'),release=()=>{}}={}){
 const out=createCanvas();out.width=out.height=1024;const g=out.getContext('2d');
 for(const [x,y,sx,sy]of [[0,0,1,1],[1024,0,-1,1],[0,1024,1,-1],[1024,1024,-1,-1]]){g.save();g.translate(x,y);g.scale(sx,sy);g.drawImage(source,0,0,512,512);g.restore();}
 release(source);return out;
}
export function sourceImageResidency(images){
 const unique=[...new Set(images.values())];let pixels=0;
 for(const im of unique)pixels+=(im.naturalWidth||im.width||0)*(im.naturalHeight||im.height||0);
 return {residentSources:unique.length,residentSourceMiB:Number((pixels*4/1048576).toFixed(3))};
}

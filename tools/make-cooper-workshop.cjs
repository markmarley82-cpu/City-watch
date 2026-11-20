// Production registration/export for Mark's Midjourney workshop.
// node tools/make-cooper-workshop.cjs DAY_STUDY NIGHT_STUDY CHIMNEY_REPAIR
const sharp=require('sharp'),fs=require('node:fs/promises'),crypto=require('node:crypto');
const OUT='art-review/cooper-workshop-v1',W=896,H=1024;
const L=[103,989],C=[637,1177],R=[1171,970],TL=[102,471],TC=[636,663],TR=[1174,449],A=[400,192],B=[920,450],D=[735,155];
const l=[84,732],c=[420,900],r=[812,704],tl=[84,394],tc=[420,562],tr=[812,366],a=[280,156],b=[616,324],d=[476,198];
const planes=[
 {name:'front-wall',layer:'walls',source:[L,C,TC,TL],target:[l,c,tc,tl]},
 {name:'side-wall',layer:'walls',source:[C,R,TR,TC],target:[c,r,tr,tc]},
 {name:'roof-back',layer:'roof',source:[A,B,TR,D],target:[a,b,tr,d]},
 {name:'roof-front',layer:'roof',source:[A,B,TC,TL],target:[a,b,tc,tl]},
 {name:'gable',layer:'walls',source:[TC,TR,B],target:[tc,tr,b]}
];
function solve(m){const n=m.length;for(let k=0;k<n;k++){let p=k;for(let j=k+1;j<n;j++)if(Math.abs(m[j][k])>Math.abs(m[p][k]))p=j;[m[p],m[k]]=[m[k],m[p]];let q=m[k][k];if(Math.abs(q)<1e-10)throw Error('Singular transform');for(let j=k;j<=n;j++)m[k][j]/=q;for(let i=0;i<n;i++)if(i!==k){q=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=q*m[k][j]}}return m.map(r=>r[n]);}
function transform(src,dst){if(src.length===3){const rows=[];for(let i=0;i<3;i++){const[x,y]=src[i],[u,v]=dst[i];rows.push([x,y,1,0,0,0,u],[0,0,0,x,y,1,v]);}const z=solve(rows);return(x,y)=>[z[0]*x+z[1]*y+z[2],z[3]*x+z[4]*y+z[5]];}const rows=[];for(let i=0;i<4;i++){const[x,y]=src[i],[u,v]=dst[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}const z=solve(rows);return(x,y)=>{const den=z[6]*x+z[7]*y+1;return[(z[0]*x+z[1]*y+z[2])/den,(z[3]*x+z[4]*y+z[5])/den]};}
function inside(x,y,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))hit=!hit;}return hit;}
const glass=[[[181,562],[229,579],[229,660],[181,641]],[[275,840],[312,854],[312,932],[275,916]],[[800,666],[853,643],[853,729],[800,752]],[[1017,564],[1066,544],[1066,628],[1017,650]],[[801,900],[854,879],[854,968],[801,990]],[[1018,798],[1067,777],[1067,865],[1018,888]]];
function sample(data,w,h,x,y){x=Math.max(0,Math.min(w-1,x));y=Math.max(0,Math.min(h-1,y));const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy,v=[0,0,0,0];for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const i=(Math.min(h-1,iy+yy)*w+Math.min(w-1,ix+xx))*4,k=(xx?dx:1-dx)*(yy?dy:1-dy);for(let c=0;c<4;c++)v[c]+=data[i+c]*k;}return v;}
async function main(){
 await fs.mkdir(OUT,{recursive:true});
 const dayPath=process.argv[2],nightPath=process.argv[3];if(!dayPath||!nightPath)throw Error('Supply day and night studies');
 const day=await sharp(dayPath).resize(1280,1280).ensureAlpha().raw().toBuffer({resolveWithObject:true}),night=await sharp(nightPath).resize(1280,1280).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const dayBlur=await sharp(dayPath).resize(1280,1280).ensureAlpha().blur(9).raw().toBuffer(),nightBlur=await sharp(nightPath).resize(1280,1280).ensureAlpha().blur(9).raw().toBuffer();
 const layers=Object.fromEntries(['day','night','roof','roof-night','walls','walls-night','emission'].map(n=>[n,Buffer.alloc(W*H*4)]));
 // Chimney is an independently registered upright part of the roof layer.
 const chimney=[[748,218],[768,207],[769,193],[779,184],[793,184],[807,191],[808,211],[815,208],[817,170],[832,161],[849,162],[865,169],[866,191],[886,218],[887,239],[872,247],[872,354],[887,364],[887,382],[848,399],[749,360],[749,341],[759,337],[759,255],[746,250]];
 const chimTarget=chimney.map(([x,y])=>[563+(x-815)*.72,305+(y-386)*.72]);
 const all=[...planes,{name:'chimney',layer:'roof',source:chimney,target:chimTarget,map:(x,y)=>[(x-563)/.72+815,(y-305)/.72+386]}];
 for(const p of all){
  const inv=p.map||transform(p.target,p.source),xs=p.target.map(v=>v[0]),ys=p.target.map(v=>v[1]);
  for(let y=Math.max(0,Math.floor(Math.min(...ys))-1);y<=Math.min(H-1,Math.ceil(Math.max(...ys))+1);y++)for(let x=Math.max(0,Math.floor(Math.min(...xs))-1);x<=Math.min(W-1,Math.ceil(Math.max(...xs))+1);x++){
   if(!inside(x+.5,y+.5,p.target))continue;
   const[sx,sy]=inv(x+.5,y+.5),rgba=sample(day.data,1280,1280,sx,sy);if(rgba[3]<96)continue;
   const i=(y*W+x)*4,db=sample(dayBlur,1280,1280,sx,sy),nb=sample(nightBlur,1280,1280,sx,sy),nv=[];
   for(let k=0;k<3;k++)nv[k]=Math.max(0,Math.min(255,rgba[k]*Math.max(.35,Math.min(3.5,(nb[k]+8)/(db[k]+8)))));
   const alpha=255;
   for(const [name,rgb] of [['day',rgba],['night',nv],[p.layer,rgba],[p.layer+'-night',nv]]){for(let k=0;k<3;k++)layers[name][i+k]=Math.round(rgb[k]);layers[name][i+3]=alpha;}
   if(p.layer==='walls'&&glass.some(g=>inside(sx,sy,g))){const lum=(rgba[0]+rgba[1]+rgba[2])/3;const strength=Math.round(Math.max(0,Math.min(210,(lum-8)*5)));layers.emission[i]=255;layers.emission[i+1]=175;layers.emission[i+2]=65;layers.emission[i+3]=strength;}
  }
 }
 // Generated local chimney repair is used only inside this roof rectangle.
 // All foundation and wall pixels remain those from the measured plane exports.
 if(process.argv[4]){
  const repair=await sharp(process.argv[4]).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  for(let y=130;y<334;y++)for(let x=480;x<644;x++){
   const i=(y*W+x)*4,alpha=repair[i+3]>=128?255:0;
   const factor=[.64,.78,1.03];
   for(let k=0;k<3;k++){
    layers.day[i+k]=layers.roof[i+k]=alpha?repair[i+k]:0;
    layers.night[i+k]=layers['roof-night'][i+k]=alpha?Math.min(255,Math.round(repair[i+k]*factor[k])):0;
   }
   layers.day[i+3]=layers.night[i+3]=layers.roof[i+3]=layers['roof-night'][i+3]=alpha;
  }
 }
 // Final masks use exactly the same alpha for both times of day.
 for(let i=3;i<layers.day.length;i+=4){layers.night[i]=layers.day[i];layers['roof-night'][i]=layers.roof[i];layers['walls-night'][i]=layers.walls[i];if(layers.roof[i]){layers.walls[i]=layers['walls-night'][i]=0;layers.emission[i]=0;}layers.day[i]=layers.night[i]=Math.max(layers.roof[i],layers.walls[i]);}
 const files=[];
 for(const[name,data]of Object.entries(layers)){
  for(let i=3;i<data.length;i+=4)if(!data[i])data[i-3]=data[i-2]=data[i-1]=0;
  for(const ext of ['png','webp']){const f=`cooper-${name}.${ext}`,s=sharp(data,{raw:{width:W,height:H,channels:4}});if(ext==='png')await s.png().toFile(OUT+'/'+f);else await s.webp({lossless:true,effort:6}).toFile(OUT+'/'+f);const bytes=await fs.readFile(OUT+'/'+f);files.push({file:f,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
 }
 const doorMap=transform(planes[0].source,planes[0].target),doorSource=[[190,790],[190,1005]],doorTarget=doorSource.map(p=>doorMap(...p)),doorHeight=Math.hypot(doorTarget[0][0]-doorTarget[1][0],doorTarget[0][1]-doorTarget[1][1])*.5;
 const registration={id:'cooper-workshop-v1',source:'Mark supplied Midjourney IMG_6728.jpeg; image-generator cleanup/day and night studies',status:'prepared art candidate; no world site or runtime integration',nativeSize:[W,H],drawScale:.5,localFootprint:[6,7],projection:{axisX:[28,14],axisY:[-28,14]},nativeAnchor:c,base:{left:l,corner:c,right:r},humanDoor:{source:doorSource,native:doorTarget,renderedHeight:doorHeight,referenceOfficerHeight:60},planes,chimney:{source:chimney,target:chimTarget},night:'Low-frequency illumination from generated night study applied to registered day pixels; same alpha and geometry',cutaway:'Exterior wall shell and detachable roof; no furnished interior'};
 await fs.writeFile(OUT+'/registration.json',JSON.stringify(registration,null,2)+'\n');
 await fs.writeFile(OUT+'/manifest.json',JSON.stringify({id:'cooper-workshop-v1',status:registration.status,nativeSize:[W,H],drawScale:.5,anchor:c,files},null,2)+'\n');
 console.log(JSON.stringify({out:OUT,doorHeight,files:files.length}));
}
main().catch(e=>{console.error(e);process.exitCode=1});

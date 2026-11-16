/* Original lighting direction, not a claim about canonical municipal services. */
export const LAMP_MOODS=Object.freeze({
 civic:Object.freeze({intensity:1,radius:155,amplitude:.02,colors:['rgba(255,211,125,1)','rgba(255,176,68,.58)','rgba(246,153,51,0)']}),
 'side-street':Object.freeze({intensity:.93,radius:143,amplitude:.035,colors:['rgba(255,205,117,1)','rgba(249,164,62,.58)','rgba(239,141,43,0)']}),
 alley:Object.freeze({intensity:.82,radius:128,amplitude:.05,colors:['rgba(250,194,105,1)','rgba(238,151,55,.58)','rgba(226,129,37,0)']})
});
export function classifyLampMood(lamp,edges,shadesBounds){
 const[x,y,w,h]=shadesBounds,inside=lamp.p[0]>=x&&lamp.p[0]<=x+w&&lamp.p[1]>=y&&lamp.p[1]<=y+h;
 const kinds=lamp.edges.map(id=>edges.get(id)?.kind).filter(Boolean);
 if(inside||(kinds.length&&kinds.every(k=>['SERVICE','YARD'].includes(k))))return'alley';
 return lamp.reason==='long street interval'?'side-street':'civic';
}
export function sampleLampMood(kind,id,timeMs,{reducedMotion=false}={}){
 const name=LAMP_MOODS[kind]?kind:'civic',profile=LAMP_MOODS[name];let modulation=1;
 if(!reducedMotion&&Number.isFinite(timeMs)){
  let hash=2166136261;for(let n=0;n<id.length;n++)hash=Math.imul(hash^id.charCodeAt(n),16777619);
  const phase=(hash>>>0)/4294967296*Math.PI*2,t=timeMs/1000;
  modulation+=profile.amplitude*(.65*Math.sin(t*2.9+phase)+.35*Math.sin(t*5.1+phase*1.7));
 }
 return{...profile,name,modulation};
}

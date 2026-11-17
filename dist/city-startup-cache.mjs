// Results of expensive startup checks, worked out once at deploy time and shipped as
// startup-cache.json (tools/bake-startup-cache.mjs, run by the Pages workflow).
// A phone reuses a result only when the city it has just built has the same
// fingerprint as the city the result was worked out for; anything else (no file,
// an older file, a local copy, a changed map) runs the check exactly as before.
// While baking (window.__CW_BAKE), every check runs and passing results are recorded.

export function loadStartupCache(){
 if(typeof window!=='undefined'&&window.__CW_BAKE)return Promise.resolve({bake:window.__CW_BAKE});
 return fetch('startup-cache.json',{cache:'no-cache'})
  .then(r=>r.ok?r.json():null)
  .then(data=>data&&data.schema===1&&data.checks&&typeof data.checks==='object'?{data}:null)
  .catch(()=>null);
}

// One named check: verified(fp) is true when this exact city passed it at deploy time.
export function startupCheck(cache,name){
 const status=typeof window!=='undefined'?(window.CWStartupChecks||(window.CWStartupChecks={})):{};
 return Object.freeze({
  verified:fingerprint=>{const ok=!!fingerprint&&cache?.data?.checks?.[name]===fingerprint;status[name]=ok?'verified at deploy':'checked here';return ok;},
  record:fingerprint=>{if(cache?.bake&&fingerprint){(cache.bake.checks||(cache.bake.checks={}))[name]=fingerprint;}}
 });
}

// FNV-1a over the walking graph (cells and their streets), solid cells, doors and
// the footprints of placed scenery: everything the door check reads.
export function worldFingerprint(world,objects=[]){
 let h=0x811c9dc5;
 const add=s=>{s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}h^=0x3b;h=Math.imul(h,0x01000193);};
 for(const [cell,edges] of world.members){add(cell);for(const edge of edges)add(edge);}
 add('|solid');for(const cell of world.solid)add(cell);
 add('|doors');for(const [id,d] of world.doors){add(id);add(d.position);add(d.edge);add(d.held?1:0);}
 add('|objects');for(const o of objects)if(o&&o.rect&&!o.person)add(o.rect);
 return (h>>>0).toString(16)+'-'+world.members.size+'-'+world.solid.size+'-'+world.doors.size;
}

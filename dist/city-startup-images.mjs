/* Overlap independent I/O, then let the existing factories register in order. */
export const PARCEL_STARTUP_PATHS=Object.freeze([562,582,583,591,613,568,569,570,590].map(id=>'assets/parcel'+id+'-premise/dwelling.webp'));
export function createStartupImageBatch(load,paths){
 const pending=new Map();
 for(const path of new Set(paths))pending.set(path,Promise.resolve().then(()=>load(path)).then(image=>({image}),error=>({error})));
 return async path=>{
  const request=pending.get(path);
  if(!request)return load(path);
  const result=await request;pending.delete(path);
  if(Object.hasOwn(result,'error'))throw result.error;
  return result.image;
 };
}

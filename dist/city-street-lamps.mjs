/* Kerb-side civic furniture only. No graph, collider, door or save mutations. */
export const streetLampFacesLeft=i=>(i.side?.[0]||0)-(i.side?.[1]||0)>0;
// Pon's painted deck spans x=81..85 between y=164 and 196.
export const mountPonsDeckLamp=i=>{
 if(i.edges?.length!==1||i.edges[0]!=='E004'||i.reason!=='long street interval'||i.p[1]<=164||i.p[1]>=196)return i;
 const x=i.side[0]<0?81.45:84.55,dx=x-i.p[0];
 return {...i,p:[x,i.p[1]],rect:[i.rect[0]+dx,...i.rect.slice(1)]};
};
export async function createStreetLampNetwork({read,load,addSprites,lightAnchors}){
 const m=await read('assets/city-street-lamps-v1/manifest.json?v=drum-large'),a=m.fixture,im=await load(a.file);
 if(im.width!==a.dimensions[0]||im.height!==a.dimensions[1])throw Error('Street-lamp source dimensions changed');
 // The Watch neighbourhood shares this source URL and releases its HTML image
 // after density reduction. Neither orientation may retain that borrowed image.
 const width=im.width,height=im.height,forward=document.createElement('canvas');forward.width=width;forward.height=height;forward.getContext('2d').drawImage(im,0,0);
 const mirror=document.createElement('canvas');mirror.width=width;mirror.height=height;const mg=mirror.getContext('2d');mg.translate(width,0);mg.scale(-1,1);mg.drawImage(forward,0,0);
 // Mark the court turn with the existing side-street fixture, on the outer
 // edge of the public flagstones. Like the other posts it adds no collider.
 const instances=[...m.instances.map(mountPonsDeckLamp),{id:'E045-court-turn-lamp',p:[42.45,203.55],side:[1,0],rect:[42.39,203.49,.12,.12],lightingMood:'side-street'}];
 const rows=instances.map(i=>{const left=streetLampFacesLeft(i),fixture=left?mirror:forward,anchor=left?[width-a.anchor[0],a.anchor[1]]:a.anchor;return[i.id,fixture,i.p,anchor,1,i.rect,{cityStreetLamp:true,sceneryKind:'street-lamp',sourceAsset:i.id,lampMood:i.lightingMood||'civic',lampFacing:left?'left':'right'}];});
 const group=addSprites(rows);for(const i of instances){const left=streetLampFacesLeft(i);lightAnchors[i.id]=a.lights.map(p=>left?[width-p[0],p[1],width-p[2],p[3]]:p);}
 const facingCounts=Object.fromEntries(['left','right'].map(f=>[f,group.filter(o=>o.lampFacing===f).length]));
 return Object.freeze({report:()=>({id:m.id,ready:true,newLamps:group.length,retainedWatchLamps:m.existingWatchLamps,totalCityPostLamps:group.length+m.existingWatchLamps,sharedFixtureImages:2,facingCounts,orientationSource:'manifest side vector projected toward the roadway',lightingMoods:Object.fromEntries([...new Set(instances.map(i=>i.lightingMood))].map(k=>[k,instances.filter(i=>i.lightingMood===k).length])),decodedFixtureMiB:width*height*8/1048576,newNavigation:false,newColliders:false,newInteractiveDoors:false})});
}

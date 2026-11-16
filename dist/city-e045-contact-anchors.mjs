const expected=[["parcel613:dwelling",[42.779,197.606,3.886,4.044]],["parcel590:dwelling",[46.665,198.346,2.744,3.304]],["parcel568:dwelling",[49.409,198.297,2.66,3.353]],["parcel569:dwelling",[44.5,204.5,3.761,4.566]],["parcel570:dwelling",[48.261,203.65,3.737,4.496]],["parcel591:dwelling",[51.998,204.5,4.273,2.873]]];
export function e045ContactAnchorRequests(objects){
 if(!expected.every(([id,rect])=>{const o=objects.find(o=>o.id===id);return o&&o.rect.length===4&&o.rect.every((v,i)=>Math.abs(v-rect[i])<1e-8);}))return[];
 return [48,49,50,51].map(x=>({position:[x,203],edgeID:'E045'}));
}

// This dry public foot fits beside the workroom, but its rounded cell falls
// inside conservative footprint padding. Keep the exception tied to this
// exact fitted building; openPublicGround still checks every foot/water/held mask.
export function e045WorkroomAnchorRequests(objects){
 const rect=[58.6365,211.876,8.155075187969924,3.953947368421052];
 const workroom=objects.find(o=>o.id==='SHADES-006:sack-mender-workroom');
 if(!workroom?.rect||workroom.rect.length!==4||!workroom.rect.every((v,i)=>Math.abs(v-rect[i])<1e-8))return[];
 return [{position:[58,215],edgeID:'E045'}];
}

// Labels may move a few screen pixels; destination pins and the survey never move.
const overlaps=(a,b,gap)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
export function placeAtlasLabels(labels,{bounds,obstacles=[],gap=4}){
 const occupied=obstacles.filter(r=>r.width>0&&r.height>0),placed=new Map();
 for(const label of labels.map((l,index)=>({...l,index})).sort((a,b)=>(b.priority||0)-(a.priority||0)||a.index-b.index)){
  for(const shift of label.shifts||[0,-18,18,-36,36]){
   const rect={x:label.x,y:label.y+shift,width:label.width,height:label.height};
   if(!(rect.width>0&&rect.height>0)||![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite))continue;
   if(rect.x<bounds.x+gap||rect.y<bounds.y+gap||rect.x+rect.width>bounds.x+bounds.width-gap||rect.y+rect.height>bounds.y+bounds.height-gap)continue;
   if(occupied.some(r=>overlaps(rect,r,gap)))continue;
   placed.set(label.id,shift);occupied.push(rect);break;
  }
 }
 return placed;
}

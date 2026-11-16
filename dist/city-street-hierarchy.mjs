// Local street-surface survey. These are game dimensions, not canonical lore.
// Centre lines, graph links and property footprints remain owned by city-design.
export const STREET_SURFACE_PROFILES=Object.freeze({
 E043:{id:'DIMWELL-WHARFINGER-CARTWAY-001',classification:'local cart route',points:[[74,68],[39,113]],footway:.4,stations:[[0,3],[6,3],[14,4.6],[32,4.6],[39,3],[54,3],[0,4.2]],constraints:['Retained Dimwell workshop approach','E082 service attachment remains held']},
 E044:{id:'WHARFINGER-MISBEGOT-CARTWAY-001',classification:'quayside cart route',points:[[39,113],[34,150]],footway:.4,stations:[[0,4.2],[22,4.2],[25,3],[28,3],[30,4.2],[-7,4.2],[0,3]],constraints:['WHARFINGER-005 private working court','Original Misbegot junction width']}
});

export function streetSurfaceProfile(edge){
 const spec=STREET_SURFACE_PROFILES[edge.id||edge.edge_id];if(!spec)return null;
 const points=edge.points||edge.engine_centreline;
 if(JSON.stringify(points)!==JSON.stringify(spec.points))throw Error('Street survey centreline changed: '+spec.id);
 const [a,b]=points,length=Math.hypot(b[0]-a[0],b[1]-a[1]),normal=[-(b[1]-a[1])/length,(b[0]-a[0])/length];
 const stations=spec.stations.map(([at,width],i)=>({at:i===spec.stations.length-1?length:at<0?length+at:at,width,footway:width===3?.72:spec.footway}));
 function valueAt(at,key){at=Math.max(0,Math.min(length,at));for(let i=1;i<stations.length;i++){const a=stations[i-1],b=stations[i];if(at<=b.at)return a[key]+(b[key]-a[key])*(at-a.at)/(b.at-a.at);}return stations.at(-1)[key];}
 const widthAt=at=>valueAt(at,'width'),footwayAt=at=>valueAt(at,'footway'),carriageWidthAt=at=>widthAt(at)-2*footwayAt(at);
 const position=(at,offset=0)=>[a[0]+(b[0]-a[0])*at/length+normal[0]*offset,a[1]+(b[1]-a[1])*at/length+normal[1]*offset];
 const outline=(carriage=false)=>[...stations.map(s=>position(s.at,s.width/2-(carriage?s.footway:0))),...stations.slice().reverse().map(s=>position(s.at,-s.width/2+(carriage?s.footway:0)))];
 return {...spec,edge:edge.id||edge.edge_id,length,normal,stations,widthAt,footwayAt,carriageWidthAt,position,outline:outline(),carriageOutline:outline(true),maxWidth:Math.max(...stations.map(s=>s.width)),minWidth:Math.min(...stations.map(s=>s.width)),carriageRange:[Math.min(...stations.map(s=>s.width-2*s.footway)),Math.max(...stations.map(s=>s.width-2*s.footway))]};
}

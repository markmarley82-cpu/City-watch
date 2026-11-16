// Review-only receiving proposal. Nothing imports this from the shipped game.
export const BASE_SHA='0d88bc0fc735f13a314f24d6771e03c4ded314a2';
export const CASE_LOGIC_SHA='c8b0cb17bfdc6983e1f67b4f56a12a47885d0405';
export const PROJECTION={tileWidth:28,tileHeight:14,origin:[1070,110],cellCentreOffset:.5};
export const CONTACTS=[
 {id:'porter',room:'GATE',position:['F0',48,61],approach:['F0',47,61],
  kind:'civilian',actions:['accept','receipt','accuse','file'],
  asset:'p3_goblin_01',art:{height:40,sourceFootPivot:[48,120],equipment:'unarmed base sheet only'}},
 {id:'ponder',room:'HEM',position:['F0',82,30],approach:['F0',81,30],
  kind:'existing named identity',actions:['report','correct','file'],
  asset:'wizard-ponder-stibbons',art:{height:'resolve through existing CWCharacters.height; do not invent a new scale'}},
 {id:'crate-records',room:'OCT',position:['F0',47,38],approach:['F0',46,38],
  kind:'non-solid prop/evidence receiver',actions:['crate','buyer'],
  asset:'reuse the four accepted Mate raster candidates after Buddy receiving',
  staff:'unnamed authorised crate-opening action; no separate custodian body',
  buyer:'written first-hand account plus offer note; no buyer body'},
 {id:'stores-assistant',room:'OCT',position:['F0',43,40],approach:['F0',44,40],
  kind:'proposed original human civilian',actions:['challenge','admit','deny'],
  asset:null,art:{status:'HOLD: dedicated original identity/body/portrait awaiting receiving approval'},
  optionalWalk:[['F0',43,40],['F0',43,41],['F0',44,41],['F0',44,40]],
  walkPolicy:'optional host-owned loop, freeze before opening interview; no walk cycle commissioned'}
];
export const CONTACT_RADIUS=1.5;
export const HOST_ONLY_ACTIONS=['admit','deny'];
export const footToPixel=([,x,y])=>[1070+(x-y)*14,117+(x+y)*7];
// The return point is a graph cell centre: (x+.5,y+.5) in the existing renderer.
// Host supplies its canonical saved position and any host-owned assistant index.
// This guard does NOT authenticate visits or replace case evidence/revision gates.
export function contactGate(graph,{contactID,action,position,assistantRouteIndex=null}){
 const contact=CONTACTS.find(c=>c.id===contactID);
 if(!contact||!contact.actions.includes(action))return false;
 if(!Array.isArray(position)||position.length!==3||!graph.levels.includes(position[0])||!position.slice(1).every(Number.isInteger))return false;
 let anchor=contact.position;
 if(assistantRouteIndex!==null){
  if(contactID!=='stores-assistant'||!Number.isInteger(assistantRouteIndex)||!contact.optionalWalk[assistantRouteIndex])return false;
  anchor=contact.optionalWalk[assistantRouteIndex];
 }
 if(position[0]!==anchor[0]||!graph.movable(...position))return false;
 if(graph.zone[position[0]].get(graph.coord(position[1],position[2]))!==contact.room)return false;
 const distance=Math.hypot(position[1]-anchor[1],position[2]-anchor[2]);
 if(distance===0||distance>CONTACT_RADIUS)return false;
 // A local graph path rules out reaching diagonally through solid furniture/walls.
 const path=graph.bfs(position,anchor);
 return path.length>1&&path.length<=3;
}

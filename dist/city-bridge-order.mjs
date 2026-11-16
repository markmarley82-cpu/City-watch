import {bridgeDeckContains} from './city-bridge-contact.mjs?v=p21-b407-s039-reuse';
// The scenery comparator is not transitive across bridge layers and unrelated
// scenery. Enforce registered back / deck actor / front slots after that sort.
function orderEdges(render,edges){
 for(const edge of edges){
  const bridge=render.find(o=>o.edge===edge&&o.bridgePart);
  if(!bridge)continue;
  const onDeck=o=>o.person&&bridgeDeckContains(o.p,bridge);
  if(!render.some(onDeck))continue;
  const slots=[],back=[],people=[],front=[];
  render.forEach((o,i)=>{if(o.edge===edge&&o.bridgePart){slots.push(i);(o.bridgePart==='back'?back:front).push(o);}else if(onDeck(o)){slots.push(i);people.push(o);}});
  const ordered=[...back,...people,...front];slots.forEach((slot,i)=>{render[slot]=ordered[i];});
 }
 return render;
}
export function orderBridgeActors(render){return orderEdges(render,new Set(render.filter(o=>o.bridgePart).map(o=>o.edge)));}
// Retain the bounded Build138 entry point for existing source consumers/tests.
export function orderE007Actors(render){return orderEdges(render,['E007']);}

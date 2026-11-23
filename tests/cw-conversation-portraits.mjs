import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {conversationPortrait,mountConversationPortrait} from '../dist/cw-conversation-portraits.mjs';

for(const [actor,id] of [
 [{id:'colon'},'colon'],[{id:'palm'},'mrs-palm'],[{id:'dibbler'},'dibbler'],
 [{id:'patrol-partner',key:'mentor-nobby'},'nobby'],
 [{id:'patrol-partner',key:'mentor-carrot'},'carrot'],
 [{id:'patrol-partner',key:'mentor-colon'},'colon']]){
 const spec=conversationPortrait(actor);assert.equal(spec.id,id);
 assert((await readFile(fileURLToPath(spec.url))).length>0);
}
for(const actor of [{id:'street-porter',key:'p3_named_colon_base'},
 {id:'witness',key:'mentor-nobby'},{id:'patrol-partner',key:'mentor-detritus'},
 {id:'constructor'},{id:'toString'},{id:'patrol-partner',key:'constructor'},null])
 assert.equal(conversationPortrait(actor),null,'Unrelated people must retain their own portrait');

const doc={createElement:()=>({dataset:{},parentNode:null})};
const container={child:null,replaceChildren(child){if(this.child)this.child.parentNode=null;this.child=child;if(child)child.parentNode=this;}};
let falls=0;
assert(mountConversationPortrait(container,{id:'nobby'},{document:doc,fallback:()=>falls++}));
const previous=container.child;
assert(mountConversationPortrait(container,{id:'dibbler'},{document:doc,fallback:()=>falls++}));
previous.onerror();assert.equal(falls,0,'Late load failures must not replace a newer face');
container.child.onerror();assert.equal(falls,1);
assert(!mountConversationPortrait(container,{id:'witness'},{document:doc}));
console.log('PASS explicit identity, unrecognised actors, prototype keys, asset presence and stale-error protection');

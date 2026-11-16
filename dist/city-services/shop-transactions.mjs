/* Commit through the canonical store before reporting a sale. */
export function commitPurchase({store,revision,change}){
 const current=store.read();
 if(current.revision!==revision)return {ok:false,reason:'stale-quote'};
 if(current.pending)return {ok:false,reason:'encounter-active'};
 const result=change(current);
 if(!result.ok)return result;
 try{if(!store.replaceRecord(result.record,revision))return {ok:false,reason:'stale-quote'};}
 catch{return {ok:false,reason:'save-failed'};}
 // The canonical save owns the purchase. A legacy projection failure must not
 // describe a committed purchase as failed and invite a duplicate charge.
 try{store.project();}catch{}
 return {...result,record:store.read()};
}

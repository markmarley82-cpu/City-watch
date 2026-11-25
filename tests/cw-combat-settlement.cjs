const assert=require('node:assert/strict'),S=require('../dist/cw-p21-state.js');
function storage(){const map=new Map();let fail=false;return{getItem:k=>map.get(k)??null,setItem(k,v){if(fail)throw Error('Storage full');map.set(k,v);},fail(v){fail=v;}};}
function battle({outcome='arrest',arrested=2,released=0,incapacitated=0,hp=20,status='arrested'}={}){return{phase:'result',actors:[{id:'officer',hp,maxHp:24,status:hp?'active':'incapacitated',weaponProfile:'issued-truncheon'},{id:'patron',hp:10,maxHp:14,status},{id:'partner',hp:18,maxHp:20,status:'active'},{id:'lookout',hp:10,maxHp:10,status}],result:{outcome,arrested,released,incapacitated,escaped:0,rounds:3}};}
for(const scenario of [{outcome:'arrest',arrested:2,merit:8},{outcome:'peaceful resolution',arrested:0,released:2,status:'released',merit:5},{outcome:'subdued',arrested:0,incapacitated:2,status:'incapacitated',merit:3},{outcome:'withdrawn',arrested:0,status:'active',merit:0},{outcome:'defeat',arrested:0,status:'active',hp:0,merit:0}]){
 const db=storage(),store=S.create(db),pending=store.begin('taproom','taproom'),b=battle(scenario);assert(store.battle(pending.id,b));
 const reopened=S.create(db);assert.deepEqual(reopened.read().pending.battle,b);assert(reopened.resolve(pending.id,b));const settled=reopened.read();assert.equal(settled.state.merit,scenario.merit);assert.equal(settled.pending,null);assert.equal(settled.encounters.length,1);assert.equal(settled.state.coins,scenario.outcome==='defeat'?2:5);assert.equal(settled.state.hp,scenario.outcome==='defeat'?12:20);
 assert.equal(reopened.resolve(pending.id,b),false);assert.equal(S.create(db).resolve(pending.id,b),false);assert.deepEqual(S.create(db).read(),settled);
}
{
 const db=storage(),store=S.create(db),s=store.read().state;s.chapter=2;s.stage=1;store.campaign(s);
 for(const binding of ['cutpurse-0','cutpurse-1']){const current=S.create(db),p=current.begin('P21-PATROL',binding),b=battle();assert(current.resolve(p.id,b));assert.equal(S.create(db).resolve(p.id,b),false);}
 const r=S.create(db).read();assert.equal(r.state.stage,2);assert.equal(r.state.flags.hubCutpursesCaught,2);assert.equal(r.state.merit,16);assert.equal(r.encounters.length,2);
}
{
 const db=storage(),first=S.create(db),p=first.begin('taproom','taproom'),stale=S.create(db);first.save();assert.equal(stale.resolve(p.id,battle()),false,'Stale tab awarded a result');
 const live=S.create(db),before=live.read();db.fail(true);assert.throws(()=>live.resolve(p.id,battle()),/Storage full/);db.fail(false);assert.deepEqual(S.create(db).read(),before,'Failed write changed disk progress');const retry=S.create(db);assert(retry.resolve(p.id,battle()));assert.equal(S.create(db).read().state.merit,8);
}
console.log('PASS combat settlement: arrest, release, subdued, withdrawal, defeat, reload, stale stores, failed storage, case progression and duplicate payouts');

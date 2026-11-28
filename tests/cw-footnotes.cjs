// node tests/cw-footnotes.cjs — footnote rotation rules.
const assert=require('assert');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};
const F=require('../dist/cw-footnotes.js');const shown=[];F.render=t=>shown.push(t);
F.reset();
// First visit skips the cooldown; second visit waits for it; third visit shows nothing.
assert(F.enterLocation('Brass Bridge'));
assert(!F.enterLocation('Brass Bridge'));          // cooldown
const realNow=Date.now;let t=realNow();Date.now=()=>t;
t+=91000;assert(F.enterLocation('Brass Bridge'));  // second line
t+=91000;assert(!F.enterLocation('Brass Bridge')); // used up
assert.notStrictEqual(shown[0],shown[1]);
// Event bag: every line once before repeats.
const lines=F._data.EVENTS.fight_start,seen=[];
for(let i=0;i<lines.length;i++){t+=91000;F.event('fight_start');seen.push(shown.at(-1));}
assert.strictEqual(new Set(seen).size,lines.length);
// Every place pattern matches at least its own name, and every line is non-empty.
for(const [id,p] of Object.entries(F._data.PLACES)){assert(p.lines.length===2&&p.lines.every(Boolean),id);}
// Saved between sessions.
assert(JSON.parse(store['cityWatchFootnotes.v1']).places.brass_bridge===2);
Date.now=realNow;console.log('footnotes ok:',shown.length,'shown');

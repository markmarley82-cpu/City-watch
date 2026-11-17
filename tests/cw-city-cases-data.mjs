// Checks dist/cases/city-cases.json without a browser:
//   node tests/cw-city-cases-data.mjs
// For every case: places exist and look like [x, y, edge]; scene ids are unique; each
// finding with an outcome can be reached by some order of scenes and choices; a partial
// finding needs less than the full one; findings that require "never" cannot be reached.
import {readFileSync} from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../dist/cases/city-cases.json', import.meta.url), 'utf8'));
const problems = [];
const fail = (id, msg) => problems.push(id + ': ' + msg);

for (const [key, place] of Object.entries(data.places)) {
  const at = place.at;
  if (!place.name || !Array.isArray(at) || at.length !== 3 || !Number.isFinite(at[0]) || !Number.isFinite(at[1]) || typeof at[2] !== 'string')
    fail('place ' + key, 'needs a name and at: [x, y, "edge"]');
}

// Every reachable set of clues, exploring scenes in any order and every choice option.
function reachable(c) {
  const derive = clues => {
    let more = true;
    while (more) {
      more = false;
      for (const d of c.derive || []) if (d.when.every(w => clues.has(w)) && !clues.has(d.gives)) { clues.add(d.gives); more = true; }
    }
    return clues;
  };
  const seen = new Set(), results = [];
  const key = st => [...st.done].sort().join(',') + '|' + Object.entries(st.choices).sort().join(',');
  const stack = [{done: new Set(), clues: derive(new Set()), choices: {}, scenes: 0}];
  while (stack.length) {
    const st = stack.pop(), k = key(st);
    if (seen.has(k)) continue;
    seen.add(k); results.push(st);
    for (const s of c.scenes) {
      if (st.done.has(s.id)) continue;
      if (!(s.requires || []).every(r => st.clues.has(r))) continue;
      if (s.requiresChoice && !Object.entries(s.requiresChoice).every(([sc, opt]) => st.choices[sc] === opt)) continue;
      const options = s.choice ? s.choice.options : [null];
      for (const o of options) {
        const clues = new Set(st.clues);
        for (const g of [...(s.gives || []), ...((o && o.gives) || [])]) clues.add(g);
        stack.push({done: new Set([...st.done, s.id]), clues: derive(clues), choices: o ? {...st.choices, [s.id]: o.id} : st.choices, scenes: st.scenes + 1});
      }
    }
  }
  return results;
}

const ids = new Set();
for (const c of data.cases) {
  if (ids.has(c.id)) fail(c.id, 'duplicate case id');
  ids.add(c.id);
  for (const k of ['title', 'where', 'giverLine', 'brief']) if (!c[k]) fail(c.id, 'missing ' + k);
  const sceneIds = new Set();
  for (const s of c.scenes) {
    if (sceneIds.has(s.id)) fail(c.id, 'duplicate scene ' + s.id);
    sceneIds.add(s.id);
    if (!data.places[s.place]) fail(c.id, 'scene ' + s.id + ' has unknown place ' + s.place);
    for (const g of s.gives || []) if (!c.clues[g]) fail(c.id, 'scene ' + s.id + ' gives ' + g + ' with no clue text');
  }
  if (!data.places[c.file.place]) fail(c.id, 'file has unknown place ' + c.file.place);
  if (c.shift) continue; // partner shifts have their own test (see tests/)
  const states = reachable(c);
  const cost = f => Math.min(...states.filter(st => f.requires.every(r => st.clues.has(r))).map(st => st.scenes));
  const outcomes = c.file.findings.filter(f => f.outcome);
  if (!outcomes.some(f => f.outcome === 'partial')) fail(c.id, 'no partial finding');
  if (!outcomes.some(f => f.outcome === 'full')) fail(c.id, 'no full finding');
  for (const f of c.file.findings) {
    const best = cost(f);
    if (f.outcome && !Number.isFinite(best)) fail(c.id, 'finding ' + f.id + ' can never be reached');
    if (!f.outcome && Number.isFinite(best)) fail(c.id, 'wrong finding ' + f.id + ' can be filed');
    if (!f.outcome && !f.reject && !c.file.reject) fail(c.id, 'wrong finding ' + f.id + ' has no reply');
    if (f.outcome && !(f.reply || f.replies)) fail(c.id, 'finding ' + f.id + ' has no reply');
  }
  const partial = Math.min(...outcomes.filter(f => f.outcome === 'partial').map(cost));
  const full = Math.min(...outcomes.filter(f => f.outcome === 'full').map(cost));
  if (!(partial < full)) fail(c.id, 'the partial report should need fewer scenes than the full one (' + partial + ' vs ' + full + ')');
}

console.log(JSON.stringify({cases: data.cases.length, places: Object.keys(data.places).length, problems}, null, 1));
if (problems.length) process.exit(1);

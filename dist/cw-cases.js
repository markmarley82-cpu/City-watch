/* City cases: a small player for authored street cases (cases/city-cases.json).
   Duty -> City cases opens the case board. Each case is a set of scenes at real
   street points; scenes give clues, some offer a choice, and the report is filed
   with a Watch officer by picking a finding that the recorded evidence supports.
   Progress lives in the campaign record (state.flags.cityCasesV1), written with
   the store's revision check, so the save backup includes it and each case pays
   out once. Case data is fetched only when needed, never at cold startup. */
(function () {
  'use strict';
  const DATA_URL = 'cases/city-cases.json?v=1';
  const FLAG = 'cityCasesV1';
  const NEAR = 2.2;
  let data = null, loading = null, leadScene = null;

  const $ = id => document.getElementById(id);
  const city = () => window.CWP21City;
  const loadData = () => {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch(DATA_URL).then(r => { if (!r.ok) throw Error('Case files unavailable'); return r.json(); })
      .then(d => (data = d)).catch(e => { loading = null; throw e; });
    return loading;
  };

  // ---------- save ----------
  const store = () => window.CWP21State.create(localStorage);
  const read = () => store().read();
  const casesOf = record => {
    const f = record.state.flags[FLAG];
    return f && typeof f === 'object' ? f : { active: null, completed: {} };
  };
  function save(mutate) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const st = store(), r = st.read();
      const c = casesOf(r);
      c.completed = c.completed && typeof c.completed === 'object' ? c.completed : {};
      r.state.flags[FLAG] = c;
      if (mutate(c, r) === false) return false;
      if (st.replaceRecord(r, r.revision)) return true;
    }
    return false;
  }
  const unlocked = record => {
    const s = record.state, rounds = s.flags.p21PatrolRounds;
    return s.chapter > 0 || s.stage > 0 || !!(rounds && Array.isArray(rounds.creditedRoutes) && rounds.creditedRoutes.includes('watch-square-purse'));
  };

  // ---------- case logic ----------
  const caseById = id => data && data.cases.find(c => c.id === id);
  const has = (a, list) => (list || []).every(x => a.clues.includes(x));
  const choiceOk = (a, need) => !need || Object.entries(need).every(([k, v]) => a.choices[k] === v);
  const sceneOpen = (a, s) => !a.done.includes(s.id) && has(a, s.requires) && choiceOk(a, s.requiresChoice);
  const placeOf = key => data.places[key];
  const distanceTo = pt => { const p = city().position(); return Math.hypot(p[0] - pt[0], p[1] - pt[1]); };
  const nearPlace = key => { const pl = placeOf(key); return pl && distanceTo(pl.at) <= NEAR; };
  const fileReady = (c, a) => c.file.findings.some(f => f.outcome && has(a, f.requires));
  function nextLead(c, a) {
    const s = c.scenes.find(x => sceneOpen(a, x));
    return s ? { scene: s, place: s.place, label: s.label } : { file: true, place: c.file.place, label: c.file.label };
  }
  function leadHere(c, a) {
    const s = c.scenes.find(x => sceneOpen(a, x) && nearPlace(x.place));
    if (s) return { scene: s, label: s.label };
    if (fileReady(c, a) && nearPlace(c.file.place)) return { file: true, label: c.file.label };
    return null;
  }

  // ---------- dialog helpers (the Watch duty notebook) ----------
  function sheet(title) {
    const dialog = $('p21-duty-dialog'), box = $('p21-duty-actions');
    const section = document.createElement('section');
    section.className = 'cw-patrol-route-menu cw-case-sheet';
    box.replaceChildren(section);
    const add = (tag, text, cls) => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; section.append(n); return n; };
    const button = (label, fn, opts = {}) => {
      const b = add('button', label); b.type = 'button'; b.disabled = !!opts.disabled;
      b.onclick = () => { if (!opts.keepOpen) dialog.close(); fn && fn(); };
      return b;
    };
    add('h3', title);
    if (!dialog.open) dialog.showModal();
    return { add, button, section, dialog };
  }
  const blocked = record => !!record.pending;
  function hud(record) {
    const s = record.state, money = $('p21-money'), merit = $('p21-merit');
    let rank = null; try { rank = window.CWP21State.career(s); } catch (e) { /* ignore */ }
    if (money) money.textContent = s.coins + (s.coins === 1 ? ' coin' : ' coins');
    if (merit) merit.textContent = (rank ? rank.name + ' · ' : '') + s.merit + ' merit';
  }
  const walkTo = key => {
    const pl = placeOf(key); if (!pl) return false;
    city().stop(); const ok = city().nav(pl.at.slice(0, 2), pl.at[2]);
    if (ok !== false) city().tell('Walking to ' + pl.name + '. Drag anywhere to take control.');
    return ok;
  };

  // ---------- case board ----------
  function board(message) {
    loadData().then(() => {
      const record = read(), cs = casesOf(record), a = cs.active, c = a && caseById(a.id);
      const ui = sheet('City cases');
      if (message) ui.add('p', message, 'cw-case-note');
      if (!unlocked(record)) {
        ui.add('p', 'Finish your first patrol case with Sergeant Colon, then come back for street cases.');
        ui.button('Back to Watch duty', () => $('p21-duty').click());
        return;
      }
      if (c) {
        const lead = nextLead(c, a);
        ui.add('p', 'Current case: ' + c.title, 'cw-case-current');
        ui.add('p', 'Next: ' + lead.label + ' — ' + placeOf(lead.place).name + '.');
        ui.button('Walk to next lead', () => walkTo(lead.place), { disabled: blocked(record) });
        ui.button('Read case notes', () => notes(c, a), { keepOpen: true });
        if (fileReady(c, a) && !lead.file) ui.button('File what you have now (' + c.file.officer + ')', () => walkTo(c.file.place), { disabled: blocked(record) });
        ui.button('Stand down this case', () => standDown(c), { keepOpen: true });
      } else {
        ui.add('p', 'Pick one case at a time. You can still do Night duty and the main story while a case is open.');
      }
      const open = data.cases.filter(x => !cs.completed[x.id]);
      if (open.length) ui.add('h4', c ? 'Waiting cases' : 'Available cases');
      for (const x of open) {
        if (c && x.id === c.id) continue;
        ui.button(x.title + ' · ' + x.where, () => takeCase(x), { disabled: !!c || blocked(record), keepOpen: true });
      }
      const done = data.cases.filter(x => cs.completed[x.id]);
      if (done.length) {
        ui.add('h4', 'Filed cases');
        for (const x of done) ui.add('p', '✓ ' + x.title + ' — ' + cs.completed[x.id].summary, 'cw-case-filed');
      }
      ui.button('Back to Watch duty', () => $('p21-duty').click());
    }).catch(() => { const ui = sheet('City cases'); ui.add('p', 'The case files could not be loaded. Check your connection and try again.'); ui.button('Close', () => {}); });
  }
  function takeCase(c) {
    const record = read();
    if (blocked(record)) return board('Finish the current incident first.');
    const ok = save(cs => { if (cs.active) return false; cs.active = { id: c.id, clues: [], done: [], choices: {}, startedAt: Date.now() }; });
    if (!ok) return board('The case could not be saved. Try again.');
    const ui = sheet(c.title);
    ui.add('p', c.giverLine, 'cw-case-speech');
    ui.add('p', c.brief);
    const lead = nextLead(c, casesOf(read()).active);
    ui.button('Walk to ' + placeOf(lead.place).name, () => walkTo(lead.place));
    ui.button('Back to City cases', () => board(), { keepOpen: true });
    refreshLead();
  }
  function standDown(c) {
    const ui = sheet('Stand down: ' + c.title);
    ui.add('p', 'Your notes will be cleared and nothing is paid. You can take the case again later.');
    ui.button('Stand down', () => { save(cs => { if (!cs.active || cs.active.id !== c.id) return false; cs.active = null; }); refreshLead(); board('Case stood down.'); }, { keepOpen: true });
    ui.button('Keep working on it', () => board(), { keepOpen: true });
  }
  function notes(c, a) {
    const ui = sheet('Case notes · ' + c.title);
    if (!a.clues.length) ui.add('p', 'No evidence recorded yet.');
    for (const id of a.clues) if (c.clues[id]) ui.add('p', '• ' + c.clues[id], 'cw-case-clue');
    for (const [k, v] of Object.entries(a.choices)) {
      const s = c.scenes.find(x => x.id === k), o = s && s.choice.options.find(x => x.id === v);
      if (o) ui.add('p', '• Your decision: ' + o.label, 'cw-case-clue');
    }
    ui.button('Back to City cases', () => board(), { keepOpen: true });
  }

  // ---------- scenes ----------
  function playScene(c, s) {
    const record = read(), a = casesOf(record).active;
    if (blocked(record) || !a || a.id !== c.id || !sceneOpen(a, s) || !nearPlace(s.place)) return refreshLead();
    city().stop();
    if (s.choice) {
      const ui = sheet(s.title);
      if (s.speaker) ui.add('p', s.speaker, 'cw-case-speaker');
      ui.add('p', s.text, 'cw-case-speech');
      ui.add('p', s.choice.prompt);
      for (const o of s.choice.options) ui.button(o.label, () => choose(c, s, o), { keepOpen: true });
      ui.button('Decide later', () => {});
      return;
    }
    const ok = save(cs => { const x = cs.active; if (!x || x.id !== c.id || x.done.includes(s.id)) return false; x.done.push(s.id); for (const g of s.gives || []) if (!x.clues.includes(g)) x.clues.push(g); });
    const ui = sheet(s.title);
    if (s.speaker) ui.add('p', s.speaker, 'cw-case-speaker');
    ui.add('p', s.text, 'cw-case-speech');
    if (!ok) ui.add('p', 'This could not be saved. Close and try again.', 'cw-case-note');
    else for (const g of s.gives || []) if (c.clues[g]) ui.add('p', 'Noted: ' + c.clues[g], 'cw-case-clue');
    afterStep(c, ui);
  }
  function choose(c, s, o) {
    const ok = save(cs => { const x = cs.active; if (!x || x.id !== c.id || x.done.includes(s.id)) return false; x.done.push(s.id); x.choices[s.id] = o.id; for (const g of o.gives || []) if (!x.clues.includes(g)) x.clues.push(g); });
    const ui = sheet(s.title);
    ui.add('p', ok ? o.text : 'This could not be saved. Close and try again.', 'cw-case-speech');
    if (ok) for (const g of o.gives || []) if (c.clues[g]) ui.add('p', 'Noted: ' + c.clues[g], 'cw-case-clue');
    afterStep(c, ui);
  }
  function afterStep(c, ui) {
    const a = casesOf(read()).active;
    if (a && a.id === c.id) {
      const lead = nextLead(c, a);
      const here = leadHere(c, a);
      if (here) ui.button(here.label, () => (here.file ? fileReport(c) : playScene(c, here.scene)), { keepOpen: true });
      else ui.button('Walk to next lead: ' + placeOf(lead.place).name, () => walkTo(lead.place));
    }
    ui.button('Back to the street', () => {});
    refreshLead();
  }

  // ---------- filing ----------
  function fileReport(c, message) {
    const record = read(), a = casesOf(record).active;
    if (blocked(record) || !a || a.id !== c.id || !nearPlace(c.file.place)) return refreshLead();
    city().stop();
    const ui = sheet(c.file.title);
    ui.add('p', c.file.officer, 'cw-case-speaker');
    ui.add('p', c.file.prompt, 'cw-case-speech');
    if (message) ui.add('p', message, 'cw-case-note');
    for (const f of c.file.findings) ui.button(f.label, () => submit(c, f), { keepOpen: true });
    ui.button('Not yet — keep investigating', () => {});
  }
  function submit(c, f) {
    const a = casesOf(read()).active;
    if (!a || a.id !== c.id) return refreshLead();
    if (!f.outcome || !has(a, f.requires)) return fileReport(c, f.reject || c.file.reject);
    const choiceKey = Object.values(a.choices)[0];
    const reply = (f.replies && f.replies[choiceKey]) || f.reply;
    let paid = { merit: 0, coins: 0 };
    const ok = save((cs, r) => {
      const x = cs.active; if (!x || x.id !== c.id || cs.completed[c.id]) return false;
      paid = { merit: f.merit || 0, coins: f.coins || 0 };
      r.state.merit += paid.merit; r.state.coins += paid.coins;
      cs.completed[c.id] = { finding: f.id, outcome: f.outcome, choice: choiceKey || null, merit: paid.merit, coins: paid.coins, summary: f.summary, at: Date.now() };
      cs.active = null;
    });
    if (!ok) return fileReport(c, 'The report could not be saved. Try again.');
    hud(read());
    const ui = sheet('Report filed · ' + c.title);
    ui.add('p', c.file.officer, 'cw-case-speaker');
    ui.add('p', reply, 'cw-case-speech');
    ui.add('p', (f.outcome === 'full' ? 'Case closed. ' : 'Report filed with the evidence you had. ') + '+' + paid.merit + ' merit' + (paid.coins ? ', +' + paid.coins + ' coins' : '') + '.', 'cw-case-note');
    ui.button('City cases', () => board(), { keepOpen: true });
    ui.button('Back to the street', () => {});
    city().tell('Report filed: ' + c.title + '. +' + paid.merit + ' merit.');
    refreshLead();
  }

  // ---------- on-street lead button ----------
  let leadButton = null;
  function ensureButton() {
    if (leadButton) return leadButton;
    const view = document.querySelector('.city-view'); if (!view) return null;
    leadButton = document.createElement('button');
    leadButton.type = 'button'; leadButton.id = 'cw-case-lead'; leadButton.hidden = true;
    leadButton.onclick = () => {
      const a = casesOf(read()).active, c = a && caseById(a.id), here = c && leadHere(c, a);
      if (!here) return refreshLead();
      return here.file ? fileReport(c) : playScene(c, here.scene);
    };
    view.append(leadButton);
    return leadButton;
  }
  function refreshLead() {
    const b = ensureButton(); if (!b || !city()) return;
    let show = null;
    try {
      const record = read(), a = casesOf(record).active;
      if (a && data && !record.pending && !city().isNavigating() && !document.querySelector('dialog[open]')) {
        const c = caseById(a.id); show = c && leadHere(c, a);
      }
    } catch (e) { show = null; }
    b.hidden = !show;
    if (show) { b.textContent = show.label; b.setAttribute('aria-label', 'City case: ' + show.label); }
  }

  // ---------- Duty menu entry ----------
  function addMenuEntry() {
    const box = $('p21-duty-actions'); if (!box || box.querySelector('[data-cw-cases]')) return;
    const anchor = [...box.querySelectorAll('button')].find(b => b.textContent.trim() === 'Casebook');
    if (!anchor) return; // only on the main Duty menu
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'City cases'; b.dataset.cwCases = 'true';
    b.onclick = () => board();
    anchor.after(b);
  }

  function start() {
    if (!window.CWP21City || document.body.dataset.cityBoot !== 'ready') return setTimeout(start, 500);
    const box = $('p21-duty-actions');
    if (box) { new MutationObserver(addMenuEntry).observe(box, { childList: true }); addMenuEntry(); }
    try { if (casesOf(read()).active) loadData().then(refreshLead).catch(() => {}); } catch (e) { /* no save yet */ }
    document.addEventListener('close', () => setTimeout(refreshLead, 50), true);
    setInterval(refreshLead, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.CWCityCases = { board, refreshLead };
})();

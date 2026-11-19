/* City cases: a small player for authored street cases and shifts
   (cases/city-cases.json). Duty -> City cases opens the case board.
   A case is a set of scenes at real street points. Scenes give clues; open
   scenes are leads the player can take in any order (each with a hint of what
   it might reveal); one scene offers a decision whose result can depend on the
   patrol partner; and the report is filed with a Watch officer by choosing a
   finding the recorded evidence supports. Partial, honest findings pay too.
   Replayable shifts pay a small wage each run and merit once per finding type.
   Progress lives in the campaign record (state.flags.cityCasesV1), written with
   the store's revision check, so it is in the save backup and survives reload.
   Case data is fetched only when needed, never at cold startup. */
(function () {
  'use strict';
  const DATA_URL = 'cases/city-cases.json?v=6';
  const BOARD_MAX = 5; // available cases shown at once; more appear as these are closed
  const FLAG = 'cityCasesV1';
  const NEAR = 2.2;
  const PARTNERS = { 'WATCH-04': 'nobby', 'WATCH-03': 'colon' };
  const PARTNER_NAMES = { nobby: 'Nobby Nobbs', colon: 'Sergeant Colon' };
  let data = null, loading = null;

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
  const currentPartner = record => PARTNERS[record.state.flags.patrolMentorAssignment?.mentorId || 'WATCH-04'] || null;
  const partnerUnlocked = (record, key) => key === 'nobby' || (key === 'colon' && record.state.merit >= 6);

  // ---------- case logic ----------
  const caseById = id => data && data.cases.find(c => c.id === id);
  const has = (a, list) => (list || []).every(x => a.clues.includes(x));
  const choiceOk = (a, need) => !need || Object.entries(need).every(([k, v]) => a.choices[k] === v);
  const sceneOpen = (a, s) => !a.done.includes(s.id) && has(a, s.requires) && choiceOk(a, s.requiresChoice) && (!s.requiresPartner || s.requiresPartner === a.partner);
  const placeOf = key => data.places[key];
  const distanceTo = pt => { const p = city().position(); return Math.hypot(p[0] - pt[0], p[1] - pt[1]); };
  const nearPlace = key => { const pl = placeOf(key); return pl && distanceTo(pl.at) <= NEAR; };
  const fileReady = (c, a) => c.file.findings.some(f => f.outcome && has(a, f.requires));
  const pick = (obj, a) => (obj && a.partner && obj[a.partner]) || null; // partner-specific variant
  // Derived evidence: some facts only follow from two clues together (e.g. a sign-writer's mark plus a sighting).
  function derive(c, x) { const added = []; let more = true; while (more) { more = false; for (const d of c.derive || []) if (d.when.every(w => x.clues.includes(w)) && !x.clues.includes(d.gives)) { x.clues.push(d.gives); added.push(d.gives); more = true; } } return added; }
  const sceneText = (s, a) => pick(s.textByPartner, a) || s.text;
  // Open leads: every open scene, in order (the player may take them in any order).
  function openLeads(c, a) {
    const leads = c.scenes.filter(x => sceneOpen(a, x)).map(s => ({ scene: s, place: s.place, label: s.label, hint: s.hint }));
    if (!leads.length || (fileReady(c, a) && !leads.some(l => !l.scene.optional))) leads.push({ file: true, place: c.file.place, label: c.file.label, hint: c.file.hint });
    return leads;
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
  function leadButtons(ui, c, a, record) {
    for (const l of openLeads(c, a)) {
      if (l.hint) ui.add('p', '• ' + l.label + ' (' + placeOf(l.place).name + '): ' + l.hint, 'cw-case-clue');
    }
    for (const l of openLeads(c, a)) ui.button('Walk to: ' + l.label, () => walkTo(l.place), { disabled: blocked(record) });
  }

  // ---------- case board ----------
  function board(message) {
    loadData().then(() => {
      let record = read(), cs = casesOf(record);
      // A case that has been retired from the data (e.g. CW-NC-01, now the team's Duty pilot) is stood down quietly.
      let retired = null;
      if (cs.active && !caseById(cs.active.id)) { retired = cs.active.id; save(x => { if (!x.active || caseById(x.active.id)) return false; x.active = null; }); record = read(); cs = casesOf(record); }
      const a = cs.active, c = a && caseById(a.id);
      const ui = sheet('City cases');
      if (retired) ui.add('p', 'Your earlier bridge case has moved: The Bridge That Was Closed is now in Duty. Nothing you had earned was lost.', 'cw-case-note');
      if (message) ui.add('p', message, 'cw-case-note');
      if (!unlocked(record)) {
        ui.add('p', 'Finish your first patrol case with Sergeant Colon, then come back for street cases.');
        ui.button('Back to Watch duty', () => $('p21-duty').click());
        return;
      }
      if (c) {
        ui.add('p', (c.shift ? 'Current shift: ' : 'Current case: ') + c.title + (a.partner ? ' · with ' + PARTNER_NAMES[a.partner] : ''), 'cw-case-current');
        ui.add('p', 'Open leads — take them in any order:');
        leadButtons(ui, c, a, record);
        ui.button('Read case notes', () => notes(c, a), { keepOpen: true });
        if (fileReady(c, a) && openLeads(c, a).some(l => !l.file)) ui.button('File what you have now (' + c.file.officer + ')', () => walkTo(c.file.place), { disabled: blocked(record) });
        ui.button('Stand down', () => standDown(c), { keepOpen: true });
      } else {
        ui.add('p', 'Pick one case at a time. You can still do Night duty and the main story while a case is open.');
      }
      const list = data.cases.filter(x => x.shift || !cs.completed[x.id]);
      if (list.length) ui.add('h4', c ? 'Waiting' : 'Available');
      let shown = 0, more = 0;
      for (const x of list) {
        if (c && x.id === c.id) continue;
        if (!x.shift && shown >= BOARD_MAX) { more++; continue; }
        if (!x.shift) shown++;
        const runs = cs.completed[x.id] && cs.completed[x.id].runs ? cs.completed[x.id].runs.length : 0;
        ui.button((x.shift ? 'Shift: ' : '') + x.title + ' · ' + x.where + (runs ? ' · worked ' + runs + '×' : ''), () => takeCase(x), { disabled: !!c || blocked(record), keepOpen: true });
      }
      if (more) ui.add('p', more + ' more case' + (more === 1 ? '' : 's') + ' will appear here as you close these.', 'cw-case-note');
      const done = data.cases.filter(x => !x.shift && cs.completed[x.id]);
      const shiftsDone = data.cases.filter(x => x.shift && cs.completed[x.id]);
      if (done.length || shiftsDone.length) ui.add('h4', 'Filed');
      for (const x of done) ui.add('p', '✓ ' + x.title + ' — ' + cs.completed[x.id].summary, 'cw-case-filed');
      for (const x of shiftsDone) { const runs = cs.completed[x.id].runs || []; const last = runs[runs.length - 1]; if (last) ui.add('p', '✓ ' + x.title + ' — last run: ' + last.summary + ' (with ' + PARTNER_NAMES[last.partner] + ')', 'cw-case-filed'); }
      ui.button('Back to Watch duty', () => $('p21-duty').click());
    }).catch(() => { const ui = sheet('City cases'); ui.add('p', 'The case files could not be loaded. Check your connection and try again.'); ui.button('Close', () => {}); });
  }
  function takeCase(c) {
    const record = read();
    if (blocked(record)) return board('Finish the current incident first.');
    let partner = null;
    if (c.partners) {
      partner = currentPartner(record);
      if (!partner || !c.partners.includes(partner)) {
        const ui = sheet(c.title);
        ui.add('p', 'This shift needs Nobby Nobbs or Sergeant Colon as your patrol partner.');
        ui.add('p', 'Nobby blends into a crowd and notices who pays whom. Sergeant Colon keeps people in order, so you can work carefully. Colon joins at 6 merit.');
        ui.button('Choose your patrol partner', () => window.CWP21Game?.partnerMenu?.(), { keepOpen: true });
        ui.button('Back to City cases', () => board(), { keepOpen: true });
        return;
      }
    }
    const ok = save(cs => { if (cs.active) return false; cs.active = { id: c.id, title: c.title, clues: [], done: [], choices: {}, partner, startedAt: Date.now() }; });
    if (!ok) return board('The case could not be saved. Try again.');
    const a = casesOf(read()).active;
    const ui = sheet(c.title);
    if (partner) ui.add('p', 'Your partner for this shift: ' + PARTNER_NAMES[partner] + '. ' + (pick(c.partnerIntro, a) || ''), 'cw-case-note');
    ui.add('p', pick(c.giverLineByPartner, a) || c.giverLine, 'cw-case-speech');
    ui.add('p', c.brief);
    leadButtons(ui, c, a, read());
    ui.button('Back to City cases', () => board(), { keepOpen: true });
    refreshLead();
  }
  function standDown(c) {
    const ui = sheet('Stand down: ' + c.title);
    ui.add('p', 'Your notes will be cleared and nothing is paid. You can take it again later.');
    ui.button('Stand down', () => { save(cs => { if (!cs.active || cs.active.id !== c.id) return false; cs.active = null; }); refreshLead(); board('Stood down.'); }, { keepOpen: true });
    ui.button('Keep working on it', () => board(), { keepOpen: true });
  }
  function notes(c, a) {
    const ui = sheet('Case notes · ' + c.title);
    if (a.partner) ui.add('p', 'Partner: ' + PARTNER_NAMES[a.partner], 'cw-case-note');
    ui.add('h4', 'Evidence');
    if (!a.clues.length) ui.add('p', 'No evidence recorded yet.');
    for (const id of a.clues) if (c.clues[id]) ui.add('p', '• ' + c.clues[id], 'cw-case-clue');
    for (const [k, v] of Object.entries(a.choices)) {
      const s = c.scenes.find(x => x.id === k), o = s && s.choice.options.find(x => x.id === v);
      if (o) ui.add('p', '• Your decision: ' + o.label, 'cw-case-clue');
    }
    const leads = openLeads(c, a);
    if (leads.length) {
      ui.add('h4', 'Open leads');
      for (const l of leads) ui.add('p', '• ' + l.label + ' — ' + placeOf(l.place).name + (l.hint ? '. ' + l.hint : '.'), 'cw-case-clue');
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
      const speaker = pick(s.speakerByPartner, a) || s.speaker;
      if (speaker) ui.add('p', speaker, 'cw-case-speaker');
      ui.add('p', sceneText(s, a), 'cw-case-speech');
      ui.add('p', s.choice.prompt);
      for (const o of s.choice.options) {
        const cost = pick(o.tradeoffByPartner, a) || o.tradeoff;
        if (cost) ui.add('p', '• ' + o.label + ': ' + cost, 'cw-case-clue');
      }
      for (const o of s.choice.options) ui.button(o.label, () => choose(c, s, o), { keepOpen: true });
      ui.button('Decide later', () => {});
      return;
    }
    const gives = pick(s.givesByPartner, a) || s.gives || [];
    let derived = [];
    const ok = save(cs => { const x = cs.active; if (!x || x.id !== c.id || x.done.includes(s.id)) return false; x.done.push(s.id); for (const g of gives) if (!x.clues.includes(g)) x.clues.push(g); derived = derive(c, x); });
    const ui = sheet(s.title);
    const speaker = pick(s.speakerByPartner, a) || s.speaker;
    if (speaker) ui.add('p', speaker, 'cw-case-speaker');
    ui.add('p', sceneText(s, a), 'cw-case-speech');
    if (!ok) ui.add('p', 'This could not be saved. Close and try again.', 'cw-case-note');
    else for (const g of gives.concat(derived)) if (c.clues[g]) ui.add('p', 'Noted: ' + c.clues[g], 'cw-case-clue');
    if (ok && gives.concat(derived).some(g => c.clues[g])) window.CWTeamAudio?.cue('clue');
    const street = pick(s.streetByPartner, a) || s.street;
    if (ok && street) city().tell(street);
    afterStep(c, ui);
  }
  function choose(c, s, o) {
    const a0 = casesOf(read()).active;
    const v = (o.byPartner && a0 && o.byPartner[a0.partner]) || {};
    const gives = v.gives || o.gives || [];
    let derived = [];
    const ok = save(cs => { const x = cs.active; if (!x || x.id !== c.id || x.done.includes(s.id)) return false; x.done.push(s.id); x.choices[s.id] = o.id; for (const g of gives) if (!x.clues.includes(g)) x.clues.push(g); derived = derive(c, x); });
    const ui = sheet(s.title);
    ui.add('p', ok ? (v.text || o.text) : 'This could not be saved. Close and try again.', 'cw-case-speech');
    if (ok && gives.concat(derived).some(g => c.clues[g])) window.CWTeamAudio?.cue('clue');
    if (ok) for (const g of gives.concat(derived)) if (c.clues[g]) ui.add('p', 'Noted: ' + c.clues[g], 'cw-case-clue');
    const street = v.street || o.street;
    if (ok && street) city().tell(street);
    afterStep(c, ui);
  }
  function afterStep(c, ui) {
    const record = read(), a = casesOf(record).active;
    if (a && a.id === c.id) {
      const here = leadHere(c, a);
      if (here) ui.button(here.label, () => (here.file ? fileReport(c) : playScene(c, here.scene)), { keepOpen: true });
      for (const l of openLeads(c, a)) if (!nearPlace(l.place)) ui.button('Walk to: ' + l.label, () => walkTo(l.place));
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
    const choiceKey = Object.values(a.choices)[0] || null;
    const reply = (f.replies && (f.replies[(a.partner || '') + '+' + choiceKey] || f.replies[choiceKey] || f.replies[a.partner])) || f.reply;
    let paid = { merit: 0, coins: 0, repeat: false };
    const ok = save((cs, r) => {
      const x = cs.active; if (!x || x.id !== c.id) return false;
      if (c.shift) {
        const rec = cs.completed[c.id] = cs.completed[c.id] || { runs: [], credited: [] };
        rec.runs = Array.isArray(rec.runs) ? rec.runs : []; rec.credited = Array.isArray(rec.credited) ? rec.credited : [];
        const firstTime = !rec.credited.includes(f.id);
        paid = { merit: firstTime ? (f.merit || 0) : 0, coins: c.wage || 0, repeat: !firstTime };
        if (firstTime) rec.credited.push(f.id);
        rec.runs.push({ finding: f.id, outcome: f.outcome, partner: x.partner, choice: choiceKey, merit: paid.merit, coins: paid.coins, summary: f.summary, at: Date.now() });
        rec.runs = rec.runs.slice(-20);
      } else {
        if (cs.completed[c.id]) return false;
        paid = { merit: f.merit || 0, coins: f.coins || 0, repeat: false };
        cs.completed[c.id] = { title: c.title, finding: f.id, outcome: f.outcome, choice: choiceKey, merit: paid.merit, coins: paid.coins, summary: f.summary, at: Date.now() };
      }
      r.state.merit += paid.merit; r.state.coins += paid.coins;
      cs.active = null;
    });
    if (!ok) return fileReport(c, 'The report could not be saved. Try again.');
    hud(read());
    window.CWTeamAudio?.cue(f.outcome === 'full' ? 'case-closed' : 'reward');
    const ui = sheet('Report filed · ' + c.title);
    ui.add('p', c.file.officer, 'cw-case-speaker');
    ui.add('p', reply, 'cw-case-speech');
    const pay = [];
    if (paid.merit) pay.push('+' + paid.merit + ' merit'); if (paid.coins) pay.push('+' + paid.coins + ' coins');
    ui.add('p', (f.outcome === 'full' ? 'Case closed. ' : 'Report filed: an honest account of what you established. ') + (pay.length ? pay.join(', ') + '.' : '') + (paid.repeat ? ' You were already credited merit for this finding on an earlier run.' : ''), 'cw-case-note');
    if (c.shift) ui.add('p', 'You can work this shift again from City cases, with a different partner or a different call at the bridge.', 'cw-case-note');
    ui.button('City cases', () => board(), { keepOpen: true });
    ui.button('Back to the street', () => {});
    city().tell('Report filed: ' + c.title + '. ' + (pay.join(', ') || 'Recorded.'));
    refreshLead();
  }

  // ---------- the team's Bridge pilot (cases/bridge-closure.mjs, played from Duty) ----------
  // Shows the same street button at a bridge stop when the enquiry has an action there.
  let bridgeMod = null, bridgeLoading = false;
  function bridgeModule() {
    if (bridgeMod) return bridgeMod;
    if (!bridgeLoading) { bridgeLoading = true; import('./cases/bridge-closure.mjs?v=3').then(m => { bridgeMod = m; refreshLead(); }).catch(() => { bridgeLoading = false; }); }
    return null;
  }
  function bridgeLead(record) {
    const c = record.state.flags.bridgeClosurePilot; if (!c) return null;
    const followup = c.status === 'filed' && !c.followup && Number.isSafeInteger(c.publicReport?.night) && record.state.night > c.publicReport.night;
    if (c.status !== 'active' && !followup) return null; // never before the enquiry is taken
    const m = bridgeModule(); if (!m || !window.CWP21Game?.openBridgeCase) return null;
    const mentor = record.state.flags.patrolMentorAssignment?.mentorId || 'WATCH-04';
    const pos = city().footPosition?.() || city().position();
    // Check the stop position directly: the module's follow-up options do not carry a 'here' flag.
    const here = m.options(record, mentor, pos).filter(x => x.id !== 'stand-down' && m.STOPS[x.stop] && m.standsAt(pos, m.STOPS[x.stop]));
    if (!here.length) return null;
    return { bridge: true, label: here.length === 1 ? here[0].label : 'Bridge enquiry: ' + here.length + ' things to do here' };
  }

  // ---------- Night duty / patrol actions hidden behind a shop door ----------
  // The street button prefers a shop's entrance, so a shift action at a shop frontage
  // (e.g. the Dimwell incident by the cobbler's) could only be reached from the imp panel.
  function dutyLead(record) {
    const pd = window.CWP21Game?.patrolDuty; if (!pd) return null;
    let v = null; try { v = pd.view(record); } catch (e) { return null; }
    if (!v || !['inspect', 'report', 'book'].includes(v.action) || !v.label) return null;
    const use = $('city-use');
    if (use && use.offsetParent && use.textContent.trim() === v.label) return null; // already on the street button
    return { duty: true, label: v.label };
  }

  // ---------- on-street lead button ----------
  let leadButton = null;
  function ensureButton() {
    if (leadButton) return leadButton;
    const view = document.querySelector('.city-view'); if (!view) return null;
    leadButton = document.createElement('button');
    leadButton.type = 'button'; leadButton.id = 'cw-case-lead'; leadButton.hidden = true;
    leadButton.onclick = () => {
      if (leadButton.dataset.bridge === 'true') { window.CWP21Game?.openBridgeCase?.(); return; }
      if (leadButton.dataset.duty === 'true') { window.CWP21Game?.patrolDuty?.primary?.(); return; }
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
      if (!record.pending && !city().isNavigating() && !document.querySelector('dialog[open]')) {
        if (a && data) { const c = caseById(a.id); show = c && leadHere(c, a); }
        if (!show) show = bridgeLead(record);
        if (!show) show = dutyLead(record);
      }
    } catch (e) { show = null; }
    b.hidden = !show;
    b.dataset.bridge = show && show.bridge ? 'true' : 'false';
    b.dataset.duty = show && show.duty ? 'true' : 'false';
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
  // Rows for the Watch Notebook's Cases tab (title, status, detail). Titles come from the save,
  // or from the case data once it has loaded; opening the Notebook starts that load.
  function notebookRows(state) {
    const cs = state && state.flags && state.flags[FLAG];
    if (!cs || typeof cs !== 'object') return [];
    // First open after a reload: titles of older records arrive with the case data, then redraw.
    if (!data) loadData().then(() => { const nb = document.getElementById('watch-notebook'); if (nb && nb.classList.contains('open')) window.CW_NOTEBOOK?.refresh?.(); }).catch(() => {});
    const titleOf = (id, rec) => (caseById(id) && caseById(id).title) || (rec && rec.title) || id;
    const rows = [];
    const a = cs.active;
    if (a && a.id) {
      const c = caseById(a.id);
      rows.push({ title: titleOf(a.id, a), description: 'Investigating · ' + (a.clues || []).filter(k => !c || c.clues[k]).length + ' notes recorded', extra: c ? c.brief + ' Open Duty → City cases to carry on.' : 'Open Duty → City cases to carry on.' });
    }
    const done = Object.entries(cs.completed || {}).sort((x, y) => ((y[1] && y[1].at) || 0) - ((x[1] && x[1].at) || 0));
    for (const [id, rec] of done) {
      if (!rec || typeof rec !== 'object') continue;
      const last = Array.isArray(rec.runs) ? rec.runs[rec.runs.length - 1] : rec;
      if (!last) continue;
      rows.push({ title: titleOf(id, rec), description: 'Filed · ' + (last.outcome === 'full' ? 'case closed' : 'partial report') + (last.merit ? ' · ' + last.merit + ' merit' : ''), extra: last.summary || '' });
    }
    return rows;
  }
  window.CWCityCases = { board, refreshLead, notebookRows };
})();

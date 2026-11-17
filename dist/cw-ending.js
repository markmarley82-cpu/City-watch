/* The ending: after the Commander's Decision (chapter three, stage 4, flags.finalChoice).
   A night ceremony in Watch Square: the Watch gathers, Colon, Nobby and Carrot each recall
   something the player actually did (read from the save), Vimes ties the story together,
   answers the recommendation and hands over the stripe. Then the service record, a memorial
   for Sir Terry Pratchett (the clacks carrying his name), a dedication, and back to free
   patrol. Shown once, automatically, when no other screen is open (also for saves that made
   the decision before this existed); afterwards from Duty -> Your Watch record.
   Seen state: state.flags.endingV1, written with the store's revision check. */
(function () {
  'use strict';
  const FLAG = 'endingV1';
  const $ = id => document.getElementById(id);
  const store = () => window.CWP21State.create(localStorage);
  const read = () => store().read();
  const decided = s => (Number(s.chapter) || 0) >= 2 && (Number(s.stage) || 0) >= 4 && !!(s.flags && s.flags.finalChoice);
  const ART = 'assets/characters-drawn-v1/';
  const CAST = {
    colon: ['Sergeant Colon', 'mentor-colon-portrait.webp', 'Colon'], nobby: ['Corporal Nobbs', 'mentor-nobby-portrait.webp', 'Nobby'],
    carrot: ['Captain Carrot', 'mentor-carrot-portrait.webp', 'Carrot'], angua: ['Angua', 'mentor-angua-portrait.webp', 'Angua'],
    cheery: ['Cheery', 'mentor-cheery-portrait.webp', 'Cheery'], detritus: ['Detritus', 'mentor-detritus-portrait.webp', 'Detritus'],
    vimes: ['Commander Vimes', 'vimes-portrait.webp', 'Vimes']
  };
  const WATCH = ['colon', 'nobby', 'carrot', 'angua', 'cheery', 'detritus'];
  const ENDING_MUSIC = { id: 'U06', title: 'Fantasy: Rising Moon', sample_file: 'CW_MUSIC_U06_Rising_Moon_30s.mp3' };

  function markSeen() {
    for (let i = 0; i < 3; i++) {
      const st = store(), r = st.read();
      if (r.state.flags[FLAG]) return true;
      r.state.flags[FLAG] = { seenAt: Date.now() };
      if (st.replaceRecord(r, r.revision)) return true;
    }
    return false;
  }

  // ---------- what the save says ----------
  function facts(record) {
    const s = record.state, f = s.flags || {};
    const rounds = f.p21PatrolRounds || {};
    const done = (f.cityCasesV1 && f.cityCasesV1.completed) || {};
    const closed = id => !!done[id];
    const city = Object.values(done).filter(x => x && !Array.isArray(x.runs)).length + Object.values(done).filter(x => x && Array.isArray(x.runs)).reduce((n, x) => n + x.runs.length, 0);
    const patrolReports = f.patrolPool && Array.isArray(f.patrolPool.reports) ? f.patrolPool.reports.length : 0;
    const arrests = Array.isArray(f.p21EncounterResults) ? f.p21EncounterResults.reduce((n, r) => n + (Number(r && r.arrested) || 0), 0) : 0;
    const university = !!(f.universityCasesV1 && f.universityCasesV1.cases && Object.values(f.universityCasesV1.cases).some(c => c && c.complete));
    const bridge = f.bridgeClosurePilot && f.bridgeClosurePilot.status === 'filed' ? (f.bridgeClosurePilot.partner || 'nobby') : null;
    let rank = null; try { rank = window.CWP21State.career(s); } catch (e) { /* ignore */ }
    const choice = f.finalChoice || '';
    return {
      name: f.recruitName || 'Recruit', rank: rank ? rank.name : 'Corporal', rankIndex: rank ? rank.index : 3,
      merit: Number(s.merit) || 0, nights: Number(s.night) || 1,
      shifts: Math.max(0, (Number(rounds.paidShifts) || 0) - (Number(rounds.unsuccessfulShifts) || 0)),
      city, patrolReports, arrests, university, bridge, delivery: !!rounds.deliveryReport, closed, choice,
      kind: /^Enforcement/.test(choice) ? 'arrests' : /^Restitution/.test(choice) ? 'restitution' : /^Request filed to examine/.test(choice) ? 'audit' : 'other'
    };
  }

  // ---------- the script ----------
  function script(x) {
    const colon = x.closed('CW-NC-08') ? '“Remember that raincoat? Two coats, one peg. I wrote ‘peg-related’ on a form and the Commander signed it. Best day of my career.”'
      : x.closed('CW-SC-02') ? '“You found out the pies were going to a dog. I’ve been eating at that stall for twenty years. I don’t want to talk about it.”'
      : x.shifts >= 3 ? '“All those night shifts, and not once did you fall asleep on a bench. Somebody had to keep the benches company. That was me.”'
      : '“Thirty years I’ve been in the Watch, and I’ve never seen reports as tidy as yours. It’s unsettling, frankly.”';
    const nobby = x.bridge === 'nobby' ? '“That bridge job, eh? I blended right into the queue. Folk said I looked like I belonged in one. I’m taking that as a compliment.”'
      : x.bridge === 'colon' ? '“Heard about your bridge job with the Sarge. Should’ve taken me. I’m brilliant in a queue.”'
      : x.arrests >= 2 ? '“You brought ’em all in, and not one of ’em bit you. That’s more than I can say for most of mine.”'
      : '“I told everyone you’d make it. Well, I said you might. Well, I never said you wouldn’t.”';
    const carrot = x.university ? '“You put the porter’s name right at the University. Most people never notice when the wrong thing gets written down about someone. You did.”'
      : x.closed('CW-MY-01') ? '“The Thirteenth Chime. You wouldn’t name anyone until the evidence did. I’ve been telling everyone about it.”'
      : x.delivery ? '“The missing night delivery. You found every blanket, and you found out why. Somebody in the Shades is sleeping warm tonight because of you.”'
      : x.closed('CW-NC-12') ? '“You warned the Shades before anyone else paid that fake fine. People there are saying the Watch looked out for them.”'
      : '“Every report signed, every witness heard. That’s what the law is for, really.”';
    const verdict = {
      arrests: '“You asked for arrests. You’ll get them, the day the evidence is good enough to survive a lawyer. Until then we keep building the case, and we keep it clean.”',
      restitution: '“You asked for the shopkeepers to be paid back and the witnesses kept safe. Hardly anyone asks for that. It’s the slow way. It’s usually the right one.”',
      audit: '“You asked to see their books. Somewhere in this city a very expensive pen has just stopped moving. Follow the money, and keep a receipt for everything.”',
      other: '“Whatever comes of it, it’ll stand up, because you wrote down what you saw and nothing you didn’t.”'
    }[x.kind];
    const stripe = x.rankIndex > 3
      ? '“I was going to give you a stripe, but your duty sheets got there first.” He nods at the insignia you already wear. “' + x.rank + ' ' + x.name + '. Well done.”'
      : '“And you’ll need this.” He holds out a corporal’s stripe. “Corporal ' + x.name + '. The pay is slightly better and the problems are considerably worse.”';
    const rankWord = x.rank;
    const all = [...WATCH, 'vimes'];
    return [
      { scene: 'square', cast: [], text: 'Watch Square, a little after midnight. Somebody has lit every lamp outside the Watch House, which has never happened before and is very probably against regulations.' },
      { scene: 'square', cast: WATCH, text: 'The Watch is waiting for you. Angua leans against the wall, pretending she isn’t pleased. Cheery has brought a cake that is mostly icing. Detritus salutes, and only slightly dents his helmet.' },
      { scene: 'square', cast: WATCH, who: 'colon', text: colon },
      { scene: 'square', cast: WATCH, who: 'nobby', text: nobby },
      { scene: 'square', cast: WATCH, who: 'carrot', text: carrot },
      { scene: 'square', cast: all, text: 'The Watch House door opens and the square goes quiet. Commander Vimes walks out with his hands in his pockets, as if he just happened to be passing.' },
      { scene: 'square', cast: all, who: 'vimes', text: '“A ledger in a false-bottomed crate at the docks. An invoice for a delivery out by the Dimwell burial ground. A signet ring on a smuggler’s finger. Two thugs who thought jumping a Watch patrol was a sensible career move. Every one of them led back to the same guild door.”' },
      { scene: 'square', cast: all, who: 'vimes', text: '“I’m not saying who’s behind that door. Neither did you. That’s why I trust your report.”' },
      { scene: 'square', cast: all, who: 'vimes', text: verdict },
      { scene: 'square', cast: all, who: 'vimes', text: stripe },
      ...(x.rankIndex > 3 ? [
        { scene: 'square', cast: all, who: 'nobby', text: '“' + rankWord + '! Do I have to salute now?”' },
        { scene: 'square', cast: all, who: 'colon', text: '“You don’t salute me, Nobby.”' },
        { scene: 'square', cast: all, who: 'nobby', text: '“Yeah, but I like this one.”' }
      ] : [
        { scene: 'square', cast: all, who: 'nobby', text: '“Corporal! Same as me. Welcome to the top, mate.”' },
        { scene: 'square', cast: all, who: 'colon', text: '“Nobby, you’ve been a corporal for twenty years. That’s not the top. That’s a ledge.”' }
      ]),
      { scene: 'square', cast: all, text: 'Somebody starts a cheer. Somebody else, out of long habit, starts running. And standing under the lamps with the rest of them, you realise you belong to the Watch.' },
      { scene: 'record' },
      { scene: 'memorial' },
      { scene: 'dedication' },
      { scene: 'end' }
    ];
  }

  // ---------- rendering ----------
  let dialog = null, beats = [], at = 0, info = null, auto = false, music = null;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const button = (label, cls, fn) => { const b = el('button', cls, label); b.type = 'button'; b.onclick = e => { e.stopPropagation(); fn(); }; return b; };
  const firstOf = name => beats.findIndex(b => b.scene === name);
  function build() {
    dialog = el('dialog', 'cw-end'); dialog.id = 'cw-ending'; dialog.setAttribute('aria-label', 'The ending');
    dialog.addEventListener('cancel', e => { e.preventDefault(); skip(); });
    dialog.addEventListener('click', e => { if (e.target.closest('button')) return; if (beats[at] && beats[at].scene === 'square') next(); });
    document.body.append(dialog);
  }
  function next() { if (at < beats.length - 1) { at++; render(); } }
  function skip() { const m = firstOf('record'); if (at < m) { at = m; render(); } else finish(); }
  function render() {
    clearInterval(clacksTimer); clacksTimer = null;
    const b = beats[at];
    dialog.dataset.scene = b.scene;
    dialog.replaceChildren();
    const stage = el('div', 'cw-end-stage');
    if (b.scene === 'square') square(stage, b);
    else if (b.scene === 'record') record(stage);
    else if (b.scene === 'memorial') memorial(stage);
    else if (b.scene === 'dedication') dedication(stage);
    else ending(stage);
    dialog.append(stage);
    const bar = el('div', 'cw-end-bar');
    if (b.scene === 'square') bar.append(button('Skip', 'cw-end-quiet', skip));
    bar.append(b.scene === 'end' ? button('Continue on free patrol', 'cw-end-go', finish) : button('Continue', 'cw-end-go', next));
    dialog.append(bar);
    bar.lastElementChild.focus({ preventScroll: true });
  }
  function square(stage, b) {
    const row = el('div', 'cw-end-cast');
    for (const key of b.cast) {
      const [name, file, short] = CAST[key];
      const face = el('figure', 'cw-end-face' + (b.who === key ? ' speaking' : ''));
      const img = el('img'); img.src = ART + file; img.alt = name; img.onerror = () => img.remove();
      face.append(img, el('figcaption', null, short));
      row.append(face);
    }
    stage.append(row);
    const line = el('div', 'cw-end-line');
    if (b.who) line.append(el('p', 'cw-end-who', CAST[b.who][0]));
    line.append(el('p', b.who ? 'cw-end-speech' : 'cw-end-narration', b.text));
    stage.append(line);
    stage.append(el('p', 'cw-end-hint', 'Tap to continue'));
  }
  function record(stage) {
    const x = info, card = el('section', 'cw-end-card');
    card.append(el('p', 'cw-end-card-kicker', 'ANKH-MORPORK CITY WATCH · SERVICE RECORD'));
    card.append(el('h2', null, x.rank + ' ' + x.name));
    const dl = el('dl');
    const row = (k, v) => dl.append(el('dt', null, k), el('dd', null, v));
    row('Merit', String(x.merit));
    row('Nights served', String(x.nights));
    row('Main investigations', 'The missing ledger · Break-ins and the old crypt · Assaults on patrol');
    row('Recommendation to the Commander', x.choice || '—');
    row('Night duty shifts filed', String(x.shifts));
    row('City cases closed', String(x.city));
    row('Patrol reports filed', String(x.patrolReports));
    row('Arrests on the street', String(x.arrests));
    row('University inquiry', x.university ? 'Filed: the porter’s record corrected' : 'Not filed');
    card.append(dl, el('p', 'cw-end-stamp', 'FILED · PSEUDOPOLIS YARD'));
    stage.append(card);
  }
  // The memorial: Sir Terry (assets/memorial-v1) in front of the clacks tower (assets/clacks-v1,
  // four frames of lit shutters in a 2 x 2 sheet), which flips between its frames as if sending.
  const CLACKS = 'assets/clacks-v1/clacks-tower-8-shutter-states.webp';
  const TERRY = 'assets/memorial-v1/terry-pratchett.webp';
  let clacksTimer = null;
  function memorial(stage) {
    const night = el('div', 'cw-end-night');
    const tower = el('div', 'cw-end-clacks'); tower.setAttribute('aria-hidden', 'true');
    tower.style.backgroundImage = 'url(' + CLACKS + ')';
    const terry = el('img', 'cw-end-terry'); terry.src = TERRY; terry.alt = 'Sir Terry Pratchett, leaning on his stick';
    terry.onerror = () => terry.remove();
    // Sir Terry at true scale, standing on the ground in front of the plinth's left corner
    // (positions are fractions of the 512 x 768 tower frame; a person is about 125 px tall in it).
    const group = el('div', 'cw-end-clacks-group');
    group.append(tower, terry);
    night.append(group);
    stage.append(night);
    let frame = 0;
    const show = () => { tower.dataset.frame = String(frame); frame = (frame + 1) % 4; };
    show();
    if (!window.matchMedia || !matchMedia('(prefers-reduced-motion: reduce)').matches) clacksTimer = setInterval(show, 1100);
    const t = el('div', 'cw-end-memorial');
    t.append(el('p', 'cw-end-fade d1', 'High above the city, the clacks towers pass their messages through the dark, tower to tower, all the way across the Disc.'));
    t.append(el('p', 'cw-end-fade d2', 'Some messages carry a name in the overhead, a name the operators never take off the line. Because a man is not dead while his name is still spoken.'));
    t.append(el('p', 'cw-end-gnu cw-end-fade d3', 'GNU Terry Pratchett'));
    t.append(el('p', 'cw-end-dates cw-end-fade d4', 'Sir Terry Pratchett · 1948–2015'));
    stage.append(t);
  }
  function dedication(stage) {
    stage.append(el('p', 'cw-end-dedication cw-end-fade d1', 'For Sir Terry, and for everyone who ever walked the streets of Ankh-Morpork with him.'));
  }
  function ending(stage) {
    stage.append(el('p', 'cw-end-closing cw-end-fade d1', 'The city is still out there.'));
    stage.append(el('p', 'cw-end-closing cw-end-fade d2', 'It still needs watching.'));
  }

  // ---------- music: only if the player has sound and music on, and has not picked a track ----------
  function startMusic() {
    try {
      const a = window.CWTeamAudio, r = a && a.report();
      if (!r || !r.enabled || !r.music || !r.automaticMusic) return;
      if (a.selectMusic(ENDING_MUSIC)) music = a;
    } catch (e) { /* audio is optional */ }
  }
  function stopMusic() { try { if (music) music.useSceneMusic(); } catch (e) { /* ignore */ } music = null; }

  function open(automatic) {
    if (!dialog) build();
    if (dialog.open) return;
    info = facts(read());
    beats = script(info); at = 0; auto = !!automatic;
    for (const src of [CLACKS, TERRY]) { const i = new Image(); i.src = src; }
    window.CWP21City?.stop?.();
    render();
    dialog.showModal();
    startMusic();
  }
  function finish() {
    clearInterval(clacksTimer); clacksTimer = null;
    markSeen();
    stopMusic();
    if (dialog && dialog.open) dialog.close();
    if (auto) window.CWP21City?.tell?.('Free patrol. Your Watch record is in Duty, whenever you want it.');
    auto = false;
  }

  // ---------- automatic trigger and Duty entry ----------
  function check() {
    try {
      if (document.body.dataset.cityBoot !== 'ready' || !window.CWP21State) return;
      const r = read();
      if (r.pending || !decided(r.state) || r.state.flags[FLAG]) return;
      if (document.querySelector('dialog[open]') || window.CWRecruitmentPending) return;
      open(true);
    } catch (e) { /* no save yet */ }
  }
  function addMenuEntry() {
    const box = $('p21-duty-actions'); if (!box || box.querySelector('[data-cw-ending]')) return;
    const anchor = box.querySelector('[data-cw-cases]') || [...box.querySelectorAll('button')].find(b => b.textContent.trim() === 'Casebook');
    if (!anchor) return;
    let ok = false; try { ok = decided(read().state); } catch (e) { /* ignore */ }
    if (!ok) return;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Your Watch record'; b.dataset.cwEnding = 'true';
    b.onclick = () => { $('p21-duty-dialog')?.close(); setTimeout(() => open(false), 50); };
    anchor.after(b);
  }
  function start() {
    if (!window.CWP21City || document.body.dataset.cityBoot !== 'ready') return setTimeout(start, 500);
    const box = $('p21-duty-actions');
    if (box) { new MutationObserver(addMenuEntry).observe(box, { childList: true }); addMenuEntry(); }
    setInterval(check, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.CWEnding = { open: () => open(false) };
})();

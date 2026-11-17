/* The ending: after the Commander's Decision (chapter three, stage 4, flags.finalChoice),
   a closing scene with Vimes, the promotion, a personal Watch record card, and the credits,
   then back to free patrol. Shown once, automatically, when no other screen is open
   (also for saves that made the decision before this existed); afterwards from
   Duty -> Your Watch record. Seen state: state.flags.endingV1, written with the store's
   revision check so it is in the save backup. */
(function () {
  'use strict';
  const FLAG = 'endingV1';
  const $ = id => document.getElementById(id);
  const store = () => window.CWP21State.create(localStorage);
  const read = () => store().read();
  const decided = s => (Number(s.chapter) || 0) >= 2 && (Number(s.stage) || 0) >= 4 && !!(s.flags && s.flags.finalChoice);

  function markSeen() {
    for (let i = 0; i < 3; i++) {
      const st = store(), r = st.read();
      if (r.state.flags[FLAG]) return true;
      r.state.flags[FLAG] = { seenAt: Date.now() };
      if (st.replaceRecord(r, r.revision)) return true;
    }
    return false;
  }

  // ---------- what the record says ----------
  function choiceKind(text) {
    if (/^Enforcement/.test(text)) return 'arrests';
    if (/^Restitution/.test(text)) return 'restitution';
    if (/^Request filed to examine/.test(text)) return 'audit';
    return 'other';
  }
  function facts(record) {
    const s = record.state, f = s.flags || {};
    const rounds = f.p21PatrolRounds || {};
    const city = f.cityCasesV1 && f.cityCasesV1.completed ? Object.values(f.cityCasesV1.completed).filter(x => x && !Array.isArray(x.runs)).length : 0;
    const shifts = f.cityCasesV1 && f.cityCasesV1.completed ? Object.values(f.cityCasesV1.completed).filter(x => x && Array.isArray(x.runs)).reduce((n, x) => n + x.runs.length, 0) : 0;
    const patrolReports = f.patrolPool && Array.isArray(f.patrolPool.reports) ? f.patrolPool.reports.length : 0;
    const arrests = Array.isArray(f.p21EncounterResults) ? f.p21EncounterResults.reduce((n, r) => n + (Number(r && r.arrested) || 0), 0) : 0;
    const university = !!(f.universityCasesV1 && f.universityCasesV1.cases && Object.values(f.universityCasesV1.cases).some(c => c && c.complete));
    let rank = null; try { rank = window.CWP21State.career(s); } catch (e) { /* ignore */ }
    return {
      name: f.recruitName || 'Recruit', rank: rank ? rank.name : 'Corporal', rankIndex: rank ? rank.index : 3,
      merit: Number(s.merit) || 0, coins: Number(s.coins) || 0, nights: Number(s.night) || 1,
      shifts: Math.max(0, (Number(rounds.paidShifts) || 0) - (Number(rounds.unsuccessfulShifts) || 0)),
      city: city + shifts, patrolReports, arrests, university, choice: f.finalChoice || ''
    };
  }

  // ---------- pages ----------
  const VIMES = 'assets/characters-drawn-v1/vimes-portrait.webp';
  function pages(record) {
    const x = facts(record), kind = choiceKind(x.choice);
    const verdict = {
      arrests: '“You want arrests. Fine. You’ll get them, the day the evidence is good enough to survive a lawyer. Until then we keep building the case, and we keep it clean.”',
      restitution: '“You asked for the shopkeepers to be paid back and the witnesses kept safe. Hardly anyone asks for that. It’s the slow way. It’s usually the right one.”',
      audit: '“You want to see their books. Somewhere in this city a very expensive pen has just stopped moving. Follow the money, and keep a receipt for everything.”',
      other: '“Whatever comes of it, it’ll stand up, because you wrote down what you saw and nothing you didn’t.”'
    }[kind];
    const promoted = x.rankIndex === 3
      ? '“And you’ll need this.” He slides a corporal’s stripe across the desk. “Corporal ' + x.name + '. The pay is slightly better and the problems are considerably worse.”'
      : x.rankIndex > 3
        ? '“I was going to give you a stripe, but your duty sheets got there first.” He nods at the insignia you already wear. “' + x.rank + ' ' + x.name + '. Carry on.”'
        : '“And you’ll need this.” He slides a stripe across the desk. “' + x.rank + ' ' + x.name + '.”';
    return [
      {
        kicker: 'THE WATCH HOUSE · LATE', title: 'Commander Vimes', portrait: VIMES,
        paras: [
          'Vimes is standing at the window of his office, watching the city the way other people watch a pan that might boil over.',
          '“A ledger in a false-bottomed crate at the docks. An invoice for a delivery out by the Dimwell burial ground. A signet ring on a smuggler’s finger. Two thugs who thought jumping a Watch patrol was a sensible career move. Four different reports, and every one of them led back to the same guild door.”',
          'He turns round. “I’m not saying who’s behind that door. Neither did you. That’s why I trust your report.”',
          verdict
        ]
      },
      {
        kicker: 'THE WATCH HOUSE · LATE', title: 'A stripe', portrait: VIMES,
        paras: [
          '“Not long ago you didn’t know which end of a truncheon to hold. Now you write reports I don’t have to read twice.”',
          promoted,
          'He almost smiles. “Don’t let it go to your head. The city certainly won’t.”'
        ]
      },
      { kicker: 'CITY WATCH · SERVICE RECORD', title: 'Watch record: ' + x.name, card: x },
      { kicker: 'CITY WATCH: THE LANTERN FILES', title: 'Credits', credits: true }
    ];
  }

  // ---------- rendering ----------
  let dialog = null, index = 0, list = [], auto = false;
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function build() {
    dialog = el('dialog', 'cw-ending'); dialog.id = 'cw-ending'; dialog.setAttribute('aria-labelledby', 'cw-ending-title');
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(); });
    document.body.append(dialog);
  }
  function row(dl, label, value) { dl.append(el('dt', null, label), el('dd', null, value)); }
  function render() {
    const p = list[index];
    dialog.replaceChildren();
    const head = el('header', 'cw-ending-head');
    head.append(el('p', 'cw-ending-kicker', p.kicker));
    const close = el('button', 'cw-ending-close', 'Close'); close.type = 'button'; close.onclick = finish;
    head.append(close);
    dialog.append(head);
    const body = el('div', 'cw-ending-body');
    const h = el('h2', null, p.title); h.id = 'cw-ending-title';
    if (p.portrait) {
      const fig = el('div', 'cw-ending-speaker');
      const img = el('img'); img.src = p.portrait; img.alt = ''; img.onerror = () => img.remove();
      fig.append(img, h); body.append(fig);
    } else body.append(h);
    for (const t of p.paras || []) body.append(el('p', /^“[^”]*”$/.test(t) ? 'cw-ending-speech' : null, t)); // only pure speech in italics
    if (p.card) body.append(card(p.card));
    if (p.credits) credits(body);
    dialog.append(body);
    const nav = el('footer', 'cw-ending-nav');
    if (index > 0) { const b = el('button', 'cw-ending-alt', 'Back'); b.type = 'button'; b.onclick = () => { index--; render(); }; nav.append(b); }
    const last = index === list.length - 1;
    const next = el('button', null, last ? 'Continue on free patrol' : 'Continue'); next.type = 'button';
    next.onclick = () => { if (last) finish(); else { index++; render(); } };
    nav.append(next);
    dialog.append(nav);
    body.scrollTop = 0;
    next.focus({ preventScroll: true });
  }
  function card(x) {
    const box = el('section', 'cw-ending-card');
    const dl = el('dl');
    row(dl, 'Name', x.name);
    row(dl, 'Rank', x.rank);
    row(dl, 'Merit', String(x.merit));
    row(dl, 'Nights served', String(x.nights));
    row(dl, 'Main investigations', 'The missing ledger · Break-ins and the old crypt · Assaults on patrol');
    row(dl, 'Recommendation to the Commander', x.choice || '—');
    row(dl, 'Night duty shifts filed', String(x.shifts));
    row(dl, 'City cases closed', String(x.city));
    row(dl, 'Patrol reports filed', String(x.patrolReports));
    row(dl, 'Arrests on the street', String(x.arrests));
    row(dl, 'University inquiry', x.university ? 'Filed: the porter’s record corrected' : 'Not filed');
    box.append(dl);
    box.append(el('p', 'cw-ending-stamp', 'FILED · PSEUDOPOLIS YARD'));
    return box;
  }
  function credits(body) {
    body.append(el('p', 'cw-ending-made', 'Made by Mark and the City Watch team.'));
    body.append(el('p', null, 'Discworld was created by Sir Terry Pratchett. This is an unofficial, non-commercial fan game. Discworld is © the Terry Pratchett estate; this game is not affiliated with or endorsed by its owners.'));
    body.append(el('h3', null, 'Music'));
    const music = el('ul', 'cw-ending-list'); music.append(el('li', null, 'Loading the music credits…')); body.append(music);
    fetch('assets/echo-all-v012/tracks.json').then(r => r.json()).then(tracks => {
      music.replaceChildren();
      for (const t of tracks) music.append(el('li', null, t.title + ' — ' + t.author + ' (' + t.licence + (/Kevin MacLeod/.test(t.author) ? ', incompetech.com' : '') + ')'));
    }).catch(() => { music.replaceChildren(el('li', null, 'Music by RandomMind, Écrivain, cynicmusic, ComposerBeck and Kevin MacLeod (incompetech.com). Full credits are in the game’s music panel.')); });
    body.append(el('h3', null, 'Sound'));
    body.append(el('p', null, 'CC0 recordings by rubberduck, OwlishMedia, PagDev, kmontesdev, Julie Damsgaard (Spring Spring), Iwan Gabovitch (qubodup) and NachtmahrTV (edited by AntumDeluge), via OpenGameArt and itch.io.'));
    body.append(el('p', 'cw-ending-gnu', 'GNU Terry Pratchett'));
    body.append(el('p', null, 'Thank you for walking the beat. The city is still out there, and it still needs watching: your patrol carries on.'));
  }
  function open(automatic) {
    if (!dialog) build();
    if (dialog.open) return;
    const record = read();
    list = pages(record); index = 0; auto = !!automatic;
    window.CWP21City?.stop?.();
    render();
    dialog.showModal();
  }
  function finish() {
    markSeen();
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

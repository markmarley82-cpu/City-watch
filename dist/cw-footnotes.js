/* City Watch narrator footnotes.
 * Dry asides that slide in at the bottom of the screen with an asterisk.
 * Kept from getting repetitive:
 *  - place lines: first visit gets one, second visit gets another, then never again;
 *  - event lines: shuffled, every line used once before any repeats;
 *  - a 90 s cooldown between ordinary footnotes; the first time of each kind skips it;
 *  - Watch-life lines only after about four quiet minutes;
 *  - what has been seen is saved (localStorage key below), so it carries across sessions.
 * Hooks are read-only: it watches #city-location, #city-use, #city-message, the city clock
 * and the battle frame's messages. It changes no game state.
 * New district? Footnotes.addPack({places:{id:{match:/.../,lines:[a,b]}},events:{...},ambient:[...]}).
 */
(function () {
  'use strict';
  var COOLDOWN_MS = 90 * 1000, AMBIENT_GAP_MS = 4 * 60 * 1000, SHOW_MS = 7000;
  var STORE_KEY = 'cityWatchFootnotes.v1';

  // match is tested against the location plaque text ("Street · Place").
  var PLACES = {
    brass_bridge: { match: /Brass Bridge/i, lines: [
      "Brass Bridge: built to impress visitors. Mostly they were impressed by how much it cost to cross.",
      "The bridge's brass is polished daily by the boots of people who have somewhere better to be."] },
    the_shades: { match: /\bShades\b/i, lines: [
      "The Shades: Watchmen go in in pairs and come out in whatever state the Shades decides.",
      "You're back in the Shades. The Shades noticed. The Shades always notices."] },
    treacle_mine_road: { match: /Treacle Mine/i, lines: [
      "Treacle Mine Road: nobody has mined treacle here in living memory. Nobody has been brave enough to check whether anyone ever did.",
      "Still no treacle. The road remains confident it's coming."] },
    watch_house: { match: /Pseudopolis Yard|Watch House/i, lines: [
      "Pseudopolis Yard: the Watch House has a front door, a back door and a side door everyone pretends is a window.",
      "Home. Or as near to home as a building that smells of boiled cabbage and old boots can be."] },
    isle_of_gods: { match: /Isle of Gods/i, lines: [
      "Isle of Gods: named after the gods, who have so far declined to visit.",
      "Still no gods. Rumour says one came once, looked around, and pretended it had the wrong address."] },
    mended_drum: { match: /Mended Drum/i, lines: [
      "The Mended Drum: the furniture is replaced weekly. The customers, less often.",
      "The barman recognises you. This is either a good sign or a reason to keep your back to the wall."] },
    cunning_artificers: { match: /Cunning Artificers/i, lines: [
      "Street of Cunning Artificers: everything sold here works perfectly, as long as you don't ask it to do what it was sold for.",
      "A shop here is selling a device for finding lost things. It has been lost twice this week."] },
    unseen_university: { match: /University/i, lines: [
      "Unseen University: the walls are there to protect the city from the University, not the other way round.",
      "Something purple just went over the wall. The Watch's official position is that it didn't."] },
    river_ankh: { match: /Morpork docks|Wharfinger/i, lines: [
      "The Ankh: locals judge the river's mood by its colour. Today's colour doesn't have a name yet.",
      "The river has moved slightly since you were last here. Not along. Just... moved."] },
    dolly_sisters: { match: /Dolly Sisters/i, lines: [
      "Dolly Sisters: famous for gossip, which moves faster than the Watch and is usually better informed.",
      "Three people here already know where you're going next. One of them is wrong, but only slightly."] },
    sator_square: { match: /Sator/i, lines: [
      "Sator Square: the pigeons here have seen everything and been impressed by none of it.",
      "One of the pigeons is watching you. It has the look of a bird that knows your name."] },
    patricians_palace: { match: /Palace/i, lines: [
      "The Patrician's Palace: the Patrician is always in. Whether he's in for you is another matter.",
      "The guards at the gate nod at you. They nod at everyone. It's the not-nodding you need to worry about."] },
    alchemists_guild: { match: /Alchemist/i, lines: [
      "Guild of Alchemists: rebuilt so many times the builders keep a set of plans ready, marked \"again\".",
      "The building is still standing. Give it time."] },
    assassins_guild: { match: /Assassin/i, lines: [
      "Guild of Assassins: they don't accept walk-ins. They do accept walk-outs, briefly.",
      "A curtain twitched as you passed. Assassins don't twitch curtains. So who did?"] },
    fools_guild: { match: /Fools/i, lines: [
      "Fools' Guild: the saddest building in the city. It gets custard on the windows every morning to keep up appearances.",
      "Someone inside is practising a pratfall. They've been practising it for six years."] },
    hide_park: { match: /Hide Park/i, lines: [
      "Hide Park: named for what people do in it, not for what's on the trees.",
      "A bench here has a plaque to someone 'who loved this park'. The park has no comment."] },
    the_tanty: { match: /Tanty/i, lines: [
      "The Tanty: the city prison. The walls are thick, the food is thin, and the escapes are mostly rumours the guards start.",
      "A prisoner waves from a window. He seems far too cheerful for someone with a view like that."] },
    plaza_broken_moons: { match: /Broken Moons/i, lines: [
      "Plaza of Broken Moons: nobody remembers which moons, or who broke them. A street trader will sell you a piece anyway.",
      "The trader has more moon pieces than yesterday. Nobody asks where from."] },
    misbegot_bridge: { match: /Misbegot/i, lines: [
      "Misbegot Bridge: the name was a clerk's spelling mistake. By the time anyone noticed, it had stuck, like most things on this bridge.",
      "Something under the bridge is singing. It's best not to request anything."] },
    small_gods: { match: /Small Gods/i, lines: [
      "Small Gods: a home for gods who have lost their followers. They are very keen to meet new people.",
      "A tiny voice asks if you'd like to believe in something. It doesn't mind what."] },
    bookkeepers: { match: /Bookkeepers/i, lines: [
      "Street of Bookkeepers: every crime here is committed twice, once in the books and once in the copy for the auditors.",
      "A clerk is counting the cobbles. He's on his second count and doesn't like the answer."] },
    three_lamps: { match: /Three Lamps/i, lines: [
      "Three Lamps Alley: there were three lamps once. Then there were two lamps and a very good story.",
      "Still two lamps. The story has grown a third ending."] },
    broad_way: { match: /Broad Way/i, lines: [
      "Broad Way: wide enough for two carts to pass, and for both drivers to argue about it.",
      "The carts are still arguing. Neither has moved since you were last here."] },
    opera_house: { match: /Opera/i, lines: [
      "The Opera House: the singing can be heard three streets away. So can the complaints.",
      "Rehearsals are on. Somewhere inside, a high note is being held hostage."] }
  };

  var EVENTS = {
    fight_start: [
      "Most fights in Ankh-Morpork begin with someone saying \"Oi\". This one was no exception.",
      "Watch training covers fighting in two words: \"Don't\" and, if that fails, \"Duck\".",
      "Your opponent has the confidence of a man who has never once read the law."],
    fight_won: [
      "The suspect has decided to have a quiet lie down on the cobbles. It's been a long day for everyone.",
      "Victory. Somewhere, a sergeant will claim he taught you that."],
    fight_lost: [
      "You've been knocked down. In this city, that counts as a warm welcome.",
      "The cobbles are cold, but at least they're familiar."],
    near_death: [
      "Death would like you to know he isn't here for you. He's just early.",
      "A tall figure at the edge of your vision is checking an hourglass. Politely. For now."],
    locked_door: [
      "In Ankh-Morpork, a locked door is less a barrier than an opening offer.",
      "Locked. Whoever lives here either trusts nobody or owes everybody."],
    washing_line: ["Washing here is hung out to dry and brought back in wetter and noticeably dirtier."],
    rain: ["The rain makes the streets cleaner, briefly, before the streets make the rain dirtier."],
    nightfall: ["Night is when honest folk sleep and the Thieves' Guild starts its regular shift."],
    fog: ["Ankh-Morpork fog is so thick that people have been arrested for loitering in it without knowing."],
    arrest: [
      "The suspect came quietly, mostly because Nobby was talking and he wanted it to stop.",
      "The cells under the Watch House are cosy, damp and fully booked most Saturdays."],
    dead_end: ["This alley goes nowhere. Several criminals have found this out the hard way."],
    barrel: ["Contents unknown. The barrel would like to keep it that way."],
    trader: ["He's selling it at a loss. He sells everything at a loss, and somehow he owns three houses."],
    dibbler: ["Dibbler's sausages definitely contain meat. Which meat is between Dibbler and his conscience, and they haven't spoken in years."],
    statue: ["A great hero of the city. Nobody can remember what he did, but the pigeons are fond of him."],
    chase: ["The thief knows these streets better than you. Unfortunately for him, he knows them in the wrong order."],
    merit: ["Merit noted. Somewhere in the Watch House a form has been filled in, which is as close to fame as most Watchmen get."],
    newspaper: ["The news is printed fresh every morning and believed by lunchtime."],
    tavern: ["The tavern goes quiet when a Watchman walks in. It isn't respect. It's everyone deciding which window to use."]
  };

  var AMBIENT = [
    "Watch regulations run to forty pages. Sergeant Colon has read the first one twice.",
    "A lantern has two jobs: lighting your way, and warning criminals you're coming so everyone can avoid an awkward scene.",
    "The badge is copper. This is considered funny mainly by people who aren't wearing one.",
    "Nobby carries a certificate proving he's human. Nobody has ever asked to see it, which he finds suspicious.",
    "Recruits are issued a helmet, a sword and a strong suggestion not to use either.",
    "A Watchman's boots let them feel every cobble. Old hands can tell which street they're on with their eyes closed. New hands just fall over.",
    "Watch-house tea is brewed once a week and topped up as needed.",
    "Night shift has one advantage: the criminals are tired too.",
    "A good Watchman knows every alley. A great one knows which alleys are only alleys on Tuesdays.",
    "Nobby has been on the Watch longer than anyone can prove, which is how he likes it.",
    "The duty sergeant has a desk, a ledger and a look that has made grown trolls apologise.",
    "Ankh side and Morpork side are each sure the other half of the city smells. Both are right."
  ];

  // ---------- saved state ----------
  var state = { places: {}, bags: {}, firsts: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state.places = saved.places || {}; state.bags = saved.bags || {}; state.firsts = saved.firsts || {};
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  var lastShown = Date.now() - COOLDOWN_MS + 20000; // first footnote no sooner than 20 s in
  var showing = false;

  function shuffled(n) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; }
    return a;
  }
  function draw(key, lines) {
    if (!lines || !lines.length) return null;
    var bag = state.bags[key];
    if (!Array.isArray(bag) || !bag.length || bag.some(function (i) { return !(i < lines.length); })) bag = shuffled(lines.length);
    var idx = bag.shift(); state.bags[key] = bag;
    return { text: lines[idx], idx: idx };
  }
  function ready() {
    if (typeof document === 'undefined') return true;
    if (document.hidden) return false;
    var boot = document.body && document.body.dataset.cityBoot;
    if (boot && boot !== 'ready') return false;
    if (window.CWRecruitmentPending) return false; // still signing up
    // Stay out of menus, sign-up and conversations; fights are the exception.
    var open = document.querySelectorAll('dialog[open]');
    for (var i = 0; i < open.length; i++) if (open[i].id !== 'p21-combat-dialog') return false;
    return true;
  }
  function show(text, force) {
    var now = Date.now();
    if (!text || !ready()) return false;
    if (showing && !force) return false;
    if (!force && now - lastShown < COOLDOWN_MS) return false;
    lastShown = now; save();
    try { Footnotes.render(text); } catch (e) {}
    return true;
  }

  // ---------- slide-in box ----------
  var box = null, hideTimer = 0;
  function host() {
    // An open modal dialog sits in the top layer; put the box inside it so it isn't hidden.
    var open = document.querySelectorAll('dialog[open]');
    return open.length ? open[open.length - 1] : document.body;
  }
  function defaultRender(text) {
    if (typeof document === 'undefined') return;
    if (!box) {
      box = document.createElement('div');
      box.id = 'cw-footnote';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));' +
        'max-width:520px;margin:0 auto;padding:10px 14px;box-sizing:border-box;background:rgba(28,22,16,.95);' +
        'color:#efe3c8;border-top:2px solid #b08a4a;border-radius:6px;font:italic 15px/1.4 Georgia,serif;' +
        'z-index:100000;transform:translateY(160%);transition:transform .35s ease;box-shadow:0 4px 14px rgba(0,0,0,.45);pointer-events:none';
    }
    var h = host();
    if (box.parentNode !== h) h.appendChild(box);
    box.textContent = '* ' + text;
    showing = true;
    box.style.transform = 'translateY(160%)';
    void box.offsetWidth;
    box.style.transform = 'translateY(0)';
    clearTimeout(hideTimer); hideTimer = setTimeout(hide, SHOW_MS);
  }
  function hide() { if (box) box.style.transform = 'translateY(160%)'; showing = false; }

  var Footnotes = {
    render: defaultRender,
    enterPlace: function (id) {
      var p = PLACES[id]; if (!p) return false;
      var count = state.places[id] || 0;
      if (count >= p.lines.length) return false;
      if (show(p.lines[count], count === 0)) { state.places[id] = count + 1; save(); return true; }
      return false;
    },
    // Location plaque text -> matching places. Only the first unseen match is tried.
    enterLocation: function (text) {
      if (!text) return false;
      for (var id in PLACES) {
        if (PLACES[id].match.test(text) && (state.places[id] || 0) < PLACES[id].lines.length) return Footnotes.enterPlace(id);
      }
      return false;
    },
    event: function (name) {
      var first = !state.firsts[name], key = 'event:' + name, d = draw(key, EVENTS[name]);
      if (!d) return false;
      if (show(d.text, first)) { state.firsts[name] = true; save(); return true; }
      state.bags[key].unshift(d.idx); // not shown: keep it for next time
      return false;
    },
    tick: function () {
      // A place reached while a menu was open gets its turn once the menu closes.
      var loc = typeof document !== 'undefined' && document.getElementById('city-location');
      if (!showing && loc && Footnotes.enterLocation(loc.textContent.trim())) return true;
      if (showing || Date.now() - lastShown < AMBIENT_GAP_MS) return false;
      var d = draw('ambient', AMBIENT);
      if (d && show(d.text, false)) return true;
      if (d) state.bags.ambient.unshift(d.idx);
      return false;
    },
    addPack: function (pack) {
      if (!pack) return; var k;
      if (pack.places) for (k in pack.places) PLACES[k] = pack.places[k];
      if (pack.events) for (k in pack.events) EVENTS[k] = (EVENTS[k] || []).concat(pack.events[k]);
      if (pack.ambient) AMBIENT.push.apply(AMBIENT, pack.ambient);
    },
    reset: function () { state = { places: {}, bags: {}, firsts: {} }; lastShown = 0; save(); },
    _data: { PLACES: PLACES, EVENTS: EVENTS, AMBIENT: AMBIENT }
  };
  if (typeof window !== 'undefined') window.CWFootnotes = Footnotes;
  if (typeof module !== 'undefined') module.exports = Footnotes;
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

  // ---------- read-only hooks into the game ----------
  function watchText(id, fn) {
    var el = document.getElementById(id); if (!el) return;
    var last = '';
    var check = function () { var t = el.textContent.trim(); if (t && t !== last) { last = t; fn(t); } };
    new MutationObserver(check).observe(el, { childList: true, characterData: true, subtree: true });
    check();
  }
  watchText('city-location', function (t) {
    if (Footnotes.enterLocation(t)) return;
    if (/Mended Drum|tavern|inn\b/i.test(t)) Footnotes.event('tavern');
  });
  watchText('city-use', function (t) {
    if (/Dibbler/i.test(t)) Footnotes.event('dibbler');
    else if (/newspaper|hawker|paper seller/i.test(t)) Footnotes.event('newspaper');
    else if (/statue/i.test(t)) Footnotes.event('statue');
    else if (/barrel/i.test(t)) Footnotes.event('barrel');
    else if (/trader|stall/i.test(t)) Footnotes.event('trader');
    else if (/washing/i.test(t)) Footnotes.event('washing_line');
  });
  watchText('city-message', function (t) {
    if (/\block(ed)?\b/i.test(t)) Footnotes.event('locked_door');
    else if (/dead end/i.test(t)) Footnotes.event('dead_end');
    else if (/\bchase\b|runs? off|makes a run/i.test(t)) Footnotes.event('chase');
  });
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data.type !== 'string') return;
    if (e.data.type === 'cw-p21-battle-presented') Footnotes.event('fight_start');
    else if (e.data.type === 'cw-p21-battle-result') {
      var out = e.data.battle && e.data.battle.result && e.data.battle.result.outcome;
      // The result toast from the game comes first; give it a moment.
      setTimeout(function () {
        if (out === 'arrest') Footnotes.event('arrest');
        else if (out === 'defeat' || out === 'withdrawn') Footnotes.event('fight_lost');
        else if (out === 'subdued') Footnotes.event('fight_won');
        else if (out) Footnotes.event('merit');
      }, 2500);
    }
  });
  var lastPhase = null;
  setInterval(function () {
    try {
      var c = window.CWP21City && window.CWP21City.clock && window.CWP21City.clock();
      var phase = c && c.phase;
      if (phase && lastPhase && phase !== lastPhase && phase === 'Night') Footnotes.event('nightfall');
      if (phase) lastPhase = phase;
    } catch (e) {}
    Footnotes.tick();
  }, 5000);
})();

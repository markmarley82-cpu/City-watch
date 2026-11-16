/* City Watch small fixes: current-assignment banner, save backup/restore,
   and a Home Screen tip. Standalone; reads and writes only the game's own
   DOM and its city_watch_* localStorage entries. */
(function () {
  'use strict';
  const DEFAULT_MESSAGE = 'Report to Sergeant Colon, or follow your assignment through the seven-bridge city.';
  const SAVE_PREFIX = 'city_watch_';
  const FORMAT = 'city-watch-save';

  /* 1. The city starts with a fixed "Report to Sergeant Colon" line even when
     the player is further on. Show the real assignment instead, and keep it
     current while that default line is still on screen. */
  function syncBanner() {
    const message = document.getElementById('city-message');
    const objective = document.getElementById('p21-objective');
    if (!message || !objective) return;
    const goal = objective.textContent.trim();
    if (!goal || goal === 'Report to Sergeant Colon') return;
    if (message.textContent.trim() === DEFAULT_MESSAGE || message.dataset.cwAssignment === 'true') {
      const text = 'Assignment: ' + goal.replace(/[.\s]+$/, '') + '.';
      if (message.textContent !== text) message.textContent = text;
      message.dataset.cwAssignment = 'true';
    }
  }
  function watchBanner() {
    const message = document.getElementById('city-message');
    const objective = document.getElementById('p21-objective');
    if (!message || !objective) return;
    // Once the game writes its own message, stop treating the banner as ours.
    new MutationObserver(() => {
      if (message.dataset.cwAssignment === 'true' && !message.textContent.startsWith('Assignment: ')) delete message.dataset.cwAssignment;
      if (message.textContent.trim() === DEFAULT_MESSAGE) syncBanner();
    }).observe(message, { childList: true, characterData: true, subtree: true });
    new MutationObserver(syncBanner).observe(objective, { childList: true, characterData: true, subtree: true });
    syncBanner();
  }

  /* 2. Saves live only in this browser. Offer a backup file and a restore. */
  function saveKeys() {
    const keys = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(SAVE_PREFIX)) keys.push(k); } } catch (e) { /* storage blocked */ }
    return keys.sort();
  }
  function say(text) {
    const message = document.getElementById('city-message');
    if (message) { delete message.dataset.cwAssignment; message.textContent = text; }
  }
  function exportSave() {
    const keys = saveKeys();
    if (!keys.length) { alert('There is no saved patrol in this browser yet.'); return; }
    const data = {};
    for (const k of keys) data[k] = localStorage.getItem(k);
    const file = { format: FORMAT, version: 1, exported: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'city-watch-save-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    say('Save backup created. Keep the file somewhere safe, such as Files or iCloud Drive.');
  }
  function importSave() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return;
      f.text().then(text => {
        let file;
        try { file = JSON.parse(text); } catch (e) { file = null; }
        const data = file && file.format === FORMAT && file.data && typeof file.data === 'object' ? file.data : null;
        const entries = data ? Object.entries(data).filter(([k, v]) => k.startsWith(SAVE_PREFIX) && typeof v === 'string') : [];
        if (!entries.length) { alert('That file is not a City Watch save backup.'); return; }
        if (!confirm('Restore the patrol from this backup' + (file.exported ? ' (' + file.exported.slice(0, 10) + ')' : '') + '? Your current progress in this browser will be replaced.')) return;
        try {
          for (const k of saveKeys()) localStorage.removeItem(k);
          for (const [k, v] of entries) localStorage.setItem(k, v);
        } catch (e) { alert('Your browser would not let the game store the save. ' + e.message); return; }
        location.reload();
      });
    });
    input.click();
  }
  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  function addBackupButtons() {
    const actions = document.getElementById('p21-duty-actions');
    if (!actions || actions.querySelector('[data-cw-backup]')) return;
    const save = [...actions.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save game');
    if (!save) return; // only on the main Duty menu, not inside conversations
    const make = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.cwBackup = 'true'; b.addEventListener('click', fn); return b; };
    const exp = make('Back up save to a file', exportSave), imp = make('Restore save from a file', importSave);
    save.after(exp, imp);
    if (!standalone()) {
      const tip = document.createElement('p'); tip.dataset.cwBackup = 'true'; tip.className = 'cw-fixes-tip';
      tip.textContent = 'Tip: add City Watch to your Home Screen (Share → Add to Home Screen). Safari can clear the saves of sites you haven’t visited for a week, but not of Home Screen apps.';
      imp.after(tip);
    }
  }
  function watchDuty() {
    const actions = document.getElementById('p21-duty-actions');
    if (!actions) return;
    new MutationObserver(addBackupButtons).observe(actions, { childList: true });
    addBackupButtons();
  }

  function start() { watchBanner(); watchDuty(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

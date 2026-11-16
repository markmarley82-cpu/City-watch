/* Startup prefetch. The city asks for most of its ~1,000 startup files in
   stages, a few at a time, and then computes with the network idle. This
   downloads the files it will ask for later (listed in cw-prefetch-list.json,
   same URLs and version tags) in the background, so they are already in the
   browser cache when each stage needs them. It changes no game state: if a
   file is missing or a request fails, the game simply loads it itself. */
(function () {
  'use strict';
  try {
    const c = navigator.connection;
    if (c && c.saveData) return; // respect Data Saver
  } catch (e) { /* ignore */ }
  const LIST = 'cw-prefetch-list.json?v=0.534-p1';
  const WORKERS = 6;
  let started = false;
  function start() {
    if (started) return;
    started = true;
    fetch(LIST, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const files = data && Array.isArray(data.files) ? data.files : [];
        let next = 0;
        const worker = () => {
          if (next >= files.length) return Promise.resolve();
          const url = files[next++];
          // Read the body so the download completes into the HTTP cache, then discard it.
          return fetch(url, { priority: 'low', credentials: 'same-origin' })
            .then(r => (r.ok ? r.arrayBuffer() : null))
            .catch(() => null)
            .then(worker);
        };
        for (let i = 0; i < WORKERS; i++) worker();
      })
      .catch(() => { /* prefetch is optional */ });
  }
  // Let the page's own first requests go first.
  if (document.readyState === 'complete') setTimeout(start, 300);
  else {
    window.addEventListener('load', () => setTimeout(start, 300), { once: true });
    setTimeout(start, 2500);
  }
})();

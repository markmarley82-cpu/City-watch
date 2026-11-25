/* Phone speed meter (25 Nov 2026). Off unless the page address has ?perf=1.
   Shows how often the browser gives the game a frame, how often the city is
   actually painted, the worst stall in the last 5 seconds, how many stalls there
   were, and how much painting memory is held. A screenshot of it tells us where
   the lag is on a real phone. It changes nothing in the game. */
(function () {
  'use strict';
  let on = false;
  try { on = new URLSearchParams(location.search).get('perf') === '1'; } catch (e) { return; }
  if (!on) return;
  const box = document.createElement('div');
  box.id = 'cw-perf-overlay';
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;z-index:2147483647;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 4px);' +
    'padding:4px 8px;border-radius:4px;background:#000c;color:#eee;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre;pointer-events:none';
  const start = () => document.body.append(box);
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  const gaps = []; // [time, gap ms]
  let last = 0, frames = 0, lastPainted = null, paintRate = 0, lastReport = 0, mem = '', walking = '';
  function report(now) {
    let r = null;
    try { r = window.CWRebuiltCity && window.CWRebuiltCity.report(); } catch (e) { r = null; }
    const pb = r && r.phoneBudget, d = r && r.imageDensity;
    if (pb && typeof pb.painted === 'number') {
      if (lastPainted !== null) paintRate = (pb.painted - lastPainted) * 1000 / (now - lastReport);
      lastPainted = pb.painted;
    }
    mem = d ? 'pictures ' + Math.round(d.residentMiB || 0) + ' MB' + (d.pending ? ' · loading ' + d.pending : '') : '';
    try { walking = window.CWP21City && window.CWP21City.isNavigating() ? ' · walking' : ''; } catch (e) { walking = ''; }
  }
  function tick(now) {
    if (last) gaps.push([now, now - last]);
    last = now; frames++;
    while (gaps.length && now - gaps[0][0] > 5000) gaps.shift();
    if (now - lastReport > 1000) {
      report(now);
      const span = gaps.length ? (now - gaps[0][0]) / 1000 : 1;
      const fps = gaps.length / Math.max(0.5, span);
      const worst = gaps.reduce((m, g) => Math.max(m, g[1]), 0);
      const stalls = gaps.filter(g => g[1] > 50).length;
      box.textContent = 'frames ' + fps.toFixed(0) + '/s · painted ' + (paintRate ? paintRate.toFixed(0) : '–') + '/s' + walking +
        '\nworst stall ' + Math.round(worst) + ' ms · stalls >50ms: ' + stalls + ' (5 s)' + (mem ? '\n' + mem : '');
      lastReport = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

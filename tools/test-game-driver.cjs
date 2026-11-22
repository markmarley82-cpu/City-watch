// Long-lived game session. Drop cmdN.js (async body with p, ctx, f(), helpers) into DIR; result goes to outN.txt.
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const DIR = process.argv[2], STATE = process.argv[3];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], ...(STATE && fs.existsSync(STATE) ? { storageState: STATE } : {}) });
  const p = await ctx.newPage(); const log = [];
  p.on('pageerror', e => log.push('PAGEERR ' + e.message.slice(0, 200))); p.on('response', r => { if (r.status() >= 400) log.push(r.status() + ' ' + r.url()); });
  p.on('dialog', d => { log.push('DIALOG ' + d.message().slice(0, 200)); d.accept(); });
  const f = () => p.frames().find(x => /campaign-engine/.test(x.url()));
  const H = {
    boot: async () => { for (let i = 0; i < 160; i++) { if (await p.evaluate(() => document.body.dataset.cityBoot).catch(() => '') === 'ready') return true; await p.waitForTimeout(500); } return false; },
    look: async () => {
      const main = await p.evaluate(() => { const d = [...document.querySelectorAll('dialog[open]')]; const scope = d.length ? d[d.length - 1] : document; return { dialogs: d.map(x => x.id + ': ' + x.innerText.replace(/\s+/g, ' ').slice(0, 500)), buttons: [...scope.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().width > 0).map(b => (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50)), hud: document.querySelector('#p21-hud')?.innerText.replace(/\s+/g, ' '), obj: document.querySelector('#p21-objective')?.innerText, msg: document.querySelector('#city-message')?.innerText.slice(0, 200), loc: document.querySelector('#city-location')?.innerText }; });
      const fr = f(); let frame = null;
      if (fr && await p.locator('#p21-engine-dialog[open]').count()) frame = await fr.evaluate(() => { const ds = [...document.querySelectorAll('dialog[open], .modal.open, [role=dialog]:not([hidden])')].filter(d => d.offsetParent || d.open); return { text: (ds.length ? ds[ds.length - 1] : document.body).innerText.replace(/\s+/g, ' ').slice(0, 700), buttons: [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().width > 0).map(b => (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50)) }; }).catch(e => 'frame err ' + e.message);
      return { ...main, frame };
    },
    tap: async (text, where = 'auto') => {
      const inFrame = where === 'frame' || (where === 'auto' && await p.locator('#p21-engine-dialog[open]').count());
      const root = inFrame ? f() : p; const l = root.locator('button:visible', { hasText: text });
      const n = await l.count(); if (!n) return 'NO BUTTON ' + text + (inFrame ? ' (frame)' : '');
      await l.last().click({ timeout: 5000 }); await p.waitForTimeout(1500); return 'tapped ' + text + (inFrame ? ' (frame)' : '');
    },
    shot: async name => { await p.screenshot({ path: DIR + '/' + name + '.png' }); return 'shot ' + name; },
    save: async () => { await ctx.storageState({ path: DIR + '/state.json' }); return 'saved state'; },
  };
  await p.goto('http://127.0.0.1:8766/City-watch/index.html'); await H.boot(); await p.waitForTimeout(1000);
  fs.writeFileSync(DIR + '/ready', 'ok');
  let n = 0;
  for (;;) {
    const cmd = path.join(DIR, 'cmd' + n + '.js');
    if (fs.existsSync(cmd)) {
      let out; log.length = 0;
      try { const fn = new Function('p', 'ctx', 'f', 'H', 'return (async()=>{' + fs.readFileSync(cmd, 'utf8') + '})()'); out = await fn(p, ctx, f, H); } catch (e) { out = 'ERROR ' + e.message; }
      fs.writeFileSync(path.join(DIR, 'out' + n + '.txt'), JSON.stringify(out, null, 1) + (log.length ? '\nLOG: ' + JSON.stringify(log) : ''));
      n++;
    } else await new Promise(r => setTimeout(r, 200));
    if (fs.existsSync(DIR + '/quit')) break;
  }
  await b.close();
})();

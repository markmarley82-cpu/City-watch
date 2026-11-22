const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8766/City-watch/';
const pages = ['index.html', 'city.html', 'bridge.html', 'map.html', 'layout.html', 'campaign-engine.html',
  'field-training/index.html', 'modules/atlas/index.html', 'modules/university/index.html', 'partner-combat-v1/index.html'];
const MEDIA = /\.(webp|png|jpe?g|gif|svg|avif|mp3|ogg|wav|m4a|woff2?|ttf|otf)(\?|#|$)/i;
(async () => {
  const browser = await chromium.launch();
  const failed = new Map(); const okMedia = new Set(); const errors = [];
  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const page = await ctx.newPage();
    page.on('response', r => {
      const u = r.url(); if (!u.startsWith(base)) { if (r.status() >= 400) { const k='OUTSIDE '+u; if (!failed.has(k)) failed.set(k, new Set()); failed.get(k).add(p); } return; }
      const path = decodeURIComponent(u.slice(base.length).split(/[?#]/)[0]);
      if (r.status() >= 400) { if (!failed.has(path)) failed.set(path, new Set()); failed.get(path).add(`${p} (${r.status()})`); }
      else if (MEDIA.test(path)) okMedia.add(path);
    });
    page.on('pageerror', e => errors.push(`${p}: ${String(e.message).slice(0, 160)}`));
    try {
      await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(8000);
      // nudge interactions: click camera/sound buttons that exist
      for (const sel of ['#city-sound', '#atlas-open', '#p21-duty', '#city-appearance']) {
        const el = await page.$(sel); if (el && await el.isVisible()) { await el.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(1500); await page.keyboard.press('Escape'); }
      }
      if (p === 'index.html') {
        const boot = await page.evaluate(() => document.body.dataset.cityBoot);
        console.log('index boot state:', boot);
        await page.screenshot({ path: process.argv[2] + '/index.png' });
      }
    } catch (e) { errors.push(`${p}: navigation ${e.message.slice(0, 120)}`); }
    await ctx.close();
  }
  await browser.close();
  console.log('media loaded OK:', okMedia.size);
  console.log('failed requests:', failed.size);
  for (const [k, v] of [...failed].sort()) console.log('  ' + k + '  <- ' + [...v].join(', '));
  console.log('page errors:', errors.length); errors.slice(0, 30).forEach(e => console.log('  ' + e));
})();

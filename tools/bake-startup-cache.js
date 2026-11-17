// Bakes two startup files by booting the game once in headless Chromium:
// - startup-cache.json: with window.__CW_BAKE set, every expensive startup check runs
//   and each one that passes records the fingerprint of the city it passed for. Phones
//   then skip a check only when the city they build has the same fingerprint
//   (city-startup-cache.mjs).
// - cw-prefetch-list.json: the files requested during startup (after the first
//   burst), in order, for cw-prefetch.js. Same method as make-prefetch-list.js
//   (recorded with the prefetcher running, which measured faster on 4G than a
//   list recorded without it).
//
//   node tools/bake-startup-cache.js <site folder, default dist>
//
// Run by the Pages workflow on the copy it publishes. If anything goes wrong it
// exits non-zero and leaves the existing file (the placeholder skips nothing).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const site = path.resolve(process.argv[2] || 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith('/City-watch/')) { res.writeHead(404); res.end(); return; }
  const file = path.join(site, url.slice('/City-watch/'.length) || 'index.html');
  if (!file.startsWith(site)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body);
  });
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();
  try {
    // Record as a phone (the game loads some things differently on phones).
    const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
    await page.addInitScript(() => { window.__CW_BAKE = { checks: {} }; });
    const base = 'http://127.0.0.1:' + server.address().port + '/City-watch/', seen = []; let booted = false;
    page.on('request', r => { const u = r.url(); if (!booted && u.startsWith(base) && r.resourceType() !== 'document') seen.push(u.slice(base.length)); });
    await page.goto('http://127.0.0.1:' + server.address().port + '/City-watch/index.html');
    await page.waitForFunction(() => ['ready', 'failed'].includes(document.body.dataset.cityBoot), null, { timeout: 300000 });
    booted = true;
    const boot = await page.evaluate(() => document.body.dataset.cityBoot);
    if (boot !== 'ready') throw Error('The city did not finish loading: ' + boot);
    const checks = await page.evaluate(() => window.__CW_BAKE.checks);
    if (!Object.keys(checks).length) throw Error('No startup checks were recorded');
    fs.writeFileSync(path.join(site, 'startup-cache.json'), JSON.stringify({ schema: 1, built: new Date().toISOString(), checks }) + '\n');
    console.log('Baked startup checks:', JSON.stringify(checks));
    const EARLY = 291; // the first burst requested as the page opens (as in make-prefetch-list.js)
    const files = [...new Set(seen.slice(EARLY))].filter(u => !/^(cw-prefetch|startup-cache)/.test(u) && fs.existsSync(path.join(site, u.split('?')[0])));
    if (files.length < 100) throw Error('Suspiciously short prefetch list: ' + files.length);
    fs.writeFileSync(path.join(site, 'cw-prefetch-list.json'), JSON.stringify({ note: 'Files the city asks for later in startup; prefetched in this order by cw-prefetch.js. Baked at deploy by tools/bake-startup-cache.js.', files }));
    console.log('Baked prefetch list:', files.length, 'files');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exit(1); });

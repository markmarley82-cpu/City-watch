// Regenerates dist/cw-prefetch-list.json after a release changes file names or ?v= tags.
// Usage (needs Node and Playwright with Chromium):
//   1. Serve the game:   cd dist && python3 -m http.server 8000
//   2. From repo root:   node tools/make-prefetch-list.js http://127.0.0.1:8000/
// It starts a fresh game, records every file requested before the city is ready,
// skips the first burst the page already loads immediately, and writes the rest in order.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://127.0.0.1:8000/';
const EARLY = 291; // the first burst requested as the page opens; prefetching these does not help

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
  const seen = [];
  let ready = false;
  page.on('request', r => {
    const u = r.url();
    if (!ready && u.startsWith(base) && r.resourceType() !== 'document') seen.push(u.slice(base.length));
  });
  await page.goto(base + 'index.html');
  for (let i = 0; i < 400 && !ready; i++) {
    ready = (await page.evaluate(() => document.body.dataset.cityBoot)) === 'ready';
    if (!ready) await page.waitForTimeout(250);
  }
  await browser.close();
  if (!ready) throw new Error('The city did not finish loading.');
  const dist = path.join(__dirname, '..', 'dist');
  const files = [...new Set(seen.slice(EARLY))].filter(u =>
    !u.startsWith('cw-prefetch') && fs.existsSync(path.join(dist, u.split('?')[0])));
  const out = {
    note: 'Files the city asks for later in startup; prefetched in this order by cw-prefetch.js. Regenerate when release version tags change.',
    files,
  };
  fs.writeFileSync(path.join(dist, 'cw-prefetch-list.json'), JSON.stringify(out));
  console.log(`Wrote ${files.length} files to dist/cw-prefetch-list.json`);
})();

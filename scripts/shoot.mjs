// Batched screenshot round: every public page at 390x844 and 1280x900.
import { createRequire } from 'node:module';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'http://localhost:5180';
const q = process.env.Q || '?demo=1';
const pages = [['home', '/'], ['paper', '/paper'], ['article', '/paper/2026-09-05/__LEAD__'], ['archive', '/archive'], ['about', '/about'], ['nf', '/nothing-here'], ['auth', '/newsroom'], ['join', '/newsroom?join=1']];
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
  const errors = {};
  for (const [w, h, tag] of [[1280, 900, 'desk'], [390, 844, 'mob']]) {
    for (let [name, path] of pages) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      if (path.includes('__LEAD__')) {
        const p2 = await browser.newPage(); await p2.goto(base + '/paper' + q, { waitUntil: 'domcontentloaded' });
        const href = await p2.waitForSelector('.lead-h a', { timeout: 20000 }).then((el) => el.evaluate((a) => a.getAttribute('href'))).catch(() => null); await p2.close();
        if (!href) { errs.push('no lead link'); path = '/paper'; } else path = href;
      }
      const sep = path.includes('?') ? '&' : '';
      await page.goto(base + path + (path.includes('?') ? '&' + q.slice(1) : q), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => errs.push('nav: ' + e.message));
      await page.waitForFunction(() => !document.querySelector('.skel') && !document.getElementById('boot'), { timeout: 20000 }).catch(() => errs.push('still loading after 20s'));
      await Promise.race([page.evaluate(() => Promise.all([document.fonts.ready, ...Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))])), new Promise((r) => setTimeout(r, 15000))]).catch(() => {});
      process.stderr.write(`shot ${name}-${tag}\n`);
      await new Promise((r) => setTimeout(r, 700));
      const ov = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
      await page.screenshot({ path: `shots/${name}-${tag}.png`, fullPage: true });
      errors[`${name}-${tag}`] = { overflow: ov, errs };
      await page.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(errors, null, 1));
})();

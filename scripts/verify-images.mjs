// Proves the hero and the front page survive blocked images (ad blocker / school DNS filter).
import { createRequire } from 'node:module';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'http://localhost:5188';
const scenarios = [
  ['normal', () => false],
  ['third-party image hosts blocked', (u) => /picsum|fastly|unsplash|imgur/.test(u)],
  ['ALL images blocked (worst case)', (u, t) => t === 'image'],
];
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
for (const [name, block] of scenarios) {
  for (const path of ['/', '/paper']) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await p.setRequestInterception(true);
    const blocked = new Set(), external = new Set();
    p.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith(base) && !u.startsWith('data:')) external.add(new URL(u).host);
      if (block(u, r.resourceType())) { blocked.add(u.slice(0, 60)); return r.abort(); }
      r.continue();
    });
    await p.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForFunction(() => !document.querySelector('.skel'), { timeout: 25000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 6500));
    const s = await p.evaluate(() => {
      const c = document.querySelector('.hero-canvas');
      let dots = null;
      if (c && !c.hidden) {
        const g = c.getContext('2d');
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const seen = new Set();
        for (let i = 0; i < d.length; i += 4 * 97) seen.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
        dots = seen.size;                       // >3 distinct tones means a dot field is painted
      }
      const imgs = [...document.images].filter((i) => i.getAttribute('src') !== null || i.classList.contains('img-missing'));
      return {
        heroTones: dots, canvasHidden: c ? c.hidden : 'no-canvas',
        imgs: imgs.length,
        loaded: imgs.filter((i) => i.naturalWidth > 0).length,
        missingTiles: imgs.filter((i) => i.classList.contains('img-missing')).length,
        vanished: imgs.filter((i) => i.naturalWidth === 0 && !i.classList.contains('img-missing') && i.offsetParent !== null).length,
      };
    });
    console.log(`${name.padEnd(32)} ${path.padEnd(7)} heroTones=${String(s.heroTones).padEnd(5)} canvasHidden=${String(s.canvasHidden).padEnd(6)} imgs=${s.loaded}/${s.imgs} placeholderTiles=${s.missingTiles} silentlyGone=${s.vanished}  external=[${[...external].join(' ')}]`);
    await p.close();
  }
}
await browser.close();

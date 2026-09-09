// Precise: after a pointer move, compare the canvas one painted frame later with the same
// canvas 900ms later. Instant tracking => the picture is already final (difference ~0).
import { createRequire } from 'node:module';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const targets = (process.env.TARGETS || 'http://localhost:5188').split(',');
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 200000 });
for (const base of targets) {
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 760, deviceScaleFactor: 1 });
  await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.hero-canvas', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3500));
  const out = await p.evaluate(async () => {
    const c = document.querySelector('.hero-canvas');
    const g = c.getContext('2d');
    const step = 6;
    const fp = () => {
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const a = [];
      for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) { const i = (y * c.width + x) * 4; a.push(d[i] + d[i + 1] + d[i + 2]); }
      return a;
    };
    const diff = (a, z) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - z[i]); return s / a.length; };
    const raf = () => new Promise((r) => requestAnimationFrame(r));
    const hero = c.parentElement, r = c.getBoundingClientRect();
    const move = (fx, fy) => hero.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + r.width * fx, clientY: r.top + r.height * fy, bubbles: true }));
    const runs = [];
    for (const [ax, ay, bx, by] of [[0.22, 0.62, 0.8, 0.3], [0.85, 0.68, 0.18, 0.32]]) {
      move(ax, ay); await new Promise((s) => setTimeout(s, 800));
      move(bx, by);
      await raf(); await raf();                       // one painted frame after the move
      const early = fp();
      await new Promise((s) => setTimeout(s, 900));
      runs.push(+diff(early, fp()).toFixed(2));       // mean brightness change per sample, 0-765
    }
    return runs;
  });
  console.log(`${base.padEnd(38)} pixel change after the first painted frame: ${out.map((d) => d.toFixed(2)).join(', ')}`);
  await p.close();
}
await b.close();

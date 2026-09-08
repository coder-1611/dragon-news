import { createRequire } from 'node:module';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'https://dragon-news-rrhs.vercel.app';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
for (const path of ['/', '/paper']) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const reqs = [];
  p.on('requestfailed', (r) => reqs.push(`FAILED ${r.failure()?.errorText} ${r.url().slice(0, 90)}`));
  p.on('response', (r) => { const u = r.url(); if (/picsum|fastly|firestore|fonts/.test(u)) reqs.push(`${r.status()} ${u.slice(0, 95)}`); });
  p.on('console', (m) => { if (m.type() === 'error') reqs.push('CONSOLE ' + m.text().slice(0, 140)); });
  p.on('pageerror', (e) => reqs.push('PAGEERROR ' + e.message.slice(0, 140)));
  await p.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 9000));
  const state = await p.evaluate(() => {
    const imgs = [...document.images].map((i) => ({ src: i.currentSrc.slice(-42), w: i.naturalWidth, complete: i.complete, hidden: i.style.display === 'none' }));
    const c = document.querySelector('.hero-canvas');
    let painted = null;
    if (c) { try { const g = c.getContext('2d'); const d = g.getImageData(c.width * 0.55 | 0, c.height * 0.45 | 0, 8, 8).data; painted = [...d.slice(0, 12)].join(','); } catch (e) { painted = 'READBACK_BLOCKED: ' + e.message.slice(0, 60); } }
    return { imgs, canvas: c ? { w: c.width, h: c.height, sample: painted, hidden: c.hidden } : null };
  });
  console.log(`\n===== ${path} =====`);
  console.log(reqs.join('\n') || '(no notable network events)');
  console.log('canvas:', JSON.stringify(state.canvas));
  console.log('images:', state.imgs.map((i) => `${i.w}px ${i.hidden ? 'HIDDEN ' : ''}${i.src}`).join('\n        '));
  await p.close();
}
await browser.close();

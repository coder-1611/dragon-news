import { createRequire } from 'node:module';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'http://localhost:5187';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'mob']]) {
  const p = await browser.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(base + (process.env.Q ?? '/?demo=1'), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !document.querySelector('.skel'), { timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  await p.mouse.move(w * .7, h * .45);
  await new Promise((r) => setTimeout(r, 600));
  await p.screenshot({ path: `shots/fold-${tag}.png` });
  console.log(tag, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await p.close();
}
await browser.close();

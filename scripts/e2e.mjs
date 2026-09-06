// End-to-end editorial flow against the LIVE project, through the real UI (puppeteer):
// journalist (pending) -> editor approves -> journalist writes + submits -> editor sends back -> journalist resubmits
// -> editor accepts -> editor composes a new edition with it as lead -> publish -> public /paper shows it -> unpublish -> republish.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'http://localhost:5187';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const shots = [];
const log = (...a) => console.log('•', ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function ctx(browser, w = 1280, h = 900) {
  const c = await browser.createBrowserContext();
  const p = await c.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => log('PAGEERROR', e.message));
  p.on('dialog', (d) => d.accept('Please tighten the second paragraph.'));
  return p;
}
async function ready(p) { await p.waitForFunction(() => !document.getElementById('boot') && !document.querySelector('.skel'), { timeout: 30000 }); await wait(400); }
async function shot(p, name) { await p.screenshot({ path: `shots/nr-${name}.png`, fullPage: true }); shots.push(name); }
async function signIn(p, email, pw) {
  await p.goto(base + '/newsroom', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('#email', { timeout: 20000 });
  await p.type('#email', email); await p.type('#pw', pw);
  await Promise.all([p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}), p.click('#go')]);
  await wait(800);
}

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
try {
  // 1. journalist signs in -> pending screen
  const J = await ctx(browser);
  await signIn(J, env.JOURNALIST_EMAIL, env.JOURNALIST_PASSWORD);
  const pendingText = await J.evaluate(() => document.body.innerText);
  log('journalist pending screen:', /Pending|waiting for the editor/i.test(pendingText) ? 'OK' : 'UNEXPECTED: ' + pendingText.slice(0, 120));
  await shot(J, 'pending');
  await J.goto(base + '/newsroom/write', { waitUntil: 'domcontentloaded' }); await wait(2500);
  log('pending user hitting /newsroom/write lands on:', new URL(J.url()).pathname);

  // 2. editor approves
  const E = await ctx(browser);
  await signIn(E, env.EDITOR_EMAIL, env.EDITOR_PASSWORD);
  log('editor landed on', new URL(E.url()).pathname);
  await E.goto(base + '/newsroom/editor?tab=staff', { waitUntil: 'domcontentloaded' }); await ready(E);
  await shot(E, 'staff-before');
  const approveBtn = await E.$('[data-approve]');
  if (approveBtn) { await approveBtn.click(); await wait(1500); log('approved journalist'); } else log('no pending user to approve (already approved?)');
  await ready(E); await shot(E, 'staff-after');

  // 3. journalist writes + submits
  await J.goto(base + '/newsroom/desk', { waitUntil: 'domcontentloaded' }); await ready(J); await shot(J, 'desk-empty');
  await J.goto(base + '/newsroom/write', { waitUntil: 'domcontentloaded' }); await ready(J);
  const title = 'E2E test story ' + new Date().toISOString().slice(11, 19);
  await J.type('#title', title);
  await J.type('#dek', 'A sample dek written by the end-to-end test to prove the pipeline.');
  await J.select('#section', 'Clubs');
  await J.type('#md', ('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ').repeat(4) + '\n\n> A pull quote for the test.\n\n' + ('Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ').repeat(3));
  await wait(300); await shot(J, 'write');
  await J.click('#save'); await wait(2000);
  log('draft saved, url:', new URL(J.url()).search);
  await J.click('#submit'); await wait(2500);
  log('after submit landed on', new URL(J.url()).pathname);
  await ready(J); await shot(J, 'desk-submitted');

  // 4. editor: queue -> send back with note
  await E.goto(base + '/newsroom/editor?tab=queue', { waitUntil: 'domcontentloaded' }); await ready(E);
  await E.waitForSelector('.queue-item', { timeout: 15000 });
  const items = await E.$$eval('.queue-item h3', (els) => els.map((e) => e.textContent));
  log('queue has', items.length, 'item(s):', items.join(' | '));
  const idx = items.findIndex((t) => t === title); if (idx >= 0) { const btns = await E.$$('.queue-item'); await btns[idx].click(); await wait(500); }
  await shot(E, 'queue-review');
  await E.type('#note', 'Please tighten the second paragraph.'); await E.click('#revise'); await wait(2000);
  log('sent back with note');

  // 5. journalist sees note, resubmits
  await J.goto(base + '/newsroom/desk', { waitUntil: 'domcontentloaded' }); await ready(J);
  const deskTxt = await J.evaluate(() => document.body.innerText);
  log('journalist sees note:', deskTxt.includes('tighten the second paragraph') ? 'OK' : 'MISSING');
  await shot(J, 'desk-needs-revision');
  const editHref = await J.$$eval('.t-title a', (as, t) => as.find((a) => a.textContent === t)?.getAttribute('href'), title);
  await J.goto(base + editHref, { waitUntil: 'domcontentloaded' }); await ready(J);
  await shot(J, 'write-revision');
  await J.type('#md', '\n\nRevised paragraph added after the editor note.');
  await J.click('#submit'); await wait(2500);

  // 6. editor accepts
  await E.goto(base + '/newsroom/editor?tab=queue', { waitUntil: 'domcontentloaded' }); await ready(E);
  await E.waitForSelector('.queue-item', { timeout: 15000 });
  const items2 = await E.$$eval('.queue-item h3', (els) => els.map((e) => e.textContent));
  const i2 = items2.findIndex((t) => t === title); if (i2 >= 0) { const b = await E.$$('.queue-item'); await b[i2].click(); await wait(500); }
  await E.click('#accept'); await wait(2000); log('accepted');

  // 7. editor composes a new edition (tomorrow) with it as lead, publishes
  const d = new Date(); d.setDate(d.getDate() + 1); const edId = d.toISOString().slice(0, 10);
  await E.goto(base + '/newsroom/edition', { waitUntil: 'domcontentloaded' }); await ready(E);
  await E.$eval('#date', (i, v) => { i.value = v; }, edId);
  await E.click('#new button[type=submit]'); await wait(2500);
  await E.waitForSelector('#lead-pick', { timeout: 15000 });
  const opt = await E.$$eval('#lead-pick option', (os, t) => os.find((o) => o.textContent.startsWith(t))?.value, title);
  await E.select('#lead-pick', opt); await wait(600);
  await shot(E, 'composer');
  await E.click('#publish'); await wait(4000);
  await ready(E); await shot(E, 'composer-published');
  const state = await E.evaluate(() => document.querySelector('#actions .status')?.textContent);
  log('edition', edId, 'state:', state);

  // 8. public sees it
  const P = await ctx(browser);
  await P.goto(base + '/paper', { waitUntil: 'domcontentloaded' }); await ready(P);
  const leadNow = await P.$eval('.lead-h', (e) => e.textContent.trim()).catch(() => null);
  log('public /paper lead is now:', leadNow === title ? 'THE E2E STORY (OK)' : leadNow);
  await P.goto(base + '/archive', { waitUntil: 'domcontentloaded' }); await ready(P);
  const eds = await P.$$eval('.ed-row', (r) => r.length); log('archive lists', eds, 'editions');
  await P.goto(base + '/paper/2026-09-05', { waitUntil: 'domcontentloaded' }); await ready(P);
  log('old edition still renders:', await P.$eval('.lead-h', (e) => e.textContent.trim().slice(0, 40)));

  // 9. unpublish -> public falls back; republish -> restored
  await E.click('#unpublish'); await wait(3500); await ready(E);
  await P.goto(base + '/paper', { waitUntil: 'domcontentloaded' }); await ready(P);
  log('after unpublish, /paper lead:', (await P.$eval('.lead-h', (e) => e.textContent.trim()).catch(() => 'none')).slice(0, 40));
  await E.click('#publish'); await wait(4000); await ready(E);
  await P.goto(base + '/paper', { waitUntil: 'domcontentloaded' }); await ready(P);
  log('after republish, /paper lead:', (await P.$eval('.lead-h', (e) => e.textContent.trim())) === title ? 'E2E STORY (OK)' : 'unexpected');
  // leave the site clean: unpublish + delete the test edition so the placeholder edition is today's paper
  await E.click('#unpublish'); await wait(3500); await ready(E);
  await E.click('#delete'); await wait(2500);
  log('test edition removed; placeholder edition is today\'s paper again');
  // mobile newsroom shots
  const M = await ctx(browser, 390, 844); await signIn(M, env.EDITOR_EMAIL, env.EDITOR_PASSWORD);
  await M.goto(base + '/newsroom/editor?tab=stories', { waitUntil: 'domcontentloaded' }); await ready(M); await shot(M, 'mobile-editor');
  await M.goto(base + '/newsroom/write', { waitUntil: 'domcontentloaded' }); await ready(M); await shot(M, 'mobile-write');
  const ov = await M.evaluate(() => document.documentElement.scrollWidth - innerWidth); log('mobile newsroom overflow:', ov);
} finally { await browser.close(); log('shots:', shots.join(', ')); }

// Editor self-publish path + short stories + copy-edit-then-accept, through the real UI.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/Users/sohamsthitpragya/Projects/82-0/node_modules/');
const puppeteer = require('puppeteer');
const base = process.env.BASE || 'http://localhost:5188';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const log = (...a) => console.log('•', ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = new Date().toISOString().slice(11, 19);
async function ctx(browser) { const c = await browser.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width: 1280, height: 900 }); p.on('dialog', (d) => d.accept()); p.on('pageerror', (e) => log('PAGEERROR', e.message)); return p; }
async function ready(p) { await p.waitForFunction(() => !document.getElementById('boot') && !document.querySelector('.skel'), { timeout: 30000 }); await wait(400); }
async function signIn(p, email, pw) { await p.goto(base + '/newsroom', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#email', { timeout: 20000 }); await p.type('#email', email); await p.type('#pw', pw); await Promise.all([p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}), p.click('#go')]); await wait(800); }
const actions = (p) => p.$$eval('#actions .btn, #actions .status', (els) => els.map((e) => e.textContent.trim()));

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 240000 });
try {
  // ---- 1. the editor writes a short story of his own and marks it ready
  const E = await ctx(browser); await signIn(E, env.EDITOR_EMAIL, env.EDITOR_PASSWORD);
  await E.goto(base + '/newsroom/write', { waitUntil: 'domcontentloaded' }); await ready(E);
  log('editor write-page actions on a new story:', (await actions(E)).join(' | '));
  const eTitle = `E2E test story editor ${stamp}`;
  await E.type('#title', eTitle); await E.select('#section', 'News');
  await E.type('#md', 'Twelve words are plenty for a test story now that the limit is gone.');
  await E.click('#accept'); await wait(2500);
  log('after Ready to print, editor lands on:', new URL(E.url()).pathname);
  await ready(E);
  const inPool = await E.$$eval('.pool-item b, .slot-item b', (els) => els.map((e) => e.textContent));
  log('story visible to the composer:', inPool.includes(eTitle) ? 'YES (accepted, in the ready-to-print pool)' : 'NO -> ' + inPool.join(' | '));

  // ---- 2. approve the sample journalist so he can file a very short story
  await E.goto(base + '/newsroom/editor?tab=staff', { waitUntil: 'domcontentloaded' }); await ready(E);
  const ap = await E.$('[data-approve]'); if (ap) { await ap.click(); await wait(1500); log('approved the sample journalist'); }
  const J = await ctx(browser); await signIn(J, env.JOURNALIST_EMAIL, env.JOURNALIST_PASSWORD);
  await J.goto(base + '/newsroom/write', { waitUntil: 'domcontentloaded' }); await ready(J);
  const jTitle = `E2E test story short ${stamp}`;
  await J.type('#title', jTitle); await J.select('#section', 'Sports');
  await J.type('#md', 'Only nine words here and it should still submit.');
  await J.click('#submit'); await wait(2500);
  log('journalist 9-word story submitted, landed on:', new URL(J.url()).pathname);

  // ---- 3. editor copy-edits the submitted story: plain save must NOT change its status
  await E.goto(base + '/newsroom/editor?tab=queue', { waitUntil: 'domcontentloaded' }); await ready(E);
  await E.waitForSelector('.queue-item', { timeout: 15000 });
  const link = await E.$$eval('.queue-item', (els, t) => { const i = els.findIndex((e) => e.querySelector('h3').textContent === t); return i; }, jTitle);
  const items = await E.$$('.queue-item'); await items[link].click(); await wait(500);
  const href = await E.$eval('#review a[href*="/newsroom/write?id="]', (a) => a.getAttribute('href'));
  await E.goto(base + href, { waitUntil: 'domcontentloaded' }); await ready(E);
  log('editor opening a writer\'s submitted story sees:', (await actions(E)).join(' | '));
  await E.type('#title', ' (edited)'); await E.click('#save'); await wait(1500);
  const afterSave = (await actions(E))[0];
  log('status after the editor\'s plain save:', afterSave, afterSave.toLowerCase().includes('submitted') ? '(OK, unchanged)' : '(BUG: status changed)');
  await E.click('#accept'); await wait(2500);
  log('after Accept for print, editor lands on:', new URL(E.url()).pathname);

  // ---- 4. both stories now in the composer pool
  await E.goto(base + '/newsroom/edition', { waitUntil: 'domcontentloaded' }); await ready(E);
  const pool = await E.$$eval('.pool-item b, .slot-item b', (els) => els.map((e) => e.textContent));
  log('ready-to-print pool has editor story:', pool.includes(eTitle), '| has edited writer story:', pool.some((t) => t.startsWith(jTitle)));
  await E.screenshot({ path: 'shots/nr-editor-self-publish.png', fullPage: true });
} finally { await browser.close(); }

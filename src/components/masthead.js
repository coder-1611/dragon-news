import { html, raw, esc } from '../lib/ui.js';
import { longDate, wireDate, clockCT, todayId } from '../lib/format.js';

const NAV = [['/paper', "Today's Paper"], ['/archive', 'Archive'], ['/about', 'About & Crew']];

document.addEventListener('error', (e) => { if (e.target?.tagName === 'IMG') e.target.style.display = 'none'; }, true);

export function mountMasthead({ size = 'compact', current = '' } = {}) {
  const host = document.getElementById('mast');
  if (!host) return;
  host.className = 'mast';
  host.dataset.size = size;
  host.innerHTML = html`
    <div class="wire mono">
      <span class="wire-l">Dragon News Wire · Round Rock, Tex.</span>
      <span class="wire-c">Vol. <b data-vol>—</b> · No. <b data-issue>—</b></span>
      <span class="wire-r"><span class="live-dot" aria-hidden="true"></span><span data-press>On press</span> · <time data-clock>${clockCT()}</time> CT</span>
    </div>
    <div class="plate">
      <a class="plate-name" href="/">Dragon News</a>
      <p class="plate-sub mono">Round Rock High School · <b>Dragons</b> · Est. 1913 · <span data-date>${longDate(todayId())}</span></p>
    </div>
    <nav class="rail mono" aria-label="Primary">
      <a class="rail-brand" href="/" aria-label="Dragon News home">Dragon News</a>
      <ul>${raw(NAV.map(([href, label]) => `<li><a href="${href}"${current === href ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join(''))}</ul>
      <a class="rail-cta" href="/newsroom">Newsroom</a>
    </nav>
    <div class="crawl mono" hidden>
      <span class="crawl-tag"><span class="live-dot" aria-hidden="true"></span>Latest</span>
      <div class="crawl-track"><ul class="crawl-list"></ul></div>
    </div>`;
  // clock
  const clock = host.querySelector('[data-clock]');
  setInterval(() => { clock.textContent = clockCT(); }, 1000);
  // compress: brand appears in the rail once the plate scrolls away
  const plate = host.querySelector('.plate');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => document.body.classList.toggle('scrolled', !e.isIntersecting), { rootMargin: '-40px 0px 0px 0px' }).observe(plate);
  }
}

/** Fill the wire strip and the crawl from a published edition (or clear them). */
export function setMastheadEdition(edition) {
  const host = document.getElementById('mast');
  if (!host) return;
  const snap = edition?.snapshot;
  host.querySelector('[data-vol]').textContent = snap?.volume || '—';
  host.querySelector('[data-issue]').textContent = snap?.issueNumber ?? '—';
  host.querySelector('[data-press]').textContent = edition ? `On press · ${wireDate(edition.date || edition.id)}` : 'Press idle';
  const crawl = host.querySelector('.crawl');
  if (!snap) { crawl.hidden = true; return; }
  const items = [snap.lead, ...snap.sections.flatMap((s) => s.stories)].slice(0, 10);
  const li = items.map((s) => `<li><b>${esc(s.section)}</b><a href="/paper/${esc(edition.id)}/${esc(s.slug)}">${esc(s.title)}</a></li>`).join('');
  const list = crawl.querySelector('.crawl-list');
  list.innerHTML = li + li; // duplicated for a seamless loop
  list.style.setProperty('--crawl-dur', `${Math.max(30, items.length * 9)}s`);
  crawl.hidden = false;
}

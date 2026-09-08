import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { mountReveal } from '../components/reveal.js';
import { renderCrew } from '../components/crew.js';
import { ledgerItem, emptyPress } from '../components/stubs.js';
import { mountHalftone } from '../components/halftone.js';
import { getCurrentEdition, getCrew } from '../lib/db.js';
import { longDate } from '../lib/format.js';
import { SECTIONS } from '../lib/sections.js';
import { esc, $ } from '../lib/ui.js';

mountMasthead({ size: 'hero', current: '/' });
mountFooter();
$('#strip').innerHTML = SECTIONS.map((s) => `<li><a href="/paper#${esc(s.toLowerCase().replace(/\s+/g, '-'))}">${esc(s)}</a></li>`).join('');

async function main() {
  const [edition, crew] = await Promise.all([
    getCurrentEdition().catch((e) => { console.error(e); return null; }),
    getCrew().catch(() => ({ members: [] })),
  ]);
  setMastheadEdition(edition);

  // hero
  const canvas = $('.hero-canvas');
  const fb = $('.hero-fallback'), tint = $('.hero-tint');
  if (edition) {
    const L = edition.snapshot.lead;
    const slip = $('[data-hero-lead]');
    slip.href = `/paper/${edition.id}/${L.slug}`;
    $('[data-lead-title]').textContent = L.title;
    $('[data-lead-by]').textContent = `${L.section} · By ${L.byline}`;
    slip.hidden = false;
    mountHalftone(canvas, L.cover || '', { onFail: () => { canvas.hidden = true; fb.src = L.cover; fb.hidden = false; tint.hidden = false; } });
  }

  if (!edition) mountHalftone(canvas, '');

  // today
  const body = $('#today-body');
  if (!edition) { body.innerHTML = emptyPress(); }
  else {
    const S = edition.snapshot; const L = S.lead;
    $('[data-today-date]').textContent = `${longDate(edition.date || edition.id)} · Vol. ${S.volume}, No. ${S.issueNumber} · ${S.articleCount} stories`;
    const rest = S.sections.flatMap((s) => s.stories).slice(0, 6);
    body.innerHTML = `
      <div class="today-grid">
        <article class="today-lead" data-reveal>
          <a href="/paper/${esc(edition.id)}/${esc(L.slug)}">
            ${L.cover ? `<img src="${esc(L.cover)}" alt="" width="1600" height="1000" fetchpriority="high">` : ''}
            <h3>${esc(L.title)}</h3>
            ${L.dek ? `<p class="dek">${esc(L.dek)}</p>` : ''}
            <p class="by">${esc(L.section)} · By ${esc(L.byline)}</p>
          </a>
        </article>
        <div class="today-side" data-reveal style="--d:120ms">
          <ol class="ledger">${rest.map((s) => ledgerItem(s, edition.id, { excerpt: true })).join('')}</ol>
          <p style="margin-top:1.5rem"><a class="link-mono" href="/paper">All ${S.articleCount} stories on the front page</a></p>
        </div>
      </div>`;
  }

  // crew
  renderCrew($('#crew-grid'), crew);
  if (crew.placeholder || !crew.members?.length) $('[data-crew-note]').hidden = false;
  mountReveal();
}
main();

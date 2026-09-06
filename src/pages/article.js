import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { ledgerItem, emptyPress, SEAL } from '../components/stubs.js';
import { getArticle, getEdition } from '../lib/db.js';
import { renderMd } from '../lib/markdown.js';
import { longDate, shortDate } from '../lib/format.js';
import { esc, $, setTitle } from '../lib/ui.js';

mountMasthead({ size: 'compact', current: '/paper' });
mountFooter();

async function main() {
  const m = location.pathname.match(/^\/paper\/([^/]+)\/([^/]+)\/?$/);
  const host = $('#story');
  if (!m) { host.innerHTML = emptyPress('That story is not in print.'); return; }
  const [id, slug] = [decodeURIComponent(m[1]), decodeURIComponent(m[2])];
  let a = null, edition = null;
  try { [a, edition] = await Promise.all([getArticle(id, slug), getEdition(id)]); } catch (e) { console.error(e); }
  setMastheadEdition(edition);
  if (!a || !edition) { host.innerHTML = emptyPress('That story is not in print.', 'It may have been pulled from the edition, or the address is wrong.'); return; }
  setTitle(a.title);
  document.querySelector('meta[name="description"]').setAttribute('content', a.dek || a.title);
  const date = edition.date || id;
  host.innerHTML = `
    <nav class="story-crumbs mono" aria-label="Breadcrumb"><a href="/paper/${esc(id)}">${esc(longDate(date))}</a><span aria-hidden="true">·</span><a href="/paper/${esc(id)}#${esc(a.section.toLowerCase().replace(/\s+/g, '-'))}">${esc(a.section)}</a></nav>
    <header class="story-head">
      <h1 class="story-h">${esc(a.title)}</h1>
      ${a.dek ? `<p class="dek">${esc(a.dek)}</p>` : ''}
      <p class="story-by mono"><span>By <b>${esc(a.byline)}</b></span><span aria-hidden="true">·</span><span>${a.readTime} min read</span><span aria-hidden="true">·</span><time datetime="${esc(date)}">${esc(shortDate(date))}</time></p>
    </header>
    ${a.cover ? `<figure class="story-cover"><img src="${esc(a.cover)}" alt="" width="1600" height="1000" fetchpriority="high"><figcaption>${esc(a.coverCredit || 'Photograph · Dragon News')}</figcaption></figure>` : ''}
    <div class="story-body prose dropcap">${renderMd(a.bodyMd)}</div>
    <div class="end-mark" aria-hidden="true">${SEAL}</div>`;
  // more in this edition
  const S = edition.snapshot;
  const others = [S.lead, ...S.sections.flatMap((s) => s.stories)].filter((s) => s.slug !== slug).slice(0, 4);
  if (others.length) {
    $('#more-list').innerHTML = others.map((s) => ledgerItem(s, id, { excerpt: true })).join('');
    $('#more-link').href = `/paper/${id}`;
    $('#more').hidden = false;
  }
}
main();

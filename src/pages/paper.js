import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { mountReveal } from '../components/reveal.js';
import { stub, emptyPress } from '../components/stubs.js';
import { getCurrentEdition, getEdition } from '../lib/db.js';
import { longDate } from '../lib/format.js';
import { esc, $, setTitle } from '../lib/ui.js';

mountMasthead({ size: 'compact', current: '/paper' });
mountFooter();

async function main() {
  const m = location.pathname.match(/^\/paper\/([^/]+)\/?$/);
  const wantId = m ? decodeURIComponent(m[1]) : null;
  let edition = null;
  try { edition = wantId ? await getEdition(wantId) : await getCurrentEdition(); } catch (e) { console.error(e); }
  setMastheadEdition(edition);
  const body = $('#paper-body');
  if (!edition) {
    body.innerHTML = wantId ? emptyPress('That edition is not in print.', 'It may have been unpublished, or the date in the address is wrong.') : emptyPress();
    return;
  }
  const S = edition.snapshot, L = S.lead, id = edition.id, date = edition.date || edition.id;
  setTitle(wantId ? `Edition of ${longDate(date)}` : "Today's Paper");
  $('#folio').innerHTML = `<span>Vol. <b>${esc(S.volume)}</b> · No. <b>${esc(String(S.issueNumber))}</b></span><span><b>${esc(longDate(date))}</b></span><span>Round Rock, Texas · Free</span>`;
  if (wantId) { const b = $('#banner'); b.innerHTML = `<span>From the archive · ${esc(longDate(date))}</span><a href="/paper">Read today's paper</a>`; b.hidden = false; }
  const min = Math.max(1, Math.round((L.words || 0) / 220));
  body.innerHTML = `
    <section class="lead" aria-labelledby="lead-h">
      <div class="lead-copy">
        <h2 class="lead-h" id="lead-h"><a href="/paper/${esc(id)}/${esc(L.slug)}">${esc(L.title)}</a></h2>
        ${L.dek ? `<p class="dek">${esc(L.dek)}</p>` : ''}
        <p class="lead-by">${esc(L.section)} · By ${esc(L.byline)} · ${min} min read</p>
        <p class="lead-x">${esc(L.excerpt)} <a class="more" href="/paper/${esc(id)}/${esc(L.slug)}">Continue reading</a></p>
      </div>
      ${L.cover ? `<figure class="lead-fig"><a href="/paper/${esc(id)}/${esc(L.slug)}"><img src="${esc(L.cover)}" alt="" width="1600" height="1200" fetchpriority="high"></a><figcaption>Lead photograph · Dragon News</figcaption></figure>` : ''}
    </section>
    <div class="columns">
      ${S.sections.map((sec, i) => `
        <section class="col-sec" id="${esc(sec.name.toLowerCase().replace(/\s+/g, '-'))}" data-reveal style="--d:${(i % 4) * 70}ms">
          <h2 class="col-head">${esc(sec.name)}<span>${sec.stories.length} ${sec.stories.length === 1 ? 'story' : 'stories'}</span></h2>
          <ul>${sec.stories.map((s, j) => stub(s, id, { thumb: j === 0 })).join('')}</ul>
        </section>`).join('')}
    </div>
    <footer class="sheet-foot mono">
      <span>${S.articleCount} stories in this edition${edition.placeholder ? ' · placeholder copy' : ''}</span>
      <span><a href="/archive">Past editions</a> · <a href="/about">About the paper</a></span>
    </footer>`;
  mountReveal();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}
main();

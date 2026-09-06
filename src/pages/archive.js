import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { emptyPress } from '../components/stubs.js';
import { listEditions } from '../lib/db.js';
import { schoolYear, parseDate } from '../lib/format.js';
import { esc, $ } from '../lib/ui.js';

mountMasthead({ size: 'compact', current: '/archive' });
mountFooter();

async function main() {
  let eds = [];
  try { eds = await listEditions(); } catch (e) { console.error(e); }
  setMastheadEdition(eds[0] || null);
  const host = $('#archive');
  if (!eds.length) { host.innerHTML = emptyPress('The archive is empty.', 'Once the first edition is published it will be kept here for good.'); return; }
  const groups = new Map();
  eds.forEach((e) => { const y = schoolYear(e.date || e.id); if (!groups.has(y)) groups.set(y, []); groups.get(y).push(e); });
  host.innerHTML = [...groups.entries()].map(([year, list]) => `
    <h2 class="year-head mono">${esc(year)} school year · ${list.length} ${list.length === 1 ? 'edition' : 'editions'}</h2>
    <ol>${list.map((e) => {
      const d = parseDate(e.date || e.id); const S = e.snapshot || {};
      const mon = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      const wd = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
      return `<li class="ed-row"><a href="/paper/${esc(e.id)}">
        <span class="ed-date"><b class="ed-day">${String(d.getUTCDate()).padStart(2, '0')}</b><span class="mono">${mon} ${d.getUTCFullYear()} · ${wd}</span></span>
        <span class="ed-lead"><h2>${esc(S.lead?.title || 'Untitled edition')}</h2><p>Vol. ${esc(S.volume || '—')} No. ${esc(String(S.issueNumber ?? '—'))} · ${S.articleCount || 0} stories · ${(S.sections || []).map((s) => s.name).join(', ')}</p></span>
        ${S.lead?.thumb ? `<img class="ed-thumb" src="${esc(S.lead.thumb)}" alt="" loading="lazy" width="640" height="480">` : ''}
      </a></li>`; }).join('')}</ol>`).join('');
}
main();

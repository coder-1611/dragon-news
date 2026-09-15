import { guard } from '../../lib/auth.js';
import { db, listAllEditions, getEditionRaw, createEdition, saveEdition, deleteEdition, storiesByStatus } from '../../lib/db.js';
import { publishEdition, unpublishEdition } from '../../lib/publish.js';
import { longDate, todayId } from '../../lib/format.js';
import { SECTIONS } from '../../lib/sections.js';
import { mountShell, statusWord } from '../../components/admin-shell.js';
import { esc, $, $$, toast, params } from '../../lib/ui.js';

const s = await guard('editor');
const { body, actions } = mountShell({ session: s, title: 'Editions', sub: 'Compose and publish the paper', current: '/newsroom/edition' });
let editions = [], pool = [], cur = null, dirty = false;
let selectedId = params().get('id');

body.innerHTML = `<div class="ed-layout"><div class="panel" style="padding:0"><form class="new-ed" id="new" style="padding:1rem 1rem 0"><div class="field"><label for="date">New edition dated</label><input class="input" type="date" id="date" value="${todayId()}" required></div><button class="btn" type="submit">Create</button></form><div class="ed-list" id="edlist"></div></div><div id="composer"><div class="panel"><p class="count-empty">Pick an edition on the left, or create one.</p></div></div></div>`;

$('#new').addEventListener('submit', async (e) => {
  e.preventDefault(); const id = $('#date').value; if (!id) return;
  if (editions.find((x) => x.id === id)) { selectedId = id; return load(); }
  try { await createEdition(id, s.user.uid); selectedId = id; toast(`Edition ${id} created.`, 'success'); load(); } catch (err) { toast(err.message, 'error'); }
});

async function load() {
  [editions, pool] = await Promise.all([listAllEditions(), storiesByStatus(['accepted', 'published'])]);
  // Coming from "Ready to print" with nothing selected: open the newest unpublished edition if there is one.
  if (!selectedId) { const draft = editions.find((e) => e.status === 'draft'); if (draft) selectedId = draft.id; }
  renderList();
  if (selectedId) { cur = await getEditionRaw(selectedId); if (cur) { cur.sections = cur.sections || []; history.replaceState(null, '', `?id=${selectedId}`); renderComposer(); return; } }
  renderIdle();
}
/** No edition open: show the stories waiting for one, so a story marked ready is never invisible. */
function renderIdle() {
  const ready = pool.filter((st) => st.status === 'accepted');
  actions.innerHTML = '';
  $('#composer').innerHTML = `<div class="panel"><h2>Ready to print <span>${ready.length} ${ready.length === 1 ? 'story' : 'stories'}</span></h2>
    ${ready.length ? `<div class="pool">${ready.map((st) => `<div class="pool-item"><div><b>${esc(st.title)}</b><small>${esc(st.section)} · By ${esc(st.byline)} · ${st.wordCount || 0} words</small></div><a class="btn btn-sm btn-ghost" href="/newsroom/write?id=${st.id}">Read</a></div>`).join('')}</div>
      <p class="help" style="margin-top:1rem">Create an edition on the left (today's date is filled in), then pick a lead and add stories to sections.</p>`
      : '<p class="count-empty">Nothing is waiting. Stories appear here once they are accepted or marked ready to print.</p>'}</div>`;
}
function renderList() {
  $('#edlist').innerHTML = editions.length ? editions.map((e) => `<button type="button" aria-selected="${e.id === selectedId}" data-id="${e.id}"><b>${esc(longDate(e.date || e.id))}</b>${statusWord(e.status)}</button>`).join('') : '<p class="count-empty">No editions yet.</p>';
  $$('#edlist button').forEach((b) => b.addEventListener('click', () => { if (dirty && !confirm('Discard unsaved layout changes?')) return; dirty = false; selectedId = b.dataset.id; load(); }));
}
const storyById = (id) => pool.find((x) => x.id === id);
const inUse = () => new Set([cur.leadStoryId, ...cur.sections.flatMap((x) => x.storyIds)].filter(Boolean));
const usable = (st) => st.status === 'accepted' || (st.status === 'published' && st.publishedIn === cur.id);

function renderComposer() {
  const published = cur.status === 'published';
  const used = inUse();
  const avail = pool.filter((st) => usable(st) && !used.has(st.id));
  const lead = cur.leadStoryId && storyById(cur.leadStoryId);
  const opt = (list) => list.map((st) => `<option value="${st.id}">${esc(st.title)} — ${esc(st.section)}, ${esc(st.byline)}</option>`).join('');
  actions.innerHTML = `${statusWord(cur.status)}<button class="btn btn-ghost" id="save" type="button" ${dirty ? '' : 'disabled'}>Save layout</button>${published ? `<a class="btn btn-ghost" href="/paper/${cur.id}" target="_blank" rel="noopener">View in print</a><button class="btn" id="publish" type="button">Republish</button><button class="btn btn-danger btn-sm" id="unpublish" type="button">Unpublish</button>` : `<button class="btn" id="publish" type="button">Publish edition</button><button class="btn btn-danger btn-sm" id="delete" type="button">Delete draft</button>`}`;
  $('#composer').innerHTML = `
    <div class="panel"><h2>Edition of ${esc(longDate(cur.date || cur.id))} <span>${published ? `Printed as Vol. ${esc(cur.snapshot?.volume || '')} No. ${esc(String(cur.snapshot?.issueNumber ?? ''))}` : 'Draft · not visible to readers'}</span></h2>
      <div class="field"><span class="label">Lead story (the main headline)</span>
        <div class="slot slot-lead">${lead ? `<div class="slot-item"><div><b>${esc(lead.title)}</b><small>${esc(lead.section)} · By ${esc(lead.byline)}</small></div><div class="mini"><button type="button" data-lead-rm title="Remove">×</button></div></div>` : `<span class="slot-empty">No lead yet</span>`}
          ${avail.length ? `<select class="select" id="lead-pick"><option value="">${lead ? 'Replace the lead with…' : 'Choose the lead…'}</option>${opt(avail)}</select>` : (lead ? '' : '<p class="help">No accepted stories available. Accept stories in the queue first.</p>')}
        </div></div>
    </div>
    <div class="panel"><h2>Sections <span>order top to bottom as they print</span></h2>
      <div class="sec-grid">${SECTIONS.map((name) => { const sec = cur.sections.find((x) => x.name === name) || { name, storyIds: [] }; const items = sec.storyIds.map(storyById).filter(Boolean); const suggested = avail.filter((st) => st.section === name), others = avail.filter((st) => st.section !== name);
        return `<div class="sec-box"><h3>${esc(name)}<span>${items.length}</span></h3><div class="slot">${items.length ? items.map((st, i) => `<div class="slot-item"><div><b>${esc(st.title)}</b><small>By ${esc(st.byline)}${st.section !== name ? ` · filed as ${esc(st.section)}` : ''}</small></div><div class="mini"><button type="button" data-mv="${name}|${i}|-1" title="Up">↑</button><button type="button" data-mv="${name}|${i}|1" title="Down">↓</button><button type="button" data-rm="${name}|${i}" title="Remove">×</button></div></div>`).join('') : '<span class="slot-empty">Empty · this section will not print</span>'}
          ${avail.length ? `<select class="select" data-add="${name}"><option value="">Add a story…</option>${suggested.length ? `<optgroup label="Filed as ${esc(name)}">${opt(suggested)}</optgroup>` : ''}${others.length ? `<optgroup label="Other sections">${opt(others)}</optgroup>` : ''}</select>` : ''}</div></div>`; }).join('')}</div>
    </div>
    <div class="panel"><h2>Ready to print <span>${pool.filter(usable).length} accepted</span></h2>${avail.length ? `<div class="pool">${avail.map((st) => `<div class="pool-item"><div><b>${esc(st.title)}</b><small>${esc(st.section)} · By ${esc(st.byline)} · ${st.wordCount || 0} words</small></div><a class="btn btn-sm btn-ghost" href="/newsroom/write?id=${st.id}">Read</a></div>`).join('')}</div>` : '<p class="count-empty">Every accepted story is placed.</p>'}</div>`;

  const mark = () => { dirty = true; renderComposer(); };
  $('#lead-pick')?.addEventListener('change', (e) => { const id = e.target.value; if (!id) return; cur.sections.forEach((x) => { x.storyIds = x.storyIds.filter((y) => y !== id); }); cur.leadStoryId = id; mark(); });
  $('[data-lead-rm]')?.addEventListener('click', () => { cur.leadStoryId = null; mark(); });
  $$('[data-add]').forEach((sel) => sel.addEventListener('change', () => { const id = sel.value; if (!id) return; let sec = cur.sections.find((x) => x.name === sel.dataset.add); if (!sec) { sec = { name: sel.dataset.add, storyIds: [] }; cur.sections.push(sec); } sec.storyIds.push(id); mark(); }));
  $$('[data-rm]').forEach((b) => b.addEventListener('click', () => { const [n, i] = b.dataset.rm.split('|'); cur.sections.find((x) => x.name === n).storyIds.splice(+i, 1); mark(); }));
  $$('[data-mv]').forEach((b) => b.addEventListener('click', () => { const [n, i, d] = b.dataset.mv.split('|'); const a = cur.sections.find((x) => x.name === n).storyIds; const j = +i + +d; if (j < 0 || j >= a.length) return; [a[+i], a[j]] = [a[j], a[+i]]; mark(); }));
  $('#save').addEventListener('click', persist);
  $('#publish').addEventListener('click', async () => {
    if (!cur.leadStoryId) return toast('Pick a lead story first.', 'error');
    if (!confirm(published ? 'Republish this edition with the current layout? Readers see the change immediately.' : `Publish the edition of ${longDate(cur.id)}? It becomes visible to everyone.`)) return;
    try { await persist(true); await publishEdition(db, cur.id); toast('Published. It is in print.', 'success'); load(); } catch (e) { console.error(e); toast(e.message, 'error'); }
  });
  $('#unpublish')?.addEventListener('click', async () => { if (!confirm('Pull this edition from print? Readers will no longer see it.')) return; try { await unpublishEdition(db, cur.id); toast('Edition unpublished.'); load(); } catch (e) { toast(e.message, 'error'); } });
  $('#delete')?.addEventListener('click', async () => { if (!confirm('Delete this draft edition?')) return; try { await deleteEdition(cur.id); selectedId = null; cur = null; history.replaceState(null, '', location.pathname); toast('Draft edition deleted.'); load(); } catch (e) { toast(e.message, 'error'); } });
}
async function persist(quiet) {
  const sections = cur.sections.filter((x) => x.storyIds.length).map((x) => ({ name: x.name, storyIds: x.storyIds }));
  await saveEdition(cur.id, { leadStoryId: cur.leadStoryId || null, sections });
  cur.sections = sections; dirty = false;
  if (!quiet) { toast('Layout saved.', 'success'); renderComposer(); }
}
addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
load();

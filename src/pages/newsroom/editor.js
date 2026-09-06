import { guard } from '../../lib/auth.js';
import { listUsers, setUserStatus, setUserTitle, storiesByStatus, reviewStory, getCrew, saveCrew } from '../../lib/db.js';
import { renderMd } from '../../lib/markdown.js';
import { readTime } from '../../lib/format.js';
import { mountShell, statusWord } from '../../components/admin-shell.js';
import { avatar } from '../../components/crew.js';
import { esc, $, $$, toast, params } from '../../lib/ui.js';
import { relTime } from '../../lib/format.js';

const s = await guard('editor');
const { body } = mountShell({ session: s, title: 'Staff & queue', sub: 'Editor desk', current: '/newsroom/editor', actions: `<a class="btn" href="/newsroom/edition">Editions</a>` });
let tab = params().get('tab') || 'queue';
body.innerHTML = `<div class="tabs" role="tablist" id="tabs"></div><div id="tabbody"></div>`;
const counts = { queue: 0, staff: 0 };

function renderTabs() {
  $('#tabs').innerHTML = [['queue', 'Submissions', counts.queue], ['stories', 'All stories'], ['staff', 'Staff', counts.staff], ['crew', 'Public crew list']]
    .map(([k, l, c]) => `<button role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}${c ? `<b>${c}</b>` : ''}</button>`).join('');
  $$('#tabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; history.replaceState(null, '', `?tab=${tab}`); renderTabs(); render(); }));
}
async function render() {
  const host = $('#tabbody'); host.innerHTML = `<div class="skel" style="height:8rem"></div>`;
  try {
    if (tab === 'queue') await renderQueue(host);
    else if (tab === 'stories') await renderStories(host);
    else if (tab === 'staff') await renderStaff(host);
    else await renderCrewEditor(host);
  } catch (e) { console.error(e); host.innerHTML = `<p class="error">Could not load: ${esc(e.message)}</p>`; }
}

// ---- queue with review pane ----
let selected = null;
async function renderQueue(host) {
  const list = await storiesByStatus(['submitted']);
  counts.queue = list.length; renderTabs();
  if (!list.length) { host.innerHTML = `<div class="panel"><p class="count-empty">The queue is clear. Nothing is waiting for review.</p></div>`; return; }
  if (!list.find((x) => x.id === selected)) selected = list[0].id;
  host.innerHTML = `<div class="split"><div class="panel" style="padding:0"><div class="queue-list">${list.map((st) => `<button class="queue-item" role="option" aria-selected="${st.id === selected}" data-id="${st.id}"><h3>${esc(st.title)}</h3><p class="meta"><span>${esc(st.section)}</span><span>·</span><span>By ${esc(st.byline)}</span><span>·</span><span>${esc(relTime(st.submittedAt || st.updatedAt))}</span></p></button>`).join('')}</div></div><div id="review"></div></div>`;
  $$('.queue-item').forEach((b) => b.addEventListener('click', () => { selected = b.dataset.id; $$('.queue-item').forEach((x) => x.setAttribute('aria-selected', x === b)); renderReview(list.find((x) => x.id === selected)); }));
  renderReview(list.find((x) => x.id === selected));
}
function renderReview(st) {
  const host = $('#review');
  host.innerHTML = `
    <article class="sheet story">
      <nav class="story-crumbs mono"><span>${esc(st.section)}</span><span aria-hidden="true">·</span><span>${st.wordCount || 0} words · ${readTime(st.bodyMd)} min</span><span aria-hidden="true">·</span><a href="/newsroom/write?id=${st.id}">Open in editor</a></nav>
      <header class="story-head"><h1 class="story-h" style="font-size:var(--fs-4)">${esc(st.title)}</h1>${st.dek ? `<p class="dek">${esc(st.dek)}</p>` : ''}<p class="story-by mono"><span>By <b>${esc(st.byline)}</b></span></p></header>
      ${st.cover ? `<figure class="story-cover"><img src="${st.cover}" alt=""><figcaption>${esc(st.coverCredit || 'No photo credit')}</figcaption></figure>` : '<p class="notice">No cover photo.</p>'}
      <div class="story-body prose dropcap">${renderMd(st.bodyMd)}</div>
    </article>
    <div class="review-actions">
      <div class="field"><label for="note">Note to the writer (required when sending back)</label><textarea class="textarea" id="note" style="min-height:6rem" placeholder="What should change before this can run?"></textarea></div>
      <div class="row"><button class="btn" id="accept" type="button">Accept for print</button><button class="btn btn-ghost" id="revise" type="button">Send back with note</button></div>
    </div>`;
  $('#accept').addEventListener('click', async () => { try { await reviewStory(st.id, 'accepted', ''); toast(`Accepted “${st.title}”.`, 'success'); render(); } catch (e) { toast(e.message, 'error'); } });
  $('#revise').addEventListener('click', async () => { const n = $('#note').value.trim(); if (n.length < 3) return toast('Write the writer a note first.', 'error'); try { await reviewStory(st.id, 'needs_revision', n); toast('Sent back to the writer.'); render(); } catch (e) { toast(e.message, 'error'); } });
}

// ---- all stories ----
async function renderStories(host) {
  const list = await storiesByStatus(['accepted', 'published', 'needs_revision', 'draft', 'submitted']);
  host.innerHTML = `<div class="panel"><h2>All stories <span>${list.length}</span></h2>${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Story</th><th>Writer</th><th>Section</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
    ${list.map((st) => `<tr><td class="t-title"><a href="/newsroom/write?id=${st.id}">${esc(st.title)}</a></td><td class="t-mono">${esc(st.byline)}</td><td class="t-mono">${esc(st.section)}</td><td>${statusWord(st.status)}</td><td class="t-mono">${esc(relTime(st.updatedAt))}</td>
      <td class="t-actions">${st.status === 'accepted' ? `<button class="btn btn-sm btn-ghost" data-back="${st.id}">Send back</button>` : ''}${st.status === 'published' && st.publishedIn ? `<a class="btn btn-sm btn-ghost" href="/paper/${esc(st.publishedIn)}/${esc(st.slug)}">In print</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="count-empty">No stories yet.</p>'}</div>`;
  $$('[data-back]').forEach((b) => b.addEventListener('click', async () => { const n = prompt('Note to the writer:'); if (!n) return; try { await reviewStory(b.dataset.back, 'needs_revision', n); toast('Sent back.'); render(); } catch (e) { toast(e.message, 'error'); } }));
}

// ---- staff ----
async function renderStaff(host) {
  const users = await listUsers();
  const pending = users.filter((u) => u.status === 'pending'), rest = users.filter((u) => u.status !== 'pending');
  counts.staff = pending.length; renderTabs();
  const row = (u) => `<div class="person">${avatar({ name: u.displayName })}<div><b>${esc(u.displayName)}</b><span class="mono">${esc(u.email)} · ${u.role === 'editor' ? 'Editor' : statusWord(u.status)} · joined ${esc(relTime(u.createdAt))}</span></div>
    <div class="actions">${u.role === 'editor' ? '<span class="status status-published"><i></i>Editor</span>' : u.status === 'pending' ? `<button class="btn btn-sm" data-approve="${u.id}">Approve</button><button class="btn btn-sm btn-danger" data-reject="${u.id}">Decline</button>` : `<input class="input" value="${esc(u.title || '')}" data-title="${u.id}" aria-label="Title" placeholder="Staff Writer">${u.status === 'approved' ? `<button class="btn btn-sm btn-danger" data-reject="${u.id}">Revoke</button>` : `<button class="btn btn-sm" data-approve="${u.id}">Approve</button>`}`}</div></div>`;
  host.innerHTML = `<div class="panel"><h2>Waiting for a press pass <span>${pending.length}</span></h2>${pending.length ? pending.map(row).join('') : '<p class="count-empty">No applications waiting.</p>'}</div>
    <div class="panel"><h2>Staff <span>${rest.length}</span></h2>${rest.map(row).join('')}<p class="help" style="margin-top:1rem">Titles appear on the desk and can be used in the public crew list. Press Enter to save a title.</p></div>`;
  $$('[data-approve]').forEach((b) => b.addEventListener('click', async () => { try { await setUserStatus(b.dataset.approve, 'approved', s.user.uid); toast('Press pass approved.', 'success'); render(); } catch (e) { toast(e.message, 'error'); } }));
  $$('[data-reject]').forEach((b) => b.addEventListener('click', async () => { if (!confirm('Decline / revoke this press pass?')) return; try { await setUserStatus(b.dataset.reject, 'rejected', s.user.uid); toast('Press pass declined.'); render(); } catch (e) { toast(e.message, 'error'); } }));
  $$('[data-title]').forEach((i) => i.addEventListener('keydown', async (e) => { if (e.key !== 'Enter') return; e.preventDefault(); try { await setUserTitle(i.dataset.title, i.value.trim() || 'Staff Writer'); toast('Title saved.', 'success'); } catch (err) { toast(err.message, 'error'); } }));
}

// ---- public crew list ----
async function renderCrewEditor(host) {
  const crew = await getCrew();
  let members = (crew.members || []).map((m) => ({ ...m }));
  const draw = () => {
    host.innerHTML = `<div class="panel"><h2>Public crew list <span>shown on the home and about pages</span></h2>
      ${crew.placeholder ? '<p class="notice notice-gold" style="margin-bottom:1rem">These are placeholder names. Replace them with the real staff and save.</p>' : ''}
      <div class="crew-edit" id="rows">${members.map((m, i) => `<div class="crew-edit-row"><input class="input" placeholder="Name" value="${esc(m.name)}" data-f="name" data-i="${i}"><input class="input" placeholder="Title" value="${esc(m.title)}" data-f="title" data-i="${i}"><input class="input" placeholder="One line about them" value="${esc(m.blurb || '')}" data-f="blurb" data-i="${i}"><div class="mini"><button type="button" title="Move up" data-up="${i}">↑</button><button type="button" title="Move down" data-down="${i}">↓</button><button type="button" title="Remove" data-rm="${i}">×</button></div></div>`).join('')}</div>
      <div class="row" style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap"><button class="btn btn-ghost" id="add" type="button">Add a person</button><button class="btn" id="savecrew" type="button">Save crew list</button></div>
      <p class="help" style="margin-top:.8rem">The first person listed is shown as the editor.</p></div>`;
    $$('#rows input').forEach((i) => i.addEventListener('input', () => { members[+i.dataset.i][i.dataset.f] = i.value; }));
    $$('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.up; if (i > 0) { [members[i - 1], members[i]] = [members[i], members[i - 1]]; draw(); } }));
    $$('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.down; if (i < members.length - 1) { [members[i + 1], members[i]] = [members[i], members[i + 1]]; draw(); } }));
    $$('[data-rm]').forEach((b) => b.addEventListener('click', () => { members.splice(+b.dataset.rm, 1); draw(); }));
    $('#add').addEventListener('click', () => { members.push({ name: '', title: 'Staff Writer', blurb: '' }); draw(); });
    $('#savecrew').addEventListener('click', async () => {
      const clean = members.filter((m) => m.name.trim()).map((m, i) => ({ name: m.name.trim(), title: (m.title || 'Staff Writer').trim(), blurb: (m.blurb || '').trim(), role: i === 0 ? 'editor' : 'staff' }));
      try { await saveCrew(clean); crew.placeholder = false; toast('Crew list published.', 'success'); } catch (e) { toast(e.message, 'error'); }
    });
  };
  draw();
}
renderTabs(); render();

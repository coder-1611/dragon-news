import { guard } from '../../lib/auth.js';
import { myStories, deleteStory } from '../../lib/db.js';
import { mountShell, statusWord } from '../../components/admin-shell.js';
import { esc, toast } from '../../lib/ui.js';
import { relTime } from '../../lib/format.js';
import { SECTIONS } from '../../lib/sections.js';

const s = await guard('approved');
const { body } = mountShell({ session: s, title: 'My desk', sub: `${s.profile.title || 'Staff writer'} · ${s.profile.displayName}`, current: '/newsroom/desk', actions: `<a class="btn" href="/newsroom/write">New story</a>` });

async function render() {
  body.innerHTML = `<div class="panel"><h2>My stories <span id="count"></span></h2><div id="list"><div class="skel" style="height:8rem"></div></div></div>
  <div class="panel"><h2>How it works</h2>${s.profile.role === 'editor'
    ? `<ol class="prose" style="font-size:1rem;padding-left:1.2em;list-style:decimal;max-width:none"><li>Write your story and press <b>Ready to print</b>. Your own stories skip the queue.</li><li>Writers' stories arrive under <a href="/newsroom/editor?tab=queue">Staff &amp; queue</a>. Accept them or send them back with a note.</li><li>Open <a href="/newsroom/edition">Editions</a>, pick the lead, order the sections and publish. That is the paper.</li></ol>`
    : `<ol class="prose" style="font-size:1rem;padding-left:1.2em;list-style:decimal;max-width:none"><li>Write a story and save it as a draft. Only you can see drafts.</li><li>Submit it. The editor reads it and either accepts it or sends it back with a note.</li><li>Accepted stories are placed into an edition by the editor. When the edition is published, your byline is in print.</li></ol>`}</div>`;
  let list = [];
  try { list = await myStories(s.user.uid); } catch (e) { console.error(e); toast('Could not load your stories.', 'error'); }
  document.getElementById('count').textContent = list.length ? `${list.length}` : '';
  const host = document.getElementById('list');
  if (!list.length) { host.innerHTML = `<p class="count-empty">No stories yet. <a href="/newsroom/write">Start your first one.</a></p>`; return; }
  host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Story</th><th>Section</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
    ${list.map((st) => `<tr>
      <td class="t-title"><a href="/newsroom/write?id=${esc(st.id)}">${esc(st.title || 'Untitled')}</a>${st.status === 'needs_revision' && st.editorNote ? `<div class="help" style="margin-top:.3rem">Editor: ${esc(st.editorNote)}</div>` : ''}</td>
      <td class="t-mono">${esc(st.section || SECTIONS[0])}</td>
      <td>${statusWord(st.status)}</td>
      <td class="t-mono">${esc(relTime(st.updatedAt))}</td>
      <td class="t-actions">${st.status === 'published' && st.publishedIn ? `<a class="btn btn-sm btn-ghost" href="/paper/${esc(st.publishedIn)}/${esc(st.slug)}">Read in print</a>` : st.status === 'accepted' && s.profile.role === 'editor' ? `<a class="btn btn-sm" href="/newsroom/edition">Place in edition</a> <a class="btn btn-sm btn-ghost" href="/newsroom/write?id=${esc(st.id)}">Edit</a>` : `<a class="btn btn-sm btn-ghost" href="/newsroom/write?id=${esc(st.id)}">${['draft', 'needs_revision'].includes(st.status) || s.profile.role === 'editor' ? 'Edit' : 'View'}</a>`}${st.status === 'draft' ? ` <button class="btn btn-sm btn-danger" data-del="${esc(st.id)}">Delete</button>` : ''}</td>
    </tr>`).join('')}</tbody></table></div>`;
  host.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Delete this draft for good?')) return;
    try { await deleteStory(b.dataset.del); toast('Draft deleted.'); render(); } catch (e) { toast('Could not delete: ' + e.message, 'error'); }
  }));
}
render();

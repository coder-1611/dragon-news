import { guard, isEditor } from '../../lib/auth.js';
import { getStory, createStory, updateStory, deleteStory } from '../../lib/db.js';
import { prepareCover } from '../../lib/images.js';
import { renderMd } from '../../lib/markdown.js';
import { wordCount, readTime } from '../../lib/format.js';
import { SECTIONS } from '../../lib/sections.js';
import { mountShell, statusWord } from '../../components/admin-shell.js';
import { esc, $, toast, params } from '../../lib/ui.js';
import { serverTimestamp } from 'firebase/firestore';

const s = await guard('approved');
const editor = isEditor(s);
let id = params().get('id');
let story = null;
if (id) {
  try { story = await getStory(id); } catch (e) { console.error(e); }
  if (!story) { location.replace('/newsroom/desk'); await new Promise(() => {}); }
}
const mine = !story || story.authorUid === s.user.uid;
const editable = editor || (mine && (!story || ['draft', 'needs_revision'].includes(story.status)));
const state = { title: story?.title || '', dek: story?.dek || '', section: story?.section || SECTIONS[0], bodyMd: story?.bodyMd || '', cover: story?.cover || null, thumb: story?.thumb || null, coverCredit: story?.coverCredit || '' };

const { body, actions } = mountShell({ session: s, title: story ? (editable ? 'Edit story' : 'Story') : 'Write a story', sub: story ? `Filed by ${story.byline}` : `Byline: ${s.profile.displayName}`, current: '/newsroom/write' });

function renderActions() {
  const st = story?.status || 'draft';
  let b = '';
  if (editable) {
    b += `<button class="btn btn-ghost" id="save" type="button">${editor && !mine ? 'Save changes' : 'Save draft'}</button>`;
    if (editor) {
      // The editor's own story never goes through the queue: it is marked ready and placed in an edition.
      // Someone else's submitted story can be copy-edited here and accepted in the same place.
      if ((mine && ['draft', 'needs_revision', 'submitted'].includes(st)) || (!mine && st === 'submitted'))
        b += `<button class="btn" id="accept" type="button">${mine ? 'Ready to print' : 'Accept for print'}</button>`;
      if (st === 'accepted') b += `<a class="btn" href="/newsroom/edition">Place in an edition</a>`;
      if (!mine && st === 'submitted') b += `<a class="btn btn-ghost btn-sm" href="/newsroom/editor?tab=queue">Back to queue</a>`;
    } else if (['draft', 'needs_revision'].includes(st)) {
      b += `<button class="btn" id="submit" type="button">Submit to editor</button>`;
    }
  }
  if (story && st === 'published' && story.publishedIn) b += `<a class="btn btn-ghost" href="/paper/${esc(story.publishedIn)}/${esc(story.slug)}">Read in print</a>`;
  if (story && st === 'draft' && (mine || editor)) b += `<button class="btn btn-danger btn-sm" id="del" type="button">Delete</button>`;
  actions.innerHTML = `${statusWord(st)} ${b}`;
  $('#save')?.addEventListener('click', () => save(null));
  $('#submit')?.addEventListener('click', () => save('submitted'));
  $('#accept')?.addEventListener('click', () => save('accepted'));
  $('#del')?.addEventListener('click', async () => { if (!confirm('Delete this draft for good?')) return; try { await deleteStory(id); location.href = '/newsroom/desk'; } catch (e) { toast(e.message, 'error'); } });
}

body.innerHTML = `
  ${story?.status === 'needs_revision' && story.editorNote ? `<div class="notice notice-gold"><h3>Note from the editor</h3><p>${esc(story.editorNote)}</p></div>` : ''}
  ${!editable ? `<div class="notice"><h3>Read only</h3><p>This story is with the editor. You can edit it again if it comes back with a note.</p></div>` : ''}
  <div class="write-grid">
    <form class="write-form panel" id="f" novalidate>
      <div class="field"><label for="title">Headline</label><input class="input input-title" id="title" maxlength="160" placeholder="Headline goes here" value="${esc(state.title)}" ${editable ? '' : 'readonly'}></div>
      <div class="field"><label for="dek">Dek (one sentence under the headline)</label><input class="input" id="dek" maxlength="240" placeholder="The one-sentence summary a reader sees before tapping" value="${esc(state.dek)}" ${editable ? '' : 'readonly'}></div>
      <div class="write-row">
        <div class="field"><label for="section">Section</label><select class="select" id="section" ${editable ? '' : 'disabled'}>${SECTIONS.map((x) => `<option ${x === state.section ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label for="credit">Photo credit</label><input class="input" id="credit" maxlength="80" placeholder="Photo by …" value="${esc(state.coverCredit)}" ${editable ? '' : 'readonly'}></div>
      </div>
      <div class="field"><span class="label">Cover photo</span>
        <div class="cover-drop ${state.cover ? 'has-file' : ''}" id="drop">
          ${state.cover ? `<img id="cover-img" src="${esc(state.cover)}" alt="">` : `<p class="help" id="drop-help">Drop an image here or click to choose. It is resized and compressed automatically.</p>`}
          ${editable ? `<div class="cover-actions">${state.cover ? `<button class="btn btn-sm btn-ghost" type="button" id="cover-change">Change</button><button class="btn btn-sm btn-danger" type="button" id="cover-remove">Remove</button>` : ''}</div><input type="file" id="file" accept="image/*">` : ''}
        </div>
      </div>
      <div class="field"><label for="md">Story</label>
        ${editable ? `<div class="toolbar" role="toolbar" aria-label="Formatting"><button type="button" data-wrap="**">Bold</button><button type="button" data-wrap="_">Italic</button><button type="button" data-line="## ">Subhead</button><button type="button" data-line="> ">Pull quote</button><button type="button" data-line="- ">List</button><button type="button" data-link>Link</button></div>` : ''}
        <textarea class="textarea textarea-md" id="md" placeholder="Start with the news. Who, what, when, where, and why it matters to Dragons." ${editable ? '' : 'readonly'}>${esc(state.bodyMd)}</textarea>
        <p class="wc" id="wc"></p>
      </div>
      <p class="help">Formatting: **bold**, _italic_, ## subhead, > pull quote, - list, [text](link).</p>
    </form>
    <div class="preview-pane"><div class="sheet story" id="preview"></div></div>
  </div>`;
renderActions();

const ta = $('#md');
function preview() {
  const words = wordCount(state.bodyMd);
  $('#wc').textContent = `${words} words · ${readTime(state.bodyMd)} min read`;
  $('#preview').innerHTML = `
    <nav class="story-crumbs mono"><span>Preview</span><span aria-hidden="true">·</span><span>${esc(state.section)}</span></nav>
    <header class="story-head"><h1 class="story-h">${state.title ? esc(state.title) : '<span class="preview-empty">Headline</span>'}</h1>${state.dek ? `<p class="dek">${esc(state.dek)}</p>` : ''}<p class="story-by mono"><span>By <b>${esc(story?.byline || s.profile.displayName)}</b></span><span aria-hidden="true">·</span><span>${readTime(state.bodyMd)} min read</span></p></header>
    ${state.cover ? `<figure class="story-cover"><img src="${esc(state.cover)}" alt=""><figcaption>${esc(state.coverCredit || 'Photograph · Dragon News')}</figcaption></figure>` : ''}
    <div class="story-body prose dropcap">${state.bodyMd.trim() ? renderMd(state.bodyMd) : '<p class="preview-empty">Your story appears here as it will print.</p>'}</div>`;
}
let t; const sync = () => { state.title = $('#title').value; state.dek = $('#dek').value; state.section = $('#section').value; state.coverCredit = $('#credit').value; state.bodyMd = ta.value; clearTimeout(t); t = setTimeout(preview, 120); };
['title', 'dek', 'section', 'credit', 'md'].forEach((i) => $('#' + i).addEventListener('input', sync));
preview();

// toolbar
document.querySelectorAll('.toolbar button').forEach((b) => b.addEventListener('click', () => {
  const [a, z] = [ta.selectionStart, ta.selectionEnd]; const v = ta.value; const sel = v.slice(a, z);
  let out, pos;
  if (b.dataset.wrap) { const w = b.dataset.wrap; out = v.slice(0, a) + w + (sel || 'text') + w + v.slice(z); pos = a + w.length + (sel || 'text').length + w.length; }
  else if (b.dataset.line) { const ls = v.lastIndexOf('\n', a - 1) + 1; out = v.slice(0, ls) + b.dataset.line + v.slice(ls); pos = z + b.dataset.line.length; }
  else { const url = prompt('Link address (https://…)'); if (!url) return; out = v.slice(0, a) + `[${sel || 'link text'}](${url})` + v.slice(z); pos = a + 1; }
  ta.value = out; ta.focus(); ta.setSelectionRange(pos, pos); sync();
}));

// cover
function bindCover() {
  const file = $('#file'); if (!file) return;
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (!f) return;
    try { toast('Preparing photo…'); const r = await prepareCover(f); state.cover = r.cover; state.thumb = r.thumb; rerenderCover(); preview(); }
    catch (e) { toast(e.message, 'error'); }
  });
  $('#cover-change')?.addEventListener('click', () => file.click());
  $('#cover-remove')?.addEventListener('click', () => { state.cover = null; state.thumb = null; rerenderCover(); preview(); });
  const drop = $('#drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--maroon)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.borderColor = ''; const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); file.files = dt.files; file.dispatchEvent(new Event('change')); } });
}
function rerenderCover() {
  const drop = $('#drop');
  drop.className = 'cover-drop' + (state.cover ? ' has-file' : '');
  drop.innerHTML = (state.cover ? `<img id="cover-img" src="${state.cover}" alt="">` : `<p class="help">Drop an image here or click to choose. It is resized and compressed automatically.</p>`) +
    `<div class="cover-actions">${state.cover ? `<button class="btn btn-sm btn-ghost" type="button" id="cover-change">Change</button><button class="btn btn-sm btn-danger" type="button" id="cover-remove">Remove</button>` : ''}</div><input type="file" id="file" accept="image/*">`;
  bindCover();
}
if (editable) bindCover();

async function save(transition) {
  sync();
  const status = transition || story?.status || 'draft';
  if (transition) {
    if (state.title.trim().length < 2) return toast('Give the story a headline first.', 'error');
    if (!state.bodyMd.trim()) return toast('The story is empty.', 'error');
    if (transition === 'submitted' && !confirm('Send this story to the editor? You will not be able to edit it unless it comes back with a note.')) return;
  }
  const data = { title: state.title.trim() || 'Untitled', dek: state.dek.trim(), section: state.section, bodyMd: state.bodyMd, cover: state.cover, thumb: state.thumb, coverCredit: state.coverCredit.trim(), wordCount: wordCount(state.bodyMd), status };
  if (transition === 'submitted') data.submittedAt = serverTimestamp();
  if (transition === 'accepted') { data.reviewedAt = serverTimestamp(); data.editorNote = ''; }
  ['#save', '#submit', '#accept'].forEach((sel) => { const el = $(sel); if (el) el.disabled = true; });
  try {
    if (!id) {
      id = await createStory({ ...data, status: 'draft', authorUid: s.user.uid, byline: s.profile.displayName });
      if (transition) { const { status: _s, ...rest } = data; await updateStory(id, { status, ...(transition === 'submitted' ? { submittedAt: serverTimestamp() } : { reviewedAt: serverTimestamp(), editorNote: '' }) }); }
      history.replaceState(null, '', `/newsroom/write?id=${id}`);
    } else await updateStory(id, data);
    if (transition === 'submitted') { toast('Sent to the editor.', 'success'); setTimeout(() => (location.href = '/newsroom/desk'), 700); return; }
    if (transition === 'accepted') { toast(mine ? 'Ready to print. Now place it in an edition.' : 'Accepted for print.', 'success'); setTimeout(() => (location.href = mine ? '/newsroom/edition' : '/newsroom/editor?tab=queue'), 800); return; }
    toast('Saved.', 'success');
    story = { ...(story || {}), ...data, id, byline: story?.byline || s.profile.displayName };
    renderActions();
  } catch (e) { console.error(e); toast('Could not save: ' + (e.message || e), 'error'); renderActions(); }
}

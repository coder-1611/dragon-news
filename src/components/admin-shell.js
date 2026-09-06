import { esc } from '../lib/ui.js';
import { signOut } from '../lib/auth.js';

export function mountShell({ session, title, sub = '', current = '', actions = '' }) {
  const p = session.profile;
  const editor = p.role === 'editor';
  const nav = [
    ['/newsroom/desk', 'My desk'],
    ['/newsroom/write', 'Write a story'],
    ...(editor ? [['sep', 'Editor'], ['/newsroom/editor', 'Staff & queue'], ['/newsroom/edition', 'Editions']] : []),
    ['sep', 'Public'], ['/', 'Front page'], ['/paper', "Today's paper"],
  ];
  document.body.classList.add('nr');
  document.body.innerHTML = `
    <aside class="nr-rail">
      <a class="nr-brand" href="/">Dragon News</a>
      <p class="nr-tag"><span class="live-dot" aria-hidden="true"></span>Newsroom</p>
      <nav class="nr-nav" aria-label="Newsroom">${nav.map(([href, label]) => href === 'sep' ? `<span class="nr-sep">${label}</span>` : `<a href="${href}"${href === current ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}</nav>
      <div class="nr-me"><b>${esc(p.displayName)}</b><span>${esc(editor ? 'Editor' : p.title || 'Staff writer')}</span><button type="button" data-signout>Sign out</button></div>
    </aside>
    <main class="nr-main" id="main">
      <header class="nr-top"><div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div><div class="nr-actions" id="actions">${actions}</div></header>
      <section class="nr-body" id="body"></section>
    </main>`;
  document.querySelector('[data-signout]').addEventListener('click', async () => { await signOut(); location.href = '/newsroom'; });
  return { body: document.getElementById('body'), actions: document.getElementById('actions') };
}
export const STATUS_LABEL = { draft: 'Draft', submitted: 'Submitted', needs_revision: 'Needs revision', accepted: 'Accepted', published: 'Published', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
export const statusWord = (s) => `<span class="status status-${esc(s)}"><i aria-hidden="true"></i>${STATUS_LABEL[s] || esc(s)}</span>`;

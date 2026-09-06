import { onSession, signIn, signUp, signOut, resetPassword, isApproved, isEditor, friendlyAuthError } from '../../lib/auth.js';
import { SEAL } from '../../components/stubs.js';
import { esc, $, toast } from '../../lib/ui.js';

const join = new URLSearchParams(location.search).has('join');
let mode = join ? 'up' : 'in';

function shell(inner, foot = 'Press passes are approved by the editor') {
  document.body.className = 'auth-page';
  document.body.innerHTML = `
    <header class="auth-top"><a class="nr-brand" href="/">Dragon News</a><span class="mono"><span class="live-dot" aria-hidden="true"></span>Newsroom</span></header>
    <div class="auth-wrap"><section class="pass" aria-live="polite">${inner}<div class="pass-foot"><span>${foot}</span><a href="/" style="text-decoration:none;color:inherit">Back to the paper</a></div></section></div>
    <footer class="foot" style="padding:1rem var(--gutter);font-family:var(--f-mono);font-size:.64rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(243,237,226,.5)">Round Rock High School · 201 Deep Wood Drive · Round Rock, TX 78681</footer>`;
}

function renderForm() {
  const up = mode === 'up';
  shell(`
    <div class="pass-head"><p class="k">Press pass</p><h1>${up ? 'Apply for a press pass' : 'Sign in to the newsroom'}</h1><p>${up ? 'Any Dragon can apply. The editor approves new journalists before their first story.' : 'Journalists file stories here. The editor publishes the paper.'}</p></div>
    <div class="pass-body">
      <form id="f" novalidate>
        ${up ? `<div class="field"><label for="name">Your name, as it should appear in bylines</label><input class="input" id="name" name="name" autocomplete="name" required maxlength="80" placeholder="Jordan Alvarez"></div>` : ''}
        <div class="field"><label for="email">Email</label><input class="input" id="email" name="email" type="email" autocomplete="${up ? 'email' : 'username'}" required placeholder="you@example.com"></div>
        <div class="field"><label for="pw">Password</label><input class="input" id="pw" name="pw" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" required minlength="8" placeholder="${up ? 'At least 8 characters' : ''}"></div>
        <p class="error" id="err" hidden></p>
        <div class="row"><button class="btn" id="go" type="submit">${up ? 'Apply' : 'Sign in'}</button>${up ? '' : '<button class="alt" type="button" id="forgot" style="color:var(--maroon);border-bottom:1px solid currentColor">Forgot password</button>'}</div>
      </form>
      <p class="alt">${up ? 'Already have a pass? <button type="button" id="swap">Sign in</button>' : 'New here? <button type="button" id="swap">Apply for a press pass</button>'}</p>
    </div>`);
  $('#swap').addEventListener('click', () => { mode = up ? 'in' : 'up'; renderForm(); });
  $('#forgot')?.addEventListener('click', async () => {
    const email = $('#email').value.trim();
    if (!email) return showErr('Type your email first, then press Forgot password.');
    try { await resetPassword(email); toast('Reset email sent. Check your inbox.', 'success'); } catch (e) { showErr(friendlyAuthError(e)); }
  });
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#go'); btn.disabled = true; showErr('');
    const email = $('#email').value.trim(), pw = $('#pw').value;
    try {
      if (up) { const name = $('#name').value.trim(); if (name.length < 2) throw new Error('Tell us your name for the byline.'); if (pw.length < 8) throw new Error('Use a password of at least 8 characters.'); await signUp({ name, email, password: pw }); }
      else await signIn(email, pw);
    } catch (err) { showErr(friendlyAuthError(err)); btn.disabled = false; }
  });
}
function showErr(msg) { const el = $('#err'); if (!el) return; el.textContent = msg; el.hidden = !msg; }

function renderPending(s) {
  const rejected = s.profile.status === 'rejected';
  shell(`
    <div class="pass-head"><p class="k">Press pass · ${rejected ? 'Declined' : 'Pending'}</p><h1>${rejected ? 'This application was declined.' : `Welcome to the newsroom, ${esc(s.profile.displayName.split(' ')[0])}.`}</h1><p>${rejected ? 'Talk to the editor if you think this is a mistake.' : 'Your press pass is waiting for the editor. Once it is approved you can file your first story from this page.'}</p></div>
    <div class="pass-body" style="justify-items:center;text-align:center">
      <div class="pending-seal">${SEAL}</div>
      <p class="mono caps" style="font-size:.68rem;color:var(--ink-3)">Signed in as ${esc(s.user.email)}</p>
      <div class="row" style="justify-content:center"><button class="btn btn-ghost" id="refresh" type="button">Check again</button><button class="btn btn-ghost" id="out" type="button">Sign out</button></div>
    </div>`, rejected ? 'Applications are reviewed by the editor' : 'Pending approval by the editor');
  $('#refresh').addEventListener('click', () => location.reload());
  $('#out').addEventListener('click', async () => { await signOut(); mode = 'in'; renderForm(); });
}

onSession((s) => {
  if (s.user && s.profile) {
    if (isEditor(s)) return location.replace('/newsroom/editor');
    if (isApproved(s)) return location.replace('/newsroom/desk');
    return renderPending(s);
  }
  if (s.user && !s.profile) { // auth user without a profile doc (should not happen): let them sign out
    shell(`<div class="pass-head"><p class="k">Press pass</p><h1>No press pass on file.</h1><p>Your sign-in exists but the newsroom has no record for it. Sign out and apply again.</p></div><div class="pass-body"><button class="btn" id="out" type="button">Sign out</button></div>`);
    $('#out').addEventListener('click', async () => { await signOut(); renderForm(); });
    return;
  }
  renderForm();
});

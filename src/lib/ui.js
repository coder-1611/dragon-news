export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => out + s + (i < vals.length ? (vals[i] && vals[i].__raw ? vals[i].__raw : esc(vals[i])) : ''), '');
}
export const raw = (s) => ({ __raw: String(s ?? '') });
export function toast(msg, kind = 'info', ms = 3200) {
  let host = $('#toasts');
  if (!host) { host = document.createElement('div'); host.id = 'toasts'; host.className = 'toasts'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 320); }, ms);
}
export const params = () => new URLSearchParams(location.search);
export function setTitle(t) { document.title = t ? `${t} · Dragon News` : 'Dragon News · Round Rock High School'; }

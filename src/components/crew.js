import { esc } from '../lib/ui.js';
export const initials = (name) => String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export function avatar(m, cls = 'avatar') {
  if (m.photoUrl) return `<img class="${cls}" src="${esc(m.photoUrl)}" alt="" loading="lazy" style="object-fit:cover">`;
  return `<span class="${cls}" aria-hidden="true">${esc(initials(m.name))}</span>`;
}
export function renderCrew(host, crew, { join = true } = {}) {
  const members = crew?.members || [];
  host.innerHTML = members.map((m, i) => `
    <article class="crew-card${m.role === 'editor' ? ' is-editor' : ''}" data-reveal style="--d:${(i % 4) * 60}ms">
      ${avatar(m)}
      <div><h3 class="crew-name">${esc(m.name)}</h3><p class="crew-title">${esc(m.title)}</p></div>
      ${m.blurb ? `<p class="crew-blurb">${esc(m.blurb)}</p>` : ''}
    </article>`).join('') + (join ? `
    <div class="crew-join" data-reveal><p>Your name goes here.</p><a class="btn" href="/newsroom?join=1">Join the staff</a></div>` : '');
}

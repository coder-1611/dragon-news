import { esc } from '../lib/ui.js';
const min = (w) => Math.max(1, Math.round((w || 0) / 220));
export function stub(s, editionId, { thumb = false } = {}) {
  return `<li class="stub"><a href="/paper/${esc(editionId)}/${esc(s.slug)}">
    ${thumb && s.thumb ? `<img class="stub-thumb" src="${esc(s.thumb)}" alt="" decoding="async" width="640" height="400">` : ''}
    <h3 class="stub-h">${esc(s.title)}</h3>
    <p class="stub-x">${esc(s.excerpt)} <span class="more">Continue</span></p>
    <p class="stub-by">By ${esc(s.byline)} · ${min(s.words)} min</p>
  </a></li>`;
}
export function ledgerItem(s, editionId, { excerpt = false } = {}) {
  return `<li><a href="/paper/${esc(editionId)}/${esc(s.slug)}"><h3>${esc(s.title)}</h3><span class="ledger-sec">${esc(s.section)}</span>${excerpt ? `<p class="ledger-x">${esc(s.excerpt)}</p>` : ''}</a></li>`;
}
export const sealSvg = (cls = '') => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true"><use href="/seal.svg#seal"/></svg>`;
export const SEAL = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="arcp" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width=".8"/><text font-family="Martian Mono, ui-monospace, monospace" font-size="8.6" letter-spacing="2.4" fill="currentColor" font-weight="600"><textPath href="#arcp" startOffset="1%">ROUND ROCK HIGH SCHOOL · DRAGONS · EST. 1913 ·</textPath></text><text x="60" y="73" text-anchor="middle" font-family="Bodoni Moda, Didot, serif" font-size="40" font-weight="700" fill="currentColor">D</text><path d="M40 84 h40" stroke="currentColor" stroke-width=".8"/></svg>`;
export function emptyPress(title = 'The first edition is on the press.', body = 'Nothing has been published yet. Check back soon, or join the newsroom and help write it.') {
  return `<div class="empty">${SEAL.replace('<svg ', '<svg style="width:84px" ')}<h2>${esc(title)}</h2><p>${esc(body)}</p><a class="btn" href="/newsroom?join=1">Join the newsroom</a></div>`;
}

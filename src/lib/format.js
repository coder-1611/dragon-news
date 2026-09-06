const CT = 'America/Chicago';
export const FOUNDED = 1913;

export function parseDate(id) {
  const [y, m, d] = String(id).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 17)); // noon CT-ish, avoids DST edge
}
export function longDate(id) {
  return parseDate(id).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
export function shortDate(id) {
  return parseDate(id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
export function wireDate(id) {
  const d = parseDate(id);
  const w = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  const m = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${w} ${String(d.getUTCDate()).padStart(2, '0')} ${m} ${d.getUTCFullYear()}`;
}
export function schoolYear(id) {
  const d = parseDate(id); const y = d.getUTCFullYear(); const m = d.getUTCMonth() + 1;
  return m >= 7 ? `${y}–${String(y + 1).slice(2)}` : `${y - 1}–${String(y).slice(2)}`;
}
export function toRoman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, r] of map) while (n >= v) { out += r; n -= v; }
  return out;
}
export function volumeFor(id) { return toRoman(parseDate(id).getUTCFullYear() - FOUNDED + 1); }
export function todayId(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: CT, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  return p; // en-CA gives YYYY-MM-DD
}
export function clockCT(d = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone: CT, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
}
export function wordCount(md) { return (String(md || '').replace(/[#>*_`\-]/g, ' ').trim().match(/\S+/g) || []).length; }
export function readTime(md) { return Math.max(1, Math.round(wordCount(md) / 220)); }
export function excerpt(md, words = 28) {
  const text = String(md || '')
    .replace(/^#+\s.*$/gm, ' ')
    .replace(/^>\s?/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const ws = text.split(' ');
  return ws.length <= words ? text : ws.slice(0, words).join(' ') + '…';
}
export function firstWords(md, n = 9) { return excerpt(md, n); }
export const relTime = (ts) => {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null;
  if (!d) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

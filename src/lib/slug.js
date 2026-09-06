export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'story';
}
export function uniqueSlug(base, taken) {
  let s = base, n = 2;
  while (taken.has(s)) s = `${base}-${n++}`;
  taken.add(s);
  return s;
}

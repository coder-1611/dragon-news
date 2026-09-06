// Deterministic lorem ipsum generator for the placeholder edition (user's call: all editorial content is lorem).
import { writeFileSync } from 'node:fs';
const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus vestibulum ante primis faucibus orci luctus posuere cubilia curae nunc feugiat mi a tellus consequat imperdiet vitae ornare hendrerit`.split(/\s+/);
let s = 20260905;
const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = () => WORDS[Math.floor(rnd() * WORDS.length)];
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const sentence = (min = 8, max = 18) => { const n = min + Math.floor(rnd() * (max - min)); const ws = Array.from({ length: n }, pick); return cap(ws.join(' ')) + '.'; };
const para = (n = 4) => Array.from({ length: n + Math.floor(rnd() * 3) }, () => sentence()).join(' ');
const title = (min, max) => { const n = min + Math.floor(rnd() * (max - min + 1)); return cap(Array.from({ length: n }, pick).join(' ')); };
const body = (paras) => {
  const out = [];
  for (let i = 0; i < paras; i++) {
    out.push(para());
    if (i === 1) out.push('> ' + sentence(10, 16));
    if (i === 3) out.push('## ' + title(3, 5));
  }
  return out.join('\n\n');
};
const specs = [
  ['lead', 'Sports', 7, 9, 7],
  ['s2', 'News', 5, 8, 5],
  ['s3', 'Academics', 5, 8, 5],
  ['s4', 'Clubs', 5, 7, 4],
  ['s5', 'Arts', 5, 8, 5],
  ['s6', 'Opinion', 6, 9, 6],
  ['s7', 'Dragon Life', 5, 7, 4],
  ['s8', 'Sports', 5, 8, 5],
];
const stories = specs.map(([id, section, tmin, tmax, paras], i) => ({
  id,
  section,
  title: title(tmin, tmax),
  dek: sentence(12, 20),
  byline: 'Staff Writer',
  cover: `https://picsum.photos/seed/dragon-${i + 11}/1600/1000`,
  thumb: `https://picsum.photos/seed/dragon-${i + 11}/640/400`,
  bodyMd: body(paras),
}));
const crewTitles = ['Editor-in-Chief', 'Managing Editor', 'Sports Editor', 'Arts Editor', 'Staff Writer', 'Staff Writer', 'Staff Writer', 'Photographer', 'Adviser'];
const crew = crewTitles.map((t, i) => ({ name: title(2, 2), title: t, role: i === 0 ? 'editor' : 'staff', blurb: sentence(9, 14), initials: null }));
crew.forEach((c) => { c.initials = c.name.split(' ').map((w) => w[0]).join('').toUpperCase(); });
const edition = { id: '2026-09-05', date: '2026-09-05', status: 'published', lead: stories[0].id, sections: [], stories, placeholder: true };
const order = ['News', 'Sports', 'Academics', 'Clubs', 'Arts', 'Opinion', 'Dragon Life'];
edition.sections = order.map((name) => ({ name, storyIds: stories.filter((st) => st.section === name && st.id !== 'lead').map((st) => st.id) })).filter((sec) => sec.storyIds.length);
writeFileSync(new URL('../src/data/sample-edition.json', import.meta.url), JSON.stringify(edition, null, 2));
writeFileSync(new URL('../src/data/crew.json', import.meta.url), JSON.stringify({ members: crew, placeholder: true }, null, 2));
console.log('wrote sample-edition.json (%d stories) and crew.json (%d)', stories.length, crew.length);

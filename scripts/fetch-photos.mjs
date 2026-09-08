// Downloads topical, freely-licensed photos from Wikimedia Commons into public/img/covers/ and
// derives a 1600px cover + 640px thumbnail locally with ffmpeg. Self-hosting removes the
// third-party image host, which can be blocked by extensions or school network filters.
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const UA = 'DragonNewsSchoolPaper/1.0 (student newspaper demo; github.com/coder-1611/dragon-news)';
const DIR = new URL('../public/img/covers/', import.meta.url);
const CREDITS = new URL('../src/data/photo-credits.json', import.meta.url);
mkdirSync(DIR, { recursive: true });
const PICKS = {
  lead: { titles: ['File:Ratliff stadium.JPG'] },
  s2: { titles: ["File:SHSID Teacher's Parking Lot.jpg"] },
  s3: { titles: ['File:Test (student assessment).jpeg'] },
  s4: { titles: ['File:FIRST Robotics Competition Palmetto Regional (5558667757).jpg'] },
  s5: { titles: ['File:A school play.jpg', 'File:Drama for culture.jpg'], search: 'school play stage students performance' },
  s6: { titles: ['File:A-Wing Hallway - Caddo Magnet High School 02.jpg'] },
  s7: { titles: ['File:Dighton-Rehoboth Regional High School marching band.jpg'] },
  s8: { titles: ['File:Volleyball game.jpg'] },
};
const clean = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const nap = (ms) => new Promise((r) => setTimeout(r, ms));
async function req(url) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429) { await nap(((+r.headers.get('retry-after') || 2) + i * 2) * 1000); continue; }
    await nap(1300);
    return r;
  }
  return null;
}
const apiJson = async (params) => {
  const r = await req('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params }));
  if (!r?.ok || !/json/.test(r.headers.get('content-type') || '')) return null;
  return r.json();
};
const byTitle = async (title) => (Object.values((await apiJson({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600' }))?.query?.pages || {})[0])?.imageinfo?.[0] || null;
const bySearch = async (q) => {
  const d = await apiJson({ action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${q}`, gsrnamespace: '6', gsrlimit: '15', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600' });
  for (const p of Object.values(d?.query?.pages || {})) {
    const ii = p.imageinfo?.[0];
    if (!ii?.thumburl || ii.width < 800) continue;
    const r = ii.height / ii.width;
    if (r > 0.95 || r < 0.45) continue;
    return { ...ii, _title: p.title };
  }
  return null;
};
// ffmpeg: exact width, quality stepped down until the byte budget is met.
function encode(srcPath, outPath, width, maxBytes) {
  for (const q of [4, 6, 8, 11, 14, 18]) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', srcPath, '-vf', `scale='min(${width},iw)':-2:flags=lanczos`, '-q:v', String(q), outPath]);
    if (statSync(outPath).size <= maxBytes) break;
  }
  return statSync(outPath).size;
}
const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, 'utf8')) : {};
const only = process.argv.slice(2);
for (const [id, spec] of Object.entries(PICKS)) {
  if (only.length && !only.includes(id)) continue;
  let ii = null, title = null;
  for (const t of spec.titles) { ii = await byTitle(t); if (ii?.thumburl) { title = t; break; } }
  if (!ii?.thumburl && spec.search) { ii = await bySearch(spec.search); title = ii?._title; }
  if (!ii?.thumburl) { console.log(`${id.padEnd(5)} !! FAILED`); continue; }
  const r = await req(ii.thumburl);
  if (!r?.ok) { console.log(`${id.padEnd(5)} !! download ${r?.status}`); continue; }
  const tmp = `/tmp/dn-${id}.src`;
  writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  const big = encode(tmp, new URL(`${id}.jpg`, DIR).pathname, 1600, 150 * 1024);
  const small = encode(tmp, new URL(`${id}-t.jpg`, DIR).pathname, 640, 36 * 1024);
  unlinkSync(tmp);
  const artist = clean(ii.extmetadata?.Artist?.value).slice(0, 46) || 'Wikimedia Commons';
  const lic = clean(ii.extmetadata?.LicenseShortName?.value) || 'Wikimedia Commons';
  credits[id] = { credit: `${artist} · ${lic} · Wikimedia Commons`, file: String(title).replace('File:', '') };
  console.log(`${id.padEnd(5)} ${String(Math.round(big / 1024)).padStart(3)}KB /${String(Math.round(small / 1024)).padStart(3)}KB  ${lic.padEnd(14)} ${String(title).replace('File:', '').slice(0, 46)}`);
}
writeFileSync(CREDITS, JSON.stringify(credits, null, 2));
console.log('credits on file:', Object.keys(credits).length);

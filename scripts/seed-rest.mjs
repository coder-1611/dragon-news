// Seeds public content (crew, stories, edition + frozen articles) through the Firestore REST API
// using the Firebase CLI's own OAuth credentials (project owner; bypasses security rules).
// Use when Firebase Auth is not yet switched on. Safe to re-run: it overwrites the same document ids.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { buildSnapshot } from '../src/lib/publish.js';
import { wordCount } from '../src/lib/format.js';

const P = 'dragon-news-rrhs';
const cs = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
const tokRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com', client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi', refresh_token: cs.tokens.refresh_token, grant_type: 'refresh_token' }) });
const { access_token } = await tokRes.json();
if (!access_token) throw new Error('no access token');

const enc = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
};
const docName = (path) => `projects/${P}/databases/(default)/documents/${path}`;
async function commit(writes) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents:commit`, { method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }) });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
const setDoc = (path, data) => ({ update: { name: docName(path), fields: enc(data).mapValue.fields } });

const sample = JSON.parse(readFileSync(new URL('../src/data/sample-edition.json', import.meta.url), 'utf8'));
const crew = JSON.parse(readFileSync(new URL('../src/data/crew.json', import.meta.url), 'utf8'));
const now = new Date();
const storyIds = Object.fromEntries(sample.stories.map((s) => [s.id, `seed-${s.id}`]));
const byId = {};
const writes = [];
writes.push(setDoc('site/crew', { members: crew.members.map((m) => ({ name: m.name, title: m.title, role: m.role, blurb: m.blurb })), placeholder: !!crew.placeholder, updatedAt: now }));
// drop stale frozen articles from a previous seed (slugs may have changed)
const listRes = await fetch(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents/editions/${sample.id}/articles?pageSize=300`, { headers: { Authorization: `Bearer ${access_token}` } });
const old = (await listRes.json()).documents || [];
for (const d of old) writes.push({ delete: d.name });
for (const st of sample.stories) {
  const id = storyIds[st.id];
  const data = { authorUid: null, byline: st.byline, title: st.title, dek: st.dek, section: st.section, bodyMd: st.bodyMd, cover: st.cover, thumb: st.thumb, coverCredit: 'Dragon News file photo', wordCount: wordCount(st.bodyMd), status: 'published', editorNote: '', slug: null, publishedIn: sample.id, placeholder: !!sample.placeholder, sampleId: st.id, createdAt: now, updatedAt: now, submittedAt: now, reviewedAt: now };
  byId[id] = { id, ...data };
}
const sections = sample.sections.map((s) => ({ name: s.name, storyIds: s.storyIds.map((i) => storyIds[i]) }));
const { snapshot, articles, slugs } = buildSnapshot({ id: sample.id, date: sample.date, leadStoryId: storyIds[sample.lead], sections }, byId, 1);
for (const [id, st] of Object.entries(byId)) writes.push(setDoc(`stories/${id}`, { ...st, id: undefined, slug: slugs[id] }));
writes.push(setDoc(`editions/${sample.id}`, { date: sample.date, status: 'published', leadStoryId: storyIds[sample.lead], sections, snapshot, issueNumber: 1, createdBy: null, createdAt: now, updatedAt: now, publishedAt: now }));
for (const a of articles) writes.push(setDoc(`editions/${sample.id}/articles/${a.slug}`, { ...a, publishedAt: now }));
// strip undefined
const clean = JSON.parse(JSON.stringify(writes));
await commit(clean);
console.log(`seeded via REST: crew(${crew.members.length}), stories(${Object.keys(byId).length}), edition ${sample.id} with ${articles.length} articles; lead = ${snapshot.lead.title}`);

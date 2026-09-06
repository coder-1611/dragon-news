// Seeds the placeholder crew, a placeholder journalist account, 8 lorem stories and publishes edition 2026-09-05.
import { doc, setDoc, addDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { auth, db, env, signInOrCreate } from './_fb.mjs';
import { publishEdition } from '../src/lib/publish.js';
import { wordCount } from '../src/lib/format.js';

const E = env();
const sample = JSON.parse(readFileSync(new URL('../src/data/sample-edition.json', import.meta.url), 'utf8'));
const crew = JSON.parse(readFileSync(new URL('../src/data/crew.json', import.meta.url), 'utf8'));

// 1) placeholder journalist (pending until the editor approves)
if (E.JOURNALIST_EMAIL && E.JOURNALIST_PASSWORD) {
  const j = await signInOrCreate(E.JOURNALIST_EMAIL, E.JOURNALIST_PASSWORD, E.JOURNALIST_NAME || 'Sample Journalist');
  await setDoc(doc(db, 'users', j.uid), { displayName: E.JOURNALIST_NAME || 'Sample Journalist', email: E.JOURNALIST_EMAIL, role: 'journalist', status: 'pending', title: 'Staff Writer', bio: '', photoUrl: null, createdAt: serverTimestamp() }, { merge: false }).catch(() => {});
  console.log('journalist ready:', E.JOURNALIST_EMAIL, j.uid);
  await auth.signOut();
}

// 2) editor
const ed = await signInOrCreate(E.EDITOR_EMAIL, E.EDITOR_PASSWORD);
await setDoc(doc(db, 'site', 'crew'), { members: crew.members.map((m) => ({ name: m.name, title: m.title, role: m.role, blurb: m.blurb })), placeholder: true, updatedAt: serverTimestamp() });
console.log('crew written');

// 3) stories (skip if the edition already exists)
const existing = await getDocs(query(collection(db, 'stories'), where('placeholder', '==', true)));
const idMap = {};
if (existing.empty) {
  for (const st of sample.stories) {
    const ref = await addDoc(collection(db, 'stories'), {
      authorUid: ed.uid, byline: st.byline, title: st.title, dek: st.dek, section: st.section, bodyMd: st.bodyMd,
      cover: st.cover, thumb: st.thumb, coverCredit: 'Placeholder photograph', wordCount: wordCount(st.bodyMd),
      status: 'accepted', editorNote: '', slug: null, publishedIn: null, placeholder: true, sampleId: st.id,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), submittedAt: serverTimestamp(), reviewedAt: serverTimestamp(),
    });
    idMap[st.id] = ref.id;
  }
} else existing.docs.forEach((d) => { idMap[d.data().sampleId] = d.id; });
console.log('stories:', Object.keys(idMap).length);

// 4) edition + publish
await setDoc(doc(db, 'editions', sample.id), {
  date: sample.date, status: 'draft', leadStoryId: idMap[sample.lead],
  sections: sample.sections.map((s) => ({ name: s.name, storyIds: s.storyIds.map((i) => idMap[i]) })),
  createdBy: ed.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
}, { merge: true });
const snap = await publishEdition(db, sample.id);
console.log('published', sample.id, 'lead:', snap.lead.title, '| articles:', snap.articleCount);
process.exit(0);

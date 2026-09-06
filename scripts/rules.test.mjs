// Firestore security-rules tests. Run: npm run rules:test  (starts the emulator via firebase emulators:exec)
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({ projectId: 'dragon-news-rrhs', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8089 } });
await env.clearFirestore();
const ED = 'editor1', J = 'journ1', P = 'pend1', X = 'other1';
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'users', ED), { displayName: 'Ed', email: 'e@x', role: 'editor', status: 'approved' });
  await setDoc(doc(db, 'users', J), { displayName: 'Jo', email: 'j@x', role: 'journalist', status: 'approved' });
  await setDoc(doc(db, 'users', P), { displayName: 'Pe', email: 'p@x', role: 'journalist', status: 'pending' });
  await setDoc(doc(db, 'site', 'meta'), { editorUid: ED });
  await setDoc(doc(db, 'site', 'crew'), { members: [] });
  await setDoc(doc(db, 'stories', 'sJdraft'), { authorUid: J, title: 'd', bodyMd: 'x', section: 'News', status: 'draft' });
  await setDoc(doc(db, 'stories', 'sJsub'), { authorUid: J, title: 's', bodyMd: 'x', section: 'News', status: 'submitted' });
  await setDoc(doc(db, 'stories', 'sX'), { authorUid: X, title: 'o', bodyMd: 'x', section: 'News', status: 'draft' });
  await setDoc(doc(db, 'editions', '2026-09-05'), { date: '2026-09-05', status: 'published', snapshot: { lead: {} } });
  await setDoc(doc(db, 'editions', '2026-09-05', 'articles', 'a'), { title: 'a' });
  await setDoc(doc(db, 'editions', '2026-09-06'), { date: '2026-09-06', status: 'draft' });
  await setDoc(doc(db, 'editions', '2026-09-06', 'articles', 'b'), { title: 'b' });
});
const anon = env.unauthenticatedContext().firestore();
const asJ = env.authenticatedContext(J).firestore();
const asP = env.authenticatedContext(P).firestore();
const asE = env.authenticatedContext(ED).firestore();
const asNew = env.authenticatedContext('new1').firestore();
let pass = 0, fail = 0;
const t = async (name, p, expectOk) => { try { await (expectOk ? assertSucceeds(p) : assertFails(p)); pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  FAIL', name, '-', (e.message || e).toString().split('\n')[0].slice(0, 120)); } };

console.log('public');
await t('anon reads published edition', getDoc(doc(anon, 'editions', '2026-09-05')), true);
await t('anon reads published article', getDoc(doc(anon, 'editions', '2026-09-05', 'articles', 'a')), true);
await t('anon lists published editions (filtered)', getDocs(query(collection(anon, 'editions'), where('status', '==', 'published'))), true);
await t('anon reads crew', getDoc(doc(anon, 'site', 'crew')), true);
await t('anon reads DRAFT edition', getDoc(doc(anon, 'editions', '2026-09-06')), false);
await t('anon reads draft edition article', getDoc(doc(anon, 'editions', '2026-09-06', 'articles', 'b')), false);
await t('anon lists editions unfiltered', getDocs(collection(anon, 'editions')), false);
await t('anon reads a story', getDoc(doc(anon, 'stories', 'sJdraft')), false);
await t('anon reads a user', getDoc(doc(anon, 'users', J)), false);
await t('anon writes crew', setDoc(doc(anon, 'site', 'crew'), { members: [] }), false);

console.log('signup');
await t('new user creates own pending profile', setDoc(doc(asNew, 'users', 'new1'), { displayName: 'N', email: 'n@x', role: 'journalist', status: 'pending', title: 'Staff Writer', bio: '', photoUrl: null, createdAt: new Date() }), true);
await t('new user cannot create approved profile', setDoc(doc(env.authenticatedContext('new2').firestore(), 'users', 'new2'), { displayName: 'N', email: 'n@x', role: 'journalist', status: 'approved' }), false);
await t('new user cannot create editor profile', setDoc(doc(env.authenticatedContext('new3').firestore(), 'users', 'new3'), { displayName: 'N', email: 'n@x', role: 'editor', status: 'pending' }), false);
await t('user cannot create a profile for someone else', setDoc(doc(asNew, 'users', 'someone'), { displayName: 'N', email: 'n@x', role: 'journalist', status: 'pending' }), false);

console.log('journalist');
await t('journalist reads own profile', getDoc(doc(asJ, 'users', J)), true);
await t('journalist reads another profile', getDoc(doc(asJ, 'users', X)), false);
await t('journalist lists users', getDocs(collection(asJ, 'users')), false);
await t('journalist self-promotes to editor', updateDoc(doc(asJ, 'users', J), { role: 'editor' }), false);
await t('journalist changes own status', updateDoc(doc(asJ, 'users', J), { status: 'pending' }), false);
await t('journalist edits own bio', updateDoc(doc(asJ, 'users', J), { bio: 'hi' }), true);
await t('journalist creates own draft', setDoc(doc(asJ, 'stories', 'sJ2'), { authorUid: J, title: 'new', bodyMd: 'body', section: 'Sports', status: 'draft' }), true);
await t('journalist creates story as submitted', setDoc(doc(asJ, 'stories', 'sJ3'), { authorUid: J, title: 'new', bodyMd: 'body', section: 'Sports', status: 'submitted' }), false);
await t('journalist creates story for another author', setDoc(doc(asJ, 'stories', 'sJ4'), { authorUid: X, title: 'new', bodyMd: 'body', section: 'Sports', status: 'draft' }), false);
await t('journalist creates story with bad section', setDoc(doc(asJ, 'stories', 'sJ5'), { authorUid: J, title: 'new', bodyMd: 'body', section: 'Gossip', status: 'draft' }), false);
await t('journalist submits own draft', updateDoc(doc(asJ, 'stories', 'sJdraft'), { status: 'submitted', updatedAt: new Date(), submittedAt: new Date() }), true);
await t('journalist edits a submitted story', updateDoc(doc(asJ, 'stories', 'sJsub'), { title: 'changed', updatedAt: new Date() }), false);
await t('journalist self-accepts a story', updateDoc(doc(asJ, 'stories', 'sJsub'), { status: 'accepted' }), false);
await t('journalist reads own story', getDoc(doc(asJ, 'stories', 'sJsub')), true);
await t('journalist reads another story', getDoc(doc(asJ, 'stories', 'sX')), false);
await t('journalist lists own stories', getDocs(query(collection(asJ, 'stories'), where('authorUid', '==', J))), true);
await t('journalist lists all stories', getDocs(collection(asJ, 'stories')), false);
await t('journalist writes an edition', setDoc(doc(asJ, 'editions', '2026-09-07'), { date: '2026-09-07', status: 'published' }), false);
await t('journalist writes crew', setDoc(doc(asJ, 'site', 'crew'), { members: [] }), false);
await t('journalist reads draft edition', getDoc(doc(asJ, 'editions', '2026-09-06')), false);

console.log('pending user');
await t('pending user creates a story', setDoc(doc(asP, 'stories', 'sP'), { authorUid: P, title: 'x', bodyMd: 'b', section: 'News', status: 'draft' }), false);

console.log('editor');
await t('editor lists users', getDocs(collection(asE, 'users')), true);
await t('editor approves a user', updateDoc(doc(asE, 'users', P), { status: 'approved', approvedAt: new Date(), approvedBy: ED }), true);
await t('editor cannot grant editor role', updateDoc(doc(asE, 'users', P), { role: 'editor' }), false);
await t('editor lists all stories', getDocs(collection(asE, 'stories')), true);
await t('editor accepts a story', updateDoc(doc(asE, 'stories', 'sJsub'), { status: 'accepted', editorNote: '' }), true);
await t('editor cannot reassign author', updateDoc(doc(asE, 'stories', 'sJsub'), { authorUid: ED }), false);
await t('editor writes an edition', setDoc(doc(asE, 'editions', '2026-09-07'), { date: '2026-09-07', status: 'draft' }), true);
await t('editor writes an article', setDoc(doc(asE, 'editions', '2026-09-07', 'articles', 'z'), { title: 'z' }), true);
await t('editor reads draft edition', getDoc(doc(asE, 'editions', '2026-09-06')), true);
await t('editor writes crew', setDoc(doc(asE, 'site', 'crew'), { members: [{ name: 'A' }] }), true);

console.log('bootstrap');
await t('second bootstrap attempt (meta exists)', (async () => { const b = writeBatch(asJ); b.update(doc(asJ, 'users', J), { role: 'editor', status: 'approved' }); b.set(doc(asJ, 'site', 'meta'), { editorUid: J }); await b.commit(); })(), false);
await env.withSecurityRulesDisabled(async (c) => { const { deleteDoc } = await import('firebase/firestore'); await deleteDoc(doc(c.firestore(), 'site', 'meta')); });
await t('first bootstrap (no meta yet) self-promotes with meta in same batch', (async () => { const b = writeBatch(asNew); b.update(doc(asNew, 'users', 'new1'), { role: 'editor', status: 'approved', title: 'Editor-in-Chief', updatedAt: new Date() }); b.set(doc(asNew, 'site', 'meta'), { editorUid: 'new1', bootstrappedAt: new Date() }); await b.commit(); })(), true);
await t('bootstrap without meta write is refused', updateDoc(doc(asJ, 'users', J), { role: 'editor', status: 'approved' }), false);

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);

import { db } from './firebase.js';
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { buildSnapshot } from './publish.js';
import { readTime } from './format.js';

// Hidden dev switch: ?demo=1 renders the placeholder edition without Firestore.
const DEMO = typeof location !== 'undefined' && (new URLSearchParams(location.search).has('demo') || (() => { try { return localStorage.getItem('dn:demo') === '1'; } catch { return false; } })());
if (DEMO) try { localStorage.setItem('dn:demo', '1'); } catch {}

async function demoEdition() {
  const sample = (await import('../data/sample-edition.json')).default;
  const byId = Object.fromEntries(sample.stories.map((s) => [s.id, s]));
  const { snapshot, articles } = buildSnapshot({ id: sample.id, date: sample.date, leadStoryId: sample.lead, sections: sample.sections }, byId, 1);
  return { id: sample.id, date: sample.date, status: 'published', snapshot, articles, placeholder: true, publishedAt: new Date(sample.date + 'T12:20:00-05:00') };
}
const norm = (d) => ({ id: d.id, ...d.data() });

// ---------- public ----------
export async function getCurrentEdition() {
  if (DEMO) return demoEdition();
  const q = query(collection(db, 'editions'), where('status', '==', 'published'), orderBy('date', 'desc'), limit(1));
  const s = await getDocs(q);
  return s.empty ? null : norm(s.docs[0]);
}
export async function getEdition(id) {
  if (DEMO) { const e = await demoEdition(); return e.id === id ? e : null; }
  const s = await getDoc(doc(db, 'editions', id));
  return s.exists() && s.data().status === 'published' ? norm(s) : null;
}
export async function getArticle(editionId, slug) {
  if (DEMO) { const e = await demoEdition(); const a = e.articles.find((x) => x.slug === slug); return a ? { ...a, readTime: readTime(a.bodyMd), publishedAt: e.publishedAt } : null; }
  const s = await getDoc(doc(db, 'editions', editionId, 'articles', slug));
  if (!s.exists()) return null;
  const a = norm(s);
  return { ...a, readTime: readTime(a.bodyMd) };
}
export async function listEditions() {
  if (DEMO) return [await demoEdition()];
  const q = query(collection(db, 'editions'), where('status', '==', 'published'), orderBy('date', 'desc'), limit(200));
  return (await getDocs(q)).docs.map(norm);
}
export async function getCrew() {
  if (DEMO) return (await import('../data/crew.json')).default;
  const s = await getDoc(doc(db, 'site', 'crew'));
  return s.exists() ? s.data() : { members: [] };
}

// ---------- newsroom: profiles ----------
export const getProfile = async (uid) => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? norm(s) : null; };
export const createProfile = (uid, data) => setDoc(doc(db, 'users', uid), { ...data, role: 'journalist', status: 'pending', title: 'Staff Writer', bio: '', photoUrl: null, createdAt: serverTimestamp() });
export const listUsers = async () => (await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'asc')))).docs.map(norm);
export const setUserStatus = (uid, status, byUid, title) => updateDoc(doc(db, 'users', uid), { status, approvedAt: serverTimestamp(), approvedBy: byUid, updatedAt: serverTimestamp(), ...(title ? { title } : {}) });
export const setUserTitle = (uid, title) => updateDoc(doc(db, 'users', uid), { title, updatedAt: serverTimestamp() });

// ---------- newsroom: stories ----------
export const myStories = async (uid) => (await getDocs(query(collection(db, 'stories'), where('authorUid', '==', uid), orderBy('updatedAt', 'desc')))).docs.map(norm);
export const getStory = async (id) => { const s = await getDoc(doc(db, 'stories', id)); return s.exists() ? norm(s) : null; };
export const createStory = async (data) => (await addDoc(collection(db, 'stories'), { ...data, status: 'draft', editorNote: '', slug: null, publishedIn: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })).id;
export const updateStory = (id, data) => updateDoc(doc(db, 'stories', id), { ...data, updatedAt: serverTimestamp() });
export const deleteStory = (id) => deleteDoc(doc(db, 'stories', id));
export const storiesByStatus = async (statuses) => (await getDocs(query(collection(db, 'stories'), where('status', 'in', statuses), orderBy('updatedAt', 'desc')))).docs.map(norm);
export const reviewStory = (id, status, editorNote = '') => updateDoc(doc(db, 'stories', id), { status, editorNote, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });

// ---------- newsroom: editions ----------
export const listAllEditions = async () => (await getDocs(query(collection(db, 'editions'), orderBy('date', 'desc')))).docs.map(norm);
export const getEditionRaw = async (id) => { const s = await getDoc(doc(db, 'editions', id)); return s.exists() ? norm(s) : null; };
export const createEdition = (id, byUid) => setDoc(doc(db, 'editions', id), { date: id, status: 'draft', leadStoryId: null, sections: [], createdBy: byUid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const saveEdition = (id, data) => updateDoc(doc(db, 'editions', id), { ...data, updatedAt: serverTimestamp() });
export const deleteEdition = (id) => deleteDoc(doc(db, 'editions', id));
export const saveCrew = (members) => setDoc(doc(db, 'site', 'crew'), { members, updatedAt: serverTimestamp() });
export { db };

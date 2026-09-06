import { auth } from './firebase.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getProfile, createProfile } from './db.js';

let current = null;
const listeners = new Set();

onAuthStateChanged(auth, async (user) => {
  if (!user) { current = { user: null, profile: null }; }
  else {
    let profile = null;
    try { profile = await getProfile(user.uid); } catch (e) { console.warn('profile read failed', e); }
    current = { user, profile };
  }
  listeners.forEach((fn) => fn(current));
});

export function onSession(fn) { listeners.add(fn); if (current) fn(current); return () => listeners.delete(fn); }
export const session = () => new Promise((res) => { if (current) return res(current); const off = onSession((s) => { off(); res(s); }); });

export async function signUp({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await createProfile(cred.user.uid, { displayName: name, email });
  current = { user: cred.user, profile: await getProfile(cred.user.uid) };
  listeners.forEach((fn) => fn(current));
  return current;
}
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOut = () => fbSignOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const isEditor = (s) => !!s?.profile && s.profile.role === 'editor';
export const isApproved = (s) => !!s?.profile && (s.profile.status === 'approved' || s.profile.role === 'editor');

/** Redirects unless the session meets `need` ('approved' | 'editor'). Resolves with the session otherwise. */
export async function guard(need = 'approved') {
  const s = await session();
  if (!s.user || !s.profile) { location.replace('/newsroom'); return new Promise(() => {}); }
  if (need === 'editor' && !isEditor(s)) { location.replace(isApproved(s) ? '/newsroom/desk' : '/newsroom'); return new Promise(() => {}); }
  if (need === 'approved' && !isApproved(s)) { location.replace('/newsroom'); return new Promise(() => {}); }
  return s;
}
export function friendlyAuthError(e) {
  const c = e?.code || '';
  if (c.includes('email-already-in-use')) return 'That email already has a press pass. Sign in instead.';
  if (c.includes('invalid-email')) return 'That email address does not look right.';
  if (c.includes('weak-password')) return 'Use a password of at least 8 characters.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Email or password did not match.';
  if (c.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
  if (c.includes('network')) return 'No connection. Check your network and try again.';
  return e?.message || 'Something went wrong.';
}

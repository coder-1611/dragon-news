// Node-side Firebase client (same config as the site). Used by bootstrap + seed.
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { readFileSync, existsSync } from 'node:fs';

export const config = {
  apiKey: 'AIzaSyBEMhWn8l6CzzWBCITXQj1A9aIar_WIfus',
  authDomain: 'dragon-news-rrhs.firebaseapp.com',
  projectId: 'dragon-news-rrhs',
  appId: '1:650378621059:web:efd8f01823fb7adcb3ebb6',
};
export function env() {
  const out = { ...process.env };
  const p = new URL('../.env.local', import.meta.url);
  if (existsSync(p)) for (const line of readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !(m[1] in out)) out[m[1]] = m[2]; }
  return out;
}
export const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export async function signInOrCreate(email, password, displayName) {
  try { return (await signInWithEmailAndPassword(auth, email, password)).user; }
  catch (e) {
    if (!['auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(e.code)) throw e;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred.user;
  }
}

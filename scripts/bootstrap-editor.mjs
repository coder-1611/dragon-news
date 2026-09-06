// One-time: creates the editor account and promotes it through the self-closing rules bootstrap.
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db, env, signInOrCreate } from './_fb.mjs';

const E = env();
const email = E.EDITOR_EMAIL, password = E.EDITOR_PASSWORD, name = E.EDITOR_NAME || 'Editor-in-Chief';
if (!email || !password) { console.error('Set EDITOR_EMAIL and EDITOR_PASSWORD in .env.local'); process.exit(1); }

const user = await signInOrCreate(email, password, name);
const uref = doc(db, 'users', user.uid);
const mine = await getDoc(uref);
if (mine.exists() && mine.data().role === 'editor') { console.log('Already the editor:', email, user.uid); process.exit(0); }
if (!mine.exists()) {
  await setDoc(uref, { displayName: name, email, role: 'journalist', status: 'pending', title: 'Editor-in-Chief', bio: '', photoUrl: null, createdAt: serverTimestamp() });
}
const batch = writeBatch(db);
batch.update(uref, { role: 'editor', status: 'approved', title: 'Editor-in-Chief', updatedAt: serverTimestamp() });
batch.set(doc(db, 'site', 'meta'), { editorUid: user.uid, bootstrappedAt: serverTimestamp() });
try { await batch.commit(); } catch (e) { console.error('Bootstrap refused (already done by another account, or rules changed):', e.code || e.message); process.exit(2); }
console.log('Editor bootstrapped:', email, 'uid', user.uid);
process.exit(0);

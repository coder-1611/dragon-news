import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, env, signInOrCreate } from './_fb.mjs';
const E = env();
await signInOrCreate(E.EDITOR_EMAIL, E.EDITOR_PASSWORD);
const all = await getDocs(collection(db, 'stories'));
let n = 0;
for (const d of all.docs) if ((d.data().title || '').includes('E2E test story')) { await deleteDoc(d.ref); n++; }
const users = await getDocs(query(collection(db, 'users'), where('email', '==', E.JOURNALIST_EMAIL)));
for (const u of users.docs) await updateDoc(u.ref, { status: 'pending' });
const eds = await getDocs(collection(db, 'editions'));
console.log(`deleted ${n} test stories; journalist reset to pending; editions:`, eds.docs.map((d) => `${d.id}:${d.data().status}`).join(' '));
process.exit(0);

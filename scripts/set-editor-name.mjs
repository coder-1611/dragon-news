import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, env, signInOrCreate } from './_fb.mjs';
const E = env(); const name = process.argv.slice(2).join(' ');
if (!name) { console.error('usage: node scripts/set-editor-name.mjs "First Last"'); process.exit(1); }
const user = await signInOrCreate(E.EDITOR_EMAIL, E.EDITOR_PASSWORD);
await updateProfile(user, { displayName: name });
await updateDoc(doc(db, 'users', user.uid), { displayName: name, updatedAt: serverTimestamp() });
console.log('editor is now', name);
process.exit(0);

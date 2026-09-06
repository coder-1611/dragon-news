import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth, env } from './_fb.mjs';
const E = env(); const next = process.argv[2];
const { user } = await signInWithEmailAndPassword(auth, E.EDITOR_EMAIL, E.EDITOR_PASSWORD);
try { await updatePassword(user, next); console.log('PASSWORD_UPDATED'); }
catch (e) { console.log('REJECTED', e.code, e.message); process.exit(2); }
process.exit(0);

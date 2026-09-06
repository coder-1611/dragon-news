import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { emptyPress } from '../components/stubs.js';
import { getCurrentEdition } from '../lib/db.js';
mountMasthead({ size: 'compact' });
mountFooter();
document.getElementById('nf').outerHTML = emptyPress('Not in print.', 'There is no page at this address. Try the front page or the archive.');
getCurrentEdition().then(setMastheadEdition).catch(() => {});

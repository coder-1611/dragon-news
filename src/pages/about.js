import { mountMasthead, setMastheadEdition } from '../components/masthead.js';
import { mountFooter } from '../components/footer.js';
import { mountReveal } from '../components/reveal.js';
import { renderCrew } from '../components/crew.js';
import { SEAL } from '../components/stubs.js';
import { getCrew, getCurrentEdition } from '../lib/db.js';
import { $ } from '../lib/ui.js';

mountMasthead({ size: 'compact', current: '/about' });
mountFooter();
$('#seal').innerHTML = SEAL;
async function main() {
  const [crew, edition] = await Promise.all([getCrew().catch(() => ({ members: [] })), getCurrentEdition().catch(() => null)]);
  setMastheadEdition(edition);
  renderCrew($('#crew-grid'), crew);
  if (crew.placeholder || !crew.members?.length) $('[data-crew-note]').hidden = false;
  mountReveal();
}
main();

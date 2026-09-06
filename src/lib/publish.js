// Shared by the edition composer (browser) and scripts/seed.mjs (node).
import { doc, collection, getDoc, getDocs, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import { slugify, uniqueSlug } from './slug.js';
import { excerpt, volumeFor, wordCount } from './format.js';
import { SECTIONS } from './sections.js';

export function summarize(story, slug) {
  return {
    slug,
    storyId: story.id || null,
    title: story.title || 'Untitled',
    dek: story.dek || '',
    section: story.section || 'News',
    byline: story.byline || 'Staff Writer',
    thumb: story.thumb || story.cover || null,
    cover: story.cover || null,
    excerpt: excerpt(story.bodyMd, 28),
    words: wordCount(story.bodyMd),
  };
}

/** Pure: builds the public snapshot + article docs from a draft edition and its stories. */
export function buildSnapshot({ id, date, leadStoryId, sections }, storiesById, issueNumber = 1) {
  const taken = new Set();
  const slugs = {};
  const lead = storiesById[leadStoryId];
  if (!lead) throw new Error('Pick a lead story before publishing.');
  const order = [leadStoryId, ...sections.flatMap((s) => s.storyIds)].filter((v, i, a) => a.indexOf(v) === i);
  for (const sid of order) {
    const st = storiesById[sid];
    if (!st) throw new Error(`Story ${sid} is missing.`);
    slugs[sid] = uniqueSlug(st.slug || slugify(st.title), taken);
  }
  const snapSections = SECTIONS.map((name) => {
    const sec = sections.find((s) => s.name === name);
    const ids = (sec ? sec.storyIds : []).filter((sid) => sid !== leadStoryId && storiesById[sid]);
    return { name, stories: ids.map((sid) => summarize(storiesById[sid], slugs[sid])) };
  }).filter((s) => s.stories.length);
  const snapshot = {
    lead: summarize(lead, slugs[leadStoryId]),
    sections: snapSections,
    articleCount: order.length,
    volume: volumeFor(date),
    issueNumber,
  };
  const articles = order.map((sid) => {
    const st = storiesById[sid];
    return {
      slug: slugs[sid], storyId: sid, authorUid: st.authorUid || null, byline: st.byline || 'Staff Writer',
      title: st.title, dek: st.dek || '', section: st.section, bodyMd: st.bodyMd || '', cover: st.cover || null,
      coverCredit: st.coverCredit || '', editionId: id, editionDate: date, words: wordCount(st.bodyMd),
    };
  });
  return { snapshot, articles, slugs };
}

async function countPublishedBefore(db, date) {
  const snap = await getDocs(query(collection(db, 'editions'), where('status', '==', 'published')));
  return snap.docs.filter((d) => d.id !== date && (d.data().date || d.id) < date).length;
}

export async function publishEdition(db, editionId) {
  const eref = doc(db, 'editions', editionId);
  const esnap = await getDoc(eref);
  if (!esnap.exists()) throw new Error('Edition not found.');
  const ed = { id: editionId, ...esnap.data() };
  const ids = [ed.leadStoryId, ...(ed.sections || []).flatMap((s) => s.storyIds || [])].filter(Boolean);
  const storiesById = {};
  for (const sid of [...new Set(ids)]) {
    const s = await getDoc(doc(db, 'stories', sid));
    if (!s.exists()) throw new Error('A story in this edition no longer exists.');
    const data = { id: sid, ...s.data() };
    if (!['accepted', 'published'].includes(data.status)) throw new Error(`“${data.title}” is not accepted yet.`);
    if (data.status === 'published' && data.publishedIn && data.publishedIn !== editionId) throw new Error(`“${data.title}” is already printed in the ${data.publishedIn} edition.`);
    storiesById[sid] = data;
  }
  const issueNumber = ed.issueNumber || (await countPublishedBefore(db, ed.date || editionId)) + 1;
  const { snapshot, articles, slugs } = buildSnapshot({ id: editionId, date: ed.date || editionId, leadStoryId: ed.leadStoryId, sections: ed.sections || [] }, storiesById, issueNumber);

  const batch = writeBatch(db);
  // remove articles no longer in the edition
  const existing = await getDocs(collection(db, 'editions', editionId, 'articles'));
  const keep = new Set(articles.map((a) => a.slug));
  existing.docs.forEach((d) => { if (!keep.has(d.id)) batch.delete(d.ref); });
  // stories previously in this edition but removed -> back to accepted
  const prev = await getDocs(query(collection(db, 'stories'), where('publishedIn', '==', editionId)));
  prev.docs.forEach((d) => { if (!storiesById[d.id]) batch.update(d.ref, { status: 'accepted', publishedIn: null, updatedAt: serverTimestamp() }); });
  articles.forEach((a) => batch.set(doc(db, 'editions', editionId, 'articles', a.slug), { ...a, publishedAt: serverTimestamp() }));
  Object.entries(slugs).forEach(([sid, slug]) => batch.update(doc(db, 'stories', sid), { status: 'published', publishedIn: editionId, slug, updatedAt: serverTimestamp() }));
  batch.update(eref, { status: 'published', snapshot, issueNumber, publishedAt: ed.publishedAt || serverTimestamp(), updatedAt: serverTimestamp() });
  await batch.commit();
  return snapshot;
}

export async function unpublishEdition(db, editionId) {
  const batch = writeBatch(db);
  const arts = await getDocs(collection(db, 'editions', editionId, 'articles'));
  arts.docs.forEach((d) => batch.delete(d.ref));
  const prev = await getDocs(query(collection(db, 'stories'), where('publishedIn', '==', editionId)));
  prev.docs.forEach((d) => batch.update(d.ref, { status: 'accepted', publishedIn: null, updatedAt: serverTimestamp() }));
  batch.update(doc(db, 'editions', editionId), { status: 'draft', updatedAt: serverTimestamp() });
  await batch.commit();
}

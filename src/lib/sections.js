export const SECTIONS = ['News', 'Sports', 'Academics', 'Clubs', 'Arts', 'Opinion', 'Dragon Life'];
export const sectionIndex = (name) => Math.max(0, SECTIONS.indexOf(name));
export const sectionCode = (name) => String(sectionIndex(name) + 1).padStart(2, '0');

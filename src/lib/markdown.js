import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: false });

export function renderMd(md) {
  const html = marked.parse(String(md || ''));
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input'], FORBID_ATTR: ['style', 'onerror', 'onload'] });
}

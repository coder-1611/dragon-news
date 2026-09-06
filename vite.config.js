import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = {
  home: 'index.html',
  paper: 'paper.html',
  article: 'article.html',
  archive: 'archive.html',
  about: 'about.html',
  notfound: '404.html',
  nrIndex: 'newsroom/index.html',
  desk: 'newsroom/desk.html',
  write: 'newsroom/write.html',
  editor: 'newsroom/editor.html',
  edition: 'newsroom/edition.html',
};

// Mirrors vercel.json: cleanUrls + the two paper rewrites, for `vite dev` and `vite preview`.
function rewrites() {
  const rules = [
    [/^\/paper\/[^/]+\/[^/]+\/?$/, '/article.html'],
    [/^\/paper\/[^/]+\/?$/, '/paper.html'],
  ];
  const clean = Object.values(pages).map((f) => ['/' + f.replace(/\.html$/, '').replace(/\/index$/, ''), '/' + f]);
  const mw = (req, _res, next) => {
    const url = req.url.split('?')[0];
    for (const [re, to] of rules) if (re.test(url)) { req.url = to + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''); return next(); }
    for (const [from, to] of clean) if (url === from || url === from + '/') { req.url = to; return next(); }
    next();
  };
  return {
    name: 'dragon-rewrites',
    configureServer(s) { s.middlewares.use(mw); },
    configurePreviewServer(s) { s.middlewares.use(mw); },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [rewrites()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(Object.entries(pages).map(([k, f]) => [k, resolve(__dirname, f)])),
    },
  },
});

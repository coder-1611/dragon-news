// Covers live inside Firestore as compressed WebP data URLs (no Blaze plan needed).
// If Firebase Storage is enabled later, swap the return of prepareCover() for uploaded URLs.
const LIMIT_COVER = 150 * 1024; // bytes, base64-decoded
const LIMIT_THUMB = 26 * 1024;

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file is not an image we can read.')); };
    img.src = url;
  });
}
function encode(img, maxW, limit) {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  let q = 0.82, out = '';
  for (let i = 0; i < 8; i++) {
    out = c.toDataURL('image/webp', q);
    const bytes = Math.ceil((out.length - out.indexOf(',') - 1) * 3 / 4);
    if (bytes <= limit) break;
    q -= 0.1;
    if (q < 0.3) { // still too big: shrink
      c.width = Math.round(c.width * 0.8); c.height = Math.round(c.height * 0.8);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); q = 0.7;
    }
  }
  return out;
}
export async function prepareCover(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG, WebP, HEIC exports).');
  if (file.size > 25 * 1024 * 1024) throw new Error('That image is over 25 MB. Export a smaller copy.');
  const img = await loadImage(file);
  return { cover: encode(img, 1600, LIMIT_COVER), thumb: encode(img, 640, LIMIT_THUMB) };
}

// Live halftone: the lead cover as a maroon/newsprint dot screen on press-black,
// resolving to a fine screen around the pointer (or a slow drift on touch / idle).
const MAROON = [107, 15, 26], DEEP = [63, 10, 18], PAPER = [243, 237, 226];
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (t) => { // 0 dark -> 1 bright : deep maroon -> maroon -> newsprint
  const [a, b, u] = t < .5 ? [DEEP, MAROON, t / .5] : [MAROON, PAPER, (t - .5) / .5];
  return `rgb(${lerp(a[0], b[0], u) | 0},${lerp(a[1], b[1], u) | 0},${lerp(a[2], b[2], u) | 0})`;
};
const LEVELS = 14;
const COLORS = Array.from({ length: LEVELS + 1 }, (_, i) => mix(i / LEVELS));

export function mountHalftone(canvas, src, { onFail } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: false });
  const img = new Image();
  img.crossOrigin = 'anonymous';
  let W = 0, H = 0, dpr = 1, coarse = null, fine = null, raf = 0, running = false;
  const CELL_C = 13, CELL_F = 4.5, R = 230;
  const focus = { x: .68, y: .45, tx: .68, ty: .45 };
  let pointerActive = false, t0 = performance.now();

  function sample(cell) {
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const o = off.getContext('2d', { willReadFrequently: true });
    // cover-fit
    const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    o.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    let data;
    try { data = o.getImageData(0, 0, cols, rows).data; } catch { return null; }
    const lum = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) { const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]; lum[i] = Math.pow((.2126 * r + .7152 * g + .0722 * b) / 255, .9); }
    return { cols, rows, lum, cell };
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(rect.width)); H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    coarse = sample(CELL_C); fine = sample(CELL_F);
    if (!coarse) { onFail?.(); return false; }
    return true;
  }
  function dots(grid, clip) {
    const { cols, rows, lum, cell } = grid;
    const paths = Array.from({ length: LEVELS + 1 }, () => new Path2D());
    let x0 = 0, y0 = 0, x1 = cols, y1 = rows;
    if (clip) { x0 = Math.max(0, ((clip.x - clip.r) / cell) | 0); x1 = Math.min(cols, Math.ceil((clip.x + clip.r) / cell)); y0 = Math.max(0, ((clip.y - clip.r) / cell) | 0); y1 = Math.min(rows, Math.ceil((clip.y + clip.r) / cell)); }
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const l = lum[y * cols + x];
      const r = cell * .56 * Math.sqrt(l);
      if (r < .25) continue;
      const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
      const p = paths[Math.round(l * LEVELS)];
      p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2);
    }
    paths.forEach((p, i) => { ctx.fillStyle = COLORS[i]; ctx.fill(p); });
  }
  function draw() {
    ctx.fillStyle = '#17110F'; ctx.fillRect(0, 0, W, H);
    dots(coarse);
    const fx = focus.x * W, fy = focus.y * H;
    ctx.save();
    ctx.beginPath(); ctx.arc(fx, fy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#17110F'; ctx.fillRect(fx - R, fy - R, R * 2, R * 2);
    dots(fine, { x: fx, y: fy, r: R });
    ctx.restore();
    // hairline ring: the loupe
    ctx.beginPath(); ctx.arc(fx, fy, R, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(15,163,177,.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function frame(now) {
    if (!running) return;
    if (!pointerActive) { const t = (now - t0) / 1000; focus.tx = .62 + Math.sin(t * .21) * .22; focus.ty = .45 + Math.sin(t * .17 + 1.3) * .2; }
    focus.x += (focus.tx - focus.x) * .08; focus.y += (focus.ty - focus.y) * .08;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduced) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  img.onload = () => {
    if (!resize()) return;
    draw();
    if (reduced) return;
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); focus.tx = (e.clientX - r.left) / r.width; focus.ty = (e.clientY - r.top) / r.height; pointerActive = true; });
    hero.addEventListener('pointerleave', () => { pointerActive = false; });
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (resize()) draw(); }, 120); });
  };
  img.onerror = () => onFail?.();
  img.src = src;
  return { stop };
}

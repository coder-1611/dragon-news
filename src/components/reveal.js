export function mountReveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach((e, i) => { e.style.setProperty('--d', `${(i % 6) * 60}ms`); io.observe(e); });
}

const content = document.querySelector('main');
const header = document.querySelector('.site-header');
let pending = false;

function updateTopEdge() {
  pending = false;
  // The fade is fully opaque here. Clip the source content too, so Safari cannot
  // paint it again above a fixed overlay when the browser chrome changes height.
  const opaqueEdge = header.getBoundingClientRect().top + 48;
  const rect = content.getBoundingClientRect();
  const clip = Math.min(rect.height, Math.max(0, opaqueEdge - rect.top));
  content.style.setProperty('--top-content-clip', `${clip}px`);
}

function scheduleTopEdge() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(updateTopEdge);
}

window.addEventListener('scroll', scheduleTopEdge, { passive: true });
window.addEventListener('resize', scheduleTopEdge);
window.addEventListener('pageshow', scheduleTopEdge);
window.visualViewport?.addEventListener('resize', scheduleTopEdge);
window.visualViewport?.addEventListener('scroll', scheduleTopEdge);
new ResizeObserver(scheduleTopEdge).observe(content);
document.fonts.ready.then(scheduleTopEdge);
updateTopEdge();
